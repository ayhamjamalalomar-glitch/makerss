/* Push notifications for the iOS app, and account deletion (required by Apple for apps with sign-up). */

/* Devices that can receive pushes. The app registers its Expo push token after sign-in. */
create table if not exists public.push_tokens (
  token text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null default 'ios' check (platform in ('ios', 'android')),
  lang text not null default 'ar' check (lang in ('ar', 'en')),
  updated_at timestamptz not null default now()
);
create index if not exists push_tokens_user_idx on public.push_tokens (user_id);
alter table public.push_tokens enable row level security;
revoke all on public.push_tokens from anon, authenticated;

create or replace function public.register_push_token(p_token text, p_platform text default 'ios', p_lang text default 'ar')
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'not allowed'; end if;
  if p_token is null or p_token !~ '^(Exponent|Expo)PushToken\[[A-Za-z0-9_-]+\]$' then raise exception 'bad token'; end if;
  insert into public.push_tokens (token, user_id, platform, lang, updated_at)
  values (p_token, auth.uid(), case when p_platform = 'android' then 'android' else 'ios' end, case when p_lang = 'en' then 'en' else 'ar' end, now())
  on conflict (token) do update set user_id = excluded.user_id, platform = excluded.platform, lang = excluded.lang, updated_at = now();
end $$;

create or replace function public.unregister_push_token(p_token text)
returns void
language sql security definer
set search_path = ''
as $$
  delete from public.push_tokens where token = p_token and user_id = auth.uid();
$$;

/* Members can switch pushes off separately from emails. */
alter table public.notification_prefs add column if not exists push_enabled boolean not null default true;

/* Queue of pushes, drained by the send-push function. */
create table if not exists public.push_outbox (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  sent_at timestamptz,
  attempts int not null default 0,
  last_error text
);
create index if not exists push_outbox_pending on public.push_outbox (id) where sent_at is null;
create index if not exists push_outbox_user_idx on public.push_outbox (user_id);
alter table public.push_outbox enable row level security;
revoke all on public.push_outbox from anon, authenticated;

create or replace function public.enqueue_push(p_user uuid, p_kind text, p_payload jsonb)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if p_user is null then return; end if;
  if exists (select 1 from public.notification_prefs where user_id = p_user and not push_enabled) then return; end if;
  if not exists (select 1 from public.push_tokens where user_id = p_user) then return; end if;
  insert into public.push_outbox (user_id, kind, payload) values (p_user, p_kind, coalesce(p_payload, '{}'::jsonb));
end $$;

/* A new chat message pushes right away to the other side (text messages; collab cards push on their own). */
create or replace function public.on_message_insert_push()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare v_to uuid;
begin
  if coalesce(new.kind, 'text') <> 'text' then return new; end if;
  select case when c.user_a = new.sender_id then c.user_b else c.user_a end into v_to
  from public.conversations c where c.id = new.conversation_id;
  if exists (select 1 from public.blocks where blocker = v_to and blocked = new.sender_id) then return new; end if;
  perform public.enqueue_push(v_to, 'message', jsonb_build_object(
    'from', public.display_name_of(new.sender_id), 'body', left(new.body, 140), 'conversation_id', new.conversation_id));
  return new;
end $$;
drop trigger if exists push_message_insert on public.messages;
create trigger push_message_insert after insert on public.messages for each row execute function public.on_message_insert_push();

/* Add pushes next to the existing email notifications. */
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
  perform public.enqueue_push(new.to_id, 'collab_request', jsonb_build_object('sender', new.sender_name, 'project_type', new.project_type));
  return new;
end $$;

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
    perform public.enqueue_push(new.sender_id, 'collab_' || new.status, jsonb_build_object(
      'member', public.display_name_of(new.to_id), 'username', (select username from public.profiles where id = new.to_id)));
  end if;
  return new;
