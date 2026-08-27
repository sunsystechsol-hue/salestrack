# KaushalSaathi Task, Lead & Sales Performance Tracker
# Phase 2 Technical Specification
## Lead Management & Google Form Integration

**Project:** KaushalSaathi.com  
**Phase:** 2  
**Status:** Development Specification  
**Previous Phase:** Phase 1 — Database, Authentication, Roles & Core API  
**Next Phase:** Phase 3 — Attendance, Calls, Outcomes & Follow-ups

---

# 1. Phase 2 Objective

Phase 2 extends the Phase 1 foundation by implementing the application's core lead-management workflow.

The primary objectives are:

1. Build the Lead Management REST API.
2. Allow authorized users to create and manage leads.
3. Allow managers/admins to assign and reassign leads to counsellors.
4. Allow counsellors to view and work with their assigned leads.
5. Implement lead search, filtering and pagination.
6. Implement lead status management.
7. Implement lead details.
8. Implement duplicate lead protection.
9. Implement Google Form → Google Sheet/Apps Script → Node.js webhook integration.
10. Automatically create leads from Google Form submissions.
11. Secure the webhook using a secret token.
12. Prevent duplicate Google Form submissions using the Google Form response ID.
13. Add the initial Lead Management frontend screens.

The company project specification identifies Lead Management and Google Form Integration as core modules and assigns them to Phase 2.

---

# 2. Phase 2 Scope

## 2.1 Lead Management

Implement:

- Lead creation
- Lead listing
- Lead details
- Lead search
- Lead filtering
- Lead pagination
- Lead status updates
- Lead assignment
- Lead reassignment
- Lead notes
- Lead follow-up date storage
- Lead source tracking
- Duplicate lead detection

## 2.2 Google Form Integration

Implement:

- Google Form submission ingestion
- Google Sheets / Google Apps Script integration
- Secure Node.js webhook
- Google Form response ID tracking
- Duplicate submission protection
- Required-field validation
- Automatic source assignment
- Imported lead storage
- Manager assignment workflow

## 2.3 Frontend

Implement the initial Lead Management interface:

- Lead list
- Lead details
- Search
- Filters
- Pagination
- Lead status management
- Lead assignment/reassignment UI where authorized

---

# 3. Explicitly Out of Scope

Do NOT implement the following during Phase 2:

- Attendance functionality
- Server login/logout attendance tracking
- Call logging
- Call duration tracking
- Call outcome workflow
- Follow-up calendar
- Task management
- Counsellor performance dashboard
- Manager performance dashboard
- Admin dashboard
- Advanced reports
- Revenue tracking
- Targets
- Production deployment
- Advanced analytics
- Call recording
- Revenue/target modules

These belong to later phases according to the company development plan.

---

# 4. Existing Phase 1 Foundation

Phase 2 MUST build on the existing Phase 1 implementation.

Do NOT recreate or replace the Phase 1 foundation.

Existing technologies:

- Node.js
- Express.js
- PostgreSQL
- Prisma
- React
- Vite
- JWT
- Zod
- bcrypt
- Helmet
- express-rate-limit

Existing core models:

- User
- Attendance
- Lead
- CallLog
- Task

Phase 2 primarily extends the Lead workflow and implements Lead Management APIs and UI.

---

# 5. Existing Lead Model

The Phase 1 database already contains the Lead model.

The Lead model contains:

- id
- name
- phone
- email
- source
- course
- city
- formResponseId
- status
- assignedToId
- nextFollowUp
- notes
- createdAt
- updatedAt

Before making schema changes:

1. Inspect the existing Prisma schema.
2. Compare it with this specification.
3. Make only changes required for Phase 2.
4. Do not unnecessarily redesign the existing schema.

---

# 6. Lead Status

The following statuses are required:

- NEW
- ASSIGNED
- CONTACTED
- INTERESTED
- NOT_INTERESTED
- FOLLOW_UP
- INQUIRY
- CONVERTED
- LOST

Do not rename existing database enum values without a documented reason.

---

# 7. User Roles

Existing roles:

- ADMIN
- MANAGER
- COUNSELLOR

## ADMIN

Admin has full lead-management access.

Admin can:

- View all leads
- Create leads
- Edit leads
- Assign leads
- Reassign leads
- Change lead status
- View lead details
- Search leads
- Filter leads
- Manage imported leads

## MANAGER

Manager can:

- View team leads
- Create leads
- Edit leads
- Assign leads
- Reassign leads
- Change lead status
- View lead details
- Search leads
- Filter leads
- Manage imported leads

## COUNSELLOR

Counsellor can:

- View leads assigned to themselves
- View lead details
- Update allowed lead information
- Update lead status
- Add/update notes
- Set/update next follow-up where permitted

Counsellors MUST NOT:

- View all counsellor leads
- Reassign leads
- Assign leads to other counsellors
- Access admin functionality
- Access management-wide lead data

Backend authorization is mandatory.

---

# 8. Lead API

Create REST APIs under:

/api/leads

All Lead endpoints except the Google Form webhook MUST require JWT authentication.

---

# 9. List Leads

Endpoint:

GET /api/leads

Required features:

- Pagination
- Search
- Filtering
- Sorting where appropriate

Supported query parameters may include:

?page=1
&limit=20
&search=9876543210
&status=NEW
&assignedToId=<user-id>
&source=Google%20Form
&course=Python
&city=Hospet

Only whitelist supported query parameters.

Do not allow arbitrary database fields to be used for sorting or filtering.

---

# 10. Lead Visibility

## ADMIN

Can view all leads.

## MANAGER

Can view leads belonging to their managed team according to the available user/team structure.

If team hierarchy is not implemented in the current database, do not invent a new hierarchy without documenting the implementation decision.

## COUNSELLOR

Can view only leads assigned to themselves.

The backend MUST enforce visibility restrictions.

Never rely only on frontend filtering.

---

# 11. Pagination

Lead lists MUST use server-side pagination.

Default:

page = 1
limit = 20

Maximum:

limit = 100

Example response:

{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}

Do not load the entire Lead table into the browser.

---

# 12. Search

Lead search should support relevant fields such as:

- Name
- Phone
- Email
- Course
- City
- Google Form response ID

Use parameterized Prisma queries.

Never construct raw SQL using untrusted input.

---

# 13. Filtering

Supported filters should include:

- status
- assignedToId
- source
- course
- city
- nextFollowUp

Only implement filters supported by the existing schema.

---

# 14. Get Lead Details

Endpoint:

GET /api/leads/:id

Return the lead details available to the authenticated user's role.

Counsellors MUST NOT access another counsellor's lead by guessing a lead ID.

Authorization must happen before returning the record.

---

# 15. Create Lead

Endpoint:

POST /api/leads

Required fields:

- name
- phone

Optional fields:

- email
- source
- course
- city
- formResponseId
- assignedToId
- status
- nextFollowUp
- notes

Validate request bodies using Zod.

---

# 16. Lead Creation Defaults

For manually created leads:

Default status:

NEW

For Google Form imported leads:

Default source:

Google Form

If no counsellor is assigned:

assignedToId = null

Imported leads without an assignment should remain:

NEW

until assigned.

---

# 17. Assign Lead

Endpoint:

PATCH /api/leads/:id/assign

Only:

- ADMIN
- MANAGER

may assign leads.

Request:

{
  "assignedToId": "user-id"
}

The backend MUST verify:

1. The target user exists.
2. The target user is active.
3. The target user has the COUNSELLOR role.

After successful assignment, the lead should normally become:

ASSIGNED

unless preserving its existing status is required by the workflow.

---

# 18. Reassign Lead

Endpoint:

PATCH /api/leads/:id/reassign

Only:

- ADMIN
- MANAGER

may reassign leads.

The backend must verify the target counsellor is:

- Existing
- Active
- A COUNSELLOR

Update:

assignedToId

Do not allow unauthorized users to modify assignment.

---

# 19. Lead Status Update

Endpoint:

PATCH /api/leads/:id/status

Allowed values:

- NEW
- ASSIGNED
- CONTACTED
- INTERESTED
- NOT_INTERESTED
- FOLLOW_UP
- INQUIRY
- CONVERTED
- LOST

Validate using Zod and the Prisma enum.

Counsellors may update statuses for their own assigned leads.

