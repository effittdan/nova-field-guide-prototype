create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create index if not exists audit_events_actor_user_id_idx on public.audit_events(actor_user_id);
create index if not exists audit_events_case_id_idx on public.audit_events(case_id);
create index if not exists audit_events_facility_id_idx on public.audit_events(facility_id);
create index if not exists case_indications_indication_id_idx on public.case_indications(indication_id);
create index if not exists case_photos_organization_id_idx on public.case_photos(organization_id);
create index if not exists case_photos_uploaded_by_idx on public.case_photos(uploaded_by);
create index if not exists case_study_candidates_case_id_idx on public.case_study_candidates(case_id);
create index if not exists case_study_candidates_organization_id_idx on public.case_study_candidates(organization_id);
create index if not exists case_study_candidates_reviewed_by_idx on public.case_study_candidates(reviewed_by);
create index if not exists case_study_candidates_submitted_by_idx on public.case_study_candidates(submitted_by);
create index if not exists cases_assigned_to_idx on public.cases(assigned_to);
create index if not exists cases_facility_id_idx on public.cases(facility_id);
create index if not exists export_events_case_id_idx on public.export_events(case_id);
create index if not exists export_events_exported_by_idx on public.export_events(exported_by);
create index if not exists export_events_organization_id_idx on public.export_events(organization_id);
create index if not exists follow_up_tasks_assigned_to_idx on public.follow_up_tasks(assigned_to);
create index if not exists follow_up_tasks_case_id_idx on public.follow_up_tasks(case_id);
