-- Applied in parts: writings_table, writings_functions, writings_save_review, writings_reserve_paths, writings_bucket, writings_storage_policies.
-- Writings: articles written on Makers, and finished scripts or storyboards shared as PDF.
-- Only members with a writing specialty publish (Content writer 7, Scriptwriter 8, Storyboard artist 14).
-- A writer's first 5 writings are reviewed by the team; after the 5th is approved they publish directly.

-- ---------- paths ----------
create or replace function public.reserved_path(p text)
returns boolean
language sql
immutable
set search_path to ''
as $function$
  select lower(coalesce(p, '')) = any (array[
    'admin','join','login','me','inbox','terms','privacy','api','about','makers','settings','status','reset','en','ar',
    'messages','projects','opportunities','search','app','creators','player','sitemap','robots','assets','account',
    'maker','project','call','calls','chat','edit','collab','p','new','help','support','contact','favicon',
    'writing','writings','write','articles'
  ])
$function$;

-- ---------- table ----------
create table if not exists public.writings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('article', 'script', 'storyboard')),
  title text not null check (char_length(title) between 3 and 140),
  summary text check (summary is null or char_length(summary) <= 400),
  body text check (body is null or char_length(body) <= 80000),
  file_path text,
  file_name text check (file_name is null or char_length(file_name) <= 200),
  visibility text not null default 'public' check (visibility in ('public', 'members')),
  completed boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected', 'hidden')),
  review_note text check (review_note is null or char_length(review_note) <= 1000),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint writing_content check (
    (kind = 'article' and body is not null and char_length(body) >= 200)
    or (kind in ('script', 'storyboard') and file_path is not null and completed)
  )
);
create index if not exists writings_owner_idx on public.writings (owner_id, created_at desc);
create index if not exists writings_feed_idx on public.writings (status, published_at desc);
create index if not exists writings_reviewed_by_idx on public.writings (reviewed_by);

alter table public.writings enable row level security;
revoke all on public.writings from anon, authenticated;
grant select on public.writings to anon, authenticated;

-- Published writings of approved members are public; owners see their own; the team sees everything.
drop policy if exists writings_read on public.writings;
create policy writings_read on public.writings for select using (
  (status = 'published' and exists (select 1 from public.profiles p where p.id = owner_id and p.status = 'approved'))
  or owner_id = auth.uid()
  or public.is_staff()
);

-- ---------- helpers ----------
create or replace function public.is_writer(p_user uuid default auth.uid())
returns boolean
language sql
stable security definer
set search_path to ''
as $$
  select coalesce((select status = 'approved' and specialty_ids && array[7, 8, 14] from public.profiles where id = p_user), false)
$$;

-- Writings the team has approved for this author (the first 5 are reviewed).
create or replace function public.writer_reviewed_count(p_user uuid)
returns int
language sql
stable security definer
set search_path to ''
as $$
  select count(*)::int from public.writings where owner_id = p_user and reviewed_at is not null and status in ('published', 'hidden')
$$;
revoke all on function public.writer_reviewed_count(uuid) from public, anon, authenticated;

-- What the editor needs: may I write, and am I past review.
create or replace function public.my_writer_status()
returns jsonb
language sql
stable security definer
set search_path to ''
as $$
  select jsonb_build_object(
    'writer', public.is_writer(auth.uid()),
    'reviewed', public.writer_reviewed_count(auth.uid()),
    'trusted', public.writer_reviewed_count(auth.uid()) >= 5
  )
$$;
revoke all on function public.my_writer_status() from public, anon;
grant execute on function public.my_writer_status() to authenticated;

-- ---------- save ----------
create or replace function public.save_writing(p_id uuid, p jsonb)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid := p_id;
  v_kind text := p ->> 'kind';
  v_title text := btrim(regexp_replace(coalesce(p ->> 'title', ''), '[[:cntrl:]]+', ' ', 'g'));
  v_summary text := nullif(btrim(coalesce(p ->> 'summary', '')), '');
  v_body text := nullif(btrim(coalesce(p ->> 'body', '')), '');
  v_file text := nullif(btrim(coalesce(p ->> 'file_path', '')), '');
  v_fname text := left(nullif(btrim(coalesce(p ->> 'file_name', '')), ''), 200);
  v_vis text := coalesce(p ->> 'visibility', 'public');
  v_done boolean := coalesce((p ->> 'completed')::boolean, false);
  v_trusted boolean;
  v_old public.writings;
  v_status text;