Managers/admins may update statuses according to their access.

---

# 20. Lead Update

Endpoint:

PATCH /api/leads/:id

Allow modification only of appropriate lead fields.

Do NOT allow clients to modify:

- id
- createdAt
- updatedAt

Do not allow unauthorized modification of:

- assignedToId

Do not trust client-provided system-controlled values.

---

# 21. Delete Lead

Lead deletion should be restricted.

Preferred:

ADMIN only

If deletion is not required by the workflow, do not implement destructive deletion.

Preserve historical information whenever possible.

Do not hard-delete a lead without considering relationships with:

- CallLog
- Task
- future activity records

---

# 22. Duplicate Lead Detection

Duplicate protection is mandatory.

The company specification requires duplicate lead detection and unique Google Form response IDs.

The existing Lead model contains:

formResponseId

with a unique constraint.

---

# 23. Google Form Response ID

Every Google Form imported lead should contain:

formResponseId

Before creating a lead:

1. Check whether the formResponseId already exists.
2. If it exists, do not create another record.
3. Return a duplicate response.

Example:

{
  "success": true,
  "duplicate": true,
  "message": "Lead already exists"
}

---

# 24. Phone Duplicate Detection

Phone-based duplicate detection should also be considered.

A phone number may legitimately submit multiple enquiries.

Therefore:

- Normalize phone numbers for comparison.
- Search for possible existing leads.
- Warn or flag potential duplicates where appropriate.
- Do not automatically reject every matching phone number.
- Do not overwrite existing lead information.

---

# 25. Google Form Integration Architecture

Use the following architecture:

Google Form
    ↓
Google Sheet
    ↓
Google Apps Script
    ↓
Secure Node.js Webhook
    ↓
Zod Validation
    ↓
Duplicate Check
    ↓
PostgreSQL / Prisma
    ↓
Lead Database
    ↓
Lead Management UI

This architecture is based on the company specification.

---

# 26. Google Apps Script

Do not attempt to build or deploy the actual company Google Form during Phase 2.

The application should provide a documented webhook endpoint and example Apps Script integration.

The real company Google account/credentials must not be committed to Git.

---

# 27. Webhook Endpoint

Create:

POST /api/integrations/google-form

This endpoint does NOT use normal employee JWT authentication.

It uses a dedicated webhook secret.

---

# 28. Webhook Authentication

Use a dedicated secret.

Recommended header:

X-Webhook-Secret: <WEBHOOK_SECRET>

The secret must come from:

process.env.GOOGLE_FORM_WEBHOOK_SECRET

Never hard-code the secret.

---

# 29. Webhook Environment Variable

Add to backend/.env.example:

GOOGLE_FORM_WEBHOOK_SECRET=

The real secret belongs only in:

backend/.env

Never commit it.

---

# 30. Google Form Payload

The webhook should support a documented JSON payload.

Example:

{
  "formResponseId": "response-12345",
  "name": "Example User",
  "phone": "9876543210",
  "email": "user@example.com",
  "course": "Python Full Stack",
  "city": "Hospet"
}

Do not assume Google Forms automatically sends this exact JSON.

Google Apps Script should transform the form/spreadsheet submission into this application payload.

---

# 31. Webhook Required Fields

At minimum:

- formResponseId
- name
- phone

Optional:

- email
- course
- city

Validate all fields using Zod.

Invalid data must not be inserted.

---

# 32. Webhook Processing

Process requests in this order:

Request
    ↓
Verify webhook secret
    ↓
Validate JSON
    ↓
Validate required fields
    ↓
Normalize relevant values
    ↓
Check formResponseId
    ↓
Check duplicate conditions
    ↓
Create Lead
    ↓
Set source = Google Form
    ↓
Set status = NEW
    ↓
Return success

---

# 33. Webhook Responses

New lead:

{
  "success": true,
  "duplicate": false,
  "message": "Lead created successfully"
}

Duplicate:

{
  "success": true,
  "duplicate": true,
  "message": "Lead already exists"
}

Invalid request:

{
  "success": false,
  "message": "Invalid request"
}

Unauthorized webhook:

HTTP 401 Unauthorized

Do not expose internal database errors.

---

# 34. Webhook Rate Limiting

