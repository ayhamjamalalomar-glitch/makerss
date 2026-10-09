-- Article blocks: text and list blocks may carry their own text size (px, 12 to 48).
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
    if t in ('p', 'h2', 'h3', 'quote', 'ul', 'ol') and b ? 'size' and jsonb_typeof(b -> 'size') <> 'null'
      and (jsonb_typeof(b -> 'size') <> 'number' or (b ->> 'size')::numeric not between 12 and 48) then
      raise exception 'bad size';
    end if;
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
