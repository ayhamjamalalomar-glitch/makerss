-- Exceptional writing permission for members without a writing specialty (granted by the team).
create table if not exists public.writer_grants (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  granted_by uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists writer_grants_granted_by_idx on public.writer_grants (granted_by);
alter table public.writer_grants enable row level security;
revoke all on public.writer_grants from anon, authenticated;

create or replace function public.is_writer(p_user uuid default auth.uid())
returns boolean
language sql
stable security definer
set search_path to ''
as $$
  select coalesce((
    select status = 'approved' and (
      specialty_ids && array[7, 8, 14]
      or exists (select 1 from public.writer_grants g where g.user_id = p_user)
    )
    from public.profiles where id = p_user
  ), false)
$$;

-- Admin switch for the exception.
create or replace function public.admin_set_writer(p_user uuid, p_on boolean, p_note text default null)
returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if p_on then
    insert into public.writer_grants (user_id, granted_by, note) values (p_user, auth.uid(), p_note)
    on conflict (user_id) do update set granted_by = excluded.granted_by, note = excluded.note;
  else
    delete from public.writer_grants where user_id = p_user;
  end if;
  perform public.admin_log_access(case when p_on then 'writer_granted' else 'writer_revoked' end, 'profile', p_user::text, coalesce(p_note, case when p_on then 'writer granted' else 'writer revoked' end));
end $$;
revoke all on function public.admin_set_writer(uuid, boolean, text) from public, anon;
grant execute on function public.admin_set_writer(uuid, boolean, text) to authenticated;

-- First exception, approved by Ayham: Mohammad Labbad.
insert into public.writer_grants (user_id, note)
values ('fa57b44c-5d2b-405c-addc-ab50872afe14', 'Exception approved by Ayham, 2026-10-08')
on conflict (user_id) do nothing;
