# Phase 4 Specification — Task Management & Counsellor Dashboard

## Project

KaushalSaathi.com — Task, Lead & Sales Performance Tracker

Project Root:

D:\salestrack

---

# 1. Phase Objective

Implement Phase 4 of the KaushalSaathi Task, Lead & Sales Performance Tracker.

Phase 4 scope is strictly:

1. Task Management
2. Counsellor Daily Dashboard
3. Role-based task access
4. Task assignment by Admin/Manager
5. Task status updates by assigned employees
6. Lead-linked tasks
7. Due-date and overdue task tracking
8. Counsellor daily activity summary

The original project specification defines Phase 4 as:

"Tasks and counsellor dashboard."

Phase 5 will handle Manager/Admin dashboards and reports.

Do NOT implement Phase 5 features during Phase 4.

---

# 2. Existing System Must Be Preserved

Phase 1, Phase 2, Phase 2.5 and Phase 3 are already implemented.

The following existing functionality MUST continue working:

## Authentication

POST /api/auth/login

JWT authentication

Roles:

- ADMIN
- MANAGER
- COUNSELLOR

Server-side attendance recording on login.

Server-side attendance recording on logout.

---

## Lead Management

Existing endpoints:

GET /api/leads

GET /api/leads/:id

POST /api/leads

PATCH /api/leads/:id

PATCH /api/leads/:id/status

PATCH /api/leads/:id/assign

PATCH /api/leads/:id/reassign

---

## Google Form Integration

POST /api/integrations/google-form

The existing webhook secret mechanism and idempotency behaviour MUST remain unchanged.

---

## Attendance

Existing Phase 3 attendance functionality MUST remain unchanged.

---

## Call Tracking

Existing Phase 3 call functionality MUST remain unchanged.

---

## Follow-ups

Existing Phase 3 follow-up functionality MUST remain unchanged.

---

## Corporate CRM UI

The Phase 2.5 professional corporate CRM design system MUST be preserved.

Do not replace the existing design system.

New Phase 4 screens must use the same:

- Sidebar
- Header
- Buttons
- Cards
- Tables
- Badges
- Modals
- Form fields
- Typography
- Spacing
- Colors
- Responsive behaviour

---

# 3. Database Requirements

Add Task Management to the existing Prisma schema.

Do NOT modify or delete existing models unnecessarily.

Existing models must remain intact.

Create a new Task model.

Recommended model:

model Task {
  id          String     @id @default(uuid())

  title       String
  description String?

  status      TaskStatus @default(PENDING)

  dueAt       DateTime

  completedAt DateTime?

  userId      String
  leadId      String?

  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  lead Lead? @relation(fields: [leadId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([leadId])
  @@index([status])
  @@index([dueAt])
}

---

# 4. Task Status

Create Prisma enum:

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

These correspond to the original project specification:

- Pending
- In Progress
- Completed
- Cancelled

---

# 5. User Relations

Update the existing User model with:

tasks Task[]

Do not remove existing relations.

---

# 6. Lead Relations

Update the existing Lead model with:

tasks Task[]

Do not remove existing relations.

---

# 7. Database Migration

Create a new migration.

Suggested command:

npx prisma migrate dev --name phase4_task_management

Do NOT modify existing Phase 1, Phase 2 or Phase 3 migration files.

Migration history must remain intact.

---

# 8. Task Creation Rules

Admin and Manager can create tasks.

Counsellors cannot create arbitrary tasks for themselves through the management endpoint.

Task creation requires:

- title
- dueAt
- assigned employee (userId)

Optional:

- description
- leadId

If leadId is provided:

- Verify the lead exists.
- Verify the lead is accessible according to the user's role.
- Do not allow invalid lead IDs.

The assigned employee must be an active system user.

Preferably restrict normal task assignment to active:

COUNSELLOR

unless the existing business rules require another employee role.

---

# 9. Task Assignment Rules

ADMIN:

- Can create tasks.
- Can assign tasks.
- Can reassign tasks.
- Can view all tasks.
- Can monitor overdue tasks.

MANAGER:

- Can create tasks.
- Can assign tasks.
- Can reassign tasks.
- Can view team tasks.
- Can monitor overdue tasks.

COUNSELLOR:

- Can view only tasks assigned to themselves.
- Can update status of their own assigned tasks.
- Cannot assign tasks to other users.
- Cannot reassign tasks.
- Cannot delete tasks.
- Cannot modify another employee's tasks.

All restrictions MUST be enforced on the backend.

Never rely only on frontend hiding.

---

# 10. Task Update Rules

Allowed task status transitions:

PENDING
-> IN_PROGRESS
-> COMPLETED

PENDING
-> COMPLETED

PENDING
-> CANCELLED

IN_PROGRESS
-> COMPLETED

IN_PROGRESS
-> CANCELLED

Completed tasks should not be silently reopened unless explicitly supported by the implementation.

When status becomes COMPLETED:

completedAt = current server timestamp

When status changes away from COMPLETED:

Do not allow clients to manually control completedAt.

Server controls completedAt.

Clients must not be able to modify:

id

createdAt

updatedAt

completedAt

---

# 11. Task API

Create:

backend/src/controllers/task.controller.js

backend/src/routes/task.routes.js

backend/src/validators/task.validator.js

---

# 12. Required Task Endpoints

## GET /api/tasks

Returns tasks according to role.

ADMIN:

All tasks.

MANAGER:

Team/managed tasks.

COUNSELLOR:

Only tasks where:

userId == req.user.id

Supported query parameters:

page

limit

status

userId

leadId

search

due

---

# 13. Task Pagination

Default:

page = 1

limit = 20

Maximum:

limit = 100

Response format should remain consistent with existing APIs:

{
  data: [...],
  pagination: {
    page,
    limit,
    total,
    totalPages
  }
}

---

# 14. Task Search

Search should support:

title

description

and, where practical, linked lead name.

Use Prisma parameterized queries.

Do NOT use raw SQL.

---

# 15. Task Filtering

Support:

status

assigned employee

lead

due status

Recommended due filters:

PENDING

TODAY

OVERDUE

COMPLETED

ALL

Overdue should be calculated using server time.

A task is overdue when:

dueAt < current server time

AND

status is not COMPLETED

AND

status is not CANCELLED

---

# 16. GET /api/tasks/:id

Returns task details.

ADMIN/MANAGER:

Can access according to their task visibility.

COUNSELLOR:

Can access only their own assigned task.

Cross-user access must return:

403 Forbidden

where appropriate.

---

# 17. POST /api/tasks

ADMIN/MANAGER only.

Creates a task.

Required:

title

dueAt

userId

Optional:

description

leadId

Return:

201 Created

---

# 18. PATCH /api/tasks/:id

ADMIN/MANAGER:

Can modify task information and assignment.

COUNSELLOR:

Can update allowed status fields only on their own tasks.

Do not allow counsellors to modify:

userId

createdAt

updatedAt

completedAt

leadId

unless explicitly required by the specification.

---

# 19. PATCH /api/tasks/:id/status

Allows task status updates.

COUNSELLOR:

Only their own tasks.

ADMIN/MANAGER:

Can update tasks within their scope.

Use Zod validation.

When COMPLETED:

completedAt = server timestamp

---

# 20. Task Reassignment

Create:

PATCH /api/tasks/:id/reassign

ADMIN/MANAGER only.

Request:

{
  "userId": "counsellor-id"
}

Verify target employee:

- exists
- isActive = true
- appropriate role

Return updated task.

---

# 21. Task Deletion

Do NOT implement task deletion unless it is already required elsewhere.

Prefer retaining task history.

Cancellation should be represented using:

CANCELLED

rather than deleting historical task records.

---

# 22. Audit Logging

The existing AuditLog model must remain intact.

Important task administrative events should be auditable.

Recommended actions:

TASK_CREATED

TASK_REASSIGNED

TASK_COMPLETED

TASK_CANCELLED

At minimum:

- task creation
- task reassignment

should create AuditLog entries.

Use:

entity = "Task"

entityId = task.id

userId = req.user.id

details = useful JSON/string information

Do not expose secrets in audit details.

---

# 23. Counsellor Daily Dashboard

Implement a dedicated counsellor dashboard.

The original project specification requires counsellors to see daily activity such as:

Leads Assigned

Calls Made

Interested

Follow-ups

Inquiries

Not Interested

No Response

Converted

Login Time

Logout Time

Working Time

These values MUST come from existing database/API data.

Do NOT invent numbers.

---

# 24. Counsellor Dashboard Metrics

For the currently logged-in counsellor, calculate today's:

1. Leads Assigned
2. Calls Made
3. Interested Calls
4. Follow-ups
5. Inquiries
6. Not Interested
7. No Response
8. Converted
9. Pending Tasks
10. Completed Tasks
11. Overdue Tasks
12. Login Time
13. Logout Time
14. Working Time

Use Asia/Kolkata business date handling consistent with existing Phase 3 attendance behaviour.

---

# 25. Dashboard Data Rules

Counsellor dashboard must show only data belonging to the logged-in counsellor.

Never accept userId from the frontend to decide whose personal dashboard is shown.

The backend must derive the user from:

req.user.id

This prevents horizontal privilege escalation.

---

# 26. Counsellor Dashboard API

Create:

GET /api/dashboard/counsellor

The endpoint should return today's real metrics.

Example response:

{
  "date": "2026-08-27",
  "metrics": {
    "leadsAssigned": 0,
    "callsMade": 0,
    "interested": 0,
    "followUps": 0,
    "inquiries": 0,
    "notInterested": 0,
    "noResponse": 0,
    "converted": 0,
    "pendingTasks": 0,
    "completedTasks": 0,
    "overdueTasks": 0
  },
  "attendance": {
    "loginAt": null,
    "logoutAt": null,
    "totalMins": 0
  }
}

The exact response shape may be improved if necessary, but values must remain real database-derived values.

---

# 27. Dashboard Recent Tasks

Counsellor dashboard should show:

Today's tasks

Upcoming tasks

Overdue tasks

Recently completed tasks

Each task should link to its details where applicable.

---

# 28. Dashboard Recent Leads

Show a compact recent-leads section.

Use existing:

GET /api/leads

or a suitable backend query.

Do not duplicate lead business logic unnecessarily.

---

# 29. Frontend Task Management

Create:

frontend/src/pages/TasksPage.jsx

Features:

- Task list
- Search
- Status filter
- Due filter
- Pagination
- Lead information
- Assigned employee
- Due date
- Task status
- Status update controls
- Create Task modal for Admin/Manager
- Reassignment for Admin/Manager
- Empty state
- Loading state
- Error state

---

# 30. Task Details

Create:

frontend/src/pages/TaskDetailsPage.jsx

Display:

- Title
- Description
- Status
- Assigned employee
- Linked lead
- Due date
- Created date
- Updated date
- Completed date

Provide status actions according to role.

---

# 31. Counsellor Dashboard UI

Update the existing DashboardPage.jsx.

For COUNSELLOR:

Display a personal daily dashboard.

Suggested structure:

Top:

Good morning / employee name

Today's date

Attendance status

Metric cards

Middle:

Today's Tasks

Upcoming Follow-ups

Recent Calls

Recent Leads

Bottom:

Activity summary

Use the existing corporate CRM design system.

---

# 32. Admin/Manager Dashboard Behaviour

Do NOT build the full Phase 5 management dashboard.

For Phase 4:

Admin/Manager can continue using the existing dashboard.

Task management navigation should be available to them.

The detailed counsellor performance comparison belongs to Phase 5.

---

# 33. Sidebar Navigation

Update Sidebar.jsx.

Add:

Tasks

For COUNSELLOR:

Dashboard

Lead Management

Attendance

Call Logs

Follow-ups

Tasks

For ADMIN/MANAGER:

Dashboard

Lead Management

Attendance

Call Logs

Follow-ups

Tasks

Do not remove existing navigation.

---

# 34. API Service

Update:

frontend/src/services/api.js

Add:

taskService

dashboardService

Methods:

taskService.getTasks()

taskService.getTask()

taskService.createTask()

taskService.updateTask()

taskService.updateTaskStatus()

taskService.reassignTask()

dashboardService.getCounsellorDashboard()

Use the existing JWT API wrapper.

Do not create a second authentication mechanism.

---

# 35. Validation

Use Zod for:

task creation

task updates

task status

task reassignment

task list queries

dashboard query parameters if needed

Reject malformed input with HTTP 400.

---

# 36. Security

All protected task APIs must use:

authenticateToken

and appropriate authorizeRoles middleware.

Backend must enforce:

- counsellor task ownership
- manager/admin privileges
- active employee validation
- linked lead validation
- pagination limits
- allowed fields
- status validation

Never trust frontend role checks.

---

# 37. Rate Limiting

Follow the existing project's security conventions.

Do not weaken existing authentication or webhook rate limiting.

If task endpoints require rate limiting, use the project's existing rate-limit configuration rather than introducing an unrelated security mechanism.

---

# 38. Automated Tests

Create:

backend/test_phase4.js

Test at minimum:

A. Health check

B. Admin authentication

C. Manager authentication

D. Counsellor authentication

E. Task creation by Admin

F. Task creation by Manager

G. Counsellor cannot create arbitrary task

H. Task listing by Admin

I. Task listing by Counsellor

J. Counsellor cannot view another counsellor's task

K. Counsellor can update own task status

L. Counsellor cannot reassign task

M. Admin/Manager can reassign task

N. Task completion sets completedAt server-side

O. Overdue task detection

P. Linked lead task

Q. AuditLog creation

R. Counsellor dashboard metrics

S. Dashboard role isolation

T. Pagination and filtering

---

# 39. Regression Testing

Phase 4 must not break Phase 1–3.

Run:

npx prisma validate

npx prisma generate

npx prisma migrate status

node .\test_phase2.js

node .\test_phase3.js

node .\test_phase4.js

All tests must pass.

---

# 40. Frontend Build

Run:

cd D:\salestrack\frontend

npm run build

Build must complete with zero errors.

---

# 41. Security Audit

Run:

cd D:\salestrack

git status

git check-ignore backend/.env backend/node_modules frontend/node_modules frontend/dist

Search for accidental credentials:

git grep -n -E "postgresql://postgres:|JWT_SECRET=|GOOGLE_FORM_WEBHOOK_SECRET=|AdminPassword123|ManagerPassword123|CounsellorPassword123"

No real credentials may be committed.

---

# 42. Phase Boundary

Phase 4 MUST NOT implement:

- Manager performance comparison dashboard
- Admin performance dashboard
- Advanced reports
- CSV/PDF reporting
- Revenue tracking
- Targets
- Revenue analytics
- Production deployment
- Employee management
- Advanced analytics

Those belong to later phases.

---

# 43. Completion Criteria

Phase 4 is complete only when:

1. Task model exists.
2. Migration is created and applied.
3. Task CRUD/status functionality works.
4. Role isolation is enforced server-side.
5. Task reassignment works.
6. Audit logs are created for important task actions.
7. Overdue tasks are correctly detected.
8. Counsellor dashboard shows real daily metrics.
9. Tasks page works.
10. Task details page works.
11. Existing Phase 1–3 functionality still works.
12. test_phase2.js passes.
13. test_phase3.js passes.
14. test_phase4.js passes.
15. frontend npm run build passes.
16. No secrets are tracked.
17. Working tree is reviewed before commit.

---

# 44. Git Rule

DO NOT automatically:

git add

git commit

git push

The implementation must stop after verification and report:

- files changed
- migration created
- APIs added
- tests passed
- frontend build result
- security scan result
- git status

The developer will review and commit manually.