create extension if not exists pgcrypto;

create schema if not exists app_private;

create type public.member_role as enum (
  'practitioner',
  'practice_admin',
  'supervisor',
  'amnioptix_support'
);

create type public.case_status as enum (
  'draft',
  'complete',
  'exported',
  'archived'
);

create type public.documentation_level as enum (
  'red',
  'yellow',
  'green'
);

create type public.eye_laterality as enum (
  'OD',
  'OS',
  'OU'
);

create type public.photo_type as enum (
  'pre_treatment',
  'post_treatment',
  'other'
);

create type public.case_study_status as enum (
  'not_submitted',
  'candidate',
  'admin_review',
  'approved_for_amnioptix',
  'rejected'
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  partner_brand_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.facilities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  city text,
  state text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  created_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id, role)
);

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  facility_id uuid not null references public.facilities(id) on delete restrict,
  created_by uuid not null references public.profiles(id) on delete restrict,
  assigned_to uuid references public.profiles(id) on delete set null,
  practice_ehr_id text,
  eye public.eye_laterality not null,
  status public.case_status not null default 'draft',
  documentation_level public.documentation_level not null default 'red',
  objective_findings text,
  prior_measures text,
  treatment_rationale text,
  follow_up_date date,
  follow_up_plan text,
  notes text,
  incomplete_acknowledged boolean not null default false,
  case_study_status public.case_study_status not null default 'not_submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  exported_at timestamptz
);

create table public.indication_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  display_order integer not null default 0,
  is_active boolean not null default true
);

create table public.indications (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.indication_groups(id) on delete cascade,
  label text not null,
  is_dry_eye_driver boolean not null default false,
  display_order integer not null default 0,
  is_active boolean not null default true,
  unique (group_id, label)
);

create table public.case_indications (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  indication_id uuid references public.indications(id) on delete restrict,
  custom_label text,
  created_at timestamptz not null default now(),
  check (
    indication_id is not null or nullif(trim(custom_label), '') is not null
  )
);

create table public.case_photos (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  storage_bucket text not null,
  storage_path text not null,
  photo_type public.photo_type not null,
  taken_at timestamptz,
  uploaded_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (storage_bucket, storage_path)
);

create table public.follow_up_tasks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  assigned_to uuid references public.profiles(id) on delete set null,
  due_date date,
  description text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.case_study_candidates (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  submitted_by uuid not null references public.profiles(id) on delete restrict,
  reviewed_by uuid references public.profiles(id) on delete set null,
  status public.case_study_status not null default 'candidate',
  permission_status text,
  allowed_use_category text,
  deidentified_summary text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  facility_id uuid references public.facilities(id) on delete set null,
  case_id uuid references public.cases(id) on delete set null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  event_outcome text not null default 'success',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.export_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  exported_by uuid not null references public.profiles(id) on delete restrict,
  export_type text not null,
  created_at timestamptz not null default now()
);

