# PillSync — updated1.md — Review Plan for Dashboard & Interaction Overhaul

> Purpose: single review file for the human to approve BEFORE code is built. Covers: (a) Vite duplicate-key fix already done, (b) how to run the OCR pipeline locally, (c) exact build plan for Global UX + Patient Dashboard + Caregiver Dashboard against `planning.md` + `agents.md` + the 3 images you sent (Patient Overview ref, Caregiver Overview ref, Today calendar heatmap).
> No Dockerfile / no AWS / no Admin / no cloud — localhost only per `agents.md:1` + `planning.md:6`.

---

## 0) Immediate Fix — Already Applied (no approval needed, trivial bug)

**File:** `client/src/OcrReviewPanel.jsx:47-52`

**Warning:**
```
[vite] warning: Duplicate key "frequency" in object literal
  quantityPerDose: dosage, formType: 'oral', frequency
```
**Root cause:** `frequency` was included twice in the `body` sent to `POST /api/patient/medicines` — once as `frequency` alongside `name/dose/schedule/slot` and again as the trailing shorthand `frequency` after `quantityPerDose`.

**Fix applied:** removed trailing duplicate so body is now:
```text
{ name, dose, schedule, slot, frequency, composition, uses, sideEffects, manufacturer, imageUrl, quantityPerDose, formType: 'oral' }
```
**Verified:** `vite` `esbuild` warning disappears on next HMR reload; no payload change (same single `frequency` value sent). This was a "small bug fix within already-approved code" per `planning.md:0A` — no gate required.

---

## 1) How to Run the OCR Pipeline Locally (commands you asked for)

Requires 3 terminals + Ollama running. All localhost, no Docker.

### Terminal 1 — Ollama (prereq)
```text
ollama serve
# in another shell, pull models ONCE:
ollama pull moondream
ollama pull qwen2:1.5b
# optional fallbacks:
ollama pull llava:latest
ollama pull phi3:mini
# verify:
curl http://127.0.0.1:11434/api/tags
```

### Terminal 2 — Python OCR Microservice (FastAPI, port 8001, loopback only)
```text
cd ocr-service
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env
# edit .env — must match server/.env:
# OCR_INTERNAL_TOKEN=local-ocr-token
# OLLAMA_URL=http://127.0.0.1:11434
# OLLAMA_VISION_MODEL=moondream
# OLLAMA_TEXT_MODEL=qwen2:1.5b
uvicorn main:app --host 127.0.0.1 --port 8001 --reload
# health check:
curl http://127.0.0.1:8001/health
# NEVER expose this port publicly; Node validates X-Internal-Token per planning.md:28
```

### Terminal 3 — Node Backend (Express, port 4000)
```text
cd server
copy .env.example .env
# ensure .env has:
# MONGODB_URI=mongodb://127.0.0.1:27017/pillsync
# CLIENT_ORIGIN=http://localhost:5173
# OCR_SERVICE_URL=http://127.0.0.1:8001
# OCR_INTERNAL_TOKEN=local-ocr-token  (must match ocr-service/.env)
# JWT_ACCESS_SECRET=...
# JWT_REFRESH_SECRET=...
npm install
# first time only, with data/Medcine details T2.csv present:
npm run seed
npm run dev
# health:
curl http://localhost:4000/api/health
```

### Terminal 4 — React Frontend (Vite, port 5173)
```text
cd client
npm install
npm run dev
# build budget check (agents.md:7):
npm run build
```

### End-to-end OCR smoke test (after all 3 are up)
```text
1. Login as patient → Dashboard → "Scan prescription" → pick JPG/PNG/WebP <10MB
2. Click "Read image" → shows "Reading with local Ollama..." (vision → text stage)
3. On success: review panel shows OCR fields + MedicineMaster cross-check (read-only panel, no auto-correct)
4. Confirm frequency → schedule preview (morning/afternoon/night) → "Confirm and add"
5. If Ollama is down or image unclear: calm fallback "We could not read that image clearly. Please try again or enter manually." never a raw traceback (planning.md:10)
```

Direct-to-OCR 403 test (must fail):
```text
curl -X POST http://127.0.0.1:8001/extract -H "Content-Type: application/json" -d "{\"filename\":\"x.jpg\",\"mime_type\":\"image/jpeg\",\"image_base64\":\"abc\"}"
# → 403 Internal access only (proves frontend never holds the OCR URL — planning.md:28)
```

---

## 2) What You Asked For — Consolidated Requirements

### Image 1 — Patient Dashboard (image_c65584.png) refinements
- Sidebar with active soft-green + dot, routes: Overview, My medicines, Scan prescription, Refill, History & reports, Settings
- Metric cards visual: progress ring + mini sparkline/bar for adherence (not raw "3/4" text)
- Medication card: replace inline `Taken ✓ / Missed / Snooze` links with large segmented block buttons (≥48×48px), tactile states, snooze duration modal (+ tablet icon, optimistic UI, encouraging empty states)

### This image — Caregiver Dashboard drill-down
- Clicking a patient card (e.g. Neha Maurya) → expand tray OR navigate to dedicated Patient Detail View
- Detail must show: today's exact chronological timeline of doses (taken/missed/snoozed/upcoming with times) + emergency contacts
- Calendar heatmap (your "Today" S M T W T F S image): blue ✓ on taken days, red dot under 16/19/23 for missed/low-stock, grey empty — this is the History & Reports calendar to replicate

### Global UX (applied everywhere)
- Tactile: every clickable element `transition-all duration-200 ease-in-out hover:-translate-y-[1px] active:scale-[0.98]` + visible focus ring
- Accessibility: ≥48×48px tap targets; status never color-only (green ✓ / red ▲ + text)
- Language toggle EN|हिंदी (top-right): instant client-side re-render via Context/i18next, no reload, MedicineMaster/OCR English text excluded
- Optimistic UI: Taken click instantly flips card/badge/ring/chart/streak, then syncs via `PATCH /patient/medicines/:id/status` backed by `IntakeLog`; roll back on error

### Caregiver extras you listed
- Care Circle banner "1 connected patient" dynamic + quick-filter menu if >1
- Inventory: "Stock: Healthy" → calculated runway (e.g. "14 days remaining" green / "Refill needed by Friday" red) using `server/src/routes/patient.js:276 refill` logic
- "Send Reminder / Nudge" button when dose overdue — pushes realtime via Socket.io + durable `Notification` (`server/src/socket.js:1`)
- PS-Code Connect → loading spinner → slide-down animation of new patient card (MongoDB verified)

---

## 3) Execution Plan — Steps In Order (each is an Approval Gate per planning.md:0A)

> I will NOT start any step below until you reply "go" for that step (or "go all"). Each step states what/why/affects/assumption.

### STEP 0 — Done: Bugfix + Audit (0.2d, no gate)
- Done: duplicate-key fix above; recharts already optimized (`client` log `vite: optimized: recharts`)
- To do before build: `cd client; npm run build` + screenshot gzip report to freeze baseline against `agents.md:7` (initial <2MB, per-chunk <200KB, ceilings 5MB/500KB). Record Node heap baseline for `server`.

### STEP 1 — Global UX Foundation (0.5–1d) — GATE REQUIRED
- **What:** add Tailwind tactile utility + focus ring + 48px min tap, wrap `LanguageProvider` at root (`client/src/AppInteractive.jsx:252`), add top-right `LocaleSwitcher` (already present) to every layout header + remove any reload path, add optimistic helper `optimisticPatch(id,status)` in `client/src/lib/api.js:1`.
- **Why:** satisfies Part 1 across all pages without touching data model.
- **Affects:** `client/src/AppInteractive.jsx`, `client/src/lib/api.js`, `client/src/styles.css`, `client/src/design-overrides.css`.
- **Assumption:** keep existing `translations` dict in `AppInteractive.jsx:15`; if you prefer `react-i18next` with lazy `en.json/hi.json` we swap in Step 5 — today stays Context to avoid dependency bump unless approved.
- **Dep vetting (agents.md:5):** no new dep. At most add `tailwindcss` already present; `framer-motion` narrow import deferred.
- **Verify:** click every button shows hover lift + press scale; switch EN↔हिंदी instantly re-renders `t('brand')` etc.; Tap target audit with axe/devtools.

### STEP 2 — Patient Dashboard Refinement (1.5–2d) — GATE REQUIRED
- **What:**
  1. Sidebar: active `bg-green-50` + dark-green dot via `Sidebar` in `AppInteractive.jsx:408`.
  2. Metric Cards: circular SVG progress ring for `Today's progress` (takenToday/dueToday) + sparkline/bar for `Adherence` (7-day `GET /patient/adherence?range=weekly` daily buckets already available `server/src/routes/patient.js:67`) + streak encouraging copy when 0.
  3. Medication Card: replace inline links (`AppInteractive.jsx:657`) with large segmented buttons `[ Taken ✓ | Missed ▲ | Snooze ◷ ]`, full-width on mobile, `min-h-[48px]`, icons + text, optimistic flip, tactile classes. Add `Tablet/Capsule/Liquid/Injection` icon by `formType` (`Medicine.js`).
  4. Snooze: inline slide-up modal / dropdown with `15m / 30m / 1h / Custom` that calls `dose(id,'snoozed',minutes)` (`patient.js:180`) and shows `snoozeUntil`.
  5. Empty/zero: "Take your first dose to start your streak!" when `streak===0 && adherence===0`.
- **Why:** meets Part 2 + elderly low-cognitive-load mandate (`planning.md:0`).
- **Affects:** `client/src/AppInteractive.jsx:PatientApp`, `client/src/components/ui/AdherencePanel.jsx`, `client/src/components/ui/WeeklyBar.jsx`; reuse existing `GET /patient/dashboard`, `PATCH .../status`.
- **Dep vetting:** `recharts` already installed — lazy-load its bar/line only on adherence route so initial chunk stays <200KB (`agents.md:2`). No new dep.
- **Verify:** manual: add medicine → 3 metrics update visually; tap Taken → ring animates before network; Missed → caregiver alert created (`server/src/routes/patient.js:197`); Snooze → time moves; 0-state copy visible on fresh patient.

### STEP 3 — Caregiver Drill-Down + Inventory + Nudge (2d) — GATE REQUIRED (biggest scope)
- **What:**
  1. **Backend — Patient detail bundle:** add `GET /caregiver/patients/:patientId/detail` in `server/src/routes/caregiver.js:46` returning:
     - `patient` (publicUser), `accessLevel`, `medicines`, `todayTimeline` (today's `IntakeLog` joined with `Medicine` sorted chronologically + `status` per dose), `emergencyContacts` (from `User.emergencyContacts` or `patient.emergencyContacts` — schema addition if missing, see assumption), `refillRows` (runway per med), `adherence7d` snapshot.
     - Reuse existing `CaregiverLink` guard (`server/src/routes/caregiver.js:48`).
  2. **Backend — Nudge endpoint:** `POST /caregiver/patients/:patientId/nudge` (caregiver only, linked only) creates `Notification type=nudge` for patient, emits via `emitToCaregiver` + `emitToPatient` (add `emitToPatient` in `server/src/socket.js`) so patient dashboard shows live reminder. Guard: only if at least one `upcoming/missed` dose overdue; rate-limit 1/min per patient (light in-memory + Redis if available).
  3. **Frontend — Card drill-down:** make `CaregiverApp` patient card (`AppInteractive.jsx:877`) clickable: expand accordion tray inline OR navigate to `/caregiver/patients/:patientId` (preferred: navigate, route-level lazy per `agents.md:2` + back chevron). Tray/detail shows:
     - Chronological timeline: `08:00 Morning — Metformin 500mg Taken ✓` etc., with green check/red triangle/grey clock icons (not color-only).
     - Emergency contacts section (name/phone/relation) + call affordance.
     - Inventory row: per-medicine `remaining` + `daysLeft` → "14 days remaining" (green) / "Runs out in 3 days" (amber) / "Refill needed by Friday — 2026-09-03" (red) using `server/src/routes/patient.js:276` `parseQty` + `depletionDate` + `lowStock` logic; reuse `GET /patient/refill` calc but scoped to this patient (caregiver read-only view, no stock edit).
     - Prominent `Send Reminder` button enabled only when overdue; shows spinner then "Nudge sent".
  4. **Banner:** make `Care circle — N connected patients` (`AppInteractive.jsx:954`) a click → quick-filter menu (All / search by name) when `patients.length>1`.
  5. **Link UX:** `Connect →` button state machine: idle → `loading` spinner → slide-down animation of new card (`requestAnimationFrame` + `transition`).
- **Why:** implements your caregiver spec verbatim; keeps pill counts derived from `IntakeLog * quantityPerDose`, not guessed.
- **Affects:** `server/src/routes/caregiver.js`, `server/src/socket.js`, `server/src/models/User.js` (only if emergencyContacts missing — see gate), `client/src/AppInteractive.jsx:CaregiverApp`, new `client/src/pages/caregiver/PatientDetail.jsx` (lazy).
- **Assumption to confirm (GATE):** add `User.emergencyContacts?: [{ name, phone, relation }]` array field if not already present — **is this approved?** Alternative is to show patient's `phone` + linkCode as interim contact if you say no.
- **Dep vetting:** no new dep (`socket.io-client` + `recharts` already present). Inventory calc is pure JS; `date-fns` for "by Friday" formatting would be ~6kb treeshaken — **propose NOT to add yet** and use `Intl.DateTimeFormat` native instead to stay lighter per `agents.md:5`.
- **Verify:** link patient → spinner → card slides in; click card → detail route shows timeline + contacts; trigger overdue → Nudge button active → patient sees in-app alert + caregiver sees confirmation; refill row math matches `GET /patient/refill`.

### STEP 4 — History Calendar Heatmap (the image you sent) (1d) — GATE REQUIRED
- **What:** upgrade `PatientApp` history tab (`AppInteractive.jsx:682`) + add caregiver history sub-tab on detail view to a month grid `S M T W T F S` with:
  - Blue ✓ circle for days where all doses taken, red dot under date for missed/low-stock (16, 19, 23 pattern in your image), grey empty for future/no-data, tap → load `GET /patient/history?date=YYYY-MM-DD` logs below.
  - Data source: `GET /patient/adherence?range=monthly` `daily[]` already returns `{date,taken,missed,snoozed}` per day (`patient.js:92`), plus `GET /patient/history` for exact logs.
  - Styling: `bg-slate-900` dark card, `border-radius: squircle`, narrow `framer-motion` not needed here — CSS transitions only.
- **Why:** matches your screenshot and `design_specification.md:5` History route.
- **Affects:** `client/src/components/ui/AdherencePanel.jsx` + `AppInteractive.jsx` history branch; no backend change.
- **Dep vetting:** no new dep — CSS grid + native Date; `date-fns` deferred per Step 3.
- **Verify:** create logs for 16/19/23 as missed → red dots appear; today shows header "Today"; clicking a day loads its timeline; month nav works.

### STEP 5 — Polish, Budgets, and Tests (1d) — runs after Steps 1–4
- **What:** route-level `React.lazy` per `client/src/appRouter.jsx:12` already scaffolded — cut over `main.jsx:3` from `AppInteractive` to router (single-line change), assert `npm run build` gz budgets (`agents.md:7`), run `npm test` + manual cross-role tests, add Socket auth gate test, add `GET /caregiver/patients/:id/detail` + `POST .../nudge` supertest coverage.
- **Affects:** `client/src/main.jsx`, build config only.
- **Dep vetting:** none new; if `react-router-dom` chunk nears 200KB split `PatientDetail` + `HistoryCalendar` into own chunks (`agents.md:2`).
- **Verify:** `npm run build` shows initial <2MB gz, per-chunk <200KB (ceilings 5MB/500KB); Node heap <512MB under manual upload stress; `curl` + two-browser patient+caregiver e2e (add medicine → caregiver alert → miss dose → nudge) green.

---

## 4) Approval Checklist (reply per line)

- [ ] **STEP 1 Global UX** approved as described (no new dep, Context i18n stays)
- [ ] **STEP 2 Patient Dashboard** approved (progress ring + large block dose buttons + snooze modal)
- [ ] **STEP 3 Caregiver Drill-Down** approved — explicitly:
  - [ ] allow adding `User.emergencyContacts` array field if missing (or say "use phone only")
  - [ ] allow new `GET /caregiver/patients/:patientId/detail` + `POST .../nudge` routes
  - [ ] prefer navigation to dedicated detail view vs inline expand tray (recommended: navigate)
- [ ] **STEP 4 Calendar heatmap** approved to replace simple date picker with the S-M-T-W-T-F-S ✓/dot grid
- [ ] **STEP 5 Router cutover + build budget gate** approved (or defer)

Reply examples: `"go all"`, `"go step 1+2 only"`, `"go 3 but no emergencyContacts field — use phone only"`.

---

## 5) What Will NOT Be Done In This Batch (remains out of scope)

Docker/AWS/ECS/App Runner, Admin role/routes, marketing site, real SMS/email via Twilio/SendGrid (notifications stay `Notification` + Socket.io in-app, `delivery.js` stub), pharmacy/drug-interaction API, second Python service. OCR microservice stays loopback-only with `X-Internal-Token` (`ocr-service/main.py:90`).

---

## 6) File & Route Map For Reviewers

| Area | Key files | Routes |
|---|---|---|
| Patient overview | `client/src/AppInteractive.jsx:597 PatientApp` | `GET /patient/dashboard`, `PATCH /patient/medicines/:id/status`, `GET /patient/adherence`, `GET /patient/history`, `GET /patient/refill` |
| Caregiver overview | `client/src/AppInteractive.jsx:813 CaregiverApp` | `GET /caregiver/dashboard`, `POST /caregiver/link`, `DELETE /caregiver/link/:patientId`, `GET /caregiver/alerts`, `GET /caregiver/reports` |
| New (Step 3) | `server/src/routes/caregiver.js:46` + `server/src/socket.js:1` + new `client/src/pages/caregiver/PatientDetail.jsx` | `GET /caregiver/patients/:patientId/detail`, `POST /caregiver/patients/:patientId/nudge` |
| OCR | `client/src/OcrReviewPanel.jsx:1`, `server/src/routes/patient.js:230`, `ocr-service/main.py:88` | `POST /patient/ocr` → internal `POST 127.0.0.1:8001/extract` |
| Config | `server/src/config/env.js:1`, `ocr-service/.env.example` | — |

---

## 7) How To Review This File

```text
# from project root:
cat updated1.md
# or open in VS Code preview (Markdown)
```
I will wait for your "go" before touching code beyond the Step 0 duplicate-key fix already committed.

