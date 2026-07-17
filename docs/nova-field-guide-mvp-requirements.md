# Nova Field Guide MVP Requirements

## 1. Purpose

Nova Field Guide is a mobile-first field documentation tool for qualified eye care professionals using Nova in nursing home, assisted living, and other mobile care environments.

The MVP should help clinicians exercise good judgment, document the clinical basis for use, capture pre-treatment support, and maintain follow-up discipline. It should not function as a treatment approval engine, diagnostic tool, billing tool, or reimbursement promise.

Primary product principle:

Good medicine first. The app should reduce weak or inappropriate use patterns while making well-documented, clinically appropriate cases easier to complete.

## 2. Product Positioning

Nova Field Guide is intended to support:

- Appropriate-use thinking before application.
- Objective documentation of ocular surface compromise.
- Clear separation between dry-eye drivers and ocular surface indications.
- Pre-treatment photo capture or import.
- Fast clinician note capture through text or native dictation.
- Follow-up visibility in mobile-care settings.
- Facility-level management review.
- Optional case-study sharing after practice approval.

Nova Field Guide is not intended to:

- Decide whether a clinician should use Nova.
- Diagnose from photos.
- Provide billing or coding advice.
- Guarantee coverage, payment, or outcomes.
- Replace the EHR.
- Store full patient demographic records by default.
- Give patient-directed medical advice.

## 3. Target Users

### Practitioner

The primary user. Creates and completes field cases, documents indications and clinical rationale, captures or imports photos, adds notes, and sets follow-up expectations.

### Practice Admin or Billing Documentation Reviewer

Reviews completed cases for documentation completeness. This role can flag missing administrative or chart-support items but does not make clinical decisions.

### Clinical Director, Supervisor, or Practice Owner

Reviews facility-level patterns, chart completion, follow-up gaps, photo capture rates, and weak documentation patterns.

### AmniOptix Support

Should not have routine access to identifiable case records in the MVP. AmniOptix may receive de-identified or practice-approved case-study submissions only after explicit practice approval and appropriate legal/privacy review.

## 4. MVP Workflow Summary

1. Clinician scans QR code on the treatment card.
2. QR opens the PWA launch page.
3. First-time user is prompted to add the PWA to the device home screen when supported.
4. Clinician starts a new case.
5. Clinician selects managing medical group and facility.
6. Clinician enters practice/EHR patient ID rather than patient name by default.
7. Clinician selects eye: OD, OS, or OU.
8. Clinician selects indication group and specific findings.
9. Clinician documents dry-eye drivers separately from ocular surface indications.
10. Clinician enters objective findings, prior measures, rationale, and follow-up plan.
11. Clinician captures or imports pre-treatment photos when appropriate.
12. Clinician adds text or native-dictation notes.
13. App shows documentation completeness status and missing-item prompts.
14. Clinician can proceed with acknowledgement when documentation is incomplete.
15. App produces a chart-summary draft for EHR transfer.
16. Case can be marked synced/exported when moved into the practice workflow.
17. Follow-up due date remains visible.
18. Facility view shows aggregate activity and completion patterns.

## 5. Core Screens

### Launch / Home

Required:

- Practice or managing medical group branding.
- Quiet AmniOptix attribution.
- Facility context.
- Start new case action.
- Resume draft cases.
- Offline/sync status indicator.
- Add-to-home-screen prompt where supported.

Notes:

- AmniOptix branding should remain minimal.
- The managing medical group should feel like the primary owner of the workflow.

### Field Case

Required fields:

- Managing medical group.
- Facility.
- Practice/EHR patient ID.
- Eye: OD, OS, OU.
- Case date/time.
- Treating practitioner.
- Draft/completion status.

Default patient-identification posture:

- No patient name by default.
- No date of birth by default.
- No address or contact information.
- Use practice/EHR ID unless a production partner explicitly requires more.

### Indication Check

Required:

- Grouped indication categories.
- Specific selectable indications inside each group.
- Dry-eye drivers documented separately.
- Custom clinician-documented indication field.
- Support for multiple indications/findings in one case.

Initial indication groups:

