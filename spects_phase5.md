# Phase 5 Specification — Manager/Admin Dashboards & Reports

## Project

**KaushalSaathi Task, Lead & Sales Performance Tracker**

Repository:

```text
D:\salestrack
```

Phase 5 builds on the completed:

- Phase 1 — Database, Authentication, Roles & Core API
- Phase 2 — Lead Management & Google Form Integration
- Phase 2.5 — Professional Corporate CRM UI
- Phase 3 — Attendance, Call Tracking & Follow-ups
- Phase 4 — Task Management & Counsellor Dashboard
- Live Employee Presence Enhancement

---

# 1. Phase 5 Objective

Implement the **Manager/Admin Dashboard and Reporting system**.

The primary purpose is to allow management to understand:

- employee attendance
- live employee presence
- leads assigned
- calls made
- call outcomes
- follow-ups
- inquiries
- interested leads
- not-interested leads
- conversions
- task completion
- overdue tasks
- counsellor-wise performance
- lead-to-conversion ratio
- daily/weekly/monthly activity

The dashboard must connect **employee activity to actual lead/business outcomes**.

Do not create fake statistics.

Every displayed metric must come from the existing PostgreSQL database through authenticated backend APIs.

The original product direction explicitly states that the system should connect employee activity with lead handling and business outcomes. Management dashboards should eventually combine attendance, calls, follow-ups, conversions and revenue. Revenue/targets are marked as a future module, therefore **revenue and target management are NOT part of Phase 5 unless already supported by the existing schema.**

---

# 2. Critical Scope Rules

## 2.1 Backend Integrity

Preserve all existing functionality from Phases 1–4 and Live Presence.

Do not break or change existing API contracts.

Existing endpoints must continue working:

```text
/api/auth/login
/api/auth/logout
/api/auth/...
/api/leads
/api/users/counsellors
/api/integrations/google-form
/api/attendance
/api/attendance/me
/api/attendance/heartbeat
/api/attendance/logout
/api/calls
/api/followups
/api/tasks
/api/dashboard/counsellor
/api/health
```

Do not remove existing routes.

Do not change authentication semantics.

Do not weaken role authorization.

Do not remove existing Prisma migrations.

Do not reset the database.

Do not use:

```text
prisma migrate reset
```

---

# 3. Roles

## ADMIN

Full management visibility.

Admin can view:

- all employees
- all attendance
- live presence
- all leads
- all calls
- all follow-ups
- all tasks
- counsellor performance
- management reports

## MANAGER

Team-management visibility.

Manager can view:

- team attendance
- live presence
- team leads
- team calls
- team follow-ups
- team tasks
- counsellor performance
- management reports

Manager must not automatically receive privileges reserved for ADMIN.

## COUNSELLOR

Phase 5 management dashboards must NOT expose management-wide data to counsellors.

Counsellors continue using:

```text
/api/dashboard/counsellor
```

and their existing personal dashboards.

Counsellors must not be able to query another employee's management metrics by changing query parameters.

---

# 4. Database Policy

## IMPORTANT

Phase 5 should preferably be implemented using the existing database models:

```text
User
Attendance
Lead
CallLog
Task
AuditLog
```

Do not create unnecessary new database tables.

Do not add revenue or target tables in Phase 5.

Do not modify existing models unless technically necessary for a clearly defined reporting requirement.

If no schema change is necessary, **do not create a Prisma migration**.

All reporting calculations should be derived from existing records.

---

# 5. Management Dashboard

Create a management dashboard for:

```text
ADMIN
MANAGER
```

Suggested route:

```text
/management
```

or an equivalent route consistent with the existing frontend routing architecture.

The dashboard must be accessible only to:

```text
ADMIN
MANAGER
```

---

# 6. Management Dashboard Metrics

Display real database-derived metrics.

## Lead Metrics

At minimum:

```text
Total Leads
New Leads
Assigned Leads
Contacted Leads
Interested Leads
Not Interested Leads
Inquiry Leads
Follow-up Leads
Converted Leads
Lost Leads
```

## Activity Metrics

```text
Calls Made
Follow-ups Scheduled
Follow-ups Completed
Pending Follow-ups
Overdue Follow-ups
Tasks Created
Pending Tasks
Completed Tasks
Overdue Tasks
```

