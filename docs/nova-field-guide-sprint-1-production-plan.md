# Nova Field Guide Sprint 1 Production Plan

## 1. Sprint Goal

Create the production foundation for Nova Field Guide using the selected stack:

- React PWA on Netlify.
- Supabase Auth.
- Supabase Postgres.
- Supabase private Storage.
- Supabase Edge Functions for sensitive actions.
- Encrypted IndexedDB for offline text drafts.

Sprint 1 should produce a production-shaped application using synthetic or non-PHI pilot data only. Real case data, real patient identifiers, and real photos should wait until BAA, HIPAA configuration, retention, support access, and policy review are complete.

## 2. Source Baseline

Implementation references:

- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Securing Your API: https://supabase.com/docs/guides/api/securing-your-api
- Supabase Storage Access Control: https://supabase.com/docs/guides/storage/security/access-control
- Supabase Storage Buckets: https://supabase.com/docs/guides/storage/buckets/fundamentals
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Supabase Auth: https://supabase.com/docs/guides/auth
- Netlify file-based configuration: https://docs.netlify.com/build/configure-builds/file-based-configuration/
- Netlify environment variables: https://docs.netlify.com/build/configure-builds/environment-variables/
- Netlify redirects and rewrites: https://docs.netlify.com/manage/routing/redirects/overview/
- Netlify Vite setup: https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/

Planning assumptions:

- The first production sprint is infrastructure and workflow foundation, not a full HIPAA launch.
- Supabase and Netlify must be configured under the required HIPAA/BAA posture before ePHI.
- Authorization decisions should be based on database membership records or protected app metadata, not editable user metadata.
- Every PHI-bearing table in an exposed schema must have RLS enabled.
- Private storage access should be mediated by RLS and short-lived signed URLs.

## 3. Sprint 1 Scope

### In Scope

- Create production app shell from the current Vite/React prototype.
- Add Supabase client setup with publishable client key only.
- Add login/logout session flow.
- Add organization and facility context.
- Add initial database schema.
- Add RLS policy draft and test plan.
- Add Edge Function route plan for sensitive operations.
- Add Netlify deployment configuration.
- Add offline text-draft design.
- Add synthetic seed data.

### Out Of Scope

- Real patient data.
- Real case photos.
- AI photo review.
- Billing/coding advice engine.
- EHR integrations.
- Automated email reminders containing case details.
- Case-study public release workflow.
- Broad AmniOptix access to partner case records.

## 4. Recommended Repository Shape

Recommended production folder layout:

```text
nova-field-guide/
  netlify.toml
  package.json
  src/
    app/
    components/
    features/
      auth/
      cases/
      facilities/
      offline/
      photos/
      reports/
    lib/
      supabaseClient.ts
      offlineStore.ts
      syncQueue.ts
    styles/
  supabase/
    config.toml
    migrations/
    functions/
      create-case/
      finalize-case/
      create-chart-summary/
      create-photo-upload-url/
      create-photo-view-url/
      audit-event/
```

For the current prototype, Sprint 1 can begin inside `nova-field-guide-prototype`, but production work should split from the demo once backend wiring begins.

## 5. Supabase Schema

### Extensions

Recommended:

```sql
create extension if not exists pgcrypto;
```

### Enumerations

```sql
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
```

### Core Tables

```sql
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
```

### Indexes

```sql
create index memberships_user_org_idx on public.memberships(user_id, organization_id) where is_active;
create index facilities_org_idx on public.facilities(organization_id) where is_active;
create index cases_org_facility_idx on public.cases(organization_id, facility_id, created_at desc);
create index cases_created_by_idx on public.cases(created_by, created_at desc);
create index case_photos_case_idx on public.case_photos(case_id) where deleted_at is null;
create index follow_up_org_due_idx on public.follow_up_tasks(organization_id, due_date) where completed_at is null;
create index audit_events_org_case_idx on public.audit_events(organization_id, case_id, created_at desc);
```

## 6. RLS Policy Plan

### Helper Function Strategy