Apply rate limiting to the webhook.

The limit must allow legitimate Google Form traffic.

Do not use an unnecessarily restrictive limit.

---

# 35. Webhook Idempotency

Repeated delivery of the same Google Form submission MUST NOT create duplicate leads.

Use:

formResponseId

as the primary idempotency key.

This is important because external webhook systems may retry requests.

---

# 36. Lead Assignment Workflow

New Google Form lead:

NEW

Manager/admin reviews lead.

Manager/admin assigns counsellor.

Lead becomes:

ASSIGNED

Counsellor then handles the lead.

Call tracking is NOT implemented in Phase 2.

Call tracking belongs to Phase 3.

---

# 37. Lead Management Frontend

Create:

/leads

/leads/:id

Optional:

/leads/new

---

# 38. Lead List UI

Display:

- Name
- Phone
- Course
- City
- Source
- Status
- Assigned counsellor
- Next follow-up
- Created date

Implement:

- Search
- Status filter
- Counsellor filter where permitted
- Pagination

Do not retrieve every lead into the frontend.

---

# 39. Lead Details UI

Display:

- Name
- Phone
- Email
- Course
- City
- Source
- Form response ID
- Assigned counsellor
- Status
- Next follow-up
- Notes
- Created date

Never display:

passwordHash

---

# 40. Assignment UI

Managers/admins can:

- Assign leads
- Reassign leads

Counsellors must not see assignment controls.

Frontend visibility is not a security boundary. Backend authorization remains mandatory.

---

# 41. Lead Status UI

Use the existing statuses:

- NEW
- ASSIGNED
- CONTACTED
- INTERESTED
- NOT_INTERESTED
- FOLLOW_UP
- INQUIRY
- CONVERTED
- LOST

Use human-readable labels in the UI.

Do not modify database enum values merely for display.

---

# 42. API Error Handling

Use the existing centralized error handler.

Recommended status codes:

- 200 OK
- 201 Created
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 409 Conflict
- 429 Too Many Requests
- 500 Internal Server Error

Production responses must not expose stack traces or secrets.

---

# 43. Validation

Use Zod for:

- Lead creation
- Lead update
- Lead search
- Lead filters
- Assignment
- Reassignment
- Status updates
- Google webhook payload

Reject malformed input.

---

# 44. Audit Logging

The company specification requires audit logs for:

- Lead assignment
- Lead reassignment
- Important administrative changes

Review the existing database before introducing a new AuditLog model.

If audit logging is added in Phase 2:

- Keep the model minimal.
- Record important assignment/reassignment events.
- Do not build an unnecessarily complex audit framework.

---

# 45. Backend Security

Every protected Lead endpoint must:

1. Authenticate the user.
2. Authorize the role.
3. Apply lead visibility rules.
4. Validate the input.
5. Query only authorized records.

Do not rely on frontend restrictions.

---

# 46. Assignment Security

Never accept an assignedToId without verifying the target user.

The target user must:

- Exist
- Be active
- Have the COUNSELLOR role

Do not trust a client-supplied userId to identify the authenticated user.

Use:

req.user

from the validated JWT.

---

# 47. Frontend API Client

Create a reusable API client if appropriate.

It should handle:

- API requests
- JSON
- JWT authorization
- common errors

Never expose:

- DATABASE_URL
- JWT_SECRET
- GOOGLE_FORM_WEBHOOK_SECRET
- PostgreSQL password

to frontend code.

---

# 48. Authentication Preservation

Do NOT unnecessarily modify Phase 1 authentication.

Existing endpoint:

POST /api/auth/login

must continue working.

Existing JWT middleware must continue working.

Existing role authorization must continue working.

---

# 49. Dashboard Preservation

Do not remove the existing Phase 1 dashboard.

Add navigation to Lead Management where appropriate.

Do not implement the complete manager/admin/counsellor performance dashboards during Phase 2.

---

# 50. Prisma Migration

If the existing schema requires Phase 2 changes:

Create a new Prisma migration.

Example:

npx prisma migrate dev --name phase2_lead_management

Do NOT:

- prisma migrate reset
- Drop the database
- Delete existing migrations
- Rewrite committed migrations

Preserve Phase 1 migration history.