## Attendance Metrics

```text
Employees Logged In
Employees Live Active
Employees Inactive/Idle
Employees Logged Out
Average Working Time
```

Do not calculate employee presence from frontend state.

Use the existing server-controlled attendance and `lastSeenAt` logic.

---

# 7. Date Filtering

Management dashboard must support:

```text
Today
Yesterday
Last 7 Days
This Month
Custom Date Range
```

Default:

```text
Today
```

All date calculations must respect:

```text
Asia/Kolkata
```

Do not use browser-local dates for business reporting logic.

Date filtering must be performed server-side where possible.

---

# 8. Counsellor Performance Table

Create a management table comparing counsellors.

Example columns:

```text
Counsellor
Presence
Working Time
Leads Assigned
Calls
Interested
Inquiries
Follow-ups
Not Interested
No Response
Converted
Conversion %
Pending Tasks
Completed Tasks
Overdue Tasks
```

The table must use real database values.

Do not insert sample values such as:

```text
50 leads
42 calls
8 interested
```

unless those values actually exist in the database.

---

# 9. Performance Ranking

Provide a counsellor performance ranking.

The ranking should be based on measurable real activity.

At minimum display:

```text
Rank
Counsellor
Leads
Calls
Interested
Follow-ups
Converted
Conversion %
```

Conversion percentage:

```text
converted / assigned leads * 100
```

Handle zero denominators safely:

```text
0 / 0 = 0%
```

Do not manufacture a score.

If a composite performance score is introduced, document the formula clearly and ensure it is based only on real database metrics.

---

# 10. Lead-to-Conversion Ratio

Management reports must show:

```text
Lead-to-Conversion Ratio
```

Formula:

```text
converted leads / total relevant leads * 100
```

The implementation must document exactly which lead population is used.

Avoid ambiguous calculations.

---

# 11. Call Outcome Report

Create a call outcome summary.

Display counts for:

```text
Interested
Not Interested
Follow-up Required
Inquiry
Call Back
No Response
Wrong Number
Converted
Other
```

The counts must come from `CallLog.outcome`.

Provide date filtering.

---

# 12. Lead Status Report

Display lead status distribution:

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

Use existing `Lead.status`.

Do not create new statuses.

---

# 13. Attendance Report

Management must be able to see employee attendance.

Columns:

```text
Employee
Role
Date
Login Time
Logout Time
Working Time
Presence Status
```

For the current day, show live presence where available:

```text
LIVE ACTIVE
INACTIVE / IDLE
LOGGED OUT
```

Use the existing `lastSeenAt` presence logic.

---

# 14. Live Employee Presence

Provide a management presence section.

Display:

```text
Employee
Role
Login Time
Last Seen
Current Status
Working Time
```

Statuses:

```text
LIVE ACTIVE
INACTIVE / IDLE
LOGGED OUT
```

The server remains the authority.

Frontend polling may refresh the display, but must not calculate authoritative presence.

---

# 15. Follow-up Report

Management must be able to see:

```text
Pending
Today
Overdue
Completed
```

Include:

```text
Lead
Counsellor
Follow-up Date
Status
```

Overdue status must continue using server-side current time.

---

# 16. Task Report

Management must be able to monitor:

```text
Pending
In Progress
Completed
Cancelled
Overdue
```

Include:

```text
Task
Assigned Employee
Linked Lead
Due Date
Status
Completed At
```

Do not allow counsellors to access management-wide task reports.

Existing Phase 4 task ownership rules remain unchanged.

---

# 17. Charts

Use the existing frontend technology and an appropriate chart library if already installed.

If a chart library is not installed, prefer a lightweight implementation rather than introducing unnecessary dependencies.

Recommended charts:

### Lead Status Distribution

```text
Pie / Donut
```

### Call Outcomes

```text
Bar Chart
```

### Counsellor Performance

```text
Bar Chart
```

### Daily Activity

```text
Line / Bar Chart
```

Charts must render real API data.

Empty data must show a professional empty state.

Do not display fake placeholder chart values.

---

# 18. Reporting API

Create dedicated authenticated management reporting endpoints.

Suggested structure:

```text
GET /api/reports/management/summary
GET /api/reports/management/performance
GET /api/reports/management/calls
GET /api/reports/management/attendance
GET /api/reports/management/followups
GET /api/reports/management/tasks
```

