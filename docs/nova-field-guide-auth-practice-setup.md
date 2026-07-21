# Nova Field Guide Auth + Practice Setup

## Recommended Access Model

Use an AmniOptix-managed practice setup as the source of truth.

Clinicians can submit a first-scan setup request from the app, but that request should not automatically create authorization, facility access, or organization membership. AmniOptix admin review should convert approved requests into:

- Organization / managing medical group
- Facility directory
- Clinician profile
- Membership role
- EHR identifier label or export preference

This preserves the field-friendly onboarding path without letting self-entered data become an access-control system.

## Initial Roles

- `practitioner`: creates and manages their own field cases.
- `practice_admin`: sees practice-level context and case-completion patterns.
- `supervisor`: reviews facility-level trends and follow-up gaps.
- `amnioptix_support`: reviews onboarding requests and manages practice setup.

## First Production Flow

1. Clinician scans the Nova treatment-card QR code.
2. App opens and asks for secure email sign-in.
3. If the clinician is not assigned to a practice, the app shows setup pending.
4. Clinician submits setup request with managing group, facilities, and EHR context.
5. AmniOptix admin reviews the request.
6. Admin creates or updates the organization, facility list, and membership.
7. Clinician signs in again and receives assigned practice context.

## Admin Portal Scope

The first admin portal should manage:

- Pending onboarding requests
- Organizations / managing groups
- Facility directories
- Clinician memberships
- Role assignment
- Basic EHR label/preferences

Do not add real case or photo administration to the first admin portal until authenticated case CRUD and storage RLS have synthetic-user tests.

## HIPAA Note

Practice/EHR IDs, facility context, dates, clinical notes, and photos can still become identifying in combination. Treat authenticated case data as PHI-adjacent from the start even when patient names are not collected.
