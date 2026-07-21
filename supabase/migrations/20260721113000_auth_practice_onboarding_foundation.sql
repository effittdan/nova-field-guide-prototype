create type public.onboarding_request_status as enum (
  'pending',
  'approved',
  'rejected'
);

create or replace function app_private.has_any_role(
  allowed_roles public.member_role[]
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.user_id = (select auth.uid())
      and m.is_active = true
      and m.role = any(allowed_roles)
  );
$$;

revoke all on function app_private.has_any_role(public.member_role[]) from public;
grant execute on function app_private.has_any_role(public.member_role[]) to authenticated;

create table public.onboarding_requests (
  id uuid primary key default gen_random_uuid(),
  clinician_name text not null,
  email text not null,
  phone text,
  practice_name text,
  ehr_system text,
  ehr_identifier_label text,
  facility_names text[] not null default '{}'::text[],
  notes text,
  status public.onboarding_request_status not null default 'pending',
  requested_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  check (status = 'pending' or reviewed_at is not null)
);

create index onboarding_requests_status_created_idx on public.onboarding_requests(status, created_at desc);
create index onboarding_requests_requested_by_idx on public.onboarding_requests(requested_by) where requested_by is not null;

alter table public.onboarding_requests enable row level security;

grant select, insert, update on public.organizations to authenticated;
grant select, insert, update on public.facilities to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.memberships to authenticated;
grant select, insert, update on public.cases to authenticated;
grant select, insert on public.case_indications to authenticated;
grant select, insert on public.case_photos to authenticated;
grant select, insert, update on public.follow_up_tasks to authenticated;
grant select, insert, update on public.case_study_candidates to authenticated;
grant select on public.audit_events to authenticated;
grant select, insert on public.export_events to authenticated;
grant insert on public.onboarding_requests to anon;
grant select, insert, update on public.onboarding_requests to authenticated;

create policy "anyone can request clinician onboarding"
on public.onboarding_requests for insert
to anon, authenticated
with check (
  status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
  and (
    requested_by is null
    or requested_by = (select auth.uid())
  )
);

create policy "clinicians can read own onboarding requests"
on public.onboarding_requests for select
to authenticated
using (requested_by = (select auth.uid()));

create policy "amnioptix support can read onboarding requests"
on public.onboarding_requests for select
to authenticated
using (
  app_private.has_any_role(array['amnioptix_support']::public.member_role[])
);

create policy "amnioptix support can review onboarding requests"
on public.onboarding_requests for update
to authenticated
using (
  app_private.has_any_role(array['amnioptix_support']::public.member_role[])
)
with check (
  app_private.has_any_role(array['amnioptix_support']::public.member_role[])
);

create policy "amnioptix support can read all profiles"
on public.profiles for select
to authenticated
using (
  app_private.has_any_role(array['amnioptix_support']::public.member_role[])
);

create policy "amnioptix support can create organizations"
on public.organizations for insert
to authenticated
with check (
  app_private.has_any_role(array['amnioptix_support']::public.member_role[])
);

create policy "amnioptix support can update organizations"
on public.organizations for update
to authenticated
using (
  app_private.has_any_role(array['amnioptix_support']::public.member_role[])
)
with check (
  app_private.has_any_role(array['amnioptix_support']::public.member_role[])
);

create policy "amnioptix support can create facilities"
on public.facilities for insert
to authenticated
with check (
  app_private.has_any_role(array['amnioptix_support']::public.member_role[])
);

create policy "amnioptix support can update facilities"
on public.facilities for update
to authenticated
using (
  app_private.has_any_role(array['amnioptix_support']::public.member_role[])
)
with check (
  app_private.has_any_role(array['amnioptix_support']::public.member_role[])
);

create policy "amnioptix support can read memberships"
on public.memberships for select
to authenticated
using (
  app_private.has_any_role(array['amnioptix_support']::public.member_role[])
);

create policy "amnioptix support can create memberships"
on public.memberships for insert
to authenticated
with check (
  app_private.has_any_role(array['amnioptix_support']::public.member_role[])
);

create policy "amnioptix support can update memberships"
on public.memberships for update
to authenticated
using (
  app_private.has_any_role(array['amnioptix_support']::public.member_role[])
)
with check (
  app_private.has_any_role(array['amnioptix_support']::public.member_role[])
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    nullif(coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'name', ''), '')
  )
  on conflict (id) do update
  set email = excluded.email,
      display_name = coalesce(public.profiles.display_name, excluded.display_name);

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