Exact endpoint design may be adjusted if a cleaner architecture fits the existing backend.

All endpoints must require:

```text
authenticateToken
```

and:

```text
authorizeRoles('ADMIN', 'MANAGER')
```

where appropriate.

---

# 19. Summary Endpoint

A management summary endpoint should return structured data similar to:

```json
{
  "dateRange": {
    "from": "...",
    "to": "..."
  },
  "metrics": {
    "totalLeads": 0,
    "newLeads": 0,
    "assignedLeads": 0,
    "contactedLeads": 0,
    "interested": 0,
    "notInterested": 0,
    "inquiries": 0,
    "followUps": 0,
    "converted": 0,
    "lost": 0,
    "callsMade": 0,
    "followUpsScheduled": 0,
    "followUpsCompleted": 0,
    "pendingFollowUps": 0,
    "overdueFollowUps": 0,
    "pendingTasks": 0,
    "completedTasks": 0,
    "overdueTasks": 0
  }
}
```

Values must be computed from actual records.

---

# 20. Performance Endpoint

Return one record per active counsellor.

Example structure:

```json
[
  {
    "userId": "...",
    "name": "...",
    "presence": "LIVE ACTIVE",
    "workingMins": 0,
    "leadsAssigned": 0,
    "callsMade": 0,
    "interested": 0,
    "followUps": 0,
    "inquiries": 0,
    "notInterested": 0,
    "noResponse": 0,
    "converted": 0,
    "conversionRate": 0,
    "pendingTasks": 0,
    "completedTasks": 0,
    "overdueTasks": 0
  }
]
```

Do not expose password hashes or sensitive user fields.

---

# 21. Search & Filters

Management performance should support:

```text
Counsellor
Date Range
Lead Status
Call Outcome
Task Status
```

Where applicable.

Pagination must be used for large report datasets.

Do not fetch unlimited database records unnecessarily.

---

# 22. Frontend Pages

Create:

```text
ManagementDashboardPage.jsx
ReportsPage.jsx
```

or equivalent pages if the existing architecture benefits from fewer pages.

The UI must remain consistent with the existing:

**Professional Corporate CRM design system.**

Use:

```text
Deep navy
Slate
White surfaces
Professional blue actions
Semantic green/amber/red statuses
```

Do not return to the old glassmorphism design.

---

# 23. Sidebar

For:

```text
ADMIN
MANAGER
```

add:

```text
Management Dashboard
Reports
```

Counsellors should continue seeing their own:

```text
Dashboard
Leads
Attendance
Calls
Follow-ups
Tasks
```

Do not expose management navigation to counsellors.

---

# 24. Dashboard UX

Management dashboard should have:

### Header

```text
Management Dashboard
Date Range Selector
Refresh
```

### KPI Section

Real metric cards.

### Live Presence

Employee status list.

### Performance

Counsellor comparison table.

### Charts

Lead status, call outcomes and performance.

### Activity

Recent/important activity.

### Empty States

If there is no data:

```text
No activity for this period.
```

Do not show fake values.

---

# 25. Export Reports

If implementation can be safely supported without introducing excessive complexity, provide:

```text
CSV Export
```

for major tabular reports.

At minimum consider:

```text
Counsellor Performance
Attendance
Calls
Follow-ups
Tasks
```

Exports must contain only data the authenticated user is authorized to see.

Do not export password hashes, JWTs, secrets or sensitive authentication fields.

If CSV export is not implemented in this phase, document it explicitly rather than pretending it exists.

---

# 26. Security Requirements

Every management endpoint must enforce authorization server-side.

Never rely only on hiding frontend navigation.

Counsellor request:

```text
GET /api/reports/management/summary
```

must return:

```text
403 Forbidden
```

or equivalent authorization failure.

The following must never be returned:

```text
passwordHash
JWT secrets
database credentials
webhook secrets
```

Do not accept user identity through:

```text
?userId=
```

as a replacement for JWT identity when requesting personal data.

Management endpoints may accept filters such as counsellor ID only for authorized ADMIN/MANAGER users.

---

# 27. Performance & Query Requirements

Avoid N+1 queries.

Use Prisma aggregation where appropriate:

```text
count
groupBy
aggregate
```

Use indexed fields.

