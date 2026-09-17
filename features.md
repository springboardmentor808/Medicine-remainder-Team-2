# PillSync — features.md

> Companion file to planning.md and design.md.
> Purpose: a full, todo-list-style feature/use-case walkthrough for both roles — Patient and Caregiver — written as a linear flow (Login → Dashboard → every branch onward) so it's easy to check off what exists inside each dashboard.
> This file does not introduce new scope — every item here maps back to a module/phase already defined in planning.md and an element already defined in design.md. Items marked "(Later Phase)" are real features that exist in the plan but are not part of today's build per planning.md Section 29.
> No code included — this is a specification/checklist document only.

---

## 0. How to Read This File
- `[ ]` = feature/screen to be built (checkbox style, usable as a literal todo list)
- `(Phase X)` next to an item = which planning.md phase it belongs to; items not marked belong to today's/early scope (Phase 1–2 shell work)
- `→` = "leads to" / navigates to the next screen or state
- This file assumes the icon system and navigation map already defined in design.md — it does not repeat visual/icon detail, it focuses on **what feature exists and in what order the user encounters it**

---

## 1. Shared Entry Flow (before role split)

- [ ] Landing screen → **Login** or **Signup**
- [ ] **Signup**
  - [ ] Full name field
  - [ ] Email field (validated, duplicate-checked)
  - [ ] Password field (bcrypt-hashed server-side)
  - [ ] Role selector — Patient or Caregiver (exactly two choices, no Admin)
  - [ ] Submit → account created → redirected to **Login**
  - [ ] Duplicate email → clear non-technical error, stays on Signup
- [ ] **Login**
  - [ ] Email + password fields
  - [ ] "Forgot password?" link → **Forgot Password** flow
  - [ ] Submit → JWT access token issued + httpOnly refresh cookie set
  - [ ] If role = Patient → redirected to **Patient Dashboard (Home)**
  - [ ] If role = Caregiver → redirected to **Caregiver Dashboard (Home)**
  - [ ] Wrong password / unknown email / expired token / missing token → each shows a distinct, clear error
- [ ] **Forgot Password**
  - [ ] Enter email → one-time code generated (Redis-backed, short expiry)
  - [ ] Enter code → **Reset Password** screen → new password set → back to **Login**
