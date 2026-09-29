/* Cover every foreign key flagged by the performance advisor. */
create index if not exists admin_audit_log_admin_id_idx on public.admin_audit_log (admin_id);
create index if not exists awards_owner_id_idx on public.awards (owner_id);
create index if not exists blocks_blocked_idx on public.blocks (blocked);
create index if not exists collaboration_requests_from_id_idx on public.collaboration_requests (from_id);
create index if not exists collaboration_requests_to_id_idx on public.collaboration_requests (to_id);
create index if not exists contact_requests_sender_id_idx on public.contact_requests (sender_id);
create index if not exists credits_added_by_idx on public.credits (added_by);
create index if not exists credits_profile_id_idx on public.credits (profile_id);
create index if not exists credits_work_id_idx on public.credits (work_id);
create index if not exists invites_inviter_id_idx on public.invites (inviter_id);
create index if not exists invites_used_by_idx on public.invites (used_by);
create index if not exists messages_sender_id_idx on public.messages (sender_id);
create index if not exists open_call_applications_applicant_id_idx on public.open_call_applications (applicant_id);
create index if not exists open_calls_owner_id_idx on public.open_calls (owner_id);
create index if not exists profiles_reviewed_by_idx on public.profiles (reviewed_by);
create index if not exists reviews_from_id_idx on public.reviews (from_id);
create index if not exists reviews_to_id_idx on public.reviews (to_id);
create index if not exists specialty_suggestions_profile_id_idx on public.specialty_suggestions (profile_id);
create index if not exists tickets_credit_id_idx on public.tickets (credit_id);
create index if not exists tickets_opened_by_idx on public.tickets (opened_by);
create index if not exists works_owner_id_idx on public.works (owner_id);

/* Trigger function and internal helpers do not need to be callable over the API. */
revoke execute on function public.collab_to_conversation() from public, anon, authenticated;
revoke execute on function public.pending_collab_count() from public, anon;
grant execute on function public.pending_collab_count() to authenticated;
revoke execute on function public.expire_collaboration_requests() from public, anon, authenticated;

/* One policy per action instead of an ALL policy that overlaps the read policy. */
drop policy if exists awards_write on public.awards;
create policy awards_insert on public.awards for insert to authenticated with check (owner_id = (select auth.uid()));
create policy awards_update on public.awards for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy awards_delete on public.awards for delete to authenticated using (owner_id = (select auth.uid()));

drop policy if exists specialties_admin on public.specialties;
create policy specialties_insert on public.specialties for insert to authenticated with check ((select public.is_admin()));
create policy specialties_update on public.specialties for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy specialties_delete on public.specialties for delete to authenticated using ((select public.is_admin()));