- Keratitis.
- Epithelial compromise.
- Corneal erosion / dystrophy.
- Ulcer / severe surface compromise.
- Exposure / neurotrophic surface disease.
- Dry-eye drivers to document.
- Other clinician-documented indication.

Dry-eye driver examples:

- MGD.
- Lid disease.
- Exposure.
- Allergy or inflammation.
- Medication toxicity.
- Tear-film instability.
- Neurotrophic features.

Clinical guardrail:

The app should not treat dry eye alone as a sufficient standalone rationale for Nova use. It should prompt for associated ocular surface compromise, objective findings, prior measures, and treatment rationale.

### Documentation Best-Practice Prompts

Required:

- Three short, case-specific best-practice prompts.
- Prompts should update based on selected indications and missing fields.
- Prompts must remain educational and clinician-facing.

Example prompt themes:

- Record staining pattern, severity, location, and chronicity.
- Document prior measures and why a protected ocular surface environment is being considered now.
- Include follow-up timing and reassessment criteria.
- Document driver management, such as lids, exposure, inflammation, allergy, toxicity, or neurotrophic features.

### Photos

Required:

- Capture pre-treatment photo with phone camera when supported.
- Import photo from device.
- Label photo by type: pre-treatment, follow-up, or other.
- Associate photo with case and eye.
- Show whether a case has no photos.

Future but not MVP-required:

- Slit-lamp adapter profile.
- Image quality guidance.
- AI-assisted visible issue prompts.
- Before/after case-study packet builder.

Clinical and privacy guardrail:

The MVP should not diagnose or interpret photos. Any production storage of photos should be treated as HIPAA-sensitive.

### Notes

Required:

- Text note fields.
- Support native phone dictation through the operating-system keyboard.
- Separate fields for objective findings, prior measures, treatment rationale, follow-up plan, and general notes.

Not required in MVP:

- Built-in transcription service.
- AI note summarization.
- EHR integration.

### Documentation Status

Required:

- Green/yellow/red status indicator.
- Clickable missing-item drawer or panel.
- Missing-field list.
- Ability to proceed with acknowledgement when incomplete.

Status definitions:

- Green: Core documentation fields complete.
- Yellow: Limited missing detail or clinician acknowledged incomplete documentation.
- Red: Key documentation pieces missing; use caution.

Required missing-item checks:

- Facility.
- Practice/EHR patient ID.
- Eye.
- Indication.
- Objective findings.
- Prior measures.
- Treatment rationale.
- Pre-treatment photo.
- Follow-up plan.
- Ocular surface indication beyond dry-eye driver when dry-eye drivers are the only selected items.

Guardrail:

Status must not be labeled as approved, denied, eligible, covered, billable, or reimbursable.

### Chart Summary

Required:

- Generate a structured chart-summary draft.
- Support copy-to-clipboard.
- Include clinician judgment disclaimer.
- Include fields needed for EHR transfer.

Initial summary sections:

- Facility.
- Practice/EHR ID.
- Eye.
- Selected indications/findings.
- Objective findings.
- Prior measures.
- Treatment rationale.
- Photos captured.
- Follow-up plan.
- Notes.
- Best-practice reminder.

Not required in MVP:

- Direct EHR integration.
- Billing claim generation.
- CPT coding recommendation.
- Automated payer-specific documentation rules.

### Facility Management View

Required:

- Facility-level case count.
- Completed chart count.
- Follow-up due count.
- Missing photo count.
- Cases needing documentation review.
- Indication pattern summary.

Initial visibility:

- Facility-level reporting first.
- Clinician-level reporting optional and partner-configurable.

Guardrail:

Management view should support quality review and documentation discipline, not punitive over-surveillance.

### Case-Study Sharing

Required:

- Mark a case as a potential case-study candidate.
- Require practice admin approval before preparing submission to AmniOptix.
- Include de-identification checklist.
- Include explicit permission status.

Permission statuses:

- Not shared.
- Clinician nominated.
- Practice admin approved.
- Ready for AmniOptix review.
- Approved for internal review only.
- Approved for educational/case-study use.

Guardrail:

AmniOptix should not receive routine identifiable case data in the MVP. Any case-study sharing requires separate legal/privacy review and clear consent/permission workflow.

## 6. Data Requirements

### Case Data

Minimum fields:

- Case ID.
- Practice ID.
- Facility ID.
- Practice/EHR patient ID.
- Practitioner ID.
- Eye.
- Case date/time.
- Case status.
- Indications selected.
- Custom indication text.
- Objective findings.
- Prior measures.
- Treatment rationale.
- Follow-up date.
- Follow-up plan.
- Notes.
- Documentation completeness status.
- Incomplete documentation acknowledgement.
- Created timestamp.
- Updated timestamp.
- Sync/export status.

### Photo Data

Minimum fields:

- Photo ID.
- Case ID.
- Eye.
- Photo type.
- File reference.
- Captured/imported timestamp.
- Uploaded/synced status.
- De-identification flag for case-study workflow.

### Facility Data

Minimum fields:

- Facility ID.
- Facility name.
- Managing medical group ID.
- Active/inactive status.
- Optional region or territory.

### Organization Data

Minimum fields:

- Managing medical group ID.
- Display name.
- Branding settings.
- Facilities.
- Users.
- Role rules.

## 7. Privacy And Security Requirements

The MVP should be designed as HIPAA-sensitive from the start, even if it minimizes PHI and defaults to practice/EHR ID instead of patient name.

Required production posture:

- Role-based access control.
- Secure authentication.
- Encrypted transport.
- Encrypted storage.
- Audit logs for case access and changes.
- Organization-level data separation.
- User invite and deactivation flow.
- Device/session management.
- Clear local-draft risk messaging.
- BAA-capable vendors for any PHI or photo storage.

HIPAA-sensitive considerations:

- Practice/EHR ID may still be identifiable when combined with facility, provider, date, photos, and clinical notes.
- Eye photos and clinical notes should be treated as protected health information in production.
- Offline drafts need careful device-storage strategy and timeout/lock behavior.

## 8. Offline Requirements

Required:

- Create and edit case drafts offline.
- Store draft status locally.
- Show clear offline/unsynced indicator.
- Queue sync/upload when connection returns.
- Prevent accidental duplicate submissions where possible.

Open decisions:

- Should photos be stored offline on-device before sync?
- Should offline drafts require device biometrics or app passcode?
- How long can unsynced drafts remain on-device?
- What happens if a practitioner leaves the practice with unsynced drafts?

## 9. Accessibility And Mobile Requirements

Required:

- Mobile-first layout.
- Touch targets at least 48px tall where practical.
- High-contrast status indicators with text labels.
- Keyboard-accessible controls.
- Visible focus states.
- Labels above form fields.
- Status not communicated by color alone.
- Readable body text on phone screens.

Supported initial devices:

- Modern iPhone Safari.
- Modern Android Chrome.
- Desktop browser for admin/supervisor review.

## 10. Partner Branding Requirements

Required:

- Configurable managing medical group name.
- Configurable facility directory.
- Quiet AmniOptix support attribution.
- AmniOptix visual system as fallback for neutral clinical UI.

Not required in MVP:

- Fully custom themes for every partner.
- Custom logos per facility.
- Partner-specific clinical logic.
- Separate app builds per partner.

Principle:

One reusable application should support many medical groups through configuration, not custom rebuilds.

## 11. Success Metrics

Primary success metric:

- Reduction in weak or incomplete Nova documentation patterns.

Secondary metrics:

- Percentage of cases with objective findings documented.
- Percentage of cases with prior measures documented.
- Percentage of cases with treatment rationale documented.
- Percentage of cases with pre-treatment photos captured or imported.
- Percentage of cases with follow-up plan documented.
- Facility-level chart completion rate.
- Number of cases proceeding with incomplete-documentation acknowledgement.
- Number of SPK-only or dry-eye-driver-only cases flagged for added context.
- Number of admin-approved case-study candidates.

## 12. MVP Non-Goals

The MVP will not include:

- AI photo diagnosis.
- AI treatment recommendations.
- Automated CPT coding.
- Billing claim generation.
- Payer-specific reimbursement guidance.
- EHR integration.
- Patient portal.
- Patient-facing education.
- Inventory or lot tracking.
- Payment workflows.
- Real-time AmniOptix access to routine case records.
- Native iOS or Android app store release.

## 13. Compliance Language Requirements

The application and documentation should use language such as:

- "Documentation best practices."
- "Clinician-directed."
- "When medically appropriate."
- "When documentation supports ocular surface compromise."
- "Designed to support."
- "May help."
- "Follow the IFU."
- "Qualified healthcare professionals."
- "Clinical judgment controls final decisions."

Avoid language such as:

- "Approved case."
- "Covered case."
- "Billable case."
- "Guaranteed reimbursement."
- "Guaranteed healing."
- "Cures dry eye."
- "Insurance will cover it."
- "Use this every time."
- "AI diagnosis."
- "Nova is indicated because the app says so."

## 14. Acceptance Criteria

### Practitioner Case Workflow

- A practitioner can start a case from the PWA.
- A practitioner can select facility, enter EHR ID, and choose eye.
- A practitioner can select multiple indications/findings.
- Dry-eye drivers are visually and logically separate from ocular surface indications.
- A practitioner can enter objective findings, prior measures, rationale, and follow-up plan.
- A practitioner can capture or import a photo.
- A practitioner can add notes using text fields compatible with native dictation.
- A practitioner can see missing documentation prompts.
- A practitioner can proceed after acknowledging incomplete documentation.
- A practitioner can copy a chart-summary draft.

### Admin / Supervisor Workflow

- A reviewer can see case completion status.
- A reviewer can see missing documentation categories.
- A supervisor can view facility-level counts and follow-up gaps.
- A practice admin can approve or reject a case-study sharing candidate.

### Security / Privacy Workflow

- Users can access only their organization data.
- Actions are audit logged.
- Offline drafts are clearly marked as unsynced.
- Routine AmniOptix access to identifiable case data is not enabled by default.

## 15. Open Decisions Before Production Build

1. Which backend vendor will sign or support the required privacy and security posture?
2. Will production store photos, or only package them for practice-side export?
3. Should offline photo storage be allowed before sync?
4. What is the required chart-summary format for first partner EHR workflows?
5. Should chart summary export be copy-to-clipboard only, PDF, or both?
6. Should clinician-level reporting be enabled by default or only by partner request?
7. Who owns user provisioning: AmniOptix, partner admin, or both?
8. What is the retention policy for local drafts, synced cases, photos, and case-study candidates?
9. What consent or release workflow is required for before/after case-study material?
10. Should treatment-card QR codes remain generic launch links or eventually support product/lot context?
11. Does the MVP need lot number capture, product size capture, or card ID capture?
12. Should the first production build include email reminders for follow-up, or in-app reminders only?

## 16. Recommended Build Sequence

### Phase 1: Requirements And Architecture

- Finalize MVP requirements with internal team.
- Review with 3-5 partner clinicians or mobile practice leaders.
- Define privacy, HIPAA, and vendor posture.
- Decide production stack and hosting model.
- Confirm first partner EHR summary needs.

### Phase 2: Production PWA Foundation

- Build authentication.
- Build organization and facility configuration.
- Build practitioner case workflow.
- Build local draft model.
- Build secure sync.
- Build chart-summary export.

### Phase 3: Documentation And Review Tools

- Build completeness prompts.
- Build supervisor facility view.
- Build admin review queue.
- Build case-study nomination and approval workflow.

### Phase 4: Pilot

- Pilot with one managing medical group.
- Use limited facilities.
- Track completion, follow-up, and usability feedback.
- Revise indication taxonomy and prompts based on clinical review.

## 17. Current Prototype References

Prototype app:

```text
C:\Codex Projects\AmniOptix\nova-field-guide-prototype
```

Partner demo guide:

```text
C:\Codex Projects\AmniOptix\nova-field-guide-prototype\docs\partner-demo-walkthrough.md
```

One-page leave-behind:

```text
C:\Codex Projects\AmniOptix\nova-field-guide-prototype\docs\nova-field-guide-one-page-leave-behind.html
```