end $$;

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
    perform public.enqueue_push(new.id, 'review_approved', jsonb_build_object('username', new.username));
  elsif new.status = 'rejected' then
    perform public.enqueue_email('review_rejected', new.email, jsonb_build_object(
      'name', coalesce(new.name_ar, new.full_name), 'note', new.review_note));
    perform public.enqueue_push(new.id, 'review_rejected', '{}'::jsonb);
  elsif new.status = 'pending' then
    perform public.notify_staff('admin_review_needed', jsonb_build_object(
      'name', coalesce(new.name_ar, new.full_name), 'username', new.username, 'creator', new.account_type::text = 'creator'));
  end if;
  return new;
end $$;

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
  perform public.enqueue_push(v_owner, 'call_application', jsonb_build_object('title', v_title, 'applicant', public.display_name_of(new.applicant_id), 'call_id', new.call_id));
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
    perform public.enqueue_push(new.owner_id, 'call_approved', jsonb_build_object('title', new.title, 'call_id', new.id));
  elsif new.status = 'rejected' then
    perform public.enqueue_email('call_rejected', v_email, jsonb_build_object('name', public.display_name_of(new.owner_id), 'title', new.title, 'note', new.review_note));
    perform public.enqueue_push(new.owner_id, 'call_rejected', jsonb_build_object('title', new.title));
  end if;
  return new;
end $$;

/* Worker plumbing, same pattern as the email worker. */
create or replace function public.claim_pushes(p_limit int default 100)
returns table (id bigint, user_id uuid, kind text, payload jsonb, tokens jsonb)
language sql security definer
set search_path = ''
as $$
  with claimed as (
    update public.push_outbox o set claimed_at = now(), attempts = o.attempts + 1
    where o.id in (
      select id from public.push_outbox
      where sent_at is null and attempts < 3 and created_at > now() - interval '1 day'
        and (claimed_at is null or claimed_at < now() - interval '5 minutes')
      order by id limit least(greatest(coalesce(p_limit, 100), 1), 500)
      for update skip locked
    )
    returning o.id, o.user_id, o.kind, o.payload
  )
  select c.id, c.user_id, c.kind, c.payload,
    coalesce((select jsonb_agg(jsonb_build_object('token', t.token, 'lang', t.lang)) from public.push_tokens t where t.user_id = c.user_id), '[]'::jsonb)
  from claimed c;
$$;

create or replace function public.kick_push_worker()
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.push_outbox where sent_at is null and attempts < 3 and created_at > now() - interval '1 day') then
    perform net.http_post(
      url := 'https://ggtdseujebmfugwcbnyk.supabase.co/functions/v1/send-push',
      headers := jsonb_build_object('Content-Type', 'application/json',
        'x-worker-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'email_worker_secret')),
      body := '{}'::jsonb,
      timeout_milliseconds := 20000);
  end if;
end $$;

/* Delete my account: everything a member owns goes with the auth user (foreign keys cascade). */
create or replace function public.delete_my_account()
returns void
language plpgsql security definer
set search_path = ''
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not allowed'; end if;
  if public.is_staff() then raise exception 'staff accounts are removed by an admin'; end if;
  /* references that do not cascade */
  update public.credits c set added_by = w.owner_id from public.works w where c.work_id = w.id and c.added_by = v_uid and w.owner_id <> v_uid;
  update public.invites set used_by = null where used_by = v_uid;
  delete from auth.users where id = v_uid;
end $$;

revoke execute on function public.register_push_token(text, text, text) from public, anon;
grant execute on function public.register_push_token(text, text, text) to authenticated;
revoke execute on function public.unregister_push_token(text) from public, anon;
grant execute on function public.unregister_push_token(text) to authenticated;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
revoke execute on function public.enqueue_push(uuid, text, jsonb) from public, anon, authenticated;
revoke execute on function public.on_message_insert_push() from public, anon, authenticated;
revoke execute on function public.claim_pushes(int) from public, anon, authenticated;
revoke execute on function public.kick_push_worker() from public, anon, authenticated;
grant execute on function public.claim_pushes(int) to service_role;
grant select, update on public.push_outbox to service_role;
grant select, delete on public.push_tokens to service_role;

select cron.schedule('push-worker', '* * * * *', 'select public.kick_push_worker()');
