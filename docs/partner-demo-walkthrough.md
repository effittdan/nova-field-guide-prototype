# Nova Field Guide Partner Demo Walkthrough

## Purpose

Use this guide to run a short, consistent partner demo of the Nova Field Guide prototype. The goal is to show the product idea clearly without implying that the current prototype is production software, HIPAA infrastructure, billing advice, or a clinical decision engine.

Core message:

Nova Field Guide is designed to help mobile eye care teams document appropriate-use thinking, capture pre-treatment support, and keep follow-up discipline visible in nursing home and assisted living environments.

## Demo Positioning

Say:

- "This is a lightweight prototype, not production software."
- "The app is designed to support clinician judgment, not replace it."
- "The first goal is good medicine first: appropriate use, better documentation, and follow-up visibility."
- "The workflow can be partner-branded for a managing medical group while keeping AmniOptix support quiet and unobtrusive."

Avoid saying:

- "This determines whether Nova should be used."
- "This guarantees reimbursement."
- "This gives billing advice."
- "This detects or diagnoses disease from photos."
- "This is already HIPAA-ready."

## Setup Before The Demo

1. Start the prototype locally.

   ```powershell
   cd "C:\Codex Projects\AmniOptix\nova-field-guide-prototype"
   npm run dev -- --port 5177
   ```

2. Open the prototype.

   ```text
   http://127.0.0.1:5177/
   ```

3. Use a phone-sized browser window if possible.

4. If the app has old demo data, refresh and use `Load sample case` during the walkthrough.

5. Keep the browser on the first screen before sharing.

## 2 Minute Demo Flow

### 0:00 - 0:15 | Launch From Treatment Card

Tap or point to `Scan treatment card`.

Talk track:

"The concept starts with the QR code on the back of the treatment card. For a first-time user, the QR link can open this mobile web app and suggest adding it to the phone home screen. We are keeping the treatment card simple: it is a launch path, not a complex tracking system in the first version."

### 0:15 - 0:35 | Practice-Branded Field Workflow

Point to the managing medical group name and facility context.

Talk track:

"The app is intentionally not heavy AmniOptix branding. It can feel like a field tool for the managing medical group. The facility directory matters because a lot of these cases happen in nursing home and assisted living environments, where follow-up is harder than in private practice."

### 0:35 - 0:55 | Load A Sample Case

Tap `Load sample case`.

Talk track:

"For the demo, I will load a sample case. In production, the clinician would use a practice or EHR ID instead of a patient name by default. The point is to reduce unnecessary patient-identifying information while still helping the chart tell the clinical story."

### 0:55 - 1:20 | Indication And Best-Practice Logic

Tap `Case` if needed. Open `Keratitis` and show selected chips. Open `Dry eye drivers to document`.

Talk track:

"The checklist is grouped for speed. Dry eye drivers can be documented, but dry eye alone is not treated as the reason for using an ocular amniotic membrane. The app nudges the clinician toward objective ocular surface findings, prior measures, treatment rationale, and follow-up."

Optional line:

"We are trying to discourage the lazy pattern of applying a graft and calling every case SPK. The better workflow is to document the surface compromise and the drivers around it."

### 1:20 - 1:35 | Camera Moment

Tap `Open camera`, then `Use demo photo`.

Talk track:

"The camera step is here to support pre-treatment documentation. Long term, this could work with phone adapters or slit-lamp image import. For production, photo handling would need HIPAA-grade storage, access control, consent rules, and audit logging."

### 1:35 - 1:50 | Voice Note

Tap `Voice note`, then `Insert voice note`.

Talk track:

"For speed in the field, we can start with native phone dictation. The clinician can dictate objective findings, prior measures, and follow-up notes without turning this into a heavy EHR replacement."

### 1:50 - 2:10 | Missing Pieces And Status Dot

Tap the status pill or `Missing pieces`.

Talk track:

"The green, yellow, or red status is not an approval system. It is a documentation completeness signal. If something is missing, the clinician can still proceed based on clinical judgment, but the app makes the missing pieces visible."

### 2:10 - 2:30 | Facility View

Tap `Facility`.

Talk track:

"For supervisors or management, the facility view gives pattern visibility: cases started, complete charts, follow-up due, photo gaps, and weak documentation patterns. This is useful for quality improvement, not just sales activity."

## Short Version

Use this if you only have 60 seconds.

1. "QR opens a phone-friendly field tool."
2. "The practice can use its own branding and facility directory."
3. "Clinicians document indication, objective findings, prior measures, photos, notes, and follow-up."
4. "Dry eye drivers are captured, but dry eye alone is not treated as the reason."
5. "The app gives green/yellow/red documentation prompts without replacing clinical judgment."
6. "Management can see facility-level chart completion and follow-up gaps."

## Partner Questions To Ask

- "Would this slow your clinicians down or make documentation easier?"
- "Which fields would need to match your EHR?"
- "Would you prefer a copyable chart note, PDF, or both?"
- "How often can your mobile team realistically capture follow-up photos?"
- "Who should approve case-study submissions before anything is shared with AmniOptix?"
- "Should facility-level reporting be enough, or do you need clinician-level reporting?"

## Boundaries To State Clearly

- The prototype uses local/demo behavior only.
- It is not production HIPAA infrastructure.
- It does not provide billing advice or reimbursement guarantees.
- It does not diagnose from images.
- It does not approve or deny treatment.
- It is intended for qualified healthcare professionals.
- Clinical judgment, the product IFU, payer policies, documentation, and practice procedures control final decisions.

## Desired Reaction

The partner should leave understanding that Nova Field Guide is not a sales gimmick. It is a discipline tool for mobile clinical environments:

- Better case selection habits
- Cleaner documentation
- Pre-treatment photo support
- Follow-up visibility
- Facility-level quality oversight
- Optional, admin-approved case-study sharing

