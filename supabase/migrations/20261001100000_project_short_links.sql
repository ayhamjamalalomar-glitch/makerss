/* Short project links: makerss.net/<slug> (for example makerss.net/al-nahham).
   Project slugs and member usernames share the same first path segment, so each side checks the other. */

alter table public.works add column if not exists slug text;

/* First path segments that belong to pages of the site or the app. */
create or replace function public.reserved_path(p text)
returns boolean
language sql immutable
set search_path = ''
as $$
  select lower(coalesce(p, '')) = any (array[
    'admin','join','login','me','inbox','terms','privacy','api','about','makers','settings','status','reset','en','ar',
    'messages','projects','opportunities','search','app','creators','player','sitemap','robots','assets','account',
    'maker','project','call','calls','chat','edit','collab','p','new','help','support','contact','favicon'
  ])
$$;

/* Title to a Latin link: Arabic letters are written in Latin, everything else becomes dashes. */
create or replace function public.slugify(p_text text)
returns text
language plpgsql immutable
set search_path = ''
as $$
declare
  s text := lower(coalesce(p_text, ''));
  m jsonb := '{"ا":"a","أ":"a","إ":"i","آ":"a","ٱ":"a","ب":"b","ت":"t","ث":"th","ج":"j","ح":"h","خ":"kh","د":"d","ذ":"th","ر":"r","ز":"z","س":"s","ش":"sh","ص":"s","ض":"d","ط":"t","ظ":"z","ع":"a","غ":"gh","ف":"f","ق":"q","ك":"k","ل":"l","م":"m","ن":"n","ه":"h","ة":"a","و":"w","ي":"y","ى":"a","ئ":"e","ؤ":"o","ء":"","٠":"0","١":"1","٢":"2","٣":"3","٤":"4","٥":"5","٦":"6","٧":"7","٨":"8","٩":"9"}'::jsonb;
  ch text;
  o text := '';
begin
  s := regexp_replace(s, '[ً-ْٰـ]', '', 'g');
  foreach ch in array regexp_split_to_array(s, '') loop
    o := o || coalesce(m ->> ch, ch);
  end loop;
  o := regexp_replace(o, '[^a-z0-9]+', '-', 'g');
  o := trim(both '-' from o);
  o := trim(both '-' from left(o, 40));
  return o;
end $$;

/* Is this link free for a project (p_work is the project being edited, null for a new one)? */
create or replace function public.work_slug_available(p_slug text, p_work uuid default null)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select lower(coalesce(p_slug, '')) ~ '^[a-z0-9](?:[a-z0-9-]{0,48})[a-z0-9]$'
     and not public.reserved_path(p_slug)
     and not exists (select 1 from public.works w where lower(w.slug) = lower(p_slug) and w.id is distinct from p_work)
     and not exists (select 1 from public.profiles pr where lower(pr.username) = lower(p_slug))
$$;

create or replace function public.unique_work_slug(p_title text, p_work uuid default null)
returns text
language plpgsql stable security definer
set search_path = ''
as $$
declare base text := public.slugify(p_title); cand text; i int := 1;
begin
  if length(base) < 2 then base := 'project'; end if;
  cand := base;
  while not public.work_slug_available(cand, p_work) loop
    i := i + 1;
    cand := trim(both '-' from left(base, 44)) || '-' || i;
  end loop;
  return cand;
end $$;


/* Every project gets a link on insert; a changed link must be valid and free. */
create or replace function public.works_slug_guard()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.slug is null or btrim(new.slug) = '' then
    if tg_op = 'UPDATE' and old.slug is not null then new.slug := old.slug; return new; end if;
    new.slug := public.unique_work_slug(new.title, new.id);
    return new;
  end if;
  new.slug := lower(btrim(new.slug));
  if tg_op = 'UPDATE' and new.slug = old.slug then return new; end if;
  if not public.work_slug_available(new.slug, new.id) then raise exception 'slug taken'; end if;
  return new;
end $$;
drop trigger if exists works_slug_guard on public.works;
create trigger works_slug_guard before insert or update of slug on public.works
  for each row execute function public.works_slug_guard();

/* Existing projects, oldest first so the first project keeps the plain name. */
do $$
declare r record;
begin
  for r in select id, title from public.works where slug is null order by created_at loop
    update public.works set slug = public.unique_work_slug(r.title, r.id) where id = r.id;
  end loop;
end $$;

alter table public.works alter column slug set not null;
create unique index if not exists works_slug_key on public.works (lower(slug));

