# KaushalSaathi — Local Setup Guide

This guide provides step-by-step instructions for configuring, testing, and running the **KaushalSaathi Task, Lead & Sales Performance Tracker** in a local development environment.

---

## 1. Prerequisites

Ensure the following tools are installed on your workstation before starting:

| Tool | Minimum Version | Recommended | Notes |
|---|---|---|---|
| **Node.js** | v18.0.0+ | v20.x or v22.x LTS | JavaScript runtime |
| **npm** | v9.0.0+ | v10.x | Package manager |
| **PostgreSQL** | v14.0+ | v16.x | Relational database engine |
| **Git** | v2.30+ | Latest | Version control |
| **ngrok** | Latest | Latest | Tunneling tool for testing webhooks locally |

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
   GOOGLE_FORM_WEBHOOK_SECRET="<YOUR_WEBHOOK_SECRET>"

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

## 9. Google Form → SalesTrack Lead Integration

The Google Form integration automatically creates a new SalesTrack lead in the database whenever a student enquiry is submitted via a Google Form.

### Verified Architecture & Data Flow

```text
Google Form
→ Google Apps Script onFormSubmit Trigger
→ ngrok HTTPS Tunnel
→ SalesTrack Backend
→ Webhook Authentication & Validation
→ PostgreSQL
→ SalesTrack Lead Directory
```

### Required Form Fields & Field Mapping

| Google Form Field | SalesTrack Field | Required | Notes |
|---|---|---|---|
| **Name** | `name` | Yes | Prospect full name |
| **Phone** | `phone` | Yes | Contact phone number |
| **Email** | `email` | Optional | Email address |
| **Course** | `course` | Optional | Interested course/program |
| **City** | `city` | Optional | Prospect city location |

> [!TIP]
> Question titles extracted in Google Apps Script are normalized using `.trim()` to remove trailing whitespace (e.g., `"Name "`) and prevent field mapping errors.

### Backend Webhook Specification

- **Endpoint**: `POST /api/integrations/google-form`
- **Header**: `X-Webhook-Secret: <YOUR_WEBHOOK_SECRET>`
- **Content-Type**: `application/json`
- **Behavior**:
  - Accepts JSON payload containing form responses.
  - Validates request payload against Zod schema.
  - Prevents duplicate submissions using `formResponseId`.
  - Creates a new Lead in PostgreSQL with:
    - `source = "Google Form"`
    - `status = "NEW"`
    - `assignedToId = null` (Unassigned)

Safe environment variable configuration:
```env
GOOGLE_FORM_WEBHOOK_SECRET=<YOUR_WEBHOOK_SECRET>
```

### Local Development Setup with ngrok

1. Start the SalesTrack backend:
   ```bash
   cd D:\salestrack\backend
   node .\src\server.js
   ```
   *(Backend runs on `http://localhost:5000`)*

2. Start an ngrok tunnel on port 5000:
   ```bash
   ngrok http 5000
   ```

3. Construct the public webhook URL:
   ```text
   <NGROK_PUBLIC_URL>/api/integrations/google-form
   ```

**Important Guidelines**:
- Both the backend server and ngrok tunnel must remain running during testing.
- If the ngrok tunnel is restarted, update the webhook URL in Google Apps Script with the new public URL.

### Google Apps Script Configuration

Configure the Google Apps Script bound to your Google Form with an `onFormSubmit` trigger.

**Trigger Settings**:
- **Choose function to run**: `onFormSubmit`
- **Select event source**: `From form`
- **Select event type**: `On form submit`

**Safe Apps Script Code Example**:
```javascript
// Google Apps Script snippet for SalesTrack Webhook

const WEBHOOK_URL = "<NGROK_PUBLIC_URL>/api/integrations/google-form";
const WEBHOOK_SECRET = "<YOUR_WEBHOOK_SECRET>"; // Matches GOOGLE_FORM_WEBHOOK_SECRET in backend/.env

function onFormSubmit(e) {
  try {
    const response = e.response;
    const itemResponses = response.getItemResponses();
    
    const rawData = {};
    for (let i = 0; i < itemResponses.length; i++) {
      const itemResponse = itemResponses[i];
      // Normalize question title by trimming whitespace
      const question = itemResponse.getItem().getTitle().trim();
      const answer = itemResponse.getResponse();
      rawData[question] = answer;
    }

    const payload = {
      formResponseId: response.getId(),
      name: rawData["Name"] || "",
      phone: rawData["Phone"] || "",
      email: rawData["Email"] || "",
      course: rawData["Course"] || "",
      city: rawData["City"] || ""
    };

    if (!payload.email && response.getRespondentEmail()) {
      payload.email = response.getRespondentEmail();
    }

    const options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "X-Webhook-Secret": WEBHOOK_SECRET
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const res = UrlFetchApp.fetch(WEBHOOK_URL, options);
    Logger.log("Webhook Response Status: " + res.getResponseCode());
    Logger.log("Webhook Response Body: " + res.getContentText());
  } catch (err) {
    Logger.log("Webhook Error: " + err.toString());
  }
}
```

### End-to-End Testing Procedure

1. Start the SalesTrack backend (`http://localhost:5000`).
2. Start ngrok on port 5000 (`ngrok http 5000`).
3. Copy the generated public HTTPS ngrok URL.
4. Update `WEBHOOK_URL` in Google Apps Script.
5. Set `WEBHOOK_SECRET` matching `GOOGLE_FORM_WEBHOOK_SECRET` in `backend/.env`.
6. Confirm the `onFormSubmit` trigger is saved.
7. Submit a test response via the Google Form.
8. Open Apps Script → **Executions** and verify `onFormSubmit` completed cleanly.
9. Inspect backend/ngrok terminal logs for the incoming request.
10. Confirm backend responds with `HTTP 201 Created` (`"Lead created successfully"`).
11. Open SalesTrack CRM Lead Directory UI (`http://localhost:3001/leads`).
12. Verify the new lead appears with `Source = Google Form` and `Status = NEW`.

### Verified Test Results

The integration was verified end-to-end in local testing:

| Test Stage | Result |
|---|---|
| Google Form submission | PASS |
| Apps Script trigger | PASS |
| Form data extraction | PASS |
| Field title normalization (`.trim()`) | PASS |
| Webhook secret authentication | PASS |
| Backend payload validation | PASS |
| Lead creation | PASS |
| Database persistence | PASS |
| Lead Directory UI display | PASS |
| Source = `Google Form` | PASS |
| Status = `NEW` | PASS |

The API response returned `HTTP 201 Created` with `"Lead created successfully"`.

### Integration Troubleshooting

| Problem | Possible Cause | Solution |
|---|---|---|
| **401 Unauthorized** | Webhook secret mismatch | Verify `X-Webhook-Secret` matches `GOOGLE_FORM_WEBHOOK_SECRET` |
| **400 name/phone empty** | Form question title contains trailing whitespace | Use `.trim()` on `getTitle()` in Apps Script |
| **No Apps Script execution** | Trigger missing or inactive | Check Apps Script → Triggers → `onFormSubmit` |
| **ngrok request not received** | Backend or ngrok stopped | Ensure both backend server and ngrok tunnel are running |
| **404 Webhook Not Found** | Incorrect endpoint path or HTTP method | Verify endpoint is `POST /api/integrations/google-form` |
| **Old ngrok URL error** | ngrok tunnel restarted | Update `WEBHOOK_URL` in Apps Script with new ngrok domain |
| **Lead not visible in UI** | Page not refreshed | Refresh Lead Directory page or verify backend response |

### Production Note

> The Google Form integration has been verified end-to-end in the local development environment using ngrok. Production use requires a stable public backend URL and appropriate production infrastructure.

---

## 10. Run Automated Test Suites

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

## 11. Frontend Production Build

To verify the production bundle build from `frontend/`:

```bash
npm run build
```

This compiles static production assets into `frontend/dist/`.

---

## 12. Troubleshooting & Common Issues

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

## 13. Git Safety & Security Policy

To prevent sensitive credentials and build artifacts from leaking:

- **Ignored Files**: Never commit `.env`, `node_modules/`, or `frontend/dist/`.
- **Secret Protection**: Never put real passwords, JWT keys, database connection strings, or webhook secrets in code or documentation.
- **Verify Ignored Status**:
  ```bash
  git check-ignore backend/.env backend/node_modules frontend/node_modules frontend/dist
  ```
- **Check Working Status**:
  ```bash
  git status
  ```

---

## 14. Project Documentation Links

For further technical documentation, refer to:
- [README.md](README.md) — System Architecture & Feature Overview
- [API.md](API.md) — Complete REST API Reference
- [DEPLOYMENT.md](DEPLOYMENT.md) — Production Deployment & NGINX Configuration
- [SECURITY.md](SECURITY.md) — Security Architecture & RBAC Policy
- [PHASE6_REPORT.md](PHASE6_REPORT.md) — Verification & Audit Report
- [google-form-integration.md](docs/google-form-integration.md) — Detailed Google Form Integration Guide

---

## 15. Setup Complete Checklist

- [x] Node.js and PostgreSQL installed and running locally
- [x] `backend/.env` configured from `.env.example`
- [x] Database migrated (`prisma migrate dev`) and seeded (`prisma db seed`)
- [x] Backend running on `http://localhost:5000` (`/api/health` OK)
- [x] Frontend running on `http://localhost:3001`
- [x] Logged in successfully as Admin, Manager, and Counsellor
- [x] All 6 automated backend test suites passed 100%
- [x] Google Form webhook integration verified via ngrok