- [ ] **Logout** (available from both dashboards' header)
  - [ ] Confirms intent → invalidates session server-side (DB + Redis) → clears cookie → redirected to **Login**
  - [ ] Old token/cookie reused after logout → rejected, not silently accepted
- [ ] **Language toggle** (English / Hindi) — available in header on every screen (Later Phase 9 for full dictionary wiring, but the toggle control itself is part of the shared shell)
- [ ] Cross-role protection: Patient session attempting a Caregiver route → rejected; Caregiver session attempting a Patient route → rejected

---

## 2. PATIENT — Full Feature / Use-Case Walkthrough

### 2.1 Login → Patient Dashboard (Home)
- [ ] Land on **Home** tab immediately after login
- [ ] See greeting header with own name
- [ ] See adherence progress ring for today ("X of Y taken") — honest 0/0 state if no medicines yet
- [ ] See **Today's Medicines**, grouped Morning / Afternoon / Night
  - [ ] Empty state: "No medicines added yet" + **Add your first medicine** button → **Add Medicine** flow
  - [ ] Once medicines exist: each due medicine shown as a card with name + dosage
- [ ] From each medicine card, mark a dose:
  - [ ] **Taken** → logs intake, updates adherence ring in place (Phase 4)
  - [ ] **Missed** → logs intake as missed (Phase 4)
  - [ ] **Snooze** → opens duration picker (15/30/60 min), reschedules reminder (Phase 4)
- [ ] Tap a medicine card body → **Medicine Detail** screen
- [ ] Tap **+ Add Medicine** (always visible) → **Add Medicine** entry choice

### 2.2 Add Medicine flow
- [ ] Choose **Scan a photo** → camera/upload → OCR pipeline runs locally via Ollama → pre-filled form shown for review → confirm → saved (Phase 5)
  - [ ] Malformed/low-confidence OCR result → automatic fallback to manual entry, never silently guesses
- [ ] Choose **Enter manually** → form: medicine name, dosage, quantity, frequency, condition/disease tag → submit → saved (Phase 3)
- [ ] Newly added medicine → appears immediately in **Today's Medicines** (if scheduled for today) and **My Medicines**

### 2.3 My Medicines
- [ ] View all medicines grouped by condition tag: Blood Pressure, Diabetes, Thyroid, Antibiotics, Vitamins, Heart
- [ ] Empty per-group state: "No medicines in this category yet"
- [ ] Edit a medicine → **Edit Medicine** form → save → updates reflected everywhere (Today's Medicines, Refill Tracker, History)
- [ ] Delete a medicine → confirmation modal → confirm → removed (never a single-tap irreversible delete)
- [ ] Only ever see/manage own medicines — never another patient's (enforced server-side)

### 2.4 Dosage Scheduling (part of Add/Edit Medicine)
- [ ] Set time slot(s): Morning / Afternoon / Night
- [ ] Set recurrence (daily / specific days)
- [ ] Set quantity per dose → feeds Refill Prediction Engine (Phase 6)

### 2.5 Reminders (Phase 4)
- [ ] Reminder fires in-app / local realtime channel at scheduled time
- [ ] Reminder actions: **Taken**, **Missed**, **Snooze** (same three actions as 2.1)
- [ ] Missed reminder (not actioned within window) → auto-flagged as Missed
- [ ] Push/Email/SMS reminders — stubbed only, logged to DB, never actually sent externally (by design, not a bug)

### 2.6 Adherence Analytics
- [ ] View adherence percentage (large, prominent)
- [ ] View streak counter ("5-day streak")
- [ ] View weekly bar chart / missed-dose heatmap
- [ ] Tap a day in the chart → **History** (that specific date)
- [ ] Tap **View full history** → **History** (calendar view)
- [ ] Zero-data state: "0%" / "Not enough data yet" — never a fake number

### 2.7 Refill Tracker (Phase 6)
- [ ] View remaining stock per medicine (progress bar)
- [ ] View predicted depletion date in plain language ("Runs out in ~5 days")
- [ ] Toggle **Refill reminder** on/off per medicine
- [ ] Low-stock alert generated automatically once depletion is within 5 days (default threshold)
- [ ] Manual stock update option (e.g., "I refilled" → resets remaining count)
- [ ] Empty state: "No refill data yet" + **Add a medicine** button
- [ ] Tap a refill card → **Medicine Detail** (anchored to refill section)

### 2.8 History
- [ ] Calendar view, one cell per day
- [ ] Colored status dot(s) per day (taken/missed/snoozed summary)
- [ ] Tap a day → modal/sheet listing that day's full intake log
- [ ] Month navigation (previous/next)
- [ ] Empty state: calendar renders with no marks + helper text

### 2.9 Caregiver Linking
- [ ] Tap **Generate Code** → unique code created and displayed
- [ ] Existing unused code reopens the same code (never silently regenerates)
- [ ] **Copy code** button → clipboard + "Code copied" toast
- [ ] Share code externally (out of app, e.g., verbally/text — not an in-app share feature this phase)
- [ ] Once a caregiver links using the code → linked caregiver appears in a list with name + access level (View only / Can manage)
- [ ] Tap a linked caregiver row → link detail → **Revoke access** (confirmation required)

### 2.10 Disease-Based Organization
- [ ] Assign a condition/disease tag when adding/editing a medicine
- [ ] My Medicines groups automatically by tag
- [ ] Minimum supported tags: Blood Pressure, Diabetes, Thyroid, Antibiotics, Vitamins, Heart Medications

### 2.11 Notifications & Alerts (Patient-facing) (Phase 6/8)
- [ ] In-app reminder notification at scheduled dose time
- [ ] In-app low-stock notification ("Your BP medicine is expected to finish in 5 days. Please arrange a refill.")
- [ ] Prescription-expiry reminder (if expiry data present)
- [ ] All notifications logged to DB; no real SMS/email/push sent

### 2.12 Profile
- [ ] View/edit name, date of birth, conditions
- [ ] Save → confirmation toast, stays on screen
- [ ] Back → returns to **More** menu

### 2.13 More Menu (secondary nav, houses overflow items)
- [ ] Profile → 2.12
- [ ] Caregiver Linking → 2.9
- [ ] History → 2.8
- [ ] Language → toggle screen/picker
- [ ] Logout → shared flow (Section 1)

### 2.14 Session Persistence
- [ ] Refreshing the page keeps the patient logged in until access token truly expires or logout is triggered

---

## 3. CAREGIVER — Full Feature / Use-Case Walkthrough

### 3.1 Login → Caregiver Dashboard (Home)
- [ ] Land on **Linked Patients** (Home) immediately after login
- [ ] See greeting header with own name
- [ ] If zero linked patients → **Link a Patient** card shown prominently, focused/highlighted
- [ ] If ≥1 linked patient → **Link a Patient** collapses to a small **+ Link another patient** control, and the grid becomes primary focus

### 3.2 Link a Patient
- [ ] Enter patient's link code (generated per 2.9) into input field
- [ ] Submit → valid code → real caregiver-patient link record created in DB → Success toast ("Patient linked!") → patient card appears in grid immediately
- [ ] Submit → invalid/expired code → clear non-technical error shown near input, no backend detail leaked
- [ ] Can link multiple patients over time (not limited to one)

### 3.3 Linked Patients Grid
- [ ] One card per linked patient: name, avatar/initial (always real, DB-sourced, never hardcoded)
- [ ] Adherence percentage badge (placeholder/empty until Phase 4/8 data exists)
- [ ] Next scheduled dose text (placeholder/empty until Phase 3/4 data exists)
- [ ] Stock-status indicator dot (placeholder/empty until Phase 6 data exists)
- [ ] Tap a card → **Patient Detail** view

### 3.4 Patient Detail View
- [ ] **Patient Switcher** strip at top — jump between linked patients without returning to grid
- [ ] **Access Level Indicator** badge — "View only" or "Can manage" — sourced from the actual link record, never hardcoded/inferred
- [ ] Adherence summary card → tap → **Full Adherence Report** for that patient
- [ ] Refill/stock summary card → tap → **Refill Detail** for that patient
- [ ] Recent history preview → tap **View all** → **Patient History**
- [ ] Back chevron → returns to **Linked Patients Grid**
- [ ] If "Can manage": additional action controls appear (e.g., mark dose on behalf of patient) (Later Phase — permission logic, Phase 7)
- [ ] If "View only": all data visible, no edit/action controls rendered at all

### 3.5 Alerts Feed (Phase 7/8)
- [ ] Reverse-chronological list: missed-dose, low-stock, emergency alerts
- [ ] Each row: icon by type, patient name, plain-language message, timestamp
- [ ] Filter chips: All / Missed Dose / Low Stock / Emergency
- [ ] Tap a missed-dose alert → that patient's **History**
- [ ] Tap a low-stock alert → that patient's **Refill Detail**
- [ ] Empty state: "No alerts right now — everything looks on track"
- [ ] Realtime delivery via Socket.io once a new alert fires (Phase 7)

### 3.6 Adherence Reports (Phase 8)
- [ ] Per-patient weekly/monthly report cards
- [ ] Time-range toggle: Weekly / Monthly
- [ ] Tap a report card → **Full Adherence Report** for that patient (same as 3.4's link)

### 3.7 Refill Notifications (Phase 6/7)
- [ ] View upcoming refills across all linked patients, sorted by urgency
- [ ] Receive alert when a linked patient's stock crosses the low-stock threshold
- [ ] Tap a refill notification → that patient's **Refill Detail**

### 3.8 Multi-Patient Management
- [ ] Switch between patients via **Patient Switcher** (3.4) or by returning to **Linked Patients Grid** (3.3)
- [ ] Each patient's data always scoped correctly — no cross-patient data leakage

### 3.9 Profile
- [ ] View/edit own name, contact info
- [ ] Save → confirmation toast, stays on screen
- [ ] Logout → shared flow (Section 1)
- [ ] Back → returns to **Linked Patients Grid**

### 3.10 Session Persistence
- [ ] Refreshing the page keeps the caregiver logged in until access token truly expires or logout is triggered

---

## 4. Cross-Role Feature Parity Checklist (sanity check for the build agent)

| Feature | Patient | Caregiver |
|---|---|---|
| Signup with role selection | Yes | Yes |
| Login / Logout / Session persistence | Yes | Yes |
| Language toggle | Yes | Yes |
| Adherence view | Own data | Per linked patient |
| Refill tracking view | Own data | Per linked patient |
| History view | Own data | Per linked patient |
| Alerts | Receives reminders/refill alerts for self | Receives missed-dose + low-stock alerts for all linked patients |
| Add/Edit/Delete medicine | Yes (own only) | No (unless "Can manage" — Later Phase permission) |
| Mark dose Taken/Missed/Snooze | Yes (own doses) | Only if "Can manage" (Later Phase) |
| Linking | Generates code | Enters code |
| Multi-profile handling | N/A (single self profile) | Multiple linked patients, switchable |

---

## 5. Build-Order Cross-Reference (so nothing here contradicts planning.md)

- Sections 1, 2.1–2.3 (shell), 2.9, 2.13–2.14, 3.1–3.4 (shell), 3.9–3.10 → **today's milestone**, per planning.md Section 29
- Section 2.4 (scheduling), full 2.3 CRUD → **Phase 3**
- Section 2.5, 2.6 → **Phase 4**
- Section 2.2 OCR branch → **Phase 5**
- Section 2.7, 3.7 → **Phase 6**
- Section 3.4 manage-permission actions, 3.5 realtime → **Phase 7**
- Section 2.6/3.6 full analytics, 3.3 real badge data → **Phase 8**
- Language toggle full dictionary wiring → **Phase 9**
- All security/prompt-injection testing across every item above → **Phase 10**
- Animation/motion polish on any interaction above → **Phase 11**

**Reminder for the build agent:** this file is a feature/use-case checklist only — it does not grant permission to build ahead of the current phase. Cross-reference Section 5 before implementing any checked item; if an item's phase hasn't been reached yet per planning.md Section 9, its shell/route may exist (per design.md) but its underlying logic should render an honest empty/placeholder state, never fabricated data, exactly as planning.md Section 29.5 requires.