Use a private schema for membership checks. This avoids repeating complex role logic in every policy.

Important security rules:

- Do not put helper functions in the exposed `public` schema.
- Do not make broad public `SECURITY DEFINER` functions.
- Include an `auth.uid()`-based check.
- Set a safe `search_path`.
- Revoke broad execute access.
- Run Supabase security advisors before release.

Draft:

```sql
create schema if not exists app_private;

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

revoke all on function app_private.has_org_role(uuid, public.member_role[]) from public;
grant execute on function app_private.has_org_role(uuid, public.member_role[]) to authenticated;
```

### Enable RLS

```sql
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
```

### Baseline Policies

Reference-data policies:

```sql
create policy "authenticated can read active indication groups"
on public.indication_groups for select
to authenticated
using (is_active = true);

create policy "authenticated can read active indications"
on public.indications for select
to authenticated
using (is_active = true);
```

Profile policies:

```sql
create policy "users can read own profile"
on public.profiles for select
to authenticated
using (id = (select auth.uid()));

create policy "users can update own profile"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));
```

Organization and facility read policies:

```sql
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
```

Case policies:

```sql
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
```

Child-table policy pattern:

```sql
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
```

Audit policy:

```sql
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
```

MVP rule:

Audit inserts should be performed by controlled server code, not arbitrary client writes.

## 7. Supabase Storage Plan

### Buckets

Create private buckets:

- `case-photos`
- `case-exports`
- `case-study-packets`

Path convention:

```text
org/{organization_id}/cases/{case_id}/pre-treatment/{photo_id}.jpg
org/{organization_id}/cases/{case_id}/post-treatment/{photo_id}.jpg
org/{organization_id}/case-study/{candidate_id}/{photo_id}.jpg
```

Storage access rules:

- No public buckets.
- No permanent public URLs.
- Signed URLs generated only through API/Edge Function after authorization.
- Photo metadata in `case_photos`.
- Storage object path must match the organization and case relationship.
- Upload, view, download, and delete create audit events.

Sprint 1 implementation:

- Create bucket definitions in the migration plan.
- Add metadata table and path conventions.
- Do not enable real photo upload for PHI until HIPAA readiness is complete.

## 8. Edge Function Plan

Sprint 1 functions:

| Function | Purpose | Notes |
| --- | --- | --- |
| `create-case` | Validate organization/facility membership and create case | Writes audit event |
| `finalize-case` | Validate required fields and mark case complete | Allows incomplete acknowledgement |
| `create-chart-summary` | Generate copyable/exportable chart summary | No billing guarantees |
| `create-photo-upload-url` | Authorize and prepare photo upload | Disabled for real PHI until photo policy approved |
| `create-photo-view-url` | Return short-lived signed URL | Requires case visibility |
| `submit-case-study-candidate` | Start case-study review flow | Admin approval required |

Function rules:

- Validate the Supabase user session in every user-facing function.
- Use RLS-respecting clients for normal user operations.
- Use privileged service access only for narrow operations that require it.
- Never expose service keys to the browser.
- Redact ePHI from logs.
- Make functions idempotent where retry is likely.

## 9. Netlify Deployment Settings

Create `netlify.toml` at the production app root:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(self), microphone=(self), geolocation=()"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

