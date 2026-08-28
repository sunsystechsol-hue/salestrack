# API Reference & Documentation

Base URL: `/api`

All endpoints except `/api/health`, `/api/auth/login`, and `/api/integrations/google-forms` require a valid JWT token sent via `Authorization: Bearer <TOKEN>` header.

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/login`
Authenticates a user and records initial daily attendance session.

- **Payload**:
  ```json
  {
    "email": "counsellor@kaushalsaathi.com",
    "password": "CounsellorPassword123!"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": "uuid",
      "name": "Lead Counsellor One",
      "email": "counsellor@kaushalsaathi.com",
      "role": "COUNSELLOR"
    }
  }
  ```

---

## 2. Attendance & Live Presence (`/api/attendance`)

### `POST /api/attendance/heartbeat`
Updates current user's `lastSeenAt` timestamp.

- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Heartbeat received",
    "attendance": {
      "id": "uuid",
      "workDate": "2026-08-28T00:00:00.000Z",
      "loginAt": "2026-08-28T05:51:40.634Z",
      "logoutAt": null,
      "lastSeenAt": "2026-08-28T05:52:19.648Z",
      "isLiveActive": true,
      "presenceStatus": "ACTIVE",
      "liveWorkingMins": 1
    }
  }
  ```

### `POST /api/attendance/logout`
Records user logout timestamp and computes total session minutes.

- **Response (200 OK)**: Returns updated attendance object with `logoutAt` timestamp and `presenceStatus: "LOGGED_OUT"`.

### `GET /api/attendance/me`
Retrieves history of current user's attendance records.

---

## 3. Lead Management (`/api/leads`)

- `POST /api/leads` — Create lead (Admin/Manager).
- `GET /api/leads` — List leads with pagination (`page`, `limit`), search (`search`), and status filter (`status`).
- `GET /api/leads/:id` — Get lead details.
- `PATCH /api/leads/:id/status` — Update lead status (`NEW`, `ASSIGNED`, `CONTACTED`, `INTERESTED`, `CONVERTED`, etc.).
- `PATCH /api/leads/:id/assign` — Assign lead to counsellor (Admin/Manager).
- `PATCH /api/leads/:id/reassign` — Reassign lead to new counsellor (Admin/Manager).

---

## 4. Call Tracking & Follow-ups (`/api/calls`, `/api/followups`)

- `POST /api/calls` — Record call log (outcome, duration, remarks, optional follow-up date).
- `GET /api/calls` — Retrieve call logs for a lead or user.
- `GET /api/followups` — List scheduled and overdue follow-ups.

---

## 5. Task Management (`/api/tasks`)

- `POST /api/tasks` — Create task (Admin/Manager).
- `GET /api/tasks` — List tasks with filters (`due`, `status`, `userId`).
- `GET /api/tasks/:id` — Get task details.
- `PATCH /api/tasks/:id/status` — Update task status (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`). Automatically populates `completedAt` on completion.
- `PATCH /api/tasks/:id/reassign` — Reassign task to counsellor (Admin/Manager).

---

## 6. Management Reports & BI (`/api/reports/management`)

- `GET /api/reports/management/summary` — Overview metrics (total leads, calls, conversions, tasks, attendance).
- `GET /api/reports/management/performance` — Counsellor performance ranking & conversion rates.
- `GET /api/reports/management/calls` — Call outcomes break down.
- `GET /api/reports/management/leads` — Lead status distributions.
- `GET /api/reports/management/attendance` — Detailed employee presence report.
- `GET /api/reports/management/followups` — Scheduled follow-up analysis.
- `GET /api/reports/management/tasks` — Task completion analytics.
- `GET /api/reports/management/export` — Download CSV export (`type=performance|attendance|calls|leads|tasks|followups`).
