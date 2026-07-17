# Nova Field Guide Production Stack Selection

## 1. Decision Summary

Recommended production path:

Build Nova Field Guide as a mobile-first React PWA using:

- Frontend: React PWA, evolved from the current Vite prototype.
- Hosting: Netlify HIPAA-compliant service offering with a signed BAA, or an equivalent HIPAA BAA-capable host.
- Auth: Supabase Auth in a HIPAA-enabled Supabase project.
- Database: Supabase Postgres with row-level security.
- API: Supabase Edge Functions or a small server API layer for all sensitive writes, exports, and admin actions.
- Photo storage: Supabase Storage private buckets in the same HIPAA-enabled project.
- Offline drafts: encrypted IndexedDB on device, with a conservative retention and sync policy.
- Voice input: native device dictation only for MVP.
- Photo AI: deferred until a separate HIPAA/vendor/legal review.

This is the recommended MVP path because it preserves the current prototype direction, keeps engineering velocity high, supports relational case documentation cleanly, and avoids a large custom cloud build before product-market fit is proven.

Important qualification:

This stack is only production-appropriate for real case data after Business Associate Agreements, security configuration, policies, access controls, audit logging, and counsel review are complete.

## 2. Source Baseline

Vendor and regulatory sources reviewed:

- HHS HIPAA Security Rule summary: https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html
- HHS covered entities and business associates: https://www.hhs.gov/hipaa/for-professionals/covered-entities/index.html
- HHS cloud computing guidance: https://www.hhs.gov/hipaa/for-professionals/special-topics/health-information-technology/cloud-computing/index.html
- Supabase HIPAA compliance: https://supabase.com/docs/guides/security/hipaa-compliance
- Supabase HIPAA projects: https://supabase.com/docs/guides/platform/hipaa-projects
- Netlify HIPAA-compliant service offering: https://www.netlify.com/blog/netlify-launches-a-hipaa-compliant-service-offering/
- Netlify security and trust center: https://www.netlify.com/security/
- Netlify pricing and HIPAA service offering reference: https://www.netlify.com/pricing/
- Google Cloud HIPAA compliance: https://cloud.google.com/security/compliance/hipaa
- Google Cloud HIPAA BAA terms: https://cloud.google.com/terms/hipaa-baa
- AWS HIPAA compliance: https://aws.amazon.com/compliance/hipaa-compliance/
- AWS HIPAA eligible services reference: https://aws.amazon.com/compliance/hipaa-eligible-services-reference/

Current interpretation:

- If Nova Field Guide stores or transmits ePHI, every vendor in that data path needs HIPAA review.
- A signed BAA is required when a vendor is acting as a business associate.
- A vendor's availability of HIPAA support does not make the application compliant by itself.
- AmniOptix and partner practices still need policies, training, access controls, and operational procedures.

## 3. Recommended Architecture

```text
Treatment card QR
  -> Netlify-hosted React PWA
  -> Supabase Auth session
  -> Organization and facility context
  -> Encrypted IndexedDB draft store
  -> Supabase Edge Function / API validation
  -> Supabase Postgres
  -> Supabase private Storage bucket
  -> Audit event table
  -> Chart summary export
  -> Case-study approval queue
```

## 4. Why This Stack Fits Nova Field Guide

### Product Fit

- The current working product is already a React PWA prototype.
- Practitioners need mobile speed more than heavy enterprise workflow.
- Facility directories, case checklists, indication taxonomy, case-study candidates, and admin reporting are relational data problems.
- Supabase Postgres is a natural fit for organization-scoped case records and row-level access rules.
- Private object storage fits pre-treatment photos without forcing a separate storage vendor early.

### Operational Fit

- Supabase reduces backend build time by combining auth, database, storage, and server functions.
- Netlify keeps frontend deployment simple for a small product team and fits the PWA/static frontend shape well.
- The number of vendors handling sensitive data stays limited.
- The architecture can still migrate later to Google Cloud or AWS if a major partner requires a deeper enterprise cloud posture.

### Compliance Fit

- Supabase documents HIPAA project support with a signed BAA and HIPAA add-on for PHI.
- Netlify documents a HIPAA-compliant service offering for enterprise customers handling PHI, including the ability to execute a BAA.
- The app can keep ePHI out of URLs, analytics, client logs, and support tools.
- The database can enforce organization separation at the data layer through row-level security.

## 5. Vendor Selection

### Frontend Hosting

Recommended:

- Netlify HIPAA-compliant service offering with a signed BAA.

Configuration requirements:

- Do not put patient identifiers or case details in URLs.
- Disable or tightly control analytics that could receive ePHI.
- Do not log request bodies containing ePHI.
- Do not expose ePHI in build logs, preview deployments, screenshots, or support tickets.
- Use production-only environment variables.
- Limit preview deployment access if connected to sensitive environments.

Fallback:

- Google Cloud Run or AWS Amplify/CloudFront if counsel or a partner prefers a single major-cloud vendor posture.

### Authentication

Recommended:

- Supabase Auth within the HIPAA-enabled Supabase project.

MVP requirements:

- Unique accounts only.
- No shared facility login.
- Email invite flow.
- Strong password or passwordless magic-link flow.
- MFA available and required for admins when feasible.
- Session timeout.
- Device/session revocation.
- Role and organization membership enforced in the API and database, not only in the UI.

Avoid for MVP:

- Social login.
- Anonymous use for real case records.
- Shared practice passwords.

### Database

Recommended:

- Supabase Postgres.

Required tables:

- organizations
- facilities
- users or profiles
- memberships
- cases
- case_indications
- case_photos
- follow_up_tasks
- case_study_candidates
- audit_events
- export_events

Required controls:

- Row-level security enabled for all PHI-bearing tables.
- Organization ID on every sensitive record.
- Server-side validation for case creation and status changes.
- Soft-delete plus retention policy where appropriate.
- Audit events for create, view, update, export, photo view, photo upload, photo delete, user invite, deactivation, and role change.

### API Layer

Recommended:

- Supabase Edge Functions for sensitive operations that should not be direct client writes.

Use API functions for:

- Case creation and finalization.
- Chart summary export.
- Case-study candidate submission.
- Case-study approval.
- Signed photo URL generation.
- Audit event writes.
- Admin reporting.
- Follow-up task changes.

Direct client database access can be considered only for low-risk reads/writes protected by tested RLS policies.

### Encrypted Storage

Recommended:

- Supabase Storage private buckets for photos and generated chart packets.

Storage rules:

- No public buckets for case photos.
- No permanent public image links.
- Short-lived signed URLs only.
- Separate pathing by organization and case.
- Photo metadata stored in Postgres.
- Audit events for upload, view, download, and delete.
- Retention policy defined before pilot.

Suggested storage paths:

```text
org/{organization_id}/cases/{case_id}/pre-treatment/{photo_id}.jpg
org/{organization_id}/cases/{case_id}/post-treatment/{photo_id}.jpg
org/{organization_id}/case-study/{candidate_id}/{photo_id}.jpg
```

## 6. Offline Sync Decision

Recommended MVP posture:

Support offline case drafts, but start conservatively.

Offline data model:

- Encrypted IndexedDB for draft cases.
- Store text fields offline first.
- Mark every draft as unsynced until confirmed by server.
- Require recent authentication before reopening drafts.
- Auto-lock after inactivity.
- Retain unsynced drafts for a limited period.
- Show sync conflict warnings rather than silently overwriting server records.

Photo offline posture:

Phase 1 recommendation:

- Allow camera capture while online.
- If offline, allow the practitioner to mark that a photo was taken externally or attach later.
- Do not store photos offline in MVP unless a stronger device-storage review is completed.

Phase 2 option:

- Add encrypted local photo draft storage only if field use proves it is essential.

Rationale:

Offline text drafts help rural and nursing home workflows. Offline photos add much more privacy and device-loss risk, so they should be deferred unless pilot feedback makes them necessary.

## 7. Photo Handling Decision

Recommended MVP decision:

Store photos in the app only after the Supabase HIPAA project, BAA, private storage, retention rules, and audit logging are complete.

Pilot-safe alternative:

- For the earliest real-world pilot, support photo capture/import and chart packet export, then remove local app copies after sync/export if the practice prefers lower storage risk.

Do not include in MVP:

- AI diagnosis.
- Automatic clinical labels.
- Public image galleries.
- Emailing photos from the app.
- Uploading to unapproved shared drives.

Later AI photo review:

Visible-issue screening can be explored later as a separate module. It should be framed as documentation quality support or visible finding prompts, not diagnosis, and only after vendor BAA, model/data-retention terms, clinician review, and risk language are approved.

## 8. Analytics And Observability

Recommended MVP posture:

- Use privacy-preserving, non-PHI operational telemetry only.
- Do not send ePHI to analytics, error logging, session replay, chat support, or product analytics.
- Disable session replay for production PHI screens.
- Redact route parameters, request payloads, and form values.
- Keep aggregate metrics inside the application database where access controls apply.