---

# 51. Environment Configuration

Update:

backend/.env.example

with:

DATABASE_URL=
JWT_SECRET=
PORT=5000
NODE_ENV=development

SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
SEED_MANAGER_EMAIL=
SEED_MANAGER_PASSWORD=
SEED_COUNSELLOR_EMAIL=
SEED_COUNSELLOR_PASSWORD=

GOOGLE_FORM_WEBHOOK_SECRET=

Real secrets must remain only in:

backend/.env

---

# 52. Git Requirements

MUST NOT be committed:

- backend/.env
- node_modules/
- frontend/dist/
- frontend/node_modules/
- database credentials
- JWT secrets
- Google webhook secrets
- real customer/lead data
- local machine-specific files

SHOULD be committed:

- backend/prisma/schema.prisma
- backend/prisma/migrations/
- backend/src/
- backend/package.json
- backend/package-lock.json
- backend/.env.example
- frontend/src/
- frontend/package.json
- frontend/package-lock.json
- README.md
- spects_phase1.md
- spects_phase2.md
- .gitignore

---

# 53. Google Integration Documentation

Create documentation explaining:

1. Google Form
2. Google Sheet
3. Google Apps Script
4. Webhook URL
5. Webhook secret
6. Payload format
7. Duplicate handling
8. Expected responses
9. Local testing procedure

Do not commit production Google credentials.

---

# 54. Testing Requirements

## Lead API

Test:

- Create lead
- Get lead list
- Get lead details
- Update lead
- Update status
- Assign lead
- Reassign lead
- Search leads
- Filter leads
- Pagination

## Authorization

Test:

- ADMIN
- MANAGER
- COUNSELLOR

Verify that counsellors cannot access unauthorized leads.

## Duplicate Handling

Test:

- Duplicate formResponseId
- Repeated webhook request
- Potential phone duplicate

## Webhook

Test:

- Valid secret
- Invalid secret
- Missing secret
- Valid payload
- Invalid payload
- Missing required fields
- Duplicate submission

## Security

Test:

- Unauthenticated Lead API
- Unauthorized role
- Malformed IDs
- Invalid query parameters
- Excessive pagination limit

---

# 55. Manual Testing Workflow

Test:

Login
    ↓
Leads
    ↓
Search
    ↓
Filter
    ↓
Open Lead
    ↓
Assign Lead
    ↓
Login as Counsellor
    ↓
Verify assigned lead appears
    ↓
Verify another counsellor's lead is inaccessible

Then test the integration:

Google Form
    ↓
Apps Script/Webhook
    ↓
New Lead
    ↓
Database
    ↓
Lead List

Submit the same form response again.

Expected:

No duplicate Lead.

---

# 56. Performance Requirements

Lead lists MUST use server-side:

- Pagination
- Filtering
- Search

Do not load all leads into the browser.

Review and use appropriate Prisma indexes.

Do not create excessive indexes without reason.

---

# 57. Timezone

Business timezone:

Asia/Kolkata

Lead follow-up date/time handling should follow the application's timezone policy.

Do not silently use another business timezone.

---

# 58. Data Integrity

The system must maintain:

- Valid lead statuses
- Valid assigned counsellors
- Unique Google Form response IDs
- Valid foreign keys
- Valid email when supplied
- Valid phone when required
- Server-controlled timestamps

Clients must not be allowed to modify system timestamps.

---

# 59. Definition of Done

Phase 2 is complete only when:

## Backend

- [ ] Lead CRUD/API implemented
- [ ] Lead listing implemented
- [ ] Pagination implemented
- [ ] Search implemented
- [ ] Filters implemented
- [ ] Lead details implemented
- [ ] Assignment implemented
- [ ] Reassignment implemented
- [ ] Status updates implemented
- [ ] Role authorization verified
- [ ] Duplicate protection implemented
- [ ] Google Form webhook implemented
- [ ] Webhook secret authentication implemented
- [ ] Webhook validation implemented
- [ ] Webhook idempotency implemented

## Database

- [ ] Existing Lead schema reviewed
- [ ] Required Phase 2 changes migrated
- [ ] No destructive migration performed
- [ ] Phase 1 migration history preserved

## Frontend

