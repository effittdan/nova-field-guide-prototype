# Nova Field Guide HIPAA And Security Architecture Plan

## 1. Purpose

This document defines the recommended privacy, security, and technical architecture posture for turning the Nova Field Guide prototype into a production MVP.

It is not legal advice. It is an implementation planning document that should be reviewed with qualified privacy counsel, security advisors, and any partner organization that will use the application with patient-related data.

Current working principle:

Treat Nova Field Guide as HIPAA-sensitive from the start, even if the first production version minimizes patient-identifying fields.

## 2. Regulatory Baseline

The HIPAA Security Rule requires regulated entities to protect electronic protected health information with administrative, physical, and technical safeguards. HHS describes regulated entities as covered entities and business associates. HHS cloud guidance also states that a cloud service provider that creates, receives, maintains, or transmits ePHI on behalf of a covered entity or business associate is itself a business associate, even if the cloud provider only stores encrypted ePHI and does not hold the decryption key.

Implication for Nova Field Guide:

- If the app stores or transmits case data that includes ePHI, every production vendor in that data path must be evaluated for HIPAA suitability.
- Any cloud vendor that creates, receives, maintains, or transmits ePHI should be covered by a Business Associate Agreement when required.
- Encryption alone does not remove the need to evaluate business associate obligations.
- Practice/EHR ID can still become identifying when combined with facility, provider, date, photos, and clinical notes.
- Eye photos and clinical notes should be treated as PHI/ePHI in production.

Primary HHS references:

- HHS Summary of the HIPAA Security Rule: https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html
- HHS Covered Entities and Business Associates: https://www.hhs.gov/hipaa/for-professionals/covered-entities/index.html
- HHS HIPAA and Cloud Computing Guidance: https://www.hhs.gov/hipaa/for-professionals/special-topics/health-information-technology/cloud-computing/index.html

## 3. Recommended Product Posture

### Recommended MVP Mode

Build Nova Field Guide as a HIPAA-ready, organization-scoped PWA with:

- Secure authentication.
- Role-based access control.
- Organization and facility separation.
- Minimal patient-identifying fields by default.
- Encrypted cloud storage.
- Encrypted transport.
- Audit logging.
- Controlled offline drafts.
- Explicit sync/export status.
- Practice-controlled case-study sharing.

### Avoid For MVP

Do not build the MVP as:

- An anonymous form.
- A simple static website with localStorage-only production records.
- A general public upload portal.
- A tool that emails case photos around.
- A tool where AmniOptix can browse all practice case data by default.
- A production app using vendors that will not support the required privacy/security posture.

## 4. High-Level Architecture

Recommended system components:

```text
Treatment card QR
  -> PWA launch route
  -> Auth session
  -> Organization/facility context
  -> Local encrypted draft store
  -> Secure API
  -> Application database
  -> Object storage for photos
  -> Audit log
  -> Chart summary export
  -> Admin review / case-study queue
```

### Client

Mobile-first PWA:

- React or Next/Vite PWA.
- Installable on iOS and Android where supported.
- Offline draft support.
- Camera capture or file import.
- Native keyboard dictation only for MVP.
- No built-in transcription service for MVP.

### API

Required:

- Authenticated API endpoints only.
- Organization-scoped access checks on every request.
- Role checks for admin, supervisor, practitioner, and AmniOptix support functions.
- Server-side validation for every case update.
- No direct browser writes to unrestricted storage buckets.

### Database

Required:

- Organization table.
- Facility table.
- User table.
- Role/membership table.
- Case table.
- Case indication table.
- Photo metadata table.
- Follow-up task table.
- Case-study sharing workflow table.
- Audit event table.

### Object Storage

Required if photos are stored:

- Private buckets only.
- No public photo URLs.
- Short-lived signed URLs for authorized viewing.
- Separate storage path or bucket by organization.
- Metadata linking photo to case, eye, and photo type.
- Deletion and retention rules.
- Audit events for photo view, upload, download, and delete.

## 5. Roles And Permissions

### Practitioner

Can:

- Create case drafts.
- Edit own cases.
- Capture/import photos.
- Add notes.
- Set follow-up.
- Copy/export chart summary.
- Nominate case-study candidate.

Cannot:

- View all organization cases unless granted.
- Approve case-study sharing.
- Access other organizations.
- View admin-only reports unless granted.

### Practice Admin

Can:

- Manage users for the organization.
- Manage facilities.
- Review case documentation completeness.
- Approve or reject case-study candidates.
- Export approved case materials.
- Deactivate users.

Cannot:

- Access other organizations.
- Override clinical content as if making the treatment decision.

### Supervisor / Clinical Director

Can:

- View facility-level reports.
- View assigned organization cases.
- Review follow-up gaps.
- Review weak documentation patterns.

Configurable:

- Clinician-level reporting can be enabled by partner request.

### AmniOptix Support

Default MVP posture:

- No routine access to identifiable practice case records.

Can:

- View de-identified aggregate usage only if partner agreement allows.
- Receive approved case-study packets after practice admin approval.
- Support configuration and training without accessing identifiable case data unless separately authorized.