Netlify environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_APP_ENV`
- `VITE_ENABLE_PHOTO_UPLOADS=false`
- `VITE_ENABLE_DEMO_MODE=true`

Do not commit:

- Supabase service role key.
- Database password.
- HIPAA account documents.
- Private partner configuration.
- Any production PHI.

Netlify account settings before real data:

- Confirm Netlify HIPAA-compliant service offering.
- Execute BAA.
- Configure production team access.
- Restrict deploy permissions.
- Avoid production PHI in deploy previews.
- Store sensitive environment variables in Netlify UI, not `netlify.toml`.
- Ensure audit/security contacts are configured.

## 10. Offline Draft Strategy

### Sprint 1 Behavior

Support offline text drafts only:

- Facility.
- Practice/EHR ID.
- Eye.
- Indications.
- Objective findings.
- Prior measures.
- Treatment rationale.
- Follow-up plan.
- Notes.
- Incomplete acknowledgement.

Do not store offline photos in Sprint 1.

### Local Storage Design

Use IndexedDB, not plain `localStorage`, for production drafts.

Draft object:

```ts
type OfflineDraft = {
  localDraftId: string;
  serverCaseId?: string;
  organizationId: string;
  facilityId?: string;
  userId: string;
  encryptedPayload: ArrayBuffer;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  syncStatus: "local_only" | "pending_sync" | "synced" | "conflict" | "failed";
  lastSyncAttemptAt?: string;
  schemaVersion: number;
};
```

Encryption posture:

- Use WebCrypto for client-side draft encryption.
- Keep the draft key scoped to the authenticated user/device session.
- Re-authenticate before unlocking drafts after idle timeout.
- Treat browser encryption as risk reduction, not a substitute for device security.

### Sync Queue

Sync behavior:

1. User edits draft offline.
2. App marks draft `local_only` or `pending_sync`.
3. On reconnect, app sends draft to `create-case` or update endpoint.
4. Server validates membership and writes case.
5. Server returns case ID and updated timestamp.
6. Local draft marks `synced`.

Conflict behavior:

- If server `updated_at` is newer than the local base version, mark conflict.
- Show the practitioner a simple choice:
  - Keep server version.
  - Review local changes.
  - Save local changes as a new draft note.

Retention:

- Unsynced drafts expire after a defined period, such as 7 or 14 days.
- Completed synced drafts should be cleared from local encrypted storage.
- User can manually clear all local drafts.

## 11. Sprint Backlog

### Database

- Create schema migration draft.
- Add reference indication seed data.
- Add RLS policies.
- Add storage bucket migration plan.
- Add SQL test fixtures for two organizations and multiple roles.
- Run Supabase security/performance advisors when connected to a project.

### App

- Convert prototype state from `localStorage` to structured case model.
- Add Supabase client.
- Add auth screens.
- Add organization/facility selector.
- Add server-backed case create/update flow.
- Keep demo mode isolated from production data.
- Add offline draft store module.
- Add sync status UI.

### Netlify

- Add `netlify.toml`.
- Set build command and publish directory.
- Add SPA redirect.
- Add security headers.
- Configure environment variables in Netlify UI.
- Confirm production/deploy-preview separation.

### Security

- Add no-PHI logging rule.
- Add audit event writer design.
- Add role matrix tests.
- Add RLS test cases:
  - Practitioner cannot read another organization.
  - Practitioner can read own case.
  - Practice admin can read organization cases.
  - Supervisor can read assigned organization reporting.
  - AmniOptix support cannot browse case details by default.

## 12. Acceptance Criteria

Sprint 1 is complete when:

- App builds on Netlify-compatible settings.
- Authenticated user can log in and see only assigned organization/facility context.
- Synthetic case can be created and edited.
- Documentation status engine still works.
- Offline text draft can be created, locked, reopened after auth, synced, and cleared.
- RLS policies prevent cross-organization case access in tests.
- No service role key is present in frontend code.
- No PHI is sent to analytics, logs, or deploy previews.
- Netlify deployment config is committed without secrets.
- Photo upload remains disabled or synthetic-only until photo policy is approved.

## 13. Sprint 1 Deliverables

- Production repo/folder structure.
- Initial Supabase migration.
- RLS policy test script.
- Netlify configuration.
- Offline draft module.
- Authenticated case workflow using synthetic data.
- Security checklist for pilot readiness.

## 14. Decision Gate After Sprint 1

Before Sprint 2, decide:

1. Whether to keep using the prototype folder or split a clean production app.
2. Whether the first pilot stores photos in app storage or starts with export/remove behavior.
3. Which partner will be the first limited pilot.
4. Who will administer users: partner admin, AmniOptix, or both.
5. Draft expiration period.
6. Whether Netlify deploy previews are disabled or isolated from production Supabase.