- [ ] Lead list
- [ ] Lead details
- [ ] Search
- [ ] Filters
- [ ] Pagination
- [ ] Assignment/reassignment controls
- [ ] Status controls
- [ ] Role-based UI visibility

## Security

- [ ] JWT authentication preserved
- [ ] Role authorization enforced
- [ ] Webhook secret protected
- [ ] .env ignored
- [ ] No credentials committed
- [ ] Zod validation implemented
- [ ] Rate limiting applied

## Testing

- [ ] Lead API tests
- [ ] Authorization tests
- [ ] Duplicate tests
- [ ] Webhook tests
- [ ] Frontend build
- [ ] Backend startup
- [ ] Prisma validation
- [ ] Migration status

---

# 60. Phase 2 Deliverables

Expected project additions may include:

backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── controllers/
│   │   └── lead.controller.js
│   ├── routes/
│   │   ├── lead.routes.js
│   │   └── integration.routes.js
│   ├── validators/
│   │   └── lead.validator.js
│   ├── middleware/
│   └── services/
├── .env.example
└── package.json

frontend/
├── src/
│   ├── pages/
│   │   ├── LeadsPage.jsx
│   │   └── LeadDetailsPage.jsx
│   ├── components/
│   └── services/

docs/
└── google-form-integration.md

spects_phase1.md
spects_phase2.md
README.md

Do not create unnecessary files or folders.

---

# 61. Recommended Development Sequence

1. Inspect Phase 1
2. Read specs_phase1.md
3. Read specs_phase2.md
4. Review existing Lead schema
5. Review authentication
6. Implement Lead validators
7. Implement Lead service
8. Implement Lead controllers
9. Implement Lead routes
10. Implement authorization rules
11. Implement search/filter/pagination
12. Implement assignment/reassignment
13. Implement status updates
14. Implement duplicate detection
15. Implement Google webhook
16. Implement webhook security
17. Implement frontend Lead List
18. Implement Lead Details
19. Implement assignment UI
20. Implement search/filter UI
21. Implement Google integration documentation
22. Write tests
23. Run Prisma validation
24. Run migration if required
25. Run backend tests
26. Run frontend build
27. Review Git status
28. Stop and report results

---

# 62. Important Development Rules

1. Do not rewrite Phase 1.
2. Do not upgrade Prisma unnecessarily.
3. Keep Prisma and @prisma/client versions compatible.
4. Do not delete existing migrations.
5. Do not reset the database.
6. Do not expose secrets.
7. Do not commit .env.
8. Do not commit real lead/customer information.
9. Do not implement Phase 3 functionality.
10. Do not implement Phase 4 functionality.
11. Do not implement Phase 5 functionality.
12. Do not deploy to production.
13. Do not push to Git automatically.
14. Run tests before reporting completion.
15. Never claim a test passed unless it was actually executed.
16. Preserve working Phase 1 functionality.

---

# 63. Phase 2 Success Criteria

The following workflow must operate correctly:

Authenticated User
    ↓
Lead Management API
    ↓
Search / Filter / Pagination
    ↓
Assignment / Reassignment
    ↓
Lead Status
    ↓
PostgreSQL

And:

Google Form
    ↓
Google Sheet
    ↓
Apps Script
    ↓
Secure Webhook
    ↓
Validation
    ↓
Duplicate Detection
    ↓
PostgreSQL
    ↓
Lead Management UI

Both workflows must be verified before Phase 2 is considered complete.

---

# 64. Transition to Phase 3

After Phase 2 is complete, the project should be ready for:

Phase 3 — Attendance, Calls, Outcomes & Follow-ups

Phase 3 will introduce:

- Server-recorded attendance
- Login/logout tracking
- Working duration
- Call records
- Call outcomes
- Follow-up handling
- Related activity tracking

Do not implement these features during Phase 2.

---

# 65. Product Direction

The tracker must continue to be developed as more than an attendance/task application.

The long-term objective is to connect:

Employee Activity
+
Lead Handling
+
Calls
+
Follow-ups
+
Conversions
+
Revenue

so management can evaluate both employee activity and actual business contribution.

Phase 2 establishes the lead-management foundation required for later activity, performance and conversion tracking.