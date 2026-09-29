/* Search that understands Arabic spelling: أحمد = احمد, محمّد = محمد, مدرسة = مدرسه, and small typos. */
create extension if not exists pg_trgm with schema extensions;

create or replace function public.ar_norm(p text)
returns text
language sql immutable parallel safe
set search_path = ''
as $$
  /* drop diacritics and tatweel, unify alef, ya, ta marbuta and hamza carriers, lower case Latin */
  select lower(translate(regexp_replace(coalesce(p, ''), '[ً-ْٰـ]', '', 'g'), 'أإآٱىةؤئ', 'اااايهوي'))
$$;

create or replace function public.search_makers(p_q text, p_limit int default 8, p_kinds text[] default '{}')
returns table (id uuid, score real)
language sql stable
set search_path = ''
as $$
  with q as (select public.ar_norm(btrim(coalesce(p_q, ''))) as t),
  spec as (
    select coalesce(array_agg(s.id), '{}'::int[]) as ids
    from public.specialties s, q
    where s.is_active and length(q.t) >= 2
      and (strpos(public.ar_norm(s.name_ar), q.t) > 0 or strpos(lower(s.name_en), q.t) > 0)
  )
  select p.id,
    greatest(
      case when strpos(h.hay, q.t) > 0 then 1.0 else 0 end,
      extensions.word_similarity(q.t, h.hay),
      case when p.specialty_ids && spec.ids or p.content_types && coalesce(p_kinds, '{}') then 0.7 else 0 end
    )::real as score
  from public.profiles p
  cross join q
  cross join spec
  cross join lateral (select public.ar_norm(concat_ws(' ', p.full_name, p.name_ar, p.username, p.city, p.other_specialty)) as hay) h
  where p.status = 'approved' and length(q.t) >= 2
    and (strpos(h.hay, q.t) > 0 or extensions.word_similarity(q.t, h.hay) > 0.45
         or p.specialty_ids && spec.ids or p.content_types && coalesce(p_kinds, '{}'))
  order by score desc, p.is_founding desc, p.created_at
  limit least(greatest(coalesce(p_limit, 8), 1), 50)
$$;

create or replace function public.search_projects(p_q text, p_limit int default 6)
returns table (id uuid, score real)
language sql stable
set search_path = ''
as $$
  with q as (select public.ar_norm(btrim(coalesce(p_q, ''))) as t)
  select w.id,
    greatest(case when strpos(h.hay, q.t) > 0 then 1.0 else 0 end, extensions.word_similarity(q.t, h.hay))::real as score
  from public.works w
  cross join q
  cross join lateral (select public.ar_norm(concat_ws(' ', w.title, w.brand)) as hay) h
  where length(q.t) >= 2 and (strpos(h.hay, q.t) > 0 or extensions.word_similarity(q.t, h.hay) > 0.45)
  order by score desc, w.created_at desc
  limit least(greatest(coalesce(p_limit, 6), 1), 50)
$$;

grant execute on function public.ar_norm(text) to anon, authenticated;
grant execute on function public.search_makers(text, int, text[]) to anon, authenticated;
grant execute on function public.search_projects(text, int) to anon, authenticated;
