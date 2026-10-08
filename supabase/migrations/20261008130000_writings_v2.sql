-- Writing v2 (2026-10-08): short links makerss.net/<username>/<slug>, article blocks, share image.

alter table public.writings add column if not exists slug text, add column if not exists blocks jsonb, add column if not exists cover_url text;
create unique index if not exists writings_owner_slug_idx on public.writings (owner_id, slug);

-- Slug: the first three words of the title in Latin letters, unique per writer, fixed after the first save.
create or replace function private.writing_slug(p_title text, p_owner uuid, p_id uuid)
returns text
language plpgsql
stable
set search_path to ''
as $$
declare
  words text[] := regexp_split_to_array(btrim(regexp_replace(coalesce(p_title, ''), '[^[:alnum:][:space:]]+', ' ', 'g')), '\s+');
  base text;
  s text;
  n int := 1;
begin
  base := public.slugify(array_to_string(words[1:3], ' '));
  if base is null or base = '' then base := 'writing'; end if;
  base := left(base, 50);
  s := base;
  while exists (select 1 from public.writings w where w.owner_id = p_owner and w.slug = s and w.id <> coalesce(p_id, '00000000-0000-0000-0000-000000000000'::uuid)) loop
    n := n + 1;
    s := base || '-' || n;
  end loop;
  return s;
end $$;

create or replace function private.writings_slug_guard()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if tg_op = 'UPDATE' and old.slug is not null then new.slug := old.slug; return new; end if;
  new.slug := private.writing_slug(new.title, new.owner_id, new.id);
  return new;
end $$;
create trigger writings_slug_guard before insert or update on public.writings for each row execute function private.writings_slug_guard();
update public.writings set slug = private.writing_slug(title, owner_id, id) where slug is null;

-- Images inside articles and the generated share images: public bucket, writers write in their own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('writing-media', 'writing-media', true, 8388608, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = 8388608, allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'];
create policy writing_media_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'writing-media' and (storage.foldername(name))[1] = auth.uid()::text and public.is_writer(auth.uid())
);

-- Article blocks: p, h2, h3, quote, ul, ol, image (own writing-media file), video (YouTube, Vimeo),
-- podcast (Spotify, Apple Podcasts, YouTube), button (label + http link), divider.
-- Returns the plain text kept in writings.body.
create or replace function private.writing_blocks_text(p_blocks jsonb, p_uid uuid)
returns text
language plpgsql
immutable
set search_path to ''
as $$
declare
  b jsonb;
  t text;
  u text;
  out text := '';
  media text := 'https://ggtdseujebmfugwcbnyk.supabase.co/storage/v1/object/public/writing-media/' || p_uid::text || '/';
begin
  if p_blocks is null or jsonb_typeof(p_blocks) <> 'array' then raise exception 'bad blocks'; end if;
  if jsonb_array_length(p_blocks) > 400 then raise exception 'too many blocks'; end if;
  for b in select * from jsonb_array_elements(p_blocks) loop
    t := b ->> 'type';
    u := coalesce(b ->> 'url', '');
    if t in ('p', 'h2', 'h3', 'quote') then
      if char_length(coalesce(b ->> 'text', '')) > 6000 then raise exception 'block too long'; end if;
      out := out || coalesce(b ->> 'text', '') || E'\n\n';
    elsif t in ('ul', 'ol') then
      if jsonb_typeof(b -> 'items') <> 'array' or jsonb_array_length(b -> 'items') > 60 then raise exception 'bad list'; end if;
      out := out || coalesce((select string_agg(left(x, 1000), E'\n') from jsonb_array_elements_text(b -> 'items') x), '') || E'\n\n';
    elsif t = 'image' then
      if left(u, char_length(media)) <> media then raise exception 'bad image'; end if;
      if char_length(coalesce(b ->> 'caption', '')) > 300 then raise exception 'caption too long'; end if;
      out := out || coalesce(b ->> 'caption', '') || E'\n\n';
    elsif t = 'video' then
      if u !~* '^https://(www\.|m\.)?(youtube\.com/(watch\?|shorts/|live/|embed/)|youtu\.be/|vimeo\.com/|player\.vimeo\.com/)' then raise exception 'bad video'; end if;
    elsif t = 'podcast' then
      if u !~* '^https://(open\.spotify\.com/(episode|show)/|podcasts\.apple\.com/|(www\.|m\.)?youtube\.com/|youtu\.be/|music\.youtube\.com/)' then raise exception 'bad podcast'; end if;
    elsif t = 'button' then
      if u !~* '^https?://[^\s]+$' or char_length(u) > 500 then raise exception 'bad link'; end if;
      if char_length(coalesce(b ->> 'label', '')) not between 1 and 60 then raise exception 'bad button'; end if;
      out := out || (b ->> 'label') || E'\n\n';
    elsif t = 'divider' then
      null;
    else
      raise exception 'bad block';
    end if;
  end loop;
  return btrim(out);
end $$;

-- save_writing now takes p.blocks for articles; body is derived from them.
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
  v_blocks jsonb := case when jsonb_typeof(p -> 'blocks') = 'array' then p -> 'blocks' end;
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
  if v_kind = 'article' then
    v_file := null; v_fname := null; v_vis := 'public'; v_done := false;
    if v_blocks is not null then v_body := nullif(private.writing_blocks_text(v_blocks, v_uid), ''); end if;
  else
    v_body := null; v_blocks := null;
  end if;
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
    insert into public.writings (owner_id, kind, title, summary, body, blocks, file_path, file_name, visibility, completed, status, published_at)
    values (v_uid, v_kind, v_title, v_summary, v_body, v_blocks, v_file, v_fname, v_vis, v_done, v_status, case when v_status = 'published' then now() end)
    returning id into v_id;
  else
    select * into v_old from public.writings where id = v_id and owner_id = v_uid for update;
    if not found then raise exception 'not found'; end if;
    if v_old.status = 'hidden' then raise exception 'hidden by the team'; end if;
    v_status := case when v_trusted then 'published' else 'pending' end;
    update public.writings set kind = v_kind, title = v_title, summary = v_summary, body = v_body, blocks = v_blocks, file_path = v_file, file_name = v_fname,
      visibility = v_vis, completed = v_done, status = v_status, review_note = null, updated_at = now(),
      published_at = case when v_status = 'published' then coalesce(v_old.published_at, now()) else v_old.published_at end
    where id = v_id;
  end if;

  if v_status = 'pending' then
    perform public.notify_staff('admin_writing_needed', jsonb_build_object('title', v_title, 'owner', public.display_name_of(v_uid), 'id', v_id));
  end if;
  return v_id;
end $$;

create or replace function public.set_writing_cover(p_id uuid, p_url text)
returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  if p_url is null or left(p_url, char_length('https://ggtdseujebmfugwcbnyk.supabase.co/storage/v1/object/public/writing-media/' || auth.uid()::text || '/'))
     <> 'https://ggtdseujebmfugwcbnyk.supabase.co/storage/v1/object/public/writing-media/' || auth.uid()::text || '/' then
    raise exception 'bad cover';
  end if;
  update public.writings set cover_url = p_url where id = p_id and owner_id = auth.uid();
end $$;
