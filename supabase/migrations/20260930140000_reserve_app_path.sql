-- /app on makerss.net serves the web preview of the iOS app, so "app" can't be a username.
create or replace function public.username_available(p_username text)
returns boolean
language sql
stable security definer
set search_path to ''
as $function$
  select lower(p_username) ~ '^[a-z0-9](?:[a-z0-9-]{1,28})[a-z0-9]$'
     and lower(p_username) not in ('admin','join','login','me','inbox','terms','privacy','api','about','makers','settings','status','reset','en','ar','messages','projects','opportunities','search','app')
     and not exists (select 1 from public.profiles where lower(username) = lower(p_username))
$function$;
