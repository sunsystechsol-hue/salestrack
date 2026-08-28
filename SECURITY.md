# Security Architecture & Best Practices

This document outlines the security controls, authentication protocols, role-based authorization boundaries, data protection mechanisms, and logging rules for the KaushalSaathi Tracker.

---

## 1. Authentication & JWT Tokens

- **Algorithm**: HMAC SHA-256 (`HS256`).
- **Token Secret**: Configured exclusively via `JWT_SECRET` environment variable (never hardcoded).
- **Expiration**: Standard 24-hour expiration (`24h`).
- **Storage**: Client stores token in localStorage and transmits via `Authorization: Bearer <token>` header.
- **Identity Enforcement**: `req.user.id` is extracted strictly from the validated JWT token payload in `authenticateToken` middleware. Client request bodies cannot override `userId` or identity.

---

## 2. Password Security

- **Hashing Algorithm**: `bcrypt` with salt rounds = 10.
- **Storage**: `User.passwordHash` stores bcrypt hashes.
- **Protection**: `passwordHash` is explicitly excluded from API user responses, CSV exports, attendance mappings, and log files.

---

## 3. Role-Based Access Control (RBAC)

Authorization is strictly enforced by backend middleware (`authorizeRoles`) and controller checks:

| Role | Access Scope |
|---|---|
| `ADMIN` | Full access across all leads, tasks, team attendance, call logs, audit logs, and management reports. |
| `MANAGER` | Full management oversight of team leads, tasks, attendance, call logs, and management reports (`/api/reports/management/*`). |
| `COUNSELLOR` | Restricted strictly to assigned leads, assigned tasks, own attendance history, and own call activity logs. Access to management reports (`/api/reports/management/*`) returns **HTTP 403 Forbidden**. |

---

## 4. Server-Controlled Timestamps

The application enforces server-side timestamp generation (`new Date()`) for critical data models to prevent client manipulation:
- `Attendance.loginAt`
- `Attendance.logoutAt`
- `Attendance.lastSeenAt`
- `Task.completedAt`
- `CallLog.calledAt`

Client-supplied overrides in request payloads are explicitly ignored by backend controllers.

---

## 5. Network & HTTP Security Headers

- **Helmet**: Secures HTTP headers (`X-DNS-Prefetch-Control`, `X-Frame-Options`, `Strict-Transport-Security`, `X-Download-Options`, `X-Content-Type-Options`, `X-XSS-Protection`).
- **CORS**: Restricted via `process.env.CORS_ORIGIN`.
- **Express Rate Limiting**: Protects sensitive endpoints against brute-force attacks.

---

## 6. CSV & Export Protection

CSV export endpoints (`/api/reports/management/export`) sanitize all output fields to ensure sensitive data fields (`passwordHash`, `JWT_SECRET`, database passwords, webhook tokens) are never exported.

---

## 7. Webhook Security

The Google Form integration (`/api/integrations/google-forms`) validates incoming requests against `GOOGLE_FORM_WEBHOOK_SECRET` via the `X-Webhook-Secret` header. Requests lacking a valid secret are rejected with **HTTP 401 Unauthorized**.
