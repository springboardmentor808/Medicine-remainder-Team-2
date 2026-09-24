# PillSync — Medicine Management (Django REST Framework + React)

- **Medicine Management** — Add / Edit / Delete / View medicines
- **Disease Categories** — group medicines by the condition they treat
- **Prescription Storage** — upload and store prescription files (PDF/image)
- **Medicine Stock** — quantity tracking, low-stock + refill-soon alerts
- **Dosage Information** — structured reminder schedule (no free-text frequency)

Plus a **Today's Reminders** dashboard (Morning/Afternoon/Night,
grouped, with a Mark as Taken toggle) since a medicine reminder app needs a
"did I take it" screen, not just a data table.

Tech stack (per project spec): **Django REST Framework** backend, **React
(Vite)** frontend, **SQLite** database.

## ⚠️ This wasn't run end-to-end here

The sandbox this was built in has no network access to PyPI, npm, or apt, so
`pip install` / `npm install` couldn't run and I couldn't launch either dev
server to click through it live. What I *could* do, and did:

- Validated every Python file's syntax with `python -m py_compile` (all pass)
- Validated every JSX file with a real `esbuild` JSX compile (all pass)
- Bundled the entire frontend (`main.jsx` + every component + `api.js`) with
  `esbuild --bundle` to catch cross-file import typos — it resolved cleanly

That catches syntax and wiring errors, but not everything a live run would
(e.g. a runtime edge case in a Django queryset). Please smoke-test the flows
below once it's running locally, and let me know if anything breaks.

## Project structure

```
pillsync-django/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── pillsync/              # project settings, urls, wsgi/asgi
│   ├── medicines/             # DiseaseCategory, Medicine, MedicineSchedule, DoseLog
│   │   ├── models.py            # stock/dosage logic lives here (see below)
│   │   ├── serializers.py       # nested schedule create/update
│   │   ├── views.py             # CRUD + stock + today's-schedule + mark/undo taken
│   │   ├── urls.py
│   │   ├── admin.py
│   │   ├── migrations/0001_initial.py   # hand-written (see note below)
│   │   └── management/commands/seed.py  # sample data
│   └── prescriptions/         # Prescription model/serializer/views
│       └── migrations/0001_initial.py
└── frontend/
    ├── package.json
    ├── vite.config.js          # proxies /api -> http://127.0.0.1:8000
    ├── index.html
    └── src/
        ├── main.jsx, App.jsx, api.js, index.css
        └── components/
            ├── Sidebar.jsx, Toast.jsx
            ├── Dashboard.jsx              # Today's Reminders + stats
            ├── MedicinesView.jsx, MedicineModal.jsx, ScheduleBuilder.jsx
            ├── CategoriesView.jsx, CategoryModal.jsx
            └── PrescriptionsView.jsx, PrescriptionModal.jsx
```

## Setup

### 1. Backend (Django)

```bash
cd pillsync-django/backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt

python manage.py migrate
python manage.py seed            # optional: sample categories/medicines
python manage.py createsuperuser # optional: to use /admin/

python manage.py runserver       # http://127.0.0.1:8000
```

**Note on migrations:** `medicines/migrations/0001_initial.py` and
`prescriptions/migrations/0001_initial.py` are hand-written (no network
meant no `makemigrations` could run against a real Django install here).
They match the models field-for-field, but if `migrate` complains about
anything, delete both migration files' contents except a bare
`initial = True` migration, run `python manage.py makemigrations`, and it
will regenerate them correctly from the models.

### 2. Frontend (React + Vite)

In a second terminal:

```bash
cd pillsync-django/frontend
npm install
npm run dev               # http://localhost:5173
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` and
`/media` requests to Django on port 8000 (see `vite.config.js`), so the
React app just calls relative paths like `/api/medicines/`.

## API Reference

All endpoints are under `/api/`. Django REST Framework's router adds
trailing slashes — that's expected, not a typo.

### Medicines — CRUD Medicines, Get Medicines
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/medicines/` | List. Query params: `search`, `category_id`, `low_stock=true`, `refill_soon=true`, `sort_by` (`name`\|`stock_asc`\|`stock_desc`\|`expiry`), `page`, `per_page` |
| `GET` | `/api/medicines/<id>/` | Get one |
| `POST` | `/api/medicines/` | Add |
| `PUT`/`PATCH` | `/api/medicines/<id>/` | Edit |
| `DELETE` | `/api/medicines/<id>/` | Delete |
| `POST` | `/api/medicines/<id>/stock/` | Adjust stock: `{"change": 10}` or `{"change": -5}` |

A medicine's `dosage_frequency`, `doses_per_day`, `estimated_days_remaining`,
and `refill_soon` are **never sent by the client** — they're computed
server-side from the `schedule` array and current stock. Example: 60 tablets
at 2 reminders/day → 30 days remaining (the spec's own worked example).

Example — add a medicine with a twice-daily schedule:
```bash
curl -X POST http://127.0.0.1:8000/api/medicines/ \
  -H "Content-Type: application/json" \
  -d '{
        "name": "Ibuprofen",
        "manufacturer": "Pfizer",
        "dosage_amount": "200",
        "dosage_unit": "mg",
        "dosage_form": "Tablet",
        "quantity_per_dose": 1,
        "stock_quantity": 50,
        "reorder_level": 10,
        "unit_price": 0.10,
        "expiry_date": "2027-01-01",
        "category": 1,
        "schedule": [
          {"period": "Morning", "reminder_time": "08:00"},
          {"period": "Night", "reminder_time": "21:00"}
        ]
      }'