create index memberships_user_org_idx on public.memberships(user_id, organization_id) where is_active;
create index facilities_org_idx on public.facilities(organization_id) where is_active;
create index cases_org_facility_idx on public.cases(organization_id, facility_id, created_at desc);
create index cases_created_by_idx on public.cases(created_by, created_at desc);
create index case_indications_case_idx on public.case_indications(case_id);
create index case_photos_case_idx on public.case_photos(case_id) where deleted_at is null;
create index follow_up_org_due_idx on public.follow_up_tasks(organization_id, due_date) where completed_at is null;
create index audit_events_org_case_idx on public.audit_events(organization_id, case_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_cases_updated_at
before update on public.cases
for each row
execute function public.set_updated_at();

create or replace function app_private.has_org_role(
  check_org_id uuid,
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
    where m.organization_id = check_org_id
      and m.user_id = (select auth.uid())
      and m.is_active = true
      and m.role = any(allowed_roles)
  );
$$;

revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;
revoke all on function app_private.has_org_role(uuid, public.member_role[]) from public;
grant execute on function app_private.has_org_role(uuid, public.member_role[]) to authenticated;

alter table public.organizations enable row level security;
alter table public.facilities enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.cases enable row level security;
alter table public.indication_groups enable row level security;
alter table public.indications enable row level security;
alter table public.case_indications enable row level security;
alter table public.case_photos enable row level security;
alter table public.follow_up_tasks enable row level security;
alter table public.case_study_candidates enable row level security;
alter table public.audit_events enable row level security;
alter table public.export_events enable row level security;

create policy "authenticated can read active indication groups"
on public.indication_groups for select
to authenticated
using (is_active = true);

create policy "authenticated can read active indications"
on public.indications for select
to authenticated
using (is_active = true);

create policy "users can read own profile"
on public.profiles for select
to authenticated
using (id = (select auth.uid()));

create policy "users can update own profile"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "members can read own memberships"
on public.memberships for select
to authenticated
using (user_id = (select auth.uid()));

create policy "members can read own organizations"
on public.organizations for select
to authenticated
using (
  app_private.has_org_role(id, array[
    'practitioner',
    'practice_admin',
    'supervisor',
    'amnioptix_support'
  ]::public.member_role[])
);

create policy "members can read own facilities"
on public.facilities for select
to authenticated
using (
  app_private.has_org_role(organization_id, array[
    'practitioner',
    'practice_admin',
    'supervisor',
    'amnioptix_support'
  ]::public.member_role[])
);

create policy "members can read cases in organization"
on public.cases for select
to authenticated
using (
  app_private.has_org_role(organization_id, array[
    'practice_admin',
    'supervisor'
  ]::public.member_role[])
  or created_by = (select auth.uid())
  or assigned_to = (select auth.uid())
);

create policy "practitioners can create cases in their organization"
on public.cases for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and app_private.has_org_role(organization_id, array[
    'practitioner',
    'practice_admin',
    'supervisor'
  ]::public.member_role[])
);

create policy "case owners and admins can update cases"
on public.cases for update
to authenticated
using (
  created_by = (select auth.uid())
  or assigned_to = (select auth.uid())
  or app_private.has_org_role(organization_id, array[
    'practice_admin',
    'supervisor'
  ]::public.member_role[])
)
with check (
  created_by = (select auth.uid())
  or assigned_to = (select auth.uid())
  or app_private.has_org_role(organization_id, array[
    'practice_admin',
    'supervisor'
  ]::public.member_role[])
);

create policy "members can read case indications for visible cases"
on public.case_indications for select
to authenticated
using (
  exists (
    select 1
    from public.cases c
    where c.id = case_id
      and (
        c.created_by = (select auth.uid())
        or c.assigned_to = (select auth.uid())
        or app_private.has_org_role(c.organization_id, array[
          'practice_admin',
          'supervisor'
        ]::public.member_role[])
      )
  )
);

create policy "case owners and admins can add indications"
on public.case_indications for insert
to authenticated
with check (
  exists (
    select 1
    from public.cases c
    where c.id = case_id
      and (
        c.created_by = (select auth.uid())
        or c.assigned_to = (select auth.uid())
        or app_private.has_org_role(c.organization_id, array[
          'practice_admin',
          'supervisor'
        ]::public.member_role[])
      )
  )
);

create policy "members can read photo metadata for visible cases"
on public.case_photos for select
to authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from public.cases c
    where c.id = case_id
      and (
        c.created_by = (select auth.uid())
        or c.assigned_to = (select auth.uid())
        or app_private.has_org_role(c.organization_id, array[
          'practice_admin',
          'supervisor'
        ]::public.member_role[])
      )
  )
);

create policy "case owners and admins can create photo metadata"
on public.case_photos for insert
to authenticated
with check (
  uploaded_by = (select auth.uid())
  and exists (
    select 1
    from public.cases c
    where c.id = case_id
      and c.organization_id = organization_id
      and (
        c.created_by = (select auth.uid())
        or c.assigned_to = (select auth.uid())
        or app_private.has_org_role(c.organization_id, array[
          'practice_admin',
          'supervisor'
        ]::public.member_role[])
      )
  )
);

create policy "members can read follow up tasks in organization"
on public.follow_up_tasks for select
to authenticated
using (
  assigned_to = (select auth.uid())
  or app_private.has_org_role(organization_id, array[
    'practice_admin',
    'supervisor'
  ]::public.member_role[])
);

