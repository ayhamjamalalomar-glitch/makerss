-- In-site notification center (the bell). Every event that already sends a push (enqueue_push)
-- or alerts the team (notify_staff) also lands here, whatever the member's push or email settings.
-- Internal helpers live in schema `private`, which the API does not expose.

create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (user_id) where read_at is null;
alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
create policy notifications_own on public.notifications for select to authenticated using (user_id = auth.uid());
alter publication supabase_realtime add table public.notifications;

create schema if not exists private;

-- One notification. New messages in the same conversation fold into one unread row with a count.
create or replace function private.notify(p_user uuid, p_kind text, p_payload jsonb)
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare v_id bigint;
begin
  if p_user is null then return; end if;
  if p_kind = 'message' then
    select id into v_id from public.notifications
    where user_id = p_user and kind = 'message' and read_at is null and payload ->> 'conversation_id' = p_payload ->> 'conversation_id'
    limit 1;
    if v_id is not null then
      update public.notifications
      set payload = p_payload || jsonb_build_object('count', coalesce((payload ->> 'count')::int, 1) + 1), created_at = now()
      where id = v_id;
      return;
    end if;
  end if;
  insert into public.notifications (user_id, kind, payload) values (p_user, p_kind, coalesce(p_payload, '{}'::jsonb));
end $$;

create or replace function public.enqueue_push(p_user uuid, p_kind text, p_payload jsonb)
returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  if p_user is null then return; end if;
  perform private.notify(p_user, p_kind, p_payload);
  if exists (select 1 from public.notification_prefs where user_id = p_user and not push_enabled) then return; end if;
  if not exists (select 1 from public.push_tokens where user_id = p_user) then return; end if;
  insert into public.push_outbox (user_id, kind, payload) values (p_user, p_kind, coalesce(p_payload, '{}'::jsonb));
end $$;

create or replace function public.notify_staff(p_kind text, p_payload jsonb)
returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  perform public.enqueue_email(p_kind, p.email, p_payload) from public.profiles p where p.role in ('admin', 'reviewer') and p.email is not null;
  perform private.notify(p.id, p_kind, p_payload) from public.profiles p where p.role in ('admin', 'reviewer');
end $$;

-- Someone credited you on a project.
create or replace function private.on_credit_insert()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare w record;
begin
  if new.profile_id is null or new.profile_id = new.added_by then return new; end if;
  select id, slug, title, owner_id into w from public.works where id = new.work_id;
  if w.id is null or w.owner_id = new.profile_id then return new; end if;
  perform public.enqueue_push(new.profile_id, 'credit_added', jsonb_build_object(
    'work_id', w.id, 'slug', w.slug, 'title', w.title, 'role', new.role, 'by', public.display_name_of(coalesce(new.added_by, w.owner_id))));
  return new;
end $$;
create trigger credits_notify after insert on public.credits for each row execute function private.on_credit_insert();

-- The bell (safe for anyone: both only touch the caller's own rows).
create or replace function public.unread_notifications_count()
returns int
language sql
stable security definer
set search_path to ''
as $$
  select count(*)::int from public.notifications where user_id = auth.uid() and read_at is null
$$;

create or replace function public.mark_notifications_read(p_ids bigint[] default null)
returns void
language sql
security definer
set search_path to ''
as $$
  update public.notifications set read_at = now()
  where user_id = auth.uid() and read_at is null and (p_ids is null or id = any (p_ids))
$$;