Acceptable metrics:

- Case started count by organization/facility.
- Case completed count by organization/facility.
- Documentation status counts.
- Follow-up task count.
- Sync failure count.
- Case-study candidates submitted and approved.

Avoid:

- Patient/EHR IDs.
- Free-text notes.
- Photo URLs.
- Objective findings.
- Clinical rationale fields.
- Practitioner-entered custom indications in third-party analytics.

## 9. Candidate Stack Comparison

| Option | Fit | Strengths | Concerns | Recommendation |
| --- | --- | --- | --- | --- |
| Supabase + Netlify | High | Fastest MVP path, relational data, auth/storage/API in one backend, PWA friendly | Requires Supabase HIPAA add-on/BAA, Netlify HIPAA service/BAA, careful RLS, careful logging | Recommended |
| Google Cloud native | Medium-high | Mature HIPAA posture, strong controls, enterprise-friendly | More build complexity, less rapid MVP unless team already uses GCP | Strong fallback |
| AWS native | Medium-high | Mature healthcare controls, broad eligible services, strong IAM/storage/logging | Highest complexity and DevOps burden for this MVP | Enterprise fallback |
| No cloud case storage | Low-medium | Lowest initial data surface | Weak reporting, weak follow-up, weak case-study workflow | Not recommended beyond demo/pilot edge case |

## 10. Implementation Phases

### Phase 1: Production Foundation With Synthetic Data

- Create production app repo structure.
- Keep React PWA frontend.
- Add Supabase project in non-PHI mode.
- Build auth, organizations, facilities, roles, case drafts, indication taxonomy, and chart summary.
- Use synthetic/demo cases only.
- Validate access-control logic before real data.

### Phase 2: HIPAA Readiness

- Execute required BAAs.
- Enable Supabase HIPAA project/add-on if selected.
- Confirm Netlify HIPAA service offering, account configuration, and BAA or choose another approved host.
- Configure private buckets.
- Implement audit logs.
- Implement admin user management.
- Draft support, retention, case-study, and photo policies.
- Run security review.

### Phase 3: Limited Real-Data Pilot

- One managing medical group.
- Small facility set.
- Named users only.
- Minimal PHI fields.
- Text drafts offline.
- Photo storage enabled only if approved.
- Weekly review of sync failures, documentation completeness, and support tickets.

### Phase 4: Partner Expansion

- Add partner branding configuration.
- Add facility directory management.
- Add aggregate management reporting.
- Add case-study approval packet workflow.
- Add EHR export formatting based on partner requirements.

## 11. Engineering Work Breakdown

First production sprint:

- Supabase schema draft.
- RLS policy draft.
- Auth and invite flow.
- Organization/facility selection.
- Case create/edit/save.
- Indication taxonomy migration.
- Documentation status engine.
- Audit event writer.
- Chart summary export.

Second production sprint:

- Offline encrypted drafts.
- Sync queue.
- Conflict handling.
- Admin facility management.
- Supervisor reporting.
- Case-study candidate queue.

Third production sprint:

- Private photo upload.
- Signed photo viewing.
- Photo audit events.
- Retention/deletion tooling.
- Pilot support dashboard.

## 12. Go / No-Go Criteria Before Real Data

Go only when:

- Required BAAs are signed.
- ePHI-bearing vendors are approved.
- RLS policy tests pass.
- Private storage access tests pass.
- Audit logging is working.
- Error logs are redacted.
- Analytics excludes ePHI.
- User deactivation works.
- Offline drafts can be cleared and expire.
- Photo retention/deletion behavior is documented.
- Practice admin workflow is ready.

No-go if:

- Any vendor in the ePHI path lacks required agreement coverage.
- Photos would be stored publicly or semi-publicly.
- Shared logins are required.
- The app depends on email or analytics tools receiving case details.
- Support staff need broad case access without a defined access procedure.

## 13. Final Recommendation

Choose Supabase + Netlify for MVP production planning.

Use Supabase as the system of record for auth, Postgres, private storage, API functions, and audit events. Use Netlify for the PWA frontend only after the appropriate HIPAA service offering, account configuration, and BAA are in place, or substitute Google Cloud/AWS hosting if counsel prefers a single-cloud posture.

For the pilot:

- Store case text data in Supabase.
- Store photos in Supabase private storage only after approval.
- Use encrypted IndexedDB for offline text drafts.
- Defer offline photo storage.
- Defer AI photo review.
- Keep voice input native to the device.
- Keep AmniOptix access limited to de-identified aggregate metrics and practice-approved case-study packets.
