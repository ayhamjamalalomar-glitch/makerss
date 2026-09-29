-- Abuse limits for the two anonymous entry points: page analytics and collaboration requests.
-- 1. track_event: limits keyed on the caller's IP (hashed), not only on the visitor id the browser sends.
-- 2. send_contact_request: per-recipient and per-IP daily caps, clean sender name, valid email.

-- Hashed client IP from the request headers PostgREST exposes. Null when not called over HTTP.
create or replace function public.client_ip_hash()
returns text
language sql
stable
set search_path = ''
as $$
  select case when ip is null or ip = '' then null else md5('makers:' || ip) end
  from (
    select trim(split_part(coalesce(
      nullif(current_setting('request.headers', true), '')::json ->> 'cf-connecting-ip',
      nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for',
      nullif(current_setting('request.headers', true), '')::json ->> 'x-real-ip'
    ), ',', 1)) as ip
  ) h
$$;
revoke all on function public.client_ip_hash() from public, anon, authenticated;

-- ---------- page analytics ----------
alter table public.page_events add column if not exists ip_hash text;
create index if not exists page_events_visitor_day on public.page_events (visitor, day);
create index if not exists page_events_ip_day on public.page_events (ip_hash, day);
create index if not exists page_events_target_day on public.page_events (target_type, target_id, day);
-- One count per target, kind, IP and day, however many visitor ids that IP makes up.
create unique index if not exists page_events_dedupe_ip on public.page_events (target_type, target_id, kind, ip_hash, day);

create or replace function public.track_event(p_type text, p_id uuid, p_kind text, p_visitor text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_owner uuid; v_ip text := public.client_ip_hash();
begin
  if p_type not in ('profile', 'project') or p_kind not in ('view', 'contact', 'share', 'social', 'work', 'message') then return; end if;
  if p_visitor is null or p_visitor !~ '^[A-Za-z0-9-]{8,64}$' then return; end if;
  if p_type = 'profile' then
    select id into v_owner from public.profiles where id = p_id and status = 'approved';
  else
    select w.owner_id into v_owner from public.works w join public.profiles p on p.id = w.owner_id where w.id = p_id and p.status = 'approved';
  end if;
  if v_owner is null or v_owner = auth.uid() then return; end if;
  if (select count(*) from public.page_events where visitor = p_visitor and day = current_date) >= 300 then return; end if;
  if v_ip is not null and (select count(*) from public.page_events where ip_hash = v_ip and day = current_date) >= 300 then return; end if;
  if (select count(*) from public.page_events where target_type = p_type and target_id = p_id and day = current_date) >= 5000 then return; end if;
  insert into public.page_events (target_type, target_id, owner_id, kind, visitor, viewer_id, ip_hash)
  values (p_type, p_id, v_owner, p_kind, p_visitor, auth.uid(), v_ip)
  on conflict do nothing;
end $$;

-- Keep the events table from growing forever.
create or replace function public.housekeeping()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.open_calls set status = 'closed' where status = 'open' and deadline is not null and deadline < current_date;
  perform public.expire_contact_requests();
  delete from public.page_events where day < current_date - 400;
end $$;

-- ---------- collaboration requests ----------
alter table public.contact_requests add column if not exists ip_hash text;
create index if not exists contact_requests_ip_idx on public.contact_requests (ip_hash, created_at desc);

create or replace function public.send_contact_request(p_to uuid, p_name text, p_email text, p_details text, p_project_type text default null, p_country text default null, p_city text default null, p_budget text default null, p_start date default null, p_end date default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_id uuid; v_n int; v_ip text := public.client_ip_hash();
  v_name text := left(regexp_replace(trim(coalesce(p_name, '')), '[[:cntrl:]]+', ' ', 'g'), 60);
  v_email text := lower(trim(coalesce(p_email, '')));
begin
  if not exists (select 1 from public.profiles where id = p_to and status = 'approved') then
    raise exception 'recipient not available';
  end if;
  if v_name = '' then raise exception 'name is required'; end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or length(v_email) > 254 then
    raise exception 'invalid sender_email';
  end if;
  select count(*) into v_n from public.contact_requests
   where lower(sender_email) = v_email and created_at > now() - interval '24 hours';
  if v_n >= 5 then raise exception 'too many requests, try again tomorrow'; end if;
  if v_ip is not null then
    select count(*) into v_n from public.contact_requests
     where ip_hash = v_ip and created_at > now() - interval '24 hours';
    if v_n >= 5 then raise exception 'too many requests, try again tomorrow'; end if;
  end if;
  select count(*) into v_n from public.contact_requests
   where to_id = p_to and created_at > now() - interval '24 hours';
  if v_n >= 10 then raise exception 'recipient busy today'; end if;
  select count(*) into v_n from public.contact_requests
   where to_id = p_to and lower(sender_email) = v_email and created_at > now() - interval '7 days';
  if v_n >= 2 then raise exception 'you already contacted this maker recently'; end if;
  if p_start is not null and p_start < current_date then raise exception 'start date is in the past'; end if;
  insert into public.contact_requests (to_id, sender_id, sender_name, sender_email, details, project_type, country, city, budget, start_date, end_date, ip_hash)
  values (p_to, auth.uid(), v_name, v_email, left(trim(coalesce(p_details, '')), 3000), p_project_type, p_country, p_city, p_budget, p_start, p_end, v_ip)
  returning id into v_id;
  return v_id;
end $$;
