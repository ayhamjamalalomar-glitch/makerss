/* Page analytics: views and actions on profiles and projects, one row per visitor per day per action. */
/* `visitor` is a random id the browser keeps in localStorage; no IP or personal data is stored. */
create table if not exists public.page_events (
  id bigint generated always as identity primary key,
  target_type text not null check (target_type in ('profile', 'project')),
  target_id uuid not null,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('view', 'contact', 'share', 'social', 'work', 'message')),
  visitor text not null,
  viewer_id uuid references public.profiles (id) on delete set null,
  day date not null default current_date,
  created_at timestamptz not null default now()
);
create unique index if not exists page_events_dedupe on public.page_events (target_type, target_id, kind, visitor, day);
create index if not exists page_events_owner_day on public.page_events (owner_id, day);
create index if not exists page_events_viewer_id_idx on public.page_events (viewer_id);
create index if not exists page_events_day on public.page_events (day);
alter table public.page_events enable row level security;
revoke all on public.page_events from anon, authenticated;

create or replace function public.track_event(p_type text, p_id uuid, p_kind text, p_visitor text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare v_owner uuid;
begin
  if p_type not in ('profile', 'project') or p_kind not in ('view', 'contact', 'share', 'social', 'work', 'message') then return; end if;
  if p_visitor is null or p_visitor !~ '^[A-Za-z0-9-]{8,64}$' then return; end if;
  if p_type = 'profile' then
    select id into v_owner from public.profiles where id = p_id and status = 'approved';
  else
    select w.owner_id into v_owner from public.works w join public.profiles p on p.id = w.owner_id where w.id = p_id and p.status = 'approved';
  end if;
  if v_owner is null or v_owner = auth.uid() then return; end if;
  /* a single browser cannot flood the table */
  if (select count(*) from public.page_events where visitor = p_visitor and day = current_date) >= 300 then return; end if;
  insert into public.page_events (target_type, target_id, owner_id, kind, visitor, viewer_id)
  values (p_type, p_id, v_owner, p_kind, p_visitor, auth.uid())
  on conflict do nothing;
end $$;

/* Numbers for the signed-in member's own page. */
create or replace function public.my_page_stats(p_days int default 30)
returns json
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_days int := least(greatest(coalesce(p_days, 30), 7), 90);
  v_from date := current_date - (v_days - 1);
  v_prev date := current_date - (2 * v_days - 1);
begin
  if v_uid is null then raise exception 'not allowed'; end if;
  return json_build_object(
    'days', v_days,
    'views', (select count(*) from public.page_events where owner_id = v_uid and target_type = 'profile' and kind = 'view' and day >= v_from),
    'prev_views', (select count(*) from public.page_events where owner_id = v_uid and target_type = 'profile' and kind = 'view' and day >= v_prev and day < v_from),
    'visitors', (select count(distinct visitor) from public.page_events where owner_id = v_uid and day >= v_from),
    'project_views', (select count(*) from public.page_events where owner_id = v_uid and target_type = 'project' and kind = 'view' and day >= v_from),
    'contacts', (select count(*) from public.page_events where owner_id = v_uid and kind in ('contact', 'message') and day >= v_from),
    'shares', (select count(*) from public.page_events where owner_id = v_uid and kind = 'share' and day >= v_from),
    'clicks', (select count(*) from public.page_events where owner_id = v_uid and kind in ('social', 'work') and day >= v_from),
    'requests', (select count(*) from public.contact_requests where to_id = v_uid and created_at >= v_from),
    'series', (
      select json_agg(json_build_object('day', d::date, 'views', coalesce(e.n, 0)) order by d)
      from generate_series(v_from, current_date, interval '1 day') d
      left join (
        select day, count(*) n from public.page_events
        where owner_id = v_uid and kind = 'view' and day >= v_from group by day
      ) e on e.day = d::date
    ),
    'top_projects', (
      select coalesce(json_agg(t), '[]'::json) from (
        select w.id, w.title, count(*) as views
        from public.page_events e join public.works w on w.id = e.target_id
        where e.owner_id = v_uid and e.target_type = 'project' and e.kind = 'view' and e.day >= v_from
        group by w.id, w.title order by views desc limit 3
      ) t
    )
  );
end $$;

/* Wider picture for the team. */
create or replace function public.admin_insights()
returns json
language plpgsql stable security definer
set search_path = ''
as $$
declare v_decided int; v_accepted int;
begin
  if not public.is_staff() then raise exception 'not allowed'; end if;
  select count(*) filter (where status in ('accepted', 'declined', 'expired')), count(*) filter (where status = 'accepted')
    into v_decided, v_accepted
    from public.contact_requests where created_at > now() - interval '90 days';
  return json_build_object(
    'makers', (select count(*) from public.profiles where status = 'approved' and coalesce(account_type::text, 'maker') <> 'creator'),
    'creators', (select count(*) from public.profiles where status = 'approved' and account_type::text = 'creator'),
    'funnel', json_build_object(
      'signed_up', (select count(*) from public.profiles where created_at > now() - interval '30 days'),
      'submitted', (select count(*) from public.profiles where submitted_at > now() - interval '30 days'),
      'approved', (select count(*) from public.profiles where status = 'approved' and reviewed_at > now() - interval '30 days')
    ),
    'views_7d', (select count(*) from public.page_events where kind = 'view' and day > current_date - 7),
    'views_30d', (select count(*) from public.page_events where kind = 'view' and day > current_date - 30),
    'visitors_30d', (select count(distinct visitor) from public.page_events where day > current_date - 30),
    'requests_30d', (select count(*) from public.contact_requests where created_at > now() - interval '30 days'),
    'accept_rate', case when v_decided > 0 then round(100.0 * v_accepted / v_decided) else null end,
    'avg_response_hours', (
      select round(extract(epoch from avg(responded_at - created_at)) / 3600)
      from public.contact_requests where responded_at is not null and created_at > now() - interval '90 days'
    ),
    'applications_30d', (select count(*) from public.open_call_applications where created_at > now() - interval '30 days'),
    'messages_30d', (select count(*) from public.messages where created_at > now() - interval '30 days'),
    'signups', (
      select json_agg(json_build_object('day', d::date, 'n', coalesce(s.n, 0)) order by d)
      from generate_series(current_date - 29, current_date, interval '1 day') d
      left join (select created_at::date as day, count(*) n from public.profiles where created_at > now() - interval '30 days' group by 1) s on s.day = d::date
    ),
    'top_profiles', (
      select coalesce(json_agg(t), '[]'::json) from (
        select p.id, coalesce(p.name_ar, p.full_name) as name, p.username, count(*) as views
        from public.page_events e join public.profiles p on p.id = e.target_id
        where e.target_type = 'profile' and e.kind = 'view' and e.day > current_date - 30
        group by p.id order by views desc limit 5
      ) t
    )
  );
end $$;

revoke execute on function public.track_event(text, uuid, text, text) from public;
grant execute on function public.track_event(text, uuid, text, text) to anon, authenticated;
revoke execute on function public.my_page_stats(int) from public, anon;
grant execute on function public.my_page_stats(int) to authenticated;
revoke execute on function public.admin_insights() from public, anon;
grant execute on function public.admin_insights() to authenticated;
