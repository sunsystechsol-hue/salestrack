# Phase 6 Specification — Testing, Security, Deployment & Documentation

## Project

KaushalSaathi.com — Task, Lead & Sales Performance Tracker

Project Path:

D:\salestrack

---

# 1. Phase 6 Objective

Phase 6 is the final production-hardening phase of the KaushalSaathi Task, Lead & Sales Performance Tracker.

The objective is to:

1. Perform comprehensive regression testing of Phases 1–5.
2. Verify Live Employee Presence and attendance lifecycle.
3. Perform backend and frontend security hardening.
4. Verify authentication and role-based authorization.
5. Verify production configuration and environment handling.
6. Validate database migration and backup readiness.
7. Verify frontend production build.
8. Verify API reliability and error handling.
9. Improve technical documentation.
10. Prepare the application for production deployment.

Phase 6 MUST NOT introduce unnecessary business features.

The focus is stability, security, deployment readiness, and documentation.

---

# 2. Existing System That Must Be Preserved

The following functionality already exists and MUST continue working:

## Phase 1

- PostgreSQL database
- Prisma ORM
- User authentication
- JWT authentication
- ADMIN role
- MANAGER role
- COUNSELLOR role
- Role-based authorization
- Core API infrastructure

## Phase 2

- Lead management
- Lead creation
- Lead assignment
- Lead reassignment
- Lead search/filtering
- Google Form webhook integration
- Duplicate lead protection
- Audit logging

## Phase 3

- Attendance
- Login/logout
- Call tracking
- Call outcomes
- Follow-up management
- Asia/Kolkata date semantics

## Live Employee Presence

- `Attendance.lastSeenAt`
- Heartbeat endpoint
- Live active detection
- Inactive/idle detection
- Logged-out detection
- Automatic frontend heartbeat
- Live working time
- Re-login after logout fix

## Phase 4

- Task management
- Task assignment
- Task reassignment
- Task status updates
- Task ownership authorization
- Counsellor dashboard
- Task audit logging

## Phase 5

- Management dashboard
- Management reports
- Counsellor performance
- Attendance reports
- Call reports
- Lead status reports
- Follow-up reports
- Task reports
- CSV exports
- Management-only authorization
- Date-range filtering
- Pagination

---

# 3. Critical Product Direction

The application must remain focused on connecting:

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
Business Performance

Management reporting should continue to combine employee activity and actual lead outcomes.

The original project specification identifies this as the primary product direction. 

---

# 4. Phase 6 Rules

## Rule 1 — No unnecessary schema changes

Do not modify Prisma schema unless a genuine production-readiness issue is discovered.

If a schema change is genuinely required:

1. Explain why.
2. Create a proper Prisma migration.
3. Never reset the database.
4. Never delete existing migrations.
5. Never use destructive migration commands against the existing database.

---

## Rule 2 — Preserve existing functionality

Do not rewrite working Phase 1–5 modules unnecessarily.

Do not replace existing authentication, attendance, task, lead, call, follow-up, or reporting implementations unless required to fix a verified issue.

---

## Rule 3 — No fake data

Do not add:

- mock production metrics
- fake dashboard statistics
- hardcoded employee activity
- hardcoded conversion numbers
- fake attendance
- fake reports

All production metrics must remain database-derived.

---

## Rule 4 — No secret exposure

Never commit:

- `.env`
- database passwords
- JWT secrets
- webhook secrets
- API keys
- private credentials
- password hashes
- access tokens

---

## Rule 5 — Git policy

The agent MUST NOT execute:

```bash
git add
git commit
git push