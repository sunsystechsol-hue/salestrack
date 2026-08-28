# KaushalSaathi — Local Setup Guide

This guide provides step-by-step instructions for configuring and running the **KaushalSaathi Task, Lead & Sales Performance Tracker** in a local development environment.

---

## 1. Prerequisites

Ensure the following tools are installed on your workstation before starting:

| Tool | Minimum Version | Recommended | Notes |
|---|---|---|---|
| **Node.js** | v18.0.0+ | v20.x or v22.x LTS | JavaScript runtime |
| **npm** | v9.0.0+ | v10.x | Package manager |
| **PostgreSQL** | v14.0+ | v16.x | Relational database engine |
| **Git** | v2.30+ | Latest | Version control |

---

## 2. Clone / Open the Project

Clone the repository or navigate to your local working workspace directory:

```bash
git clone <repository-url>
cd salestrack
```

Project Directory Layout:
```text
salestrack/
├── backend/          # Express 5 REST API & Prisma ORM
├── frontend/         # React 18 + Vite Web UI
├── docs/             # Technical specifications & guides
├── README.md         # Architecture & Project Overview
├── DEPLOYMENT.md     # Production NGINX & Backup Guide
├── SECURITY.md       # Security Controls & Policy
├── API.md            # REST API Reference
└── SETUP.md          # Local Setup Guide (This file)
```

---

## 3. Backend Setup

1. Change directory to `backend/`:
   ```bash
   cd backend
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Create the environment configuration file:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `backend/.env` (using placeholders):
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/kaushalsaathi_tracker?schema=public"
   JWT_SECRET="YOUR_JWT_SECRET_KEY_HERE"
   PORT=5000
   NODE_ENV="development"

   # Webhook Security Secret
   GOOGLE_FORM_WEBHOOK_SECRET="YOUR_WEBHOOK_SECRET_HERE"

   # Seed Account Configuration
   SEED_ADMIN_EMAIL="admin@kaushalsaathi.com"
   SEED_ADMIN_PASSWORD="YOUR_ADMIN_SEED_PASSWORD"
   SEED_MANAGER_EMAIL="manager@kaushalsaathi.com"
   SEED_MANAGER_PASSWORD="YOUR_MANAGER_SEED_PASSWORD"
   SEED_COUNSELLOR_EMAIL="counsellor@kaushalsaathi.com"
   SEED_COUNSELLOR_PASSWORD="YOUR_COUNSELLOR_SEED_PASSWORD"
   ```

---

## 4. Database Setup

1. **Verify PostgreSQL Service**:
   Ensure PostgreSQL is running locally on port `5432` and the database `kaushalsaathi_tracker` exists (or PostgreSQL superuser has rights to create it).

2. **Validate Prisma Schema**:
   ```bash
   npx prisma validate
   ```

3. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

4. **Apply Database Migrations**:
   Run development migrations to initialize the schema:
   ```bash
   npx prisma migrate dev
   ```

5. **Seed Test Accounts & Initial Data**:
   Populate the database with initial users and roles:
   ```bash
   npx prisma db seed
   ```

6. **Verify Migration Status**:
   ```bash
   npx prisma migrate status
   ```

> [!WARNING]
> **DO NOT** run `npx prisma migrate reset` in active development or production environments, as this will drop all existing tables and data!

---

## 5. Start Backend Service

Start the backend development server:

```bash
npm run dev
```

- **Backend Base URL**: `http://localhost:5000`
- **Health Check Endpoint**: `http://localhost:5000/api/health`

Test health status:
```bash
curl http://localhost:5000/api/health
# Expected response: {"status":"ok"}
```

---

## 6. Frontend Setup

1. Open a new terminal window and navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

- **Frontend App URL**: `http://localhost:3001` (or `http://localhost:5173`)

---

## 7. Login & User Roles

Access the application in your browser at `http://localhost:3001/` and log in with the configured seed user credentials:

| Role | Email | Access Scope |
|---|---|---|
| **ADMIN** | `admin@kaushalsaathi.com` | Full administrative control, all leads, tasks, team attendance, call activity logs, audit logs, and management dashboards. |
| **MANAGER** | `manager@kaushalsaathi.com` | Team management oversight, lead assignment/reassignment, task assignment, team attendance monitoring, and management reports. |
| **COUNSELLOR** | `counsellor@kaushalsaathi.com` | Personal dashboard, assigned leads, call logging, scheduled follow-ups, assigned tasks, and personal attendance tracking. |

---

## 8. Verify Application Functionality

Perform a quick sanity check across core workflows:

1. **Health Check**: Confirm `http://localhost:5000/api/health` returns `{"status":"ok"}`.
2. **Authentication**: Log in as `ADMIN`, `MANAGER`, and `COUNSELLOR`.
3. **Personal & Executive Dashboards**: Check KPI metrics load cleanly.
4. **Lead Management**: View lead directory, search, filter, and view details.
5. **Call Tracking & Follow-ups**: Log a call outcome and schedule a follow-up.
6. **Task Management**: Create, assign, and complete tasks.
7. **Live Attendance & Presence**: Check active session badge (`LIVE ACTIVE`) and working time duration.
8. **Management Reports & CSV Exports**: Verify BI charts and download CSV reports (Admin/Manager).

---

## 9. Run Automated Test Suites

The backend includes comprehensive test suites. From `backend/`:

```bash
# Run individual test suites
node test_phase2.js   # Lead management & Webhook ingestion
node test_phase3.js   # Attendance, Call tracking & Follow-ups
node test_phase4.js   # Tasks, Counsellor isolation & Metrics
node test_presence.js # Live Employee Presence & Re-login lifecycle
node test_phase5.js   # BI Reports, Aggregations & CSV Security
node test_phase6.js   # Phase 6 Hardening & Regression Suite (38 tests)

# Run full sequential regression suite
node test_phase2.js; node test_phase3.js; node test_phase4.js; node test_presence.js; node test_phase5.js; node test_phase6.js
```

---

## 10. Frontend Production Build

To verify the production bundle build from `frontend/`:

```bash
npm run build
```

This compiles static production assets into `frontend/dist/`.

---

## 11. Troubleshooting & Common Issues

- **Backend Port 5000 in Use**:
  Identify the process using port 5000:
  ```bash
  netstat -ano | findstr :5000
  ```
  Or change `PORT=5001` in `backend/.env`.

- **Frontend Port Conflict**:
  Vite automatically detects port conflicts (e.g. port 3000 in use) and offers the next available port (e.g. `3001`).

- **PostgreSQL Connection Errors**:
  Verify PostgreSQL service is active and `DATABASE_URL` credentials match your local setup.

- **Authentication / JWT Errors**:
  Ensure `JWT_SECRET` is defined in `backend/.env`.

---

## 12. Git Safety & Security Policy

To prevent sensitive credentials and build artifacts from leaking:

- **Ignored Files**: Never commit `.env`, `node_modules/`, or `frontend/dist/`.
- **Verify Ignored Status**:
  ```bash
  git check-ignore backend/.env backend/node_modules frontend/node_modules frontend/dist
  ```
- **Check Working Status**:
  ```bash
  git status
  ```

---

## 13. Project Documentation Links

For further technical documentation, refer to:
- [README.md](README.md) — System Architecture & Feature Overview
- [API.md](API.md) — Complete REST API Reference
- [DEPLOYMENT.md](DEPLOYMENT.md) — Production Deployment & NGINX Configuration
- [SECURITY.md](SECURITY.md) — Security Architecture & RBAC Policy
- [PHASE6_REPORT.md](PHASE6_REPORT.md) — Verification & Audit Report

---

## 14. Setup Complete Checklist

- [x] Node.js and PostgreSQL installed and running locally
- [x] `backend/.env` configured from `.env.example`
- [x] Database migrated (`prisma migrate dev`) and seeded (`prisma db seed`)
- [x] Backend running on `http://localhost:5000` (`/api/health` OK)
- [x] Frontend running on `http://localhost:3001`
- [x] Logged in successfully as Admin, Manager, and Counsellor
- [x] All 6 automated backend test suites passed 100%
