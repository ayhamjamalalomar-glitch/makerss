/* Reports ("بلّغ") reuse the tickets table, plus scheduled housekeeping. */

alter table public.tickets add column if not exists target_type text;
alter table public.tickets add column if not exists target_id text;
alter table public.tickets add column if not exists reason text;
create index if not exists tickets_status_idx on public.tickets (status, created_at desc);

create or replace function public.report_content(p_type text, p_id text, p_reason text, p_message text default null)
returns bigint
language plpgsql security definer
set search_path = ''
as $$
declare v_id bigint;
begin
  if auth.uid() is null then raise exception 'not allowed'; end if;
  if p_type not in ('profile', 'project', 'call') then raise exception 'bad type'; end if;
  if p_reason not in ('fake', 'stolen', 'offensive', 'spam', 'other') then raise exception 'bad reason'; end if;
  if (select count(*) from public.tickets where opened_by = auth.uid() and created_at > now() - interval '24 hours') >= 10 then
    raise exception 'too many reports';
  end if;
  insert into public.tickets (opened_by, kind, target_type, target_id, reason, message, status)
  values (auth.uid(), 'report', p_type, left(p_id, 80), p_reason, left(nullif(btrim(coalesce(p_message, '')), ''), 1000), 'open')
  returning id into v_id;
  perform public.notify_staff('admin_report', jsonb_build_object('type', p_type, 'reason', p_reason, 'by', public.display_name_of(auth.uid())));
  return v_id;
end $$;

create or replace function public.resolve_ticket(p_id bigint, p_resolution text)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then raise exception 'not allowed'; end if;
  update public.tickets set status = 'resolved', resolution = left(nullif(btrim(coalesce(p_resolution, '')), ''), 500), resolved_at = now() where id = p_id;
  insert into public.admin_audit_log (admin_id, action, target_type, target_id, reason)
  values (auth.uid(), 'resolve_ticket', 'ticket', p_id::text, p_resolution);
end $$;

revoke execute on function public.report_content(text, text, text, text) from public, anon;
grant execute on function public.report_content(text, text, text, text) to authenticated;
revoke execute on function public.resolve_ticket(bigint, text) from public, anon;
grant execute on function public.resolve_ticket(bigint, text) to authenticated;
grant select on public.tickets to authenticated;

/* Close open calls whose deadline passed, and expire unanswered collaboration requests. */
create or replace function public.housekeeping()
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.open_calls set status = 'closed' where status = 'open' and deadline is not null and deadline < current_date;
  perform public.expire_contact_requests();
end $$;
revoke execute on function public.housekeeping() from public, anon, authenticated;

select cron.schedule('housekeeping', '15 * * * *', 'select public.housekeeping()');