begin
  if v_uid is null or not public.is_writer(v_uid) then raise exception 'not a writer'; end if;
  if v_kind not in ('article', 'script', 'storyboard') then raise exception 'bad kind'; end if;
  if v_vis not in ('public', 'members') then raise exception 'bad visibility'; end if;
  if v_kind = 'article' then v_file := null; v_fname := null; v_vis := 'public'; v_done := false; else v_body := null; end if;
  if v_kind <> 'article' then
    if v_file is null or split_part(v_file, '/', 1) <> v_uid::text or v_file !~ '\.pdf$' then raise exception 'bad file'; end if;
    if not v_done then raise exception 'only finished work'; end if;
  end if;
  v_trusted := public.writer_reviewed_count(v_uid) >= 5;

  if v_id is null then
    if (select count(*) from public.writings where owner_id = v_uid and created_at > now() - interval '24 hours') >= 5 then
      raise exception 'too many writings today';
    end if;
    v_status := case when v_trusted then 'published' else 'pending' end;
    insert into public.writings (owner_id, kind, title, summary, body, file_path, file_name, visibility, completed, status, published_at)
    values (v_uid, v_kind, v_title, v_summary, v_body, v_file, v_fname, v_vis, v_done, v_status, case when v_status = 'published' then now() end)
    returning id into v_id;
  else
    select * into v_old from public.writings where id = v_id and owner_id = v_uid for update;
    if not found then raise exception 'not found'; end if;
    if v_old.status = 'hidden' then raise exception 'hidden by the team'; end if;
    -- Before the writer is trusted, any edit goes back to review.
    v_status := case when v_trusted then 'published' else 'pending' end;
    update public.writings set kind = v_kind, title = v_title, summary = v_summary, body = v_body, file_path = v_file, file_name = v_fname,
      visibility = v_vis, completed = v_done, status = v_status, review_note = null, updated_at = now(),
      published_at = case when v_status = 'published' then coalesce(v_old.published_at, now()) else v_old.published_at end
    where id = v_id;
  end if;

  if v_status = 'pending' then
    perform public.notify_staff('admin_writing_needed', jsonb_build_object('title', v_title, 'owner', public.display_name_of(v_uid), 'id', v_id));
  end if;
  return v_id;
end $$;
revoke all on function public.save_writing(uuid, jsonb) from public, anon;
grant execute on function public.save_writing(uuid, jsonb) to authenticated;

create or replace function public.delete_writing(p_id uuid)
returns text
language plpgsql
security definer
set search_path to ''
as $$
declare v_file text;
begin
  delete from public.writings where id = p_id and owner_id = auth.uid() returning file_path into v_file;
  if not found then raise exception 'not found'; end if;
  return v_file;
end $$;
revoke all on function public.delete_writing(uuid) from public, anon;
grant execute on function public.delete_writing(uuid) to authenticated;

-- ---------- review ----------
create or replace function public.admin_review_writing(p_id uuid, p_approve boolean, p_note text default null)
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare w public.writings; v_email text; v_name text;
begin
  if not public.is_staff() then raise exception 'not allowed'; end if;
  update public.writings set
    status = case when p_approve then 'published' else 'rejected' end,
    review_note = case when p_approve then null else left(nullif(btrim(coalesce(p_note, '')), ''), 1000) end,
    reviewed_by = auth.uid(), reviewed_at = now(),
    published_at = case when p_approve then coalesce(published_at, now()) else published_at end
  where id = p_id returning * into w;
  if not found then raise exception 'not found'; end if;

  select email, public.display_name_of(id) into v_email, v_name from public.profiles where id = w.owner_id;
  if public.email_ok(w.owner_id) then
    perform public.enqueue_email(case when p_approve then 'writing_approved' else 'writing_rejected' end, v_email,
      jsonb_build_object('name', v_name, 'title', w.title, 'id', w.id, 'note', w.review_note));
  end if;
  perform public.enqueue_push(w.owner_id, case when p_approve then 'writing_approved' else 'writing_rejected' end, jsonb_build_object('title', w.title, 'id', w.id));

  -- The 5th approved writing: from now on this writer publishes without review.
  if p_approve and public.writer_reviewed_count(w.owner_id) = 5 then
    perform public.enqueue_email('writer_trusted', v_email, jsonb_build_object('name', v_name));
    perform public.enqueue_push(w.owner_id, 'writer_trusted', '{}'::jsonb);
  end if;
  perform public.admin_log_access(case when p_approve then 'writing_approved' else 'writing_rejected' end, 'writing', p_id::text, coalesce(nullif(btrim(coalesce(p_note, '')), ''), case when p_approve then 'approved' else 'rejected' end));
