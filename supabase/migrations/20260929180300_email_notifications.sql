-- Email notifications. Database triggers put emails in an outbox; the `send-emails` Edge Function
-- sends them through Resend. Nothing is sent until RESEND_API_KEY is set on the function.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

create table if not exists public.email_outbox (
  id bigint generated always as identity primary key,
  kind text not null,
  to_email text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  sent_at timestamptz,
  attempts int not null default 0,
  last_error text
);
create index if not exists email_outbox_pending on public.email_outbox (id) where sent_at is null;
alter table public.email_outbox enable row level security;
revoke all on public.email_outbox from anon, authenticated;

-- A member can switch off optional emails (requests, applicants, unread messages).
-- Account emails (review decisions) always go out.
create table if not exists public.notification_prefs (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  email_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.notification_prefs enable row level security;
create policy prefs_read on public.notification_prefs for select to authenticated using (user_id = (select auth.uid()));
create policy prefs_insert on public.notification_prefs for insert to authenticated with check (user_id = (select auth.uid()));
create policy prefs_update on public.notification_prefs for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update on public.notification_prefs to authenticated;

create table if not exists public.message_email_log (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  last_notified_at timestamptz not null
);
alter table public.message_email_log enable row level security;
revoke all on public.message_email_log from anon, authenticated;

create or replace function public.email_ok(p_user uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select not exists (select 1 from public.notification_prefs where user_id = p_user and not email_enabled)
$$;

create or replace function public.enqueue_email(p_kind text, p_to text, p_payload jsonb)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if p_to is null or p_to !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return; end if;
  insert into public.email_outbox (kind, to_email, payload) values (p_kind, lower(btrim(p_to)), coalesce(p_payload, '{}'::jsonb));
end $$;

-- Staff who review pages and open calls.
create or replace function public.notify_staff(p_kind text, p_payload jsonb)
returns void
language sql security definer
set search_path = ''
as $$
  select public.enqueue_email(p_kind, p.email, p_payload)
  from public.profiles p where p.role in ('admin', 'reviewer') and p.email is not null;
$$;

create or replace function public.display_name_of(p_id uuid)
returns text
language sql stable security definer
set search_path = ''
as $$
  select coalesce(nullif(btrim(name_ar), ''), nullif(btrim(full_name), ''), username) from public.profiles where id = p_id
$$;

-- New collaboration request: tell the member.
create or replace function public.on_contact_request_insert()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare v_email text;
begin
  select email into v_email from public.profiles where id = new.to_id;
  if public.email_ok(new.to_id) then
    perform public.enqueue_email('collab_request', v_email, jsonb_build_object(
      'name', public.display_name_of(new.to_id), 'sender', new.sender_name, 'project_type', new.project_type,
      'details', left(coalesce(new.details, ''), 400), 'start', new.start_date, 'end', new.end_date,
      'budget', new.budget, 'country', new.country, 'city', new.city));
  end if;
  return new;
end $$;

-- Member answered a request: tell the sender.
create or replace function public.on_contact_request_status()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if old.status = 'new' and new.status in ('accepted', 'declined') then
    perform public.enqueue_email('collab_' || new.status, new.sender_email, jsonb_build_object(
      'sender', new.sender_name, 'member', public.display_name_of(new.to_id),
      'username', (select username from public.profiles where id = new.to_id),
      'member_sender', new.sender_id is not null));
  end if;
  return new;
end $$;

-- Review decisions and new submissions.
create or replace function public.on_profile_status()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.status is not distinct from old.status then return new; end if;
  if new.status = 'approved' and old.status in ('draft', 'pending', 'rejected') then
    perform public.enqueue_email('review_approved', new.email, jsonb_build_object(
      'name', coalesce(new.name_ar, new.full_name), 'username', new.username, 'founding', new.is_founding));
  elsif new.status = 'rejected' then
    perform public.enqueue_email('review_rejected', new.email, jsonb_build_object(
      'name', coalesce(new.name_ar, new.full_name), 'note', new.review_note));
  elsif new.status = 'pending' then
    perform public.notify_staff('admin_review_needed', jsonb_build_object(
      'name', coalesce(new.name_ar, new.full_name), 'username', new.username, 'creator', new.account_type::text = 'creator'));
  end if;
  return new;
end $$;

-- Someone applied to an open call: tell its owner.
create or replace function public.on_application_insert()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare v_owner uuid; v_title text; v_email text;
begin
  select owner_id, title into v_owner, v_title from public.open_calls where id = new.call_id;
  select email into v_email from public.profiles where id = v_owner;
  if public.email_ok(v_owner) then
    perform public.enqueue_email('call_application', v_email, jsonb_build_object(
      'name', public.display_name_of(v_owner), 'title', v_title, 'call_id', new.call_id,
      'applicant', public.display_name_of(new.applicant_id),
      'username', (select username from public.profiles where id = new.applicant_id),
      'message', left(coalesce(new.message, ''), 400)));
  end if;
  return new;
end $$;

create or replace function public.on_open_call_change()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare v_email text;
begin
  if tg_op = 'INSERT' then
    if new.status = 'pending' then
      perform public.notify_staff('admin_call_needed', jsonb_build_object('title', new.title, 'owner', public.display_name_of(new.owner_id)));
    end if;
    return new;
  end if;
  if new.status is not distinct from old.status or old.status <> 'pending' then return new; end if;
  select email into v_email from public.profiles where id = new.owner_id;
  if new.status = 'open' then
    perform public.enqueue_email('call_approved', v_email, jsonb_build_object('name', public.display_name_of(new.owner_id), 'title', new.title, 'call_id', new.id));
  elsif new.status = 'rejected' then
    perform public.enqueue_email('call_rejected', v_email, jsonb_build_object('name', public.display_name_of(new.owner_id), 'title', new.title, 'note', new.review_note));
  end if;
  return new;
end $$;

drop trigger if exists email_contact_request_insert on public.contact_requests;
create trigger email_contact_request_insert after insert on public.contact_requests for each row execute function public.on_contact_request_insert();
drop trigger if exists email_contact_request_status on public.contact_requests;
create trigger email_contact_request_status after update of status on public.contact_requests for each row execute function public.on_contact_request_status();
drop trigger if exists email_profile_status on public.profiles;
create trigger email_profile_status after update of status on public.profiles for each row execute function public.on_profile_status();
drop trigger if exists email_application_insert on public.open_call_applications;
create trigger email_application_insert after insert on public.open_call_applications for each row execute function public.on_application_insert();
drop trigger if exists email_open_call_change on public.open_calls;
create trigger email_open_call_change after insert or update of status on public.open_calls for each row execute function public.on_open_call_change();

-- Unread messages: one reminder when a message waits 10 minutes, then at most one every 3 hours.
create or replace function public.queue_unread_digests()
returns int
language plpgsql security definer
set search_path = ''
as $$
declare r record; n int := 0;
begin
  for r in
    with unread as (
      select case when c.user_a = m.sender_id then c.user_b else c.user_a end as to_id, m.sender_id, m.created_at
      from public.messages m join public.conversations c on c.id = m.conversation_id
      where m.read_at is null and coalesce(m.kind, 'text') = 'text'
        and m.created_at < now() - interval '10 minutes' and m.created_at > now() - interval '3 days'
    )
    select u.to_id, count(*) as cnt, array_agg(distinct public.display_name_of(u.sender_id)) as senders
    from unread u left join public.message_email_log l on l.user_id = u.to_id
    where l.user_id is null or (u.created_at > l.last_notified_at and l.last_notified_at < now() - interval '3 hours')
    group by u.to_id
  loop
    insert into public.message_email_log (user_id, last_notified_at) values (r.to_id, now())
      on conflict (user_id) do update set last_notified_at = excluded.last_notified_at;
    if public.email_ok(r.to_id) then
      perform public.enqueue_email('unread_messages', (select email from public.profiles where id = r.to_id),
        jsonb_build_object('name', public.display_name_of(r.to_id), 'count', r.cnt, 'senders', to_jsonb(r.senders[1:3])));
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;

-- Worker plumbing. The secret lives in Vault; cron sends it, the function checks it.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'email_worker_secret') then
    perform vault.create_secret(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'email_worker_secret', 'Shared secret between pg_cron and the send-emails function');
  end if;
end $$;

create or replace function public.email_worker_check(p_secret text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from vault.decrypted_secrets where name = 'email_worker_secret' and decrypted_secret = p_secret)
$$;

-- Hand a batch to the worker. Rows claimed by a run that crashed are retried after 5 minutes.
create or replace function public.claim_emails(p_limit int default 40)
returns setof public.email_outbox
language sql security definer
set search_path = ''
as $$
  update public.email_outbox o set claimed_at = now(), attempts = o.attempts + 1
  where o.id in (
    select id from public.email_outbox
    where sent_at is null and attempts < 5 and created_at > now() - interval '2 days'
      and (claimed_at is null or claimed_at < now() - interval '5 minutes')
    order by id limit least(greatest(coalesce(p_limit, 40), 1), 100)
    for update skip locked
  )
  returning o.*;
$$;

create or replace function public.kick_email_worker()
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  perform public.queue_unread_digests();
  if exists (select 1 from public.email_outbox where sent_at is null and attempts < 5 and created_at > now() - interval '2 days') then
    perform net.http_post(
      url := 'https://ggtdseujebmfugwcbnyk.supabase.co/functions/v1/send-emails',
      headers := jsonb_build_object('Content-Type', 'application/json',
        'x-worker-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'email_worker_secret')),
      body := '{}'::jsonb,
      timeout_milliseconds := 20000);
  end if;
end $$;

-- Only the database and the worker (service role) call these.
revoke execute on function public.email_ok(uuid) from public, anon, authenticated;
revoke execute on function public.enqueue_email(text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.notify_staff(text, jsonb) from public, anon, authenticated;
revoke execute on function public.display_name_of(uuid) from public, anon, authenticated;
revoke execute on function public.on_contact_request_insert() from public, anon, authenticated;
revoke execute on function public.on_contact_request_status() from public, anon, authenticated;
revoke execute on function public.on_profile_status() from public, anon, authenticated;
revoke execute on function public.on_application_insert() from public, anon, authenticated;
revoke execute on function public.on_open_call_change() from public, anon, authenticated;
revoke execute on function public.queue_unread_digests() from public, anon, authenticated;
revoke execute on function public.email_worker_check(text) from public, anon, authenticated;
revoke execute on function public.claim_emails(int) from public, anon, authenticated;
revoke execute on function public.kick_email_worker() from public, anon, authenticated;
grant execute on function public.email_worker_check(text) to service_role;
grant execute on function public.claim_emails(int) to service_role;
grant select, update on public.email_outbox to service_role;

select cron.schedule('email-worker', '* * * * *', 'select public.kick_email_worker()');