/* Usernames now also stay clear of project links. */
create or replace function public.username_available(p_username text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select lower(p_username) ~ '^[a-z0-9](?:[a-z0-9-]{1,28})[a-z0-9]$'
     and not public.reserved_path(p_username)
     and not exists (select 1 from public.profiles where lower(username) = lower(p_username))
     and not exists (select 1 from public.works where lower(slug) = lower(p_username))
$$;

create or replace function public.make_username(p_seed text)
returns text
language plpgsql security definer
set search_path = ''
as $$
declare base text; cand text; i int := 1;
begin
  base := lower(coalesce(p_seed, ''));
  base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
  base := trim(both '-' from base);
  if length(base) < 3 then base := 'maker'; end if;
  base := trim(both '-' from left(base, 24));
  cand := base;
  while exists (select 1 from public.profiles where lower(username) = cand)
     or exists (select 1 from public.works where lower(slug) = cand)
     or public.reserved_path(cand) loop
    i := i + 1; cand := base || '-' || i;
  end loop;
  return cand;
end $$;

create or replace function public.profiles_username_guard()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.username is not null and new.username is distinct from old.username
     and exists (select 1 from public.works where lower(slug) = lower(new.username)) then
    raise exception 'username taken';
  end if;
  return new;
end $$;
drop trigger if exists profiles_username_guard on public.profiles;
create trigger profiles_username_guard before update of username on public.profiles
  for each row execute function public.profiles_username_guard();

/* save_work takes an optional link (p->>'slug'); empty keeps the current one or makes one from the title. */
create or replace function public.save_work(p_id uuid, p jsonb, p_credits jsonb)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid := p_id;
  v_title text := btrim(coalesce(p->>'title',''));
  v_year int := nullif(p->>'year','')::int;
  v_poster text := nullif(btrim(coalesce(p->>'thumb_url','')),'');
  v_url text := nullif(btrim(coalesce(p->>'url','')),'');
  v_slug text := nullif(lower(btrim(coalesce(p->>'slug',''))),'');
  c jsonb;
  v_pid uuid;
  v_name text;
  v_role text;
  n int := 0;
begin
  if v_uid is null or not public.is_approved() then raise exception 'not allowed'; end if;
  if length(v_title) < 1 or length(v_title) > 140 then raise exception 'bad title'; end if;
  if v_year is not null and (v_year < 1950 or v_year > extract(year from now())::int + 2) then raise exception 'bad year'; end if;
  if v_poster is not null and v_poster !~ '^https://' then raise exception 'bad poster'; end if;
  if v_url is not null and v_url !~ '^https://' then raise exception 'bad url'; end if;
  if jsonb_typeof(coalesce(p_credits,'[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_credits,'[]'::jsonb)) > 60 then raise exception 'bad credits'; end if;
  if v_slug is not null and not public.work_slug_available(v_slug, v_id) then raise exception 'slug taken'; end if;

  if v_id is null then
    insert into public.works (owner_id, title, brand, year, thumb_url, platforms, description, url, role, kind, thumbnail_url, slug)
    values (v_uid, v_title, left(nullif(btrim(coalesce(p->>'brand','')),''),120), v_year, v_poster,
            coalesce((select array_agg(left(x,40)) from jsonb_array_elements_text(coalesce(p->'platforms','[]'::jsonb)) x limit 8), '{}'),
            left(nullif(btrim(coalesce(p->>'description','')),''),2000), v_url,
            left(nullif(btrim(coalesce(p->>'role','')),''),80), left(nullif(p->>'kind',''),40),
            case when coalesce(p->>'thumbnail_url','') ~ '^https://' then p->>'thumbnail_url' end,
            v_slug)
    returning id into v_id;
  else
    update public.works set
      title = v_title,
      brand = left(nullif(btrim(coalesce(p->>'brand','')),''),120),
      year = v_year, thumb_url = v_poster,
      platforms = coalesce((select array_agg(left(x,40)) from jsonb_array_elements_text(coalesce(p->'platforms','[]'::jsonb)) x limit 8), '{}'),
      description = left(nullif(btrim(coalesce(p->>'description','')),''),2000),
      url = v_url, role = left(nullif(btrim(coalesce(p->>'role','')),''),80), kind = left(nullif(p->>'kind',''),40),
      thumbnail_url = case when coalesce(p->>'thumbnail_url','') ~ '^https://' then p->>'thumbnail_url' end,
      slug = coalesce(v_slug, slug),
      updated_at = now()
    where id = v_id and (owner_id = v_uid or public.is_staff());
    if not found then raise exception 'not allowed'; end if;
  end if;

  -- replace credits (keep anyone's "disputed" flag so removed people stay removed)
  delete from public.credits where work_id = v_id and status <> 'disputed';
  for c in select * from jsonb_array_elements(coalesce(p_credits,'[]'::jsonb)) loop
    n := n + 1;
    v_pid := nullif(c->>'profile_id','')::uuid;
    v_name := left(nullif(btrim(coalesce(c->>'name','')),''),80);
    v_role := left(nullif(btrim(coalesce(c->>'role','')),''),80);
    if v_pid is not null then
      if not exists (select 1 from public.profiles where id = v_pid and status = 'approved') then continue; end if;
      if exists (select 1 from public.credits where work_id = v_id and profile_id = v_pid and status = 'disputed') then continue; end if;
      insert into public.credits (work_id, profile_id, role, status, added_by, created_at)
      values (v_id, v_pid, v_role, case when v_pid = v_uid then 'confirmed' else 'unconfirmed' end::public.credit_status, v_uid, now() + (n || ' ms')::interval);
    elsif v_name is not null then
      insert into public.credits (work_id, display_name, role, status, added_by, created_at)
      values (v_id, v_name, v_role, 'unconfirmed', v_uid, now() + (n || ' ms')::interval);
    end if;
  end loop;
  return v_id;
end $$;

revoke execute on function public.work_slug_available(text, uuid) from public;
grant execute on function public.work_slug_available(text, uuid) to anon, authenticated;
revoke execute on function public.unique_work_slug(text, uuid) from public, anon, authenticated;
revoke execute on function public.works_slug_guard() from public, anon, authenticated;
revoke execute on function public.profiles_username_guard() from public, anon, authenticated;