Do not retrieve entire tables into Node.js when database aggregation can perform the calculation.

Use pagination for detailed report tables.

---

# 28. Audit Logging

Existing AuditLog behaviour must remain intact.

Important management actions introduced by Phase 5 should be audited if they mutate data.

Viewing reports does not necessarily need an audit entry unless the existing project policy requires it.

Do not modify existing audit semantics unnecessarily.

---

# 29. No Phase 6 Scope Creep

Do NOT implement:

```text
Production deployment
AWS/VPS configuration
HTTPS deployment
Domain configuration
SSO
Database backup infrastructure
Advanced security hardening
User training system
Production monitoring
```

These belong to the later testing/security/deployment/documentation phase.

---

# 30. No Revenue/Target Module

The original specification marks:

```text
Revenue and target vs actual reporting
```

as a recommended future module.

Therefore Phase 5 must NOT create:

```text
Revenue model
Target model
Commission model
Salary model
Financial reporting
```

unless such fields already exist and can be safely displayed.

---

# 31. Automated Test Suite

Create:

```text
backend/test_phase5.js
```

Test sections should cover at minimum:

### A–C
Health and authentication.

### D–F
ADMIN and MANAGER management report access.

### G
COUNSELLOR management report rejection.

### H–J
Summary metrics are derived from real database records.

### K–M
Counsellor performance calculations.

### N
Conversion rate calculation.

### O
Call outcome aggregation.

### P
Lead status aggregation.

### Q
Attendance reporting.

### R
Live presence reporting.

### S
Follow-up reporting.

### T
Task reporting.

### U
Date-range filtering.

### V
Pagination.

### W
No sensitive fields exposed.

### X
Phase 2 regression.

### Y
Phase 3 regression.

### Z
Phase 4 regression.

---

# 32. Verification Commands

Run:

```powershell
cd D:\salestrack\backend

npx prisma validate
npx prisma generate
npx prisma migrate status

node .\test_phase2.js
node .\test_phase3.js
node .\test_phase4.js
node .\test_presence.js
node .\test_phase5.js
```

Then:

```powershell
cd D:\salestrack\frontend

npm run build
```

---

# 33. Security Scan

From:

```text
D:\salestrack
```

run:

```powershell
git check-ignore backend/.env backend/node_modules frontend/node_modules frontend/dist
```

Then:

```powershell
git grep -n -E "postgresql://postgres:|JWT_SECRET=|GOOGLE_FORM_WEBHOOK_SECRET=|AdminPassword123|ManagerPassword123|CounsellorPassword123"
```

Review all matches manually.

Do not claim a secret scan is clean merely because placeholder documentation exists.

Distinguish:

```text
real secret
placeholder
documentation
test credential
```

---

# 34. Git Policy

The agent MUST NOT execute:

```text
git add
git commit
git push
```

The agent may inspect:

```text
git status
git diff
git diff --stat
git diff --cached
```

All changes must remain in the working directory for manual review.

---

# 35. Final Acceptance Criteria

Phase 5 is complete only when:

- ADMIN can access management dashboard.
- MANAGER can access management dashboard.
- COUNSELLOR cannot access management dashboard.
- Management metrics are real database-derived values.
- Date filtering works correctly.
- Counsellor performance comparison works.
- Conversion rate is mathematically correct.
- Call outcomes are aggregated correctly.
- Lead statuses are aggregated correctly.
- Attendance reporting works.
- Live presence works.
- Follow-up reporting works.
- Task reporting works.
- No sensitive authentication data is exposed.
- Existing Phase 2 functionality passes.
- Existing Phase 3 functionality passes.
- Existing Phase 4 functionality passes.
- Live presence tests pass.
- Phase 5 tests pass.
- Frontend production build passes.
- No existing API is unnecessarily broken.
- No database reset occurs.
- No git commit or push occurs.

---

# 36. Product Direction

The management dashboard must answer one central business question:

> **"What are our employees doing, how are they handling leads, and what business outcomes are those activities producing?"**

The dashboard should therefore connect:

```text
Attendance
     ↓
Employee Activity
     ↓
Calls
     ↓
Lead Outcomes
     ↓
Follow-ups
     ↓
Tasks
     ↓
Conversions
     ↓
Management Performance
```

This is the central purpose of Phase 5.