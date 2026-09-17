# 💊 PillSync — Medication Reminder & Notification System

A full-stack medication tracking application with a **React + Vite** frontend and a **FastAPI + SQLite** backend.

---

## 📋 Prerequisites

Make sure the following are installed on your system before proceeding:

| Tool       | Minimum Version | Check Command         |
| ---------- | --------------- | --------------------- |
| **Node.js** | v18+           | `node --version`      |
| **npm**     | v9+            | `npm --version`       |
| **Python**  | 3.10+          | `python --version`    |
| **pip**     | 22+            | `pip --version`       |

> **Windows users**: Use PowerShell or Command Prompt. If `python` is not recognized, try `py` instead.

---

## 🚀 Quick Start (Two Terminals)

### Terminal 1 — Backend (FastAPI)

```bash
# 1. Navigate to the backend folder
cd backend

# 2. (Recommended) Create a virtual environment
python -m venv venv

# 3. Activate the virtual environment
#    Windows (PowerShell):
.\venv\Scripts\Activate.ps1
#    Windows (CMD):
.\venv\Scripts\activate.bat
#    macOS / Linux:
source venv/bin/activate

# 4. Install Python dependencies
pip install -r requirements.txt

# 5. Start the FastAPI server
uvicorn main:app --reload --port 8000
```

The API will be available at **http://localhost:8000**  
Interactive API docs at **http://localhost:8000/docs**

---

### Terminal 2 — Frontend (React + Vite)

```bash
# 1. Navigate to the frontend folder
cd frontend

# 2. Install all Node.js dependencies
npm install

# 3. Start the Vite development server
npm run dev
```

The app will be available at **http://localhost:5173**

---

## 📦 Dependency Breakdown

### Backend (`backend/requirements.txt`)

| Package              | Purpose                                      |
| -------------------- | -------------------------------------------- |
| `fastapi`            | Web framework for building REST APIs         |
| `uvicorn[standard]`  | ASGI server to run the FastAPI app           |
| `sqlalchemy`         | ORM for SQLite database interactions         |
| `pydantic`           | Data validation and serialization            |
| `httptools`          | Fast HTTP parsing (uvicorn performance)      |
| `python-dotenv`      | Environment variable loading from `.env`     |
| `websockets`         | WebSocket support for uvicorn                |

### Frontend (`frontend/package.json`)

| Package              | Purpose                                      |
| -------------------- | -------------------------------------------- |
| `react`              | UI component library                         |
| `react-dom`          | React DOM rendering                          |
| `react-router-dom`   | Client-side routing / navigation             |
| `lucide-react`       | Icon library (Pill, Bell, Home, etc.)        |
| `recharts`           | Charting library for dashboard graphs        |
| `tailwindcss`        | Utility-first CSS framework                  |
| `@tailwindcss/vite`  | Tailwind CSS plugin for Vite                 |
| `@vitejs/plugin-react` | React Fast Refresh for Vite               |
| `vite`               | Next-gen frontend build tool                 |

---

## 📁 Project Structure

```
PillSync-INFY-PROJ/
├── backend/
│   ├── main.py              # FastAPI app entry point + seed data
│   ├── database.py          # SQLAlchemy engine & session setup
│   ├── models.py            # ORM models (Reminder, Notification)
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── requirements.txt     # Python dependencies
│   ├── pillsync.db          # SQLite database (auto-created)
│   └── routes/
│       ├── __init__.py
│       ├── reminders.py     # /api/reminders CRUD endpoints
│       └── notifications.py # /api/notifications endpoints
│
├── frontend/
│   ├── package.json         # Node.js dependencies & scripts
│   ├── vite.config.js       # Vite + React + Tailwind config
│   ├── index.html           # HTML entry point
│   └── src/
│       ├── main.jsx         # React entry point
│       ├── App.jsx          # Router + Login + Auth wrapper
│       ├── api.js           # API client (fetch wrapper)
│       ├── constants.js     # Colors, slots, seed data
│       ├── App.css          # Global styles
│       ├── index.css        # Base styles
│       ├── components/
│       │   ├── Header.jsx       # App header with role switch
│       │   └── BottomNav.jsx    # Bottom navigation bar
│       └── pages/
│           ├── DashboardPage.jsx      # Home / Dashboard
│           ├── RemindersPage.jsx      # Medication reminders
│           ├── NotificationsPage.jsx  # Notification history
│           └── ProfilePage.jsx        # User profile
│
└── README.md                # ← You are here
```

---

## 🔌 API Endpoints

### Reminders

| Method   | Endpoint                        | Description                |
| -------- | ------------------------------- | -------------------------- |
| `GET`    | `/api/reminders/`              | List all reminders         |
| `POST`   | `/api/reminders/`              | Create a new reminder      |
| `PUT`    | `/api/reminders/{id}`          | Update a reminder          |
| `PATCH`  | `/api/reminders/{id}/taken`    | Mark as taken              |
| `PATCH`  | `/api/reminders/{id}/missed`   | Mark as missed             |
| `PATCH`  | `/api/reminders/{id}/snooze`   | Snooze a reminder          |
| `DELETE` | `/api/reminders/{id}`          | Delete a reminder          |

### Notifications

| Method   | Endpoint                        | Description                |
| -------- | ------------------------------- | -------------------------- |
| `GET`    | `/api/notifications/`          | List notifications         |
| `GET`    | `/api/notifications/summary`   | Get summary counts         |
| `DELETE` | `/api/notifications/{id}`      | Delete a notification      |
| `DELETE` | `/api/notifications/`          | Clear all notifications    |

---

## 🛠️ Common Issues & Fixes

### "python is not recognized"
Use `py` instead of `python`, or add Python to your system PATH.

### "npm: command not found"
Install Node.js from https://nodejs.org (LTS version recommended).

### Backend port 8000 already in use
```bash
uvicorn main:app --reload --port 8001
```
Then update `BASE_URL` in `frontend/src/api.js` to `http://localhost:8001`.

### Frontend works without backend
The frontend has built-in fallback data, so the UI will display demo notifications and reminders even if the backend is not running. Start the backend for full CRUD functionality.

---

## 📝 npm Scripts (Frontend)

| Command           | Description                        |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Start Vite dev server (port 5173)  |
| `npm run build`   | Production build to `dist/`        |
| `npm run preview` | Preview the production build       |
| `npm run lint`    | Run oxlint for code quality        |