```
Each schedule slot is just `period` (`Morning`/`Afternoon`/`Evening`/`Night`)
+ optional `reminder_time` (`"HH:MM"`, 24h) — no meal/breakfast fields.
Sending `schedule` on `PUT`/`PATCH` fully replaces the existing schedule;
omitting it (a partial `PATCH`) leaves it untouched.

### Disease Categories
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/categories/` | List |
| `POST` | `/api/categories/` | Add: `{"name": "...", "description": "..."}` |
| `PATCH` | `/api/categories/<id>/` | Edit |
| `DELETE` | `/api/categories/<id>/` | Delete — medicines in it become **uncategorized**, not deleted |

Seeded categories match the spec's disease-based organization list: Blood
Pressure, Diabetes, Thyroid, Antibiotics, Vitamins, Heart Medications.

### Prescriptions — Upload Prescription
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/prescriptions/` | Multipart: `file`, `patient_name`, `doctor_name` (optional), `notes` (optional), `medicine` (optional, medicine id) |
| `GET` | `/api/prescriptions/` | List. Query params: `search`, `medicine_id` |
| `GET` | `/api/prescriptions/<id>/` | Get one |
| `DELETE` | `/api/prescriptions/<id>/` | Delete (also removes the stored file) |

```bash
curl -X POST http://127.0.0.1:8000/api/prescriptions/ \
  -F "patient_name=John Doe" \
  -F "doctor_name=Dr. Smith" \
  -F "notes=Follow up in 2 weeks" \
  -F "medicine=1" \
  -F "file=@/path/to/prescription.pdf"
```

### Dashboard: Today's Reminders + Mark as Taken
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/schedule/today/` | Every reminder slot grouped by period, with today's taken/not-taken status |
| `POST` | `/api/schedule/<schedule_id>/take/` | Mark today's dose taken (deducts `quantity_per_dose` from stock; idempotent) |
| `POST` | `/api/schedule/<schedule_id>/undo/` | Undo — restores the deducted stock |

## Database models

**DiseaseCategory** — id, name, description.

**Medicine** — id, name, manufacturer, dosage_amount, dosage_unit,
dosage_form, quantity_per_dose, stock_quantity, reorder_level, unit_price,
expiry_date, description, category (FK → DiseaseCategory, `SET_NULL`),
created_at, updated_at. `dosage_frequency`, `doses_per_day`,
`low_stock`, `estimated_days_remaining`, `refill_soon` are computed
properties, never stored.

**MedicineSchedule** — id, medicine (FK, `CASCADE`), period, reminder_time,
sort_order. One row per reminder slot.

**DoseLog** — id, medicine (FK, `CASCADE`), schedule (FK, `CASCADE`),
log_date, taken_at. Unique on (schedule, log_date) — marking taken twice in
one day is a no-op, and undo just deletes today's row.

**Prescription** — id, patient_name, doctor_name, notes, medicine (FK →
Medicine, `SET_NULL`), file, original_filename, uploaded_at.

## Notes

- **No auth yet.** `REST_FRAMEWORK["DEFAULT_PERMISSION_CLASSES"]` is
  `AllowAny` — the spec's Patient/Caregiver/Admin auth module is a separate
  piece of work. `MedicineSchedule` is deliberately structured so a `user`
  FK can be added later without a redesign.
- Uploaded files are renamed to a UUID on disk (`prescriptions/<uuid>.<ext>`);
  the original filename is kept in the DB for display only.
- Allowed prescription types: pdf, png, jpg, jpeg, gif, webp, 10 MB max —
  both configurable in `settings.py` (`ALLOWED_PRESCRIPTION_EXTENSIONS`,
  `MAX_PRESCRIPTION_SIZE`).
- Deleting a medicine unlinks (doesn't delete) any prescriptions that
  referenced it; deleting a category uncategorizes its medicines.
- DRF's default validation error format is `{"field": ["message"]}` — the
  frontend's `api.js` unwraps this automatically for the toast/error UI.
- CORS is wide open in `DEBUG` mode for local dev convenience — tighten
  `CORS_ALLOWED_ORIGINS` / turn off `CORS_ALLOW_ALL_ORIGINS` for production.
