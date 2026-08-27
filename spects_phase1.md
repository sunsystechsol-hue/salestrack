# KaushalSaathi Task, Lead & Sales Performance Tracker

## Development Specification — Phase 1

> **Repository:** `salestrack`
>
> **Current Phase:** Phase 1 — Database, Authentication, Roles & Core API
>
> **Source:** Internal KaushalSaathi.com Project Requirements & Technical Specification

---

# 1. IMPORTANT INSTRUCTION

The current repository root is the project root.

**Do NOT create another `kaushalsaathi-tracker/` or `salestrack/` directory inside the repository.**

All files and folders must be created directly inside the current repository.

Current repository:

```text
salestrack/
```

---

# 2. PROJECT OBJECTIVE

Build the initial production-ready foundation for the **KaushalSaathi Task, Lead & Sales Performance Tracker**.

The complete application will eventually manage:

* Employee authentication
* Employee attendance
* Lead management
* Lead assignment and reassignment
* Call tracking
* Call outcomes
* Follow-ups
* Task management
* Counsellor performance
* Manager performance monitoring
* Admin management
* Reports
* Google Form integration

The complete business workflow is:

```text
Google Form
    ↓
Google Sheet / Apps Script
    ↓
Secure Node.js Webhook
    ↓
PostgreSQL Lead Database
    ↓
Manager Assignment
    ↓
Counsellor Login
    ↓
Calls
    ↓
Call Outcomes
    ↓
Follow-ups
    ↓
Conversions
    ↓
Performance Dashboard
```

The current task is **only Phase 1**.

Do not implement the entire application at once.

---

# 3. CURRENT DEVELOPMENT PHASE

The company specification defines six development phases.

```text
Phase 1 → Database, authentication, roles and core API
Phase 2 → Lead management and Google Form integration
Phase 3 → Attendance, calls, outcomes and follow-ups
Phase 4 → Tasks and counsellor dashboard
Phase 5 → Manager/Admin dashboards and reports
Phase 6 → Testing, security, deployment and documentation
```

For this task, implement:

```text
PHASE 1 ONLY
```

Phase 1 must establish a clean foundation for later phases.

---

# 4. COMPANY-RECOMMENDED TECHNOLOGY STACK

Use the technology stack recommended in the company specification:

```text
Frontend       → React.js + Vite
Backend        → Node.js + Express.js
Database       → PostgreSQL
ORM            → Prisma
UI             → Tailwind CSS or equivalent
Validation     → Zod
Authentication → JWT or Company SSO
Security       → Helmet + Rate Limiting + HTTPS
Charts         → Recharts or equivalent
Integration    → Google Apps Script / Google Sheets API
```

For the current Phase 1 implementation:

```text
Frontend       → React + Vite
Backend        → Node.js + Express.js
Database       → PostgreSQL
ORM            → Prisma
Validation     → Zod
Authentication → JWT
Security       → Helmet + rate limiting
```

---

# 5. REPOSITORY STRUCTURE

Create the project directly in the current repository.

Recommended initial structure:

```text
salestrack/
│
├── README.md
├── specs.md
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
│       ├── services/
│       ├── hooks/
│       ├── contexts/
│       ├── utils/
│       ├── App.jsx
│       └── main.jsx
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
│   │   ├── utils/
│   │   └── server.js
│   │
│   └── prisma/
│       └── schema.prisma
│
└── docs/
```

This structure is an **implementation recommendation**, not an exact folder structure mandated by the company specification.

Do not create unnecessary files just to populate folders.

---

# 6. PHASE 1 DATABASE

Use:

```text
PostgreSQL
```

with:

```text
Prisma ORM
```

The initial database must establish the core entities required by the project.

Required core entities:

```text
User
Attendance
Lead
CallLog
Task
```

The complete relationships and business logic can be expanded during later phases.

---

# 7. USER MODEL

The `User` model must support the following fields:

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

### Roles

The system must support exactly these initial roles:

```text
ADMIN
MANAGER
COUNSELLOR
```

Use a Prisma enum for roles where appropriate.