## 6. Data Classification

### Low Sensitivity

- Generic indication taxonomy.
- Best-practice prompt text.
- App UI configuration.
- Generic partner demo data.

### Organization Sensitive

- Facility directory.
- User list.
- Managing medical group branding.
- Facility-level aggregate metrics.

### HIPAA-Sensitive / Treat As ePHI

- Practice/EHR patient ID.
- Facility plus treatment date plus provider.
- Objective findings.
- Prior measures.
- Treatment rationale.
- Clinical notes.
- Follow-up plan.
- Eye photos.
- Case-study candidate materials.

## 7. PHI-Minimization Strategy

Default MVP fields should avoid:

- Patient name.
- Date of birth.
- Address.
- Phone number.
- Email.
- Insurance identifiers.
- Free-form patient contact information.

Default MVP fields should use:

- Practice/EHR patient ID.
- Facility.
- Eye.
- Case date/time.
- Clinician.
- Indications/findings.
- Objective findings.
- Prior measures.
- Rationale.
- Notes.
- Follow-up plan.

Important:

Using an EHR ID instead of a patient name reduces direct identifiers, but it does not eliminate HIPAA sensitivity when combined with clinical notes, dates, facility, provider, and photos.

## 8. Offline Draft Strategy

Offline support is clinically useful for nursing home and rural mobile practice settings, but it creates risk. The MVP should use a conservative model.

### Recommended MVP Behavior

- Local drafts are supported.
- Offline drafts are visibly marked as unsynced.
- Drafts are scoped to the authenticated user and device.
- Drafts require recent authentication before viewing.
- Drafts auto-lock after inactivity.
- Draft sync occurs when the device reconnects.
- Sync conflicts are surfaced rather than silently overwritten.
- Unsynced drafts have a retention limit.

### Local Storage Recommendation

Avoid plain localStorage for production case records.

Use one of:

- Encrypted IndexedDB with app-level encryption.
- A secure mobile wrapper later if device-level secure storage is required.
- A server-first mode for partners who do not need offline drafts.

Open security decision:

Determine whether production offline drafts may include photos. If yes, require stronger controls, because photos are highly sensitive and may persist on-device.

## 9. Photo Handling Strategy

### Recommended MVP Options

Option A: Store photos securely in app storage.

- Better workflow continuity.
- Better admin review and follow-up support.
- Higher HIPAA/security burden.
- Requires object storage BAA/vendor review.
- Requires retention and deletion policy.

Option B: Capture/import photos only for chart packet export, then remove from app after export/sync.

- Lower long-term storage risk.
- Less useful for follow-up and supervisor review.
- Still HIPAA-sensitive during capture and export.

Option C: No photo storage in MVP; only photo completion checkbox.

- Lowest risk.
- Less impressive and less clinically useful.

Recommended starting posture:

Use Option A only if a suitable BAA-capable vendor stack and retention policy are approved. Otherwise, pilot with Option B.

### Prohibited For MVP

- Public image URLs.
- Emailing photos from the app.
- Storing photos in unapproved cloud drives.
- AI photo interpretation.
- Automatic diagnostic labels.

## 10. Case-Study Sharing Architecture

Case-study sharing must be separate from routine case storage.

Required workflow:

1. Practitioner marks case as candidate.
2. App shows de-identification checklist.
3. Practice admin reviews candidate.
4. Practice admin confirms permission status.
5. Approved packet is prepared for AmniOptix review.
6. AmniOptix receives only the approved packet, not broad chart access.

Required case-study packet fields:

- Case-study ID.
- De-identified clinical summary.
- Selected photos.
- Before/after status if available.
- Permission status.
- Practice admin approver.
- Approval timestamp.
- Allowed use category.

Allowed use categories:

- Internal review only.
- Clinical education review.
- Case-study development.
- Marketing/public use after additional release.

Open legal decision:

Define exact consent/release workflow before allowing external education or marketing use.

## 11. Audit Logging Requirements

Audit logs should record:

- Login.
- Logout.
- Failed login.
- Case created.
- Case viewed.
- Case edited.
- Case exported/copied.
- Photo uploaded.
- Photo viewed.
- Photo deleted.
- Follow-up changed.
- Documentation status acknowledged.
- Case-study candidate marked.
- Case-study approved/rejected.
- User invited.
- User deactivated.
- Facility created/edited.
- Role changed.

Audit logs should include:

- Event ID.
- Timestamp.
- User ID.
- Organization ID.
- Facility ID when applicable.
- Case ID when applicable.
- Event type.
- IP/device metadata when appropriate.
- Outcome.

Audit logs should be tamper-resistant and not editable through normal application UI.

## 12. Authentication And Session Requirements

Required:

- Unique user accounts.
- No shared logins.
- Strong password or passwordless secure authentication.
- MFA support for admin roles.
- Session timeout.
- Device/session revocation.
- Invite and deactivation flow.
- Role-based access at API layer.

Recommended:

- MFA required for admins.
- Shorter session life on shared/mobile environments.
- Re-authentication before viewing local offline drafts after idle timeout.

## 13. Vendor Posture

Production vendors should be selected only after confirming:

- BAA availability when the vendor handles ePHI.
- Data residency and storage controls.
- Encryption at rest.
- Encryption in transit.
- Access logging.
- Admin access controls.
- Backup/restore posture.
- Incident response obligations.
- Subprocessor list.
- Data deletion support.
- Ability to segment organizations.

Vendor categories needing review:

- Hosting.
- Database.
- Object storage.
- Authentication.
- Email or notification provider.
- Error logging/observability.
- Analytics.
- Customer support tooling.
- AI/transcription providers if ever added.

MVP rule:

Do not send ePHI to analytics, telemetry, AI, or support tools unless those tools are approved for the intended data category and covered by the required agreement.

## 14. Candidate Stack Options

These are architecture options, not final recommendations.

### Option 1: Supabase-Based PWA

Potential fit:

- Fast PWA backend development.
- Auth, Postgres, row-level security, storage, edge functions.
- Good for structured relational case data.

Must confirm:

- BAA availability and scope for the selected Supabase plan.
- Storage handling for photos.
- RLS policy design and testing.
- Audit log immutability strategy.

### Option 2: Google Cloud / Firebase Or Google Cloud Run

Potential fit:

- Mature HIPAA-capable cloud posture when configured under appropriate agreements.
- Strong identity, storage, logging, and hosting primitives.

Must confirm:

- BAA coverage for selected services.
- App architecture complexity.
- Offline strategy.

### Option 3: AWS-Based PWA

Potential fit:

- Mature healthcare cloud architecture options.
- Strong object storage, audit, IAM, encryption, and logging.

Must confirm:

- Higher implementation complexity.
- BAA coverage for selected services.
- Cost and maintenance overhead.

### Option 4: No Cloud Case Storage MVP

Potential fit:

- Lower initial HIPAA surface.
- Could export chart packet directly to practice workflow.

Tradeoff:

- Weak management reporting.
- Weak follow-up visibility.
- Harder case-study workflow.
- Less useful for multi-facility oversight.

## 15. Recommended MVP Architecture Decision

Recommended direction:

Build a HIPAA-ready PWA with organization-scoped cloud storage, but do not enable production PHI/photo use until vendor agreements, policies, and security controls are approved.

Practical staged approach:

1. Production-like app using synthetic/demo data.
2. Security review and vendor agreements.
3. Limited pilot with one partner and a small facility set.
4. Enable real case data only after access controls, audit logging, retention, and support procedures are validated.

## 16. Required Policies And Procedures

Before real production data:

- Access control policy.
- User provisioning/deactivation procedure.
- Mobile/offline draft policy.
- Data retention policy.
- Photo handling policy.
- Case-study sharing and approval policy.
- Incident response procedure.
- Breach notification workflow.
- Vendor/subprocessor review procedure.
- Support access procedure.
- Admin training guide.
- Practitioner acceptable-use guidance.

## 17. Engineering Acceptance Criteria

### Security

- All API routes require authentication.
- All case reads/writes enforce organization access.
- All role-restricted functions enforce API-side authorization.
- All storage objects are private.
- All photo access uses authorized short-lived access.
- Audit events are written for case, photo, and user-management actions.
- Error logs do not include ePHI.
- Analytics do not include ePHI.

### Offline

- Drafts clearly show unsynced status.
- Drafts sync after reconnect.
- Drafts do not silently overwrite server data.
- User can see sync failure and retry.
- Draft retention limit is enforceable.

### Admin

- Admin can invite and deactivate users.
- Admin can manage facility directory.
- Admin can approve or reject case-study sharing candidate.
- Admin can view documentation completeness by facility.

### Practitioner

- Practitioner can complete MVP case workflow on a phone.
- Practitioner can proceed with incomplete documentation acknowledgement.
- Practitioner can copy/export chart summary.
- Practitioner can set follow-up.

## 18. Decisions Needed Before Engineering Estimate

1. Which backend/cloud vendors are acceptable from a BAA and operations standpoint?
2. Will photos be stored in the app, exported then removed, or deferred?
3. Will offline drafts include photos?
4. What is the minimum acceptable device lock/session timeout?
5. Who administers users: AmniOptix, partner admins, or both?
6. Does AmniOptix need aggregate de-identified analytics in MVP?
7. What case-study release language and approval workflow are required?
8. What is the first partner's preferred chart-summary export format?
9. Should follow-up reminders be in-app only, email-based, or both?
10. What data retention period should apply to draft, completed, exported, and shared cases?

## 19. Immediate Next Steps

1. Review this plan with AmniOptix leadership.
2. Review with privacy counsel or HIPAA compliance advisor.
3. Select two candidate backend/vendor stacks for comparison.
4. Decide photo storage posture for pilot.
5. Decide whether the pilot will use synthetic data first or limited real case data.
6. Convert the chosen architecture into an engineering implementation plan.

