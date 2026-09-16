# PillSync - Intelligent Medicine Reminder & Medication Tracking System

[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-success.svg)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-4.19-lightgrey.svg)](https://expressjs.com/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-black.svg)](https://socket.io/)

**PillSync** is a comprehensive, production-grade medication management and adherence tracking platform built for the **Infosys Springboard Internship (Team 2)**. The platform bridges the communication gap between patients and caregivers through real-time notifications, intelligent scheduled reminder engines, adherence analytics, inventory refill warnings, and optional local AI prescription scanning.

---

## 📑 Table of Contents
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Key Features](#-key-features)
- [Prerequisites](#-prerequisites)
- [MongoDB Setup & Configuration](#-mongodb-setup--configuration)
- [Installation & Getting Started](#-installation--getting-started)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
  - [3. Optional AI OCR Microservice](#3-optional-ai-ocr-microservice)
- [Testing & Verification](#-testing--verification)
- [Step-by-Step Walkthrough for Evaluation](#-step-by-step-walkthrough-for-evaluation)
- [Environment Variables Reference](#-environment-variables-reference)
- [Project Directory Structure](#-project-directory-structure)

---

## 🏗 Architecture & Tech Stack

```
                               ┌────────────────────────────────┐
                               │  Client (React 18 + Vite SPA)  │
                               │  Tailwind CSS + Recharts       │
                               └───────────┬────────────▲───────┘
                                           │            │
                                 HTTP REST │            │ WebSockets
                                           ▼            │ (Socket.io)
┌──────────────────────────────┬────────────────────────┴───────┐
│ OCR Microservice (FastAPI)   │   Express.js API Backend       │
│ • Ollama (Moondream + Qwen)  │   • Zod Schema Validation      │
│ • Local Vision-Language      │   • JWT Auth & Role Guards     │
│ • Privacy-safe loopback      │   • Smart Reminder Cron Engine │
└──────────────▲───────────────┴───────────────┬────────────────┘
               │                               │
               └──────── Loopback (8001) ──────┘
                                               ▼
                               ┌────────────────────────────────┐
                               │   MongoDB Database & Mongoose  │
                               │   • Users & Caregiver Links    │
                               │   • Medicines & Refill Stock   │
                               │   • Reminder Logs & Adherence  │
                               └────────────────────────────────┘
```

- **Frontend**: React 18, Vite, React Router v7, Tailwind CSS, Recharts (Adherence & compliance data visualization), Lucide icons, Socket.io-client.
- **Backend**: Node.js (ES Modules), Express.js, MongoDB & Mongoose ODM, Zod request validation, JWT Authentication (Access + Refresh Tokens in HTTP-only cookies), Socket.io, Node-cron.
- **Smart Reminder Engine**: Background scheduled job automatically generating daily reminder logs, tracking pending doses, transitioning statuses (*scheduled* &rarr; *pending* &rarr; *taken* / *missed*), and triggering caregiver alerts upon missed doses.
- **AI OCR Service (Optional Microservice)**: Python FastAPI with Ollama (`moondream` + `qwen2:1.5b`) for privacy-preserving offline prescription scanning and automatic medication parameter extraction.

---

## 🌟 Key Features

1. **Role-Based Architecture**:
   - **Patient Role**: Manage medication schedule, log doses with double-tap safety confirmations, monitor refill stocks, view personal adherence calendars, and scan prescriptions.
   - **Caregiver Role**: Monitor linked patients in real time, inspect medication logs, receive instant alerts on missed doses, track adherence trends, and assist with refill requests.
2. **Secure Patient-Caregiver Linking**:
   - Every patient profile is assigned a unique, collision-resistant code (e.g. `PS-4X89K2`). Caregivers seamlessly link to patients using this code without sharing passwords.
3. **Smart Scheduled Reminders & Adherence Logs**:
   - Automated reminder scheduler generates timestamped dose logs.
   - Prevents duplicate dose logging with double-tap safety windows.
   - Detailed adherence scoring and heatmaps over 7-day, 14-day, and monthly cycles.
4. **Intelligent Refill Management**:
   - Live inventory tracking decrementing remaining doses automatically upon intake.
   - Color-coded threshold alerts (e.g. warning when remaining supply drops below 5 days).
5. **Multi-Channel Alerts**:
   - Instant in-app notification center stored durably in MongoDB.
   - Real-time bidirectional alerts via Socket.io.
   - Optional fallback delivery via Twilio SMS and Gmail SMTP.

---

## 💻 Prerequisites

Before running the application, ensure the following software is installed on your workstation:

- **Node.js**: v18.0.0 or newer ([Download Node.js](https://nodejs.org/))
- **npm**: v9.0.0 or newer (bundled with Node.js)
- **MongoDB**: v6.0 or newer (Local Community Server or MongoDB Atlas account)
- **Git**: For version control
- *(Optional for OCR)*: Python 3.10+ and [Ollama](https://ollama.ai/)

---

## 🗄 MongoDB Setup & Configuration

You can connect PillSync to either a **Local MongoDB instance** or **MongoDB Atlas (Cloud)**.

### Option A: Local MongoDB (Recommended for Local Testing)

1. **Install MongoDB Community Server**:
   - Download and install from [MongoDB Community Download](https://www.mongodb.com/try/download/community).
   - Ensure "Install MongoDB as a Service" is checked during setup on Windows.
2. **Verify MongoDB is running**:
   - On Windows, verify the service in PowerShell:
     ```powershell
     Get-Service -Name MongoDB
     # If stopped, run:
     net start MongoDB
     ```
   - On Linux/macOS:
     ```bash
     sudo systemctl status mongod
     # If stopped, run:
     sudo systemctl start mongod
     ```
3. **Default Connection URI**:
   ```
   mongodb://127.0.0.1:27017/pillsync
   ```

### Option B: MongoDB Atlas (Cloud Database)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a free **M0 Shared Cluster**.
3. Under **Database Access**, create a database user (e.g., username `pillsync_admin` with password).
4. Under **Network Access**, click **Add IP Address** and select **Allow Access from Anywhere** (`0.0.0.0/0`) or whitelist your current IP.
5. Click **Connect** &rarr; **Drivers** &rarr; Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/pillsync?retryWrites=true&w=majority
   ```
6. Paste this URI into `server/.env` under `MONGODB_URI`.

---

## 🚀 Installation & Getting Started

### 1. Backend Setup

1. Open a terminal and navigate to `server`:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your local environment configuration:
   ```bash
   # On Windows (PowerShell/CMD):
   copy .env.example .env

   # On macOS/Linux:
   cp .env.example .env
   ```
4. Verify/update `server/.env`:
   ```env
   PORT=4000
   CLIENT_ORIGIN=http://localhost:5173
   MONGODB_URI=mongodb://127.0.0.1:27017/pillsync
   JWT_ACCESS_SECRET=local_pillsync_jwt_access_secret_2026_secure
   JWT_REFRESH_SECRET=local_pillsync_jwt_refresh_secret_2026_secure

   # Optional Notification integrations (leave blank for durable in-app queuing)
   SMTP_HOST=
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=
   SMTP_PASSWORD=
   SMTP_FROM=PillSync <notifications@example.com>
   TWILIO_ACCOUNT_SID=
   TWILIO_AUTH_TOKEN=
   TWILIO_FROM_NUMBER=
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   The API will start and log:
   ```
   [server] PillSync API running on port 4000
   [db] Connected to MongoDB at mongodb://127.0.0.1:27017/pillsync
   [reminderEngine] Smart reminder engine initialized
   ```

---

### 2. Frontend Setup

1. Open a second terminal and navigate to `client`:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

### 3. Optional AI OCR Microservice

If you wish to test local prescription image scanning using Ollama:

1. Install [Ollama](https://ollama.ai/) and pull the local vision and language models:
   ```bash
   ollama pull moondream
   ollama pull qwen2:1.5b
   ```
2. In a third terminal:
   ```bash
   cd ocr-service
   python -m venv .venv
   
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate

   pip install -r requirements.txt
   uvicorn main:app --host 127.0.0.1 --port 8001
   ```

---

## 🧪 Testing & Verification

PillSync includes extensive automated unit, validation, integration, and build tests:

### Run Backend Jest Test Suite
In the `server` directory:
```bash
npm test
```
**Test Results**:
- `tests/smartReminderEngine.test.js`: Scheduled cron generation, pending transitions, intake status, and missed-dose alerts.
- `tests/patient_caregiver_flow.test.js`: End-to-end patient registration, link code generation, caregiver pairing, medication logging, and data retrieval.
- `tests/auth.test.js`: JWT issuance, refresh rotation, role protection, and password hashing.
- `tests/zod.test.js`: Request payload validation against injection and invalid schemas.
- `tests/time.test.js`: Timezone calculations, schedule window matching, and date comparisons.
- `tests/doubleTap.test.js`: Prevention of duplicate dosage entries.

> **Status**: 6 passed, 6 total suites, 34 passed tests.

### Run Frontend Vitest Suite
In the `client` directory:
```bash
npm test
```
> **Status**: All frontend component and utility tests passing.

### Run Production Build Verification
In the `client` directory:
```bash
npm run build
```
> **Status**: Production build succeeds and outputs optimized static bundle to `client/dist`.

---

## 🔍 Step-by-Step Walkthrough for Evaluation

Reviewers can verify the complete system functionality using the following workflow:

### Step 1: Create a Patient Account
1. Visit `http://localhost:5173`.
2. Click **Sign Up** &rarr; select **Patient** role.
3. Fill in name, email (e.g. `patient@test.com`), phone number, and password.
4. Upon entering the Patient Dashboard, observe the **Link Code** badge at the top (e.g., `PS-XXXXXX`). Click **Copy Code**.

### Step 2: Add Medications
1. In the Patient Dashboard, click **+ Add Medicine**.
2. Enter:
   - **Name**: `Metformin`
   - **Dosage**: `500 mg`
   - **Frequency**: `Twice daily`
   - **Times**: Select morning and evening times (e.g., `08:00`, `20:00`)
   - **Current Stock**: `30`
   - **Refill Alert Threshold**: `5`
3. Click **Save Medicine**.
4. The medicine appears in your daily intake list and schedule view.

### Step 3: Record Medication Intake
1. On the intake card, click **Mark Taken**.
2. Notice the instant status transition and double-tap safeguard prevention.
3. Check the **Adherence** page: the adherence rate and charts update immediately.
4. Check the **Refill** page: remaining inventory decrements accurately.

### Step 4: Create a Caregiver Account & Link Patient
1. Open an Incognito / Private browsing window (or separate browser) and navigate to `http://localhost:5173`.
2. Click **Sign Up** &rarr; select **Caregiver** role.
3. Register (e.g. `caregiver@test.com`).
4. On the Caregiver Dashboard, enter the patient's **Link Code** (`PS-XXXXXX`) in the **Link a Patient** panel and click **Link Patient**.
5. The patient's real-time schedule, adherence score, and active medications instantly appear on the Caregiver's monitoring view.

### Step 5: Real-Time Alerts & Socket Synchronization
1. When medication status updates or a dose is overdue, real-time alerts appear in the Caregiver's **Alerts** center.
2. In-app notifications persist reliably in MongoDB, accessible across sessions.

---

## 📋 Environment Variables Reference

### Backend (`server/.env`)
| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | API server listen port | `4000` |
| `CLIENT_ORIGIN` | Allowed CORS frontend origin | `http://localhost:5173` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/pillsync` |
| `JWT_ACCESS_SECRET` | Secret key for signing access tokens | `your_access_secret_key` |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens | `your_refresh_secret_key` |
| `SMTP_HOST` | *(Optional)* SMTP mail server host | `smtp.gmail.com` |
| `SMTP_PORT` | *(Optional)* SMTP mail server port | `587` |
| `SMTP_USER` | *(Optional)* SMTP sender email address | `you@gmail.com` |
| `SMTP_PASSWORD` | *(Optional)* App-specific password | `xxxx xxxx xxxx xxxx` |
| `TWILIO_ACCOUNT_SID`| *(Optional)* Twilio Account SID | `ACxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | *(Optional)* Twilio Auth Token | `your_auth_token` |
| `TWILIO_FROM_NUMBER`| *(Optional)* Twilio registered SMS number| `+1234567890` |
| `OCR_SERVICE_URL` | Microservice URL for OCR prescription scan| `http://127.0.0.1:8001` |

---

## 📂 Project Directory Structure

```
PillSync/
├── client/                     # React 18 + Vite Frontend
│   ├── src/
│   │   ├── components/         # Patient & Caregiver UI components
│   │   ├── layouts/            # Role-based shell layouts
│   │   ├── pages/
│   │   │   ├── patient/        # Adherence, Medicines, Refill, Scan pages
│   │   │   └── caregiver/      # Caregiver monitoring, Alerts, Detail pages
│   │   ├── AppInteractive.jsx  # Main application routing & session management
│   │   └── appRouter.jsx       # Route definitions & guards
│   ├── package.json
│   └── vite.config.js
├── server/                     # Express.js REST API Backend
│   ├── src/
│   │   ├── config/             # Environment & DB configurations
│   │   ├── controllers/        # Business logic controllers
│   │   ├── jobs/               # Smart Reminder cron engine
│   │   ├── middleware/         # Auth, Role guards, Zod validators
│   │   ├── models/             # Mongoose Schemas (User, Medicine, ReminderLog, Notification)
│   │   ├── routes/             # Express API routes (/patient, /caregiver, /reminders, /auth)
│   │   ├── services/           # Email, SMS, Socket notification dispatchers
│   │   ├── app.js              # Express app initialization & middleware
│   │   └── server.js           # Server entry point & socket listener
│   ├── tests/                  # Automated test suites (Jest)
│   ├── package.json
│   └── .env.example
├── ocr-service/                # Python FastAPI OCR Microservice
│   ├── main.py                 # FastAPI endpoints & Ollama prompt chains
│   └── requirements.txt
├── .gitignore
└── README.md                   # Project Documentation & Setup Guide
```

---

## 👥 Team & Acknowledgments
- **Project**: Intelligent Medicine Reminder and Medication Tracking Platform
- **Team**: Team 2
- **Internship**: Infosys Springboard Internship
- **Mentor**: Anusha