create policy "case owners and admins can manage follow up tasks"
on public.follow_up_tasks for insert
to authenticated
with check (
  exists (
    select 1
    from public.cases c
    where c.id = case_id
      and c.organization_id = organization_id
      and (
        c.created_by = (select auth.uid())
        or c.assigned_to = (select auth.uid())
        or app_private.has_org_role(c.organization_id, array[
          'practice_admin',
          'supervisor'
        ]::public.member_role[])
      )
  )
);

create policy "members can read case study candidates in organization"
on public.case_study_candidates for select
to authenticated
using (
  submitted_by = (select auth.uid())
  or app_private.has_org_role(organization_id, array[
    'practice_admin',
    'supervisor'
  ]::public.member_role[])
);

create policy "case owners can submit case study candidates"
on public.case_study_candidates for insert
to authenticated
with check (
  submitted_by = (select auth.uid())
  and exists (
    select 1
    from public.cases c
    where c.id = case_id
      and c.organization_id = organization_id
      and (
        c.created_by = (select auth.uid())
        or c.assigned_to = (select auth.uid())
      )
  )
);

create policy "admins and supervisors can read audit events in organization"
on public.audit_events for select
to authenticated
using (
  organization_id is not null
  and app_private.has_org_role(organization_id, array[
    'practice_admin',
    'supervisor'
  ]::public.member_role[])
);

create policy "admins and supervisors can read export events in organization"
on public.export_events for select
to authenticated
using (
  app_private.has_org_role(organization_id, array[
    'practice_admin',
    'supervisor'
  ]::public.member_role[])
);

insert into public.indication_groups (slug, label, display_order)
values
  ('keratitis', 'Keratitis', 10),
  ('epithelial', 'Epithelial compromise', 20),
  ('erosion', 'Erosion / dystrophy', 30),
  ('severe', 'Ulcer / severe surface compromise', 40),
  ('dry-eye-drivers', 'Dry eye drivers to document', 50)
on conflict (slug) do nothing;

insert into public.indications (group_id, label, is_dry_eye_driver, display_order)
select g.id, item.label, item.is_dry_eye_driver, item.display_order
from public.indication_groups g
join (
  values
    ('keratitis', 'Superficial punctate keratitis', false, 10),
    ('keratitis', 'Filamentary keratitis', false, 20),
    ('keratitis', 'Exposure keratitis', false, 30),
    ('keratitis', 'Neurotrophic keratitis', false, 40),
    ('epithelial', 'Persistent epithelial defect', false, 10),
    ('epithelial', 'Non-healing epithelial defect', false, 20),
    ('epithelial', 'Corneal epithelial breakdown', false, 30),
    ('erosion', 'Recurrent corneal erosion', false, 10),
    ('erosion', 'Anterior basement membrane dystrophy with epithelial compromise', false, 20),
    ('severe', 'Corneal ulcer support', false, 10),
    ('severe', 'Corneal melt concern', false, 20),
    ('severe', 'Post-surgical epithelial compromise', false, 30),
    ('dry-eye-drivers', 'MGD', true, 10),
    ('dry-eye-drivers', 'Lid disease', true, 20),
    ('dry-eye-drivers', 'Exposure', true, 30),
    ('dry-eye-drivers', 'Allergy or inflammation', true, 40),
    ('dry-eye-drivers', 'Medication toxicity', true, 50),
    ('dry-eye-drivers', 'Tear-film instability', true, 60)
) as item(group_slug, label, is_dry_eye_driver, display_order)
  on item.group_slug = g.slug
on conflict (group_id, label) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('case-photos', 'case-photos', false, 20971520, array['image/jpeg', 'image/png', 'image/webp']),
  ('case-exports', 'case-exports', false, 10485760, array['application/pdf', 'text/plain']),
  ('case-study-packets', 'case-study-packets', false, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "authenticated users can read authorized case photo objects"
on storage.objects for select
to authenticated
using (
  bucket_id = 'case-photos'
  and exists (
    select 1
    from public.case_photos p
    where p.storage_bucket = bucket_id
      and p.storage_path = name
      and p.deleted_at is null
      and exists (
        select 1
        from public.cases c
        where c.id = p.case_id
          and (
            c.created_by = (select auth.uid())
            or c.assigned_to = (select auth.uid())
            or app_private.has_org_role(c.organization_id, array[
              'practice_admin',
              'supervisor'
            ]::public.member_role[])
          )
      )
  )
);