Example conceptual structure:

```text
User
 ├── id
 ├── name
 ├── email
 ├── phone
 ├── passwordHash
 ├── role
 ├── isActive
 ├── createdAt
 └── updatedAt
```

---

# 8. ATTENDANCE MODEL

The company specification requires server-recorded employee attendance.

The initial model must support:

```text
userId
workDate
loginAt
logoutAt
totalMins
notes
```

Attendance must allow the system to calculate working duration.

Employees must not be allowed to manually modify their actual login/logout timestamps.

Managers and Admins will eventually be able to view attendance.

Detailed attendance functionality belongs to a later development phase, but the database structure should be prepared for it.

---

# 9. LEAD MODEL

The core lead entity must support the following company-required information:

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

Also include appropriate database timestamps such as:

```text
createdAt
updatedAt
```

where appropriate for implementation.

---

# 10. LEAD STATUSES

The application must support these lead statuses:

```text
NEW
ASSIGNED
CONTACTED
INTERESTED
NOT_INTERESTED
FOLLOW_UP
INQUIRY
CONVERTED
LOST
```

These statuses should be represented consistently across the backend and database.

---

# 11. CALL LOG MODEL

The company specification requires call records containing:

```text
leadId
userId
calledAt
durationSec
outcome
remarks
nextFollowUp
```

The initial database schema should support these fields.

Detailed call-tracking UI and business logic will be implemented in Phase 3.

---

# 12. CALL OUTCOMES

The system should support these recommended outcomes:

```text
INTERESTED
NOT_INTERESTED
FOLLOW_UP_REQUIRED
INQUIRY
CALL_BACK
NO_RESPONSE
WRONG_NUMBER
CONVERTED
OTHER
```

Keep the database representation consistent.

---

# 13. TASK MODEL

The company specification defines tasks with:

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

Task statuses:

```text
PENDING
IN_PROGRESS
COMPLETED
CANCELLED
```

Task functionality belongs primarily to Phase 4, but the initial database design should be capable of supporting it.

---

# 14. DATABASE RELATIONSHIPS

Establish appropriate relationships between the core entities.

Conceptually:

```text
User
 │
 ├──── Attendance
 │
 ├──── CallLog
 │
 └──── Task
          │
          └──── Lead

Lead
 │
 ├──── CallLog
 │
 └──── Task
```

A user can have:

* Multiple attendance records
* Multiple call logs
* Multiple assigned tasks
* Multiple assigned leads depending on role/business rules

A lead can have:

* An assigned counsellor
* Multiple call logs
* Multiple tasks

Use appropriate foreign keys and Prisma relations.

Do not invent unnecessary entities at this stage.

---

# 15. AUTHENTICATION

Implement the Phase 1 authentication foundation.

Required functionality:

```text
Login
Password hashing
JWT generation
Authentication middleware
Role-based authorization
Protected API routes
```

Passwords must **never** be stored in plain text.

The database should store:

```text
passwordHash
```

instead of the original password.

---

# 16. LOGIN FLOW

The basic authentication flow should be:

```text
User enters email/password
          ↓
Backend receives credentials
          ↓
Validate request
          ↓
Find active user
          ↓
Compare password with passwordHash
          ↓
Generate JWT
          ↓
Return authentication response
```

Invalid credentials must result in an appropriate error response.

Inactive users must not be allowed to authenticate.

---

# 17. JWT

Use JWT for the Phase 1 authentication implementation.

JWT configuration must come from an environment variable.

Do not hard-code secrets.

Required environment variable:

```text
JWT_SECRET
```

The implementation should use an appropriate token expiration strategy.

Do not expose the JWT secret to the frontend.

---

# 18. AUTHENTICATION MIDDLEWARE

Create middleware that:

1. Reads the authentication token.
2. Validates the token.
3. Identifies the authenticated user.
4. Rejects invalid/expired tokens.
5. Makes the authenticated user available to protected controllers/routes.

Conceptually:

```text
Request
   ↓
Authentication Middleware
   ↓
JWT Validation
   ↓
Authenticated User
   ↓
Controller
```

