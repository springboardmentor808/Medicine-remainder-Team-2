# PillSync - Healthcare & Medication Tracking Management System

A production-ready, unified full-stack **MERN Healthcare & Medication Tracking System** built with MongoDB, Express, React, Node.js, and styled with Tailwind CSS & Recharts analytics.

---

## 🚀 Key Features

1. **Multi-Patient Healthcare Directory**: Manage 12+ patient profiles with Indian medical details, chronic conditions, emergency contacts, and assigned physicians.
2. **Patient Registration System**: Interactive modal form with input validations, auto-generated Patient IDs (`P013`, `P014`), and instant directory sync.
3. **Daily Intake Checklist**: Real-time intake logging per patient showing dosages, schedules, and status markers (*Taken*, *Missed*, *Skipped*).
4. **Adherence Analytics**: Interactive Recharts graphs showing 14-day compliance trends, intake volume comparisons, and rate calculations.
5. **Monthly Calendar Audit**: Color-coded calendar grids with day-by-day slide drawers.
6. **Chronological Regimen Timeline**: Vertical node milestones for treatment starts, dose events, and completions.
7. **Unified Single-Domain Architecture**: Express serves the production React/Vite build from `frontend/dist` with client-side SPA routing support (`app.get('*')`) and relative `/api` endpoints.

---

## 📁 Project Structure

```
PillSync/
├── backend/
│   ├── config/              # MongoDB Connection setup & dynamic memory fallback
│   ├── controllers/         # Patients, Medications, History, Adherence, Dashboard controllers
│   ├── middleware/          # Async handler, global error middleware
│   ├── models/              # Mongoose Schemas (Patient, Medication, MedicationLog)
│   ├── routes/              # Express REST API Routes (/api/patients, /api/medications, etc.)
│   ├── utils/               # Log sync helper, missed dose audit, multi-patient seeder
│   ├── app.js               # Express app config & static frontend serving
│   ├── server.js            # Node listener entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # UI Cards, AddPatientModal, spinners, floating toasts
│   │   ├── context/ font    # Theme Context, Toast Context
│   │   ├── pages/           # PatientsDashboard, PatientProfile, Forms, Calendars, Analytics, Timelines, Settings
│   │   ├── services/        # Axios API Client (Relative /api endpoints)
│   │   ├── index.css        # Tailwind imports, calendar tiles, glassmorphism styles
│   │   ├── main.jsx         # React bootstrap
│   │   └── App.jsx          # Router layout shell
│   ├── index.html           # HTML shell
│   ├── vite.config.js       # Vite config with dev proxy to localhost:5000
│   ├── tailwind.config.js   # Tailwind theme configurations
│   └── package.json
├── .env.example             # Environment template
├── package.json             # Root monorepo manager with build & start scripts
└── README.md
```

---

## 🌐 Production Deployment

* **Live Application URL**: [https://pillsync-3.onrender.com](https://pillsync-3.onrender.com)
* **REST API Root**: [https://pillsync-3.onrender.com/api](https://pillsync-3.onrender.com/api)

PillSync is pre-configured for 1-click single Web Service deployment on **Render**, **Railway**, or **Heroku**.

### Render Setup Steps:

1. Push your code to your GitHub repository ([https://github.com/sagar101-s/PillSYnc.git](https://github.com/sagar101-s/PillSYnc.git)).
2. Log in to [Render.com](https://render.com) and click **New +** → **Web Service**.
3. Select your repository `PillSYnc`.
4. Configure service settings:
   * **Name**: `pillsync-3`
   * **Environment**: `Node`
   * **Build Command**: `npm run build`
   * **Start Command**: `npm start`
5. Add Environment Variables:
   * `NODE_ENV`: `production`
   * `PORT`: `5000`
   * `CLIENT_URL`: `https://pillsync-3.onrender.com`
   * `MONGO_URI`: `<your_mongodb_atlas_connection_string>`
   * `JWT_SECRET`: `<your_jwt_secret_key>`
6. Click **Create Web Service**.

Render will automatically run `npm run build` to compile the Vite frontend into `frontend/dist`, start the Express backend server on Node, and serve both the React interface and REST API endpoints from `https://pillsync-3.onrender.com`!

---

## 🔧 Local Development Setup

### 1. Installation
```bash
npm run setup
```

### 2. Run Development Servers Concurrently
```bash
npm run dev
```

### 3. Re-seed Database
```bash
npm run seed
```