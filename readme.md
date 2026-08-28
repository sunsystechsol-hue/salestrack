# KaushalSaathi Task, Lead & Sales Performance Tracker

> **Internal IT Project — KaushalSaathi.com**

A web-based internal application for managing **employee attendance, enquiry leads, calls, follow-ups, tasks, conversions, and sales performance**.

The primary purpose of this system is to connect employee activity with **lead handling and actual business outcomes**, allowing management to evaluate both daily activity and business contribution.

---

## 📌 Project Overview

The KaushalSaathi Task, Lead & Sales Performance Tracker centralizes the workflow from enquiry generation to conversion.

### Core Workflow

```text
Google Form
    ↓
Google Sheet / Apps Script
    ↓
Secure Node.js Webhook
    ↓
PostgreSQL Lead Database
    ↓
Manager Lead Assignment
    ↓
Counsellor Login
    ↓
Lead Handling
    ↓
Calls
    ↓
Call Outcome
    ↓
Follow-up
    ↓
Conversion
    ↓
Performance Dashboard
```

The application provides different functionality based on the user's role:

* **Admin**
* **Manager**
* **Counsellor**

---

# 🎯 Project Objectives

The system is designed to allow counsellors to:

* Log in and log out
* Automatically record attendance
* View assigned enquiry leads
* Search and filter leads
* Record calls
* Record call outcomes
* Add call remarks
* Schedule follow-ups
* Complete assigned tasks
* View daily performance

Managers can:

* View their team
* Assign leads
* Reassign leads
* Assign tasks
* Monitor attendance
* Monitor calls
* Monitor follow-ups
* Monitor conversions
* Compare counsellor performance
* Generate reports

Admins have full access to the system.

The system should ultimately connect:

```text
Employee Activity
       +
Lead Handling
       +
Calls
       +
Follow-ups
       +
Conversions
       ↓
Business Performance
```

---

# 👥 User Roles & Permissions

## ADMIN

The Admin has full access to the application.

### Access

* Employee management
* Leads
* Lead assignments
* Lead reassignments
* Reports
* Targets
* Settings
* Attendance
* Performance

---

## MANAGER

The Manager is responsible for team-level operations and monitoring.

### Access

* View team members
* Assign leads
* Reassign leads
* Assign tasks
* Monitor attendance
* Monitor calls
* Monitor follow-ups
* Monitor conversions
* View reports
* Monitor team performance

---

## COUNSELLOR

The Counsellor handles assigned leads and day-to-day lead activity.

### Access

* Own attendance
* Assigned leads
* Call records
* Follow-ups
* Assigned tasks
* Daily performance

---

# 🔐 Authentication & Attendance

Every employee receives a unique account.

The server automatically records:

* Login time
* Logout time
* Working duration

Employees must **not be able to manually modify actual login/logout timestamps**.

Managers and Admins can view attendance records.

### Attendance Information

```text
Employee Name
Login Time
Logout Time
Total Working Duration
Work Date
```

The application should use:

```text
Asia/Kolkata
```

as the configured timezone.

---

# 👤 Lead Management

Lead management is one of the core modules of the application.

Each lead should contain:

| Field                   | Description                              |
| ----------------------- | ---------------------------------------- |
| Lead Name               | Name of the enquiry                      |
| Mobile Number           | Lead contact number                      |
| Email                   | Lead email                               |
| Course / Program        | Course the lead is interested in         |
| City                    | Lead city                                |
| Lead Source             | Source of the lead                       |
| Google Form Response ID | Unique Google Form submission identifier |
| Assigned Counsellor     | Employee handling the lead               |
| Lead Status             | Current lead stage                       |
| Next Follow-up          | Scheduled follow-up date                 |
| Notes                   | Additional information                   |
| Created Date            | Lead creation timestamp                  |

---

# 📊 Lead Statuses

The application should support the following lead statuses:

```text
NEW
ASSIGNED
CONTACTED
INTERESTED
NOT INTERESTED
FOLLOW-UP
INQUIRY
CONVERTED
LOST
```

These statuses represent the lead's progression through the counselling process.

---

# 📞 Call Tracking

After every call, the counsellor should record:

* Lead
* Call date/time
* Call duration
* Call outcome
* Remarks
* Next follow-up date

### Recommended Call Outcomes

```text
Interested
Not Interested
Follow-up Required
Inquiry / More Information Required
Call Back
No Response
Wrong Number
Converted
Other
```

Call records allow management to understand employee activity and its relationship to lead outcomes.

---

# 📅 Follow-up Management

The system should track lead follow-ups.

Follow-ups should support:

* Pending follow-ups
* Completed follow-ups
* Overdue follow-ups
* Next follow-up dates

The follow-up process should allow counsellors to continue working with a lead until the lead reaches an appropriate final state such as:

```text
CONVERTED
LOST
NOT INTERESTED
```

---

# 📝 Task Management

Managers can create and assign tasks to employees.

Tasks may optionally be linked to a specific lead.

### Task Fields

```text
Title
Description
Assigned Employee
Lead
Due Date
Status
Completed Date
Created Date
Updated Date
```

### Task Statuses

```text
Pending
In Progress
Completed
Cancelled
```

Employees can update the status of tasks assigned to them.

Managers can monitor pending and overdue tasks.

---

# 📈 Counsellor Dashboard

Each counsellor should have a personal daily performance dashboard.

### Dashboard Metrics

| Metric         | Description              |
| -------------- | ------------------------ |
| Leads Assigned | Number of assigned leads |
| Calls Made     | Number of calls          |
| Interested     | Interested lead count    |
| Follow-ups     | Follow-up count          |
| Inquiries      | Inquiry count            |
| Not Interested | Not-interested count     |
| No Response    | No-response count        |
| Converted      | Converted lead count     |
| Login Time     | Login timestamp          |
| Logout Time    | Logout timestamp         |
| Working Time   | Total working duration   |

Example:

```text
Today's Performance

Leads Assigned     50
Calls Made         42
Interested          8
Follow-ups         12
Inquiries           5
Not Interested      7
No Response         6
Converted           2

Login Time       09:30
Logout Time      18:00
Working Time     08h 20m
```

---

# 👨‍💼 Manager Dashboard

The Manager Dashboard should allow management to compare counsellors on a single screen.

Example:

| Counsellor | Login |  Hours | Leads | Calls | Interested | Follow-up | Converted |
| ---------- | ----: | -----: | ----: | ----: | ---------: | --------: | --------: |
| Employee 1 | 09:30 | 8h 20m |    50 |    42 |          8 |        12 |         2 |
| Employee 2 | 09:42 | 7h 55m |    45 |    37 |          6 |        10 |         1 |
| Employee 3 | 09:28 | 8h 45m |    60 |    51 |         14 |        15 |         4 |

This dashboard should help management understand:

* Employee activity
* Attendance
* Lead workload
* Call activity
* Follow-up workload
* Interest levels
* Conversions
* Relative counsellor performance

---

# 📥 Google Form Integration

New enquiry submissions should automatically enter the lead database.

### Recommended Architecture

```text
Google Form
     ↓
Google Sheet
     ↓
Google Apps Script
     ↓
Secure Node.js Webhook
     ↓
PostgreSQL
     ↓
Lead Dashboard
```

### Integration Requirements

The integration should:

1. Receive Google Form submissions.
2. Validate required fields such as name and phone.
3. Store the lead in PostgreSQL.
4. Prevent duplicate imports.
5. Store the source as `Google Form`.
6. Allow managers to assign imported leads.
7. Secure the webhook using a secret token.

### Duplicate Prevention

Each Google Form submission should have a unique:

```text
formResponseId
```

This identifier should be used to reduce duplicate lead imports.

---

# 🗄️ Database Design

The recommended database is **PostgreSQL**, with **Prisma** as the ORM.

## Users

```text
Users
```

Fields:

```text
id
name
email
phone
passwordHash
role
isActive
createdAt
updatedAt
```

---

## Attendance

```text
Attendance
```

Fields:

```text
userId
workDate
loginAt
logoutAt
totalMins
notes
```

---

## Leads

```text
Leads
```

Fields:

```text
name
phone
email
source
course
city
formResponseId
status
assignedToId
nextFollowUp
notes
```

---

## CallLogs

```text
CallLogs
```

Fields:

```text
leadId
userId
calledAt
durationSec
outcome
remarks
nextFollowUp
```

---

## Tasks

```text
Tasks
```

Fields:

```text
title
description
status
dueAt
completedAt
userId
leadId
createdAt
updatedAt
```

The database design above follows the tables and key fields specified in the project requirements.

---

# 🛠️ Technology Stack

The project specification recommends:

| Layer          | Technology                             |
| -------------- | -------------------------------------- |
| Frontend       | React.js                               |
| Build Tool     | Vite                                   |
| Backend        | Node.js + Express.js                   |
| Database       | PostgreSQL                             |
| ORM            | Prisma                                 |
| UI             | Tailwind CSS or equivalent             |
| Charts         | Recharts or equivalent                 |
| Authentication | JWT or Company SSO                     |
| Validation     | Zod                                    |
| Security       | Helmet, Rate Limiting, HTTPS           |
| Integration    | Google Apps Script / Google Sheets API |
| Deployment     | VPS / AWS / Render / Railway           |

These technologies are based on the recommended technology stack in the company specification.

---

# 🖥️ Application Screens

The planned application screens are:

### Authentication

1. Login

### Dashboards

2. Admin Dashboard
3. Manager Dashboard
4. Counsellor Dashboard

### Attendance

5. Employee Attendance

### Leads

6. Lead List
7. Lead Details
8. Assign / Reassign Leads

### Calls & Follow-ups

9. Call Update
10. Follow-up Calendar

### Tasks

11. My Tasks
12. Team Tasks

### Performance

13. Employee Performance
14. Reports

### Administration

15. Employee Management

The screen list follows the project specification.

---

# 📊 Management Reports

The system should provide management reports covering:

### Call Activity

* Daily total calls by employee

### Attendance

* Daily login/logout
* Working hours

### Lead Assignment

* Leads assigned per employee

### Lead Interest

* Interested vs. not interested

### Follow-ups

* Pending follow-ups
* Overdue follow-ups

### Inquiries

* Inquiry count

### Conversions

* Conversion count
* Lead-to-conversion ratio

### Performance

* Counsellor-wise performance ranking
* Daily activity
* Weekly activity
* Monthly activity

---

# 💰 Future Revenue & Target Reporting

Revenue and target-vs-actual reporting are identified as recommended future functionality.

The long-term direction is to combine:

```text
Attendance
    +
Calls
    +
Follow-ups
    +
Conversions
    +
Revenue
```

This will allow management to evaluate both **employee activity** and **actual business contribution**.

---

# 🔒 Security Requirements

Security must be implemented at the backend/API level and not only in the frontend.

## Role-Based Authorization

Every protected API must verify the user's role and permissions.

Example roles:

```text
ADMIN
MANAGER
COUNSELLOR
```

---

## Password Security

Passwords must never be stored as plain text.

The database should store a secure password hash:

```text
Password
   ↓
Hash
   ↓
passwordHash
   ↓
Database
```

---

## HTTPS

Production deployment should use HTTPS.

---

## Authentication Security

The authentication system should use a secure JWT/session strategy with appropriate expiration.

---

## Rate Limiting

Authentication endpoints should have rate limiting to reduce brute-force attacks.

---

## Audit Logs

Important administrative actions should be recorded.

Examples include:

* Lead assignment
* Lead reassignment
* Important administrative changes

---

## Database Backups

A database backup and recovery process should be maintained for production.

---

## Pagination, Search & Filters

The application should support:

* Pagination
* Search
* Filters

This is particularly important when the number of leads becomes large.

---

## Duplicate Lead Detection

The application should detect duplicate leads.

Google Form response IDs should also be used to prevent duplicate imports.

---

## Timezone

The application should use:

```text
Asia/Kolkata
```

---

## Privacy & Data Retention

The application should address:

* Data retention
* Privacy
* Appropriate handling of employee data
* Appropriate handling of lead/customer information

If call recording is added in the future, it should only be implemented after legal/privacy review and appropriate consent handling.

---

# 📁 Suggested Repository Structure

The exact repository structure can evolve during development. A suggested organization is:

```text
kaushalsaathi-tracker/
│
├── README.md
├── .gitignore
├── .env.example
│
├── frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── index.html
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── layouts/
│       ├── hooks/
│       ├── services/
│       ├── utils/
│       └── App.jsx
│
├── backend/
│   ├── package.json
│   ├── package-lock.json
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── validators/
│   │   └── utils/
│   │
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
│
├── google-integration/
│   └── README.md
│
└── docs/
    ├── API.md
    ├── DATABASE.md
    ├── DEPLOYMENT.md
    └── USER-GUIDE.md
```

> This is a recommended implementation structure, not an exact structure mandated by the company specification.

---

# 🔑 Environment Configuration

Environment variables should be used for secrets and deployment-specific configuration.

Example:

```env
DATABASE_URL=
JWT_SECRET=
GOOGLE_WEBHOOK_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
PORT=5000
NODE_ENV=development
```

### ⚠️ Important

Never commit the real `.env` file.

Commit:

```text
.env.example
```

Do **not** commit:

```text
.env
```

The `.env.example` file should contain variable names without real company credentials.

---

# 🚀 Local Development

## Prerequisites

Install:

* Node.js
* npm
* PostgreSQL
* Git

---

## Clone Repository

```bash
git clone <company-repository-url>
cd kaushalsaathi-tracker
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## Backend Setup

In another terminal:

```bash
cd backend
npm install
```

Configure your environment variables:

```text
.env
```

Then configure Prisma and the PostgreSQL connection.

Example:

```bash
npx prisma generate
npx prisma migrate dev
```

Start the backend using the project's configured development script:

```bash
npm run dev
```

---

# 🧪 Testing

Testing should cover all major workflows.

## Authentication

* Login
* Invalid login
* Logout
* Expired authentication
* Unauthorized access

## Attendance

* Login timestamp
* Logout timestamp
* Working duration
* Attendance records

## Leads

* Create lead
* Search lead
* Filter lead
* Assign lead
* Reassign lead
* Update lead status
* Duplicate detection

## Calls

* Record call
* Call duration
* Call outcome
* Remarks
* Follow-up date

## Tasks

* Create task
* Assign task
* Update status
* Due date
* Overdue task handling

## Google Integration

* Valid webhook
* Invalid webhook secret
* Required field validation
* Duplicate response ID
* Successful lead import

## Authorization

Test each role independently:

```text
ADMIN
MANAGER
COUNSELLOR
```

Verify that each role can only access the functionality permitted to that role.

---

# 🏗️ Development Phases

The project is planned in six phases.

## Phase 1 — Foundation

```text
Database
Authentication
Roles
Core API
```

---

## Phase 2 — Lead Management

```text
Lead Management
Google Form Integration
```

---

## Phase 3 — Activity Tracking

```text
Attendance
Calls
Call Outcomes
Follow-ups
```

---

## Phase 4 — Tasks & Counsellor Dashboard

```text
Task Management
Counsellor Dashboard
```

---

## Phase 5 — Management Dashboards & Reports

```text
Manager Dashboard
Admin Dashboard
Reports
```

---

## Phase 6 — Production

```text
Testing
Security
Deployment
Documentation
```

The six-phase development plan follows the sequence defined in the project specification.

---

# 📦 Project Deliverables

The completed system should include:

* Complete React frontend
* Node.js/Express REST API
* PostgreSQL database
* Prisma migrations
* Google Form/Google Sheet integration
* Role-based authentication
* Admin Dashboard
* Manager Dashboard
* Counsellor Dashboard
* Lead assignment
* Lead reassignment
* Call tracking
* Task management
* Follow-up management
* Reports
* Exports
* Production deployment
* Technical documentation
* Admin/user training

These deliverables are defined in the project specification.

---

# 🚫 Files & Data That Must Not Be Committed

The repository must not contain:

```text
.env
node_modules/
dist/
build/
```

or:

```text
Database passwords
JWT secrets
Google API secrets
Google service-account credentials
Private API keys
Production database dumps
Real lead/customer data
```

Use:

```text
.env.example
```

to document required environment variables.

---

# 📈 Key Business Metrics

The application should make important business metrics available to management.

### Activity

```text
Calls
Leads Assigned
Follow-ups
Inquiries
Working Hours
Tasks
```

### Lead Funnel

```text
NEW
   ↓
ASSIGNED
   ↓
CONTACTED
   ↓
INTERESTED / INQUIRY / FOLLOW-UP
   ↓
CONVERTED / LOST
```

### Conversion

```text
Conversion Count
Lead-to-Conversion Ratio
Counsellor Performance
```

### Attendance

```text
Login Time
Logout Time
Working Duration
```

---

# 🔮 Future Enhancements

The project specification identifies revenue and target-vs-actual reporting as recommended future functionality.

Potential future enhancements include:

* Revenue tracking
* Employee targets
* Target vs. actual reporting
* Advanced analytics
* Conversion funnel analysis
* Historical performance trends
* Advanced management dashboards

These should be treated as future enhancements unless they are explicitly included in the current development scope.

---

# 🎯 Product Direction

The most important product direction is that this application should **not be treated merely as an attendance or task tracker**.

The system should eventually connect:

```text
Employee Activity
        ↓
Lead Handling
        ↓
Calls
        ↓
Follow-ups
        ↓
Conversions
        ↓
Revenue
        ↓
Business Contribution
```

Management should therefore be able to evaluate both:

### Activity

> How much work was performed?

and:

### Outcome

> What business result came from that work?

This distinction is central to the product direction defined in the specification.

---

# 📚 Documentation

Additional documentation can be maintained under:

```text
docs/
├── API.md
├── DATABASE.md
├── DEPLOYMENT.md
└── USER-GUIDE.md
```

Recommended documentation includes:

* API documentation
* Database documentation
* Authentication flow
* Role permissions
* Google integration setup
* Deployment instructions
* Backup and recovery
* Admin guide
* User guide

---

# 👨‍💻 Development Tool

Development may be carried out using **Antigravity** as the development environment/AI coding assistant.

All generated or modified code should still follow the project's architecture, security requirements, role permissions, database design and business requirements defined in this specification.

---

# 📌 Project Information

**Project:** KaushalSaathi Task, Lead & Sales Performance Tracker

**Organization:** KaushalSaathi.com

**Application Type:** Internal Web Application

**Primary Users:**

```text
Admin
Manager
Counsellor
```

**Backend:**

```text
Node.js
Express.js
```

**Frontend:**

```text
React.js
Vite
```

**Database:**

```text
PostgreSQL
Prisma
```

**Integration:**

```text
Google Forms
Google Sheets
Google Apps Script
```

**Production Domain (Proposed):**

```text
tracker.kaushalsaathi.com
```

---

# 📄 Source

This README is based on the internal **KaushalSaathi.com Task, Lead & Sales Performance Tracker — Project Requirements & Technical Specification** provided for the development team.

The specification defines the project's modules, roles, workflows, database design, technology stack, application screens, reports, security requirements, deliverables and development phases.

---

## 🛡️ Phase 6 — Production Hardening & Verification

Phase 6 hardens, verifies, and documents the complete application for production deployment.

### 1. Automated & Manual Verification
- **Automated Regression Suite**: Full test coverage across Phase 2 (`test_phase2.js`), Phase 3 (`test_phase3.js`), Phase 4 (`test_phase4.js`), Live Presence (`test_presence.js`), Phase 5 (`test_phase5.js`), and Phase 6 (`test_phase6.js`).
- **Browser Role Verification**: End-to-end testing of `ADMIN`, `MANAGER`, and `COUNSELLOR` user roles, verifying route protection, sidebar navigation restrictions, and UI component behavior.
- **Frontend Production Build**: Verified using `npm run build` (Vite) with 0 errors.

### 2. Live Employee Presence & Re-Login Lifecycle
- **Same-Day Re-Login Behavior**: When an employee logs in multiple times on the same `Asia/Kolkata` business date, the system reopens the existing daily `Attendance` record (`logoutAt: null`, `loginAt: now`, `lastSeenAt: now`) while preserving accumulated historical `totalMins` and keeping `liveWorkingMins` accurate.
- **Heartbeat & Inactivity**: Client heartbeats sent every 45s maintain `LIVE ACTIVE` status; sessions automatically transition to `INACTIVE / IDLE` after 5 minutes of missing heartbeats without logging out.

### 3. Timezone & Data Protection
- **Timezone**: All business-date calculations, daily summaries, and date-range filters adhere strictly to `Asia/Kolkata` timezone semantics.
- **Authentication & RBAC**: HMAC SHA-256 JWT tokens with 24-hour expiration. Backend route middleware (`authorizeRoles`) enforces role boundaries (`COUNSELLOR` access to `/api/reports/management/*` is blocked with HTTP 403 Forbidden).
- **Server-Controlled Timestamps**: `loginAt`, `logoutAt`, `lastSeenAt`, `calledAt`, and `completedAt` are generated server-side (`new Date()`) to prevent client manipulation.
- **Security & Secret Audit**: Scanned codebase for credential leaks; verified `passwordHash`, `JWT_SECRET`, database connection strings, and webhook tokens are never exposed in API outputs or CSV exports. `.env`, `node_modules`, and `frontend/dist` are git-ignored.

### 4. Dependency Vulnerability Audit
- **Backend Audit**: Identified 3 high-severity vulnerabilities in transitive devDependency `deepmerge-ts` nested within `@prisma/config` CLI tooling. Determined as acceptable development-time risk pending an upstream Prisma patch (remediation via `npm audit fix --force` would force a breaking Prisma downgrade).
- **Frontend Audit**: 0 vulnerabilities.

### 5. Technical Documentation Links
- [API Reference](API.md) — Complete REST API reference.
- [Deployment & Backup Guide](DEPLOYMENT.md) — NGINX proxy setup, PM2 process management, PostgreSQL backup/recovery.
- [Security Architecture](SECURITY.md) — Security controls, JWT specifications, RBAC rules.
- [Phase 6 Audit & Verification Report](PHASE6_REPORT.md) — Full test execution log and production readiness assessment.