---

# 19. ROLE-BASED AUTHORIZATION

Create reusable role-based authorization middleware.

Roles:

```text
ADMIN
MANAGER
COUNSELLOR
```

The backend must enforce permissions.

Do **not** rely only on frontend route protection.

Example conceptual usage:

```text
requireRole("ADMIN")
requireRole("MANAGER", "ADMIN")
```

The exact implementation is up to the developer.

---

# 20. SECURITY

The company specification requires security controls.

For Phase 1, implement:

### Helmet

Use Helmet for Express security headers.

### Rate Limiting

Apply rate limiting, especially to authentication endpoints.

### Password Hashing

Never store plain-text passwords.

### Authentication Expiration

JWT tokens must have an appropriate expiration.

### Protected APIs

Protected routes must validate authentication and authorization.

---

# 21. HEALTH CHECK

Create a simple backend health endpoint:

```text
GET /api/health
```

Expected response:

```json
{
  "status": "ok"
}
```

This endpoint does not need authentication.

It will be useful for development and deployment health checks.

---

# 22. VALIDATION

Use:

```text
Zod
```

for request validation.

At minimum, validate:

### Login

```text
email
password
```

### User-related input

Validate required fields and appropriate formats.

### Other Phase 1 API input

Do not allow unexpected or malformed data to reach business logic.

Keep validation separate from controllers where practical.

---

# 23. ERROR HANDLING

Create centralized backend error handling.

The API should return consistent JSON error responses.

Example conceptual response:

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

Do not expose:

* Database passwords
* JWT secrets
* Stack traces
* Internal credentials
* Sensitive server configuration

in production API responses.

---

# 24. API STRUCTURE

The exact API naming is an implementation decision.

A recommended Phase 1 organization is:

```text
/api/auth
/api/users
/api/attendance
/api/leads
/api/calls
/api/tasks
```

Only implement the routes required for Phase 1.

Do not create fake endpoints for features that have not been implemented.

---

# 25. INITIAL AUTH API

Implement the minimum authentication API.

Recommended:

```text
POST /api/auth/login
```

Optional logout handling may be implemented according to the chosen JWT strategy.

Remember:

JWT itself is stateless. Do not claim that a token is invalidated server-side unless the implementation actually provides token revocation/blacklisting or uses another appropriate mechanism.

---

# 26. FRONTEND

Create a basic React + Vite frontend foundation.

Initial pages/routes should be prepared for:

```text
/login
/dashboard
/leads
/tasks
/attendance
/reports
```

However, only implement the functionality required for Phase 1.

At minimum:

```text
Login Page
Basic authenticated application shell
Basic protected routing
Role-aware navigation foundation
```

The frontend must not be considered the security boundary.

---

# 27. FRONTEND AUTHENTICATION

The frontend should:

* Provide a login form.
* Send credentials to the backend.
* Handle successful authentication.
* Handle failed authentication.
* Maintain authentication state.
* Protect authenticated pages.
* Handle expired/invalid authentication appropriately.

Do not expose:

```text
JWT_SECRET
DATABASE_URL
Google secrets
```

to the frontend.

---

# 28. DATABASE ENVIRONMENT

Use:

```text
DATABASE_URL
```

for PostgreSQL connection configuration.

Example `.env.example`:

```env
DATABASE_URL=
JWT_SECRET=
PORT=5000
NODE_ENV=development
```

Do not put real credentials in `.env.example`.

---

# 29. ENVIRONMENT FILE RULES

### Allowed in Git

```text
.env.example
```

### NEVER commit

```text
.env
.env.local
.env.production
```

Never commit:

```text
Database passwords
JWT secrets
Google API credentials
Private API keys
Production credentials
```

---

# 30. GITIGNORE

Create a root `.gitignore`.

It must ignore at minimum:

```text
node_modules/
.env
.env.*
!.env.example
dist/
build/
coverage/
*.log
```

Also ignore common operating-system and IDE temporary files where appropriate.

Do not ignore:

```text
README.md
specs.md
schema.prisma
Prisma migrations
package.json
package-lock.json
source code
```

---

# 31. PRISMA

Use Prisma for database access.

Create:

```text
backend/prisma/schema.prisma
```

The Prisma schema should contain the Phase 1 core models.

After configuring PostgreSQL, the developer should be able to run appropriate Prisma commands such as:

```bash
npx prisma generate
```

and:

```bash
npx prisma migrate dev
```

Do not commit generated secrets or local database credentials.

Prisma migrations should be committed to Git once created.

---

# 32. PACKAGE MANAGEMENT

Use npm unless the repository already has an established package manager.

Commit:

```text
package.json
package-lock.json
```

Do not commit:

```text
node_modules/
```

---

# 33. TIMEZONE

The company specification requires:

```text
Asia/Kolkata
```

The application must consistently account for this timezone when implementing business dates and attendance-related calculations.

Do not silently use another business timezone.

---

# 34. DO NOT IMPLEMENT YET

Do **NOT** implement the following as part of this Phase 1 task unless required as a minimal foundation:

```text
Google Form integration
Google Sheets integration
Google Apps Script webhook
Advanced lead management UI
Lead assignment UI
Call tracking UI
Follow-up calendar
Task dashboard
Counsellor dashboard
Manager dashboard
Admin dashboard
Advanced reports
Revenue tracking
Target tracking
Production deployment
```

These belong to later phases of the project.

---

# 35. FUTURE PHASES

The implementation must remain extensible for:

## Phase 2

```text
Lead Management
Google Form Integration
Google Sheet / Apps Script
Secure Webhook
Duplicate Lead Prevention
```

## Phase 3

```text
Attendance
Calls
Call Outcomes
Follow-ups
```

## Phase 4

```text
Tasks
Counsellor Dashboard
```

## Phase 5

```text
Manager Dashboard
Admin Dashboard
Reports
```

## Phase 6

```text
Testing
Security Hardening
Deployment
Documentation
Training
```

---

# 36. IMPORTANT DATABASE DESIGN RULE

Do not design the database only around the current login screen.

The database must be prepared for the complete application described by the company specification.

The core entities are:

```text
Users
Attendance
Leads
CallLogs
Tasks
```

Future functionality should be able to build on these models without unnecessary restructuring.

---

# 37. CODE QUALITY

Follow these principles:

* Keep controllers thin.
* Keep business logic in services where appropriate.
* Keep validation separate.
* Keep authentication middleware reusable.
* Keep authorization middleware reusable.
* Use clear naming.
* Avoid duplicated business logic.
* Avoid hard-coded credentials.
* Avoid unnecessary dependencies.
* Handle errors consistently.
* Use environment variables for configuration.
* Keep frontend and backend responsibilities separate.

---

# 38. DO NOT INVENT REQUIREMENTS

The company specification is the source of truth for business requirements.

Do not invent:

* Additional user roles
* Additional lead statuses
* Additional call outcomes
* Additional business rules
* Revenue calculations
* Sales targets
* Automatic lead assignment algorithms
* Unspecified integrations

unless they are explicitly requested later.

If an implementation decision is necessary but not defined by the specification, choose a reasonable technical approach and document it as an **implementation decision**, not as a company requirement.

---

# 39. ANTIGRAVITY DEVELOPMENT RULES

Antigravity may be used as the development environment/AI coding assistant.

When generating code:

1. Inspect the existing repository before creating files.
2. Do not overwrite existing files unnecessarily.
3. Do not create a nested `kaushalsaathi-tracker` directory.
4. Work directly inside the current `salestrack` repository.
5. Follow this `specs.md`.
6. Implement Phase 1 only.
7. Keep company requirements separate from implementation choices.
8. Do not create fake functionality.
9. Do not insert real credentials.
10. Do not create or use real lead/customer data for testing.
11. Explain significant implementation decisions.
12. Keep the code ready for future phases.

---

# 40. TEST DATA

If test users are required during development, use clearly fake data.

Example:

```text
Name: Test Admin
Email: admin@example.test
Phone: 9999999999
```

Do not use real employee/customer information.

Do not commit production database records.

---

# 41. DOCUMENTATION

For Phase 1, document:

```text
README.md
specs.md
```

Additional documentation can be added later:

```text
docs/
├── API.md
├── DATABASE.md
├── DEPLOYMENT.md
└── USER-GUIDE.md
```

Do not create detailed documentation for functionality that has not actually been implemented.

---

# 42. PHASE 1 ACCEPTANCE CRITERIA

Phase 1 is considered complete when:

### Repository

* [ ] Project is created directly inside the current `salestrack` repository.
* [ ] No nested project directory is created.
* [ ] `.gitignore` exists.
* [ ] `.env.example` exists.
* [ ] No real secrets are committed.

### Frontend

* [ ] React + Vite is configured.
* [ ] Login page exists.
* [ ] Basic routing exists.
* [ ] Authentication state is handled.
* [ ] Protected route foundation exists.

### Backend

* [ ] Node.js + Express is configured.
* [ ] `/api/health` works.
* [ ] Authentication API exists.
* [ ] Password hashing is implemented.
* [ ] JWT authentication is implemented.
* [ ] Authentication middleware exists.
* [ ] Role authorization middleware exists.
* [ ] Zod validation is implemented.
* [ ] Helmet is configured.
* [ ] Rate limiting is configured.

### Database

* [ ] PostgreSQL connection is configured through `DATABASE_URL`.
* [ ] Prisma is configured.
* [ ] User model exists.
* [ ] Attendance model exists.
* [ ] Lead model exists.
* [ ] CallLog model exists.
* [ ] Task model exists.
* [ ] Relationships are defined appropriately.
* [ ] Prisma migration can be generated/applied.

### Security

* [ ] Plain-text passwords are never stored.
* [ ] Secrets are environment variables.
* [ ] `.env` is ignored.
* [ ] JWT secret is not exposed to frontend.
* [ ] Protected APIs enforce authentication.
* [ ] Protected APIs enforce authorization.

---

# 43. GIT CHECK BEFORE FIRST COMMIT

Before committing, run:

```bash
git status
```

Review every staged file.

The first commit should generally contain source/configuration such as:

```text
README.md
specs.md
.gitignore
.env.example

frontend/
backend/
docs/
```

It should NOT contain:

```text
.env
node_modules/
dist/
build/
database dumps
real credentials
API keys
Google credentials
real lead/customer data
```

Then create an appropriate initial commit, for example:

```bash
git add .
git status
git commit -m "Initial project setup"
```

Do not push until the staged files have been reviewed.

---

# 44. IMPORTANT SOURCE REQUIREMENTS

The company specification defines the system as an internal web-based Task, Lead and Sales Performance Tracker covering authentication, attendance, lead management, calls, tasks, follow-ups, dashboards, Google Form integration and reports.

It specifically recommends:

```text
Node.js + Express.js
PostgreSQL
Prisma
React.js + Vite
Tailwind CSS or equivalent
Recharts or equivalent
JWT or company SSO
Zod
Helmet
Rate limiting
HTTPS
Google Apps Script / Google Sheets API
```

The company specification also defines the six development phases, beginning with:

```text
Database
Authentication
Roles
Core API
```

Therefore, this specification intentionally limits the current Antigravity task to **Phase 1**.

---

# 45. FINAL INSTRUCTION TO ANTIGRAVITY

Implement **only Phase 1** described in this document.

Before making changes:

1. Inspect the existing `salestrack` repository.
2. Preserve existing useful files.
3. Do not create a nested project directory.
4. Do not delete existing work without a clear reason.
5. Create the required frontend/backend/database foundation.
6. Implement authentication, roles and core API foundations.
7. Configure Prisma and PostgreSQL.
8. Apply security basics.
9. Keep secrets outside Git.
10. Verify the application runs.
11. Verify the database schema/migration works.
12. Verify login/authentication works.
13. Verify role-based authorization works.
14. Report exactly what was created or changed.

Do not proceed to Phase 2, Phase 3, Phase 4, Phase 5 or Phase 6 unless explicitly instructed.