end $$;
revoke all on function public.admin_review_writing(uuid, boolean, text) from public, anon;
grant execute on function public.admin_review_writing(uuid, boolean, text) to authenticated;

-- Hide or restore a published writing (reports).
create or replace function public.admin_hide_writing(p_id uuid, p_hidden boolean)
returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  if not public.is_staff() then raise exception 'not allowed'; end if;
  update public.writings set status = case when p_hidden then 'hidden' else 'published' end where id = p_id and status in ('published', 'hidden');
  perform public.admin_log_access(case when p_hidden then 'writing_hidden' else 'writing_restored' end, 'writing', p_id::text, case when p_hidden then 'hidden' else 'restored' end);
end $$;
revoke all on function public.admin_hide_writing(uuid, boolean) from public, anon;
grant execute on function public.admin_hide_writing(uuid, boolean) to authenticated;

-- Reports can point at a writing.
create or replace function public.report_content(p_type text, p_id text, p_reason text, p_message text default null)
returns bigint
language plpgsql
security definer
set search_path to ''
as $function$
declare v_id bigint;
begin
  if auth.uid() is null then raise exception 'not allowed'; end if;
  if p_type not in ('profile', 'project', 'call', 'writing') then raise exception 'bad type'; end if;
  if p_reason not in ('fake', 'stolen', 'offensive', 'spam', 'other') then raise exception 'bad reason'; end if;
  if (select count(*) from public.tickets where opened_by = auth.uid() and created_at > now() - interval '24 hours') >= 10 then
    raise exception 'too many reports';
  end if;
  insert into public.tickets (opened_by, kind, target_type, target_id, reason, message, status)
  values (auth.uid(), 'report', p_type, left(p_id, 80), p_reason, left(nullif(btrim(coalesce(p_message, '')), ''), 1000), 'open')
  returning id into v_id;
  perform public.notify_staff('admin_report', jsonb_build_object('type', p_type, 'reason', p_reason, 'by', public.display_name_of(auth.uid())));
  return v_id;
end $function$;

-- ---------- storage: private bucket for the PDFs ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('writings', 'writings', false, 20971520, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 20971520, allowed_mime_types = array['application/pdf'];

drop policy if exists writings_files_read on storage.objects;
create policy writings_files_read on storage.objects for select using (
  bucket_id = 'writings' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_staff()
    or exists (
      select 1 from public.writings w join public.profiles p on p.id = w.owner_id
      where w.file_path = objects.name and w.status = 'published' and p.status = 'approved'
        and (w.visibility = 'public' or public.is_approved())
    )
  )
);
drop policy if exists writings_files_insert on storage.objects;
create policy writings_files_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'writings' and (storage.foldername(name))[1] = auth.uid()::text and public.is_writer(auth.uid())
);
drop policy if exists writings_files_delete on storage.objects;
create policy writings_files_delete on storage.objects for delete to authenticated using (
  bucket_id = 'writings' and (storage.foldername(name))[1] = auth.uid()::text
);

-- ---------- admin stats ----------
create or replace function public.pending_writings_count()
returns int
language sql
stable security definer
set search_path to ''
as $$ select case when public.is_staff() then (select count(*)::int from public.writings where status = 'pending') else 0 end $$;
revoke all on function public.pending_writings_count() from public, anon;
grant execute on function public.pending_writings_count() to authenticated;
