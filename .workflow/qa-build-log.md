# QA & Build Log

Tracks test runs, build results, and post-deploy health checks per sprint. Maintained by QA Engineer, Deploy Engineer, and Monitor Agent.

---

## Sprint 22 — Deploy Engineer: Staging Deploy (2026-04-05)

**Timestamp:** 2026-04-05T20:15:00Z
**Agent:** Deploy Engineer
**Sprint:** #22
**Tasks Deployed:** T-101 (Email service + notification preferences API), T-102 (Notification preferences UI)

### Pre-Deploy Verification

| Check | Result |
|-------|--------|
| QA handoff confirmed (H-304) | ✅ All Sprint #22 tests pass |
| All sprint tasks at Done status | ✅ T-100, T-101, T-102 — all Done |
| Pending migrations identified | ✅ 1 migration: `20260405_01_create_notification_preferences.js` |

### Build Results

| Step | Result | Notes |
|------|--------|-------|
| `backend npm install` | ✅ Success | 0 vulnerabilities |
| `frontend npm install` | ✅ Success | 0 vulnerabilities |
| `frontend npm run build` | ✅ Success | 4647 modules, 451.91 kB JS (128.43 kB gzip), built in 315ms |

### Staging Deployment

**Environment:** Staging (local PostgreSQL — `plant_guardians_staging` DB on port 5432)
**Note:** Docker not available on this host. Using local PostgreSQL 15 (Homebrew) as staging database — matches production schema exactly.

| Step | Result | Notes |
|------|--------|-------|
| Docker availability | ⚠️ Not available | Fell back to local PostgreSQL 15 (Homebrew) |
| PostgreSQL connection | ✅ Accepting connections on localhost:5432 | |
| `npm run migrate` | ✅ Success | Batch 2: 1 migration applied (`20260405_01_create_notification_preferences.js`) |
| `notification_preferences` table | ✅ Verified | PK on user_id, FK to users(id) CASCADE, CHECK constraint, partial index — all correct |
| Backend start (`npm start`) | ✅ Running on port 3000 | PID 27589 |
| Backend health check (`GET /api/health`) | ✅ HTTP 200 | `{"status":"ok","timestamp":"2026-04-06T00:11:32.966Z"}` |
| Frontend build artifacts | ✅ Present | `frontend/dist/` — index.html + assets |
| Email service warning | ⚠️ Expected | `EMAIL_HOST` not set — email disabled (graceful degradation per Sprint 22 spec) |

**Build Status: ✅ SUCCESS**

### Services Running

| Service | URL | Status |
|---------|-----|--------|
| Backend API | http://localhost:3000 | ✅ Up |
| Health endpoint | http://localhost:3000/api/health | ✅ 200 OK |
| Frontend build | `frontend/dist/` (static) | ✅ Built |
| Database | localhost:5432/plant_guardians_staging | ✅ Connected |

### Next Step

Monitor Agent health check requested via H-305 in handoff-log.md.

---

## Sprint 22 — QA Engineer: Re-Verification Run (2026-04-05 — Automated Orchestrator)

**Timestamp:** 2026-04-05T20:07:00Z
**Agent:** QA Engineer (orchestrator re-run)
**Sprint:** #22
**Tasks:** T-101 (Done), T-102 (Done)

### Fresh Test Run Results

| Suite | Result | Notes |
|-------|--------|-------|
| Backend (`npm test`) | 161/166 PASS, 5 FAIL | 5 failures are **pre-existing** in `careActionsStreak.test.js` — NOT a Sprint #22 regression (see below) |
| Frontend (`npm test`) | 239/239 PASS | No regressions. All 12 new RemindersSection tests pass. |
| `npm audit` (backend) | 0 vulnerabilities | ✅ |
| `npm audit` (frontend) | 0 vulnerabilities | ✅ |

### careActionsStreak.test.js Flakiness — Pre-Existing (NOT Sprint 22)

5 tests fail in `careActionsStreak.test.js` because the `daysAgo(0)` helper sets the timestamp to **noon UTC today**, but when tests run between **midnight and noon UTC**, noon today is "in the future" and the backend's `performed_at` validation rejects it with 400. This is a **timezone-dependent test bug** introduced in a prior sprint. Root cause: the helper should use a time guaranteed to be in the past (e.g., `new Date()` or a time earlier than now).

**Impact:** Zero impact on Sprint #22 tasks. The notification preferences (T-101) and RemindersSection (T-102) tests all pass.

**Recommendation:** File a bug for a future sprint to fix the `daysAgo()` helper in `careActionsStreak.test.js` to avoid noon-UTC boundary issues.

### Re-Verification Summary

All Sprint #22 checks from the initial QA pass remain valid:
- ✅ Unit tests: 17 new backend + 12 new frontend, all passing
- ✅ Integration: API contracts, UI states, accessibility — all verified
- ✅ Config consistency: PORT, proxy, CORS — all aligned
- ✅ Security: No hardcoded secrets, parameterized queries, XSS escaped, HMAC constant-time, Helmet headers
- ✅ npm audit: 0 vulnerabilities both sides

**Re-Verification Verdict: ✅ PASS — Sprint 22 QA approval stands. Ready for staging deploy.**

---

## Sprint 22 — QA Engineer: Full QA Verification — T-101, T-102 (2026-04-05)

**Timestamp:** 2026-04-05T20:00:00Z
**Agent:** QA Engineer
**Sprint:** #22
**Tasks Under Test:** T-101 (Backend: notification preferences API + email service + cron), T-102 (Frontend: RemindersSection on Profile page)
**Baseline:** Backend 149/149 (Sprint 21), Frontend 227/227 (Sprint 21)

---

### 1. Unit Test Review — Backend (T-101)

**Test Type:** Unit Test
**Test File:** `backend/tests/notificationPreferences.test.js`
**Result:** ✅ PASS — 17 new tests across 4 endpoint groups

| Group | Tests | Happy Path | Error Path | Auth | Notes |
|-------|-------|------------|------------|------|-------|
| GET /notification-preferences | 3 | ✅ default prefs (new user) | — | ✅ 401 | Also tests existing prefs |
| POST /notification-preferences | 8 | ✅ full update, partial (opt_in only), partial (hour only) | ✅ empty body→400, hour=25→400, hour=8.5→400, opt_in="yes"→400 | ✅ 401 | Exceeds min coverage |
| GET /unsubscribe | 3 | ✅ valid token→200 + opt_in=false | ✅ missing token→400, invalid HMAC→400 | N/A (public) | |
| POST /admin/trigger-reminders | 3 | ✅ returns stats | ✅ hour=30→400 | ✅ 401 | |

**Total Backend Tests:** 166/166 PASS (17 new, 149 existing — no regressions)
**Verdict:** ✅ PASS — exceeds 6+ new test requirement (17 total)

---

### 2. Unit Test Review — Frontend (T-102)

**Test Type:** Unit Test
**Test Files:** `frontend/src/__tests__/RemindersSection.test.jsx`, `frontend/src/__tests__/ProfilePage.test.jsx`
**Result:** ✅ PASS — 12 new tests in RemindersSection, 1 new test in ProfilePage

| Test | Type | Result |
|------|------|--------|
| Renders loading state with aria-busy | Render | ✅ |
| Renders with opt_in=false | Happy path | ✅ |
| Renders with opt_in=true, hour=12 | Happy path | ✅ |
| Shows load error on API failure | Error path | ✅ |
| Toggles on → shows timing + save button | Interaction | ✅ |
| Saves preferences + success toast | Happy path | ✅ |
| Shows save error on API failure | Error path | ✅ |
| Dismisses save error on X click | Interaction | ✅ |
| Shows "Save changes" when toggling off | State mgmt | ✅ |
| Sends opt_in=false toast on save-off | Edge case | ✅ |
| Proper accessibility on toggle | A11y | ✅ |
| Proper radiogroup with accessible label | A11y | ✅ |
| ProfilePage renders RemindersSection | Integration | ✅ |

**Total Frontend Tests:** 239/239 PASS (12 new RemindersSection + existing — no regressions)
**Verdict:** ✅ PASS — exceeds 4+ new test requirement (12 total)

---

### 3. Integration Test — API Contract Verification (T-101 + T-102)

**Test Type:** Integration Test

#### 3a. Frontend → Backend API Wiring

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| `notificationPreferences.get()` calls `GET /api/v1/profile/notification-preferences` | Per contract | ✅ `request('/profile/notification-preferences')` — path correct | ✅ PASS |
| `notificationPreferences.update(payload)` calls `POST /api/v1/profile/notification-preferences` | Per contract | ✅ `request('/profile/notification-preferences', { method: 'POST', body: JSON.stringify(payload) })` | ✅ PASS |
| Auth header automatically attached | Bearer token | ✅ `request()` adds `Authorization: Bearer <token>` | ✅ PASS |
| Response shape: `request()` returns `json.data` | `{ opt_in, reminder_hour_utc }` | ✅ RemindersSection accesses `data.opt_in`, `data.reminder_hour_utc` | ✅ PASS |
| POST body: `{ opt_in: boolean, reminder_hour_utc: number }` | Per contract | ✅ `{ opt_in: optIn, reminder_hour_utc: reminderHour }` | ✅ PASS |
| Timing selector mapping | 8=Morning, 12=Midday, 18=Evening | ✅ TIMING_OPTIONS: `[{value:8}, {value:12}, {value:18}]` | ✅ PASS |

#### 3b. UI States (per SPEC-017)

| State | Expected | Actual | Result |
|-------|----------|--------|--------|
| Loading | `aria-busy="true"`, opacity reduced, pointer-events disabled | ✅ Implemented | ✅ PASS |
| Success (opt_in=false) | Toggle off, timing selector hidden, no save button | ✅ Implemented | ✅ PASS |
| Success (opt_in=true) | Toggle on, timing selector visible, save button visible | ✅ Implemented | ✅ PASS |
| Error (load failure) | "Could not load your current settings." + toggle defaults to off | ✅ Implemented | ✅ PASS |
| Error (save failure) | Inline error with `role="alert"` + dismiss button | ✅ Implemented | ✅ PASS |
| Success toast (save) | "Reminder settings saved" / "Email reminders turned off" | ✅ Implemented | ✅ PASS |

#### 3c. Auth Enforcement

| Endpoint | Unauthed→401? | Result |
|----------|--------------|--------|
| GET /notification-preferences | ✅ Yes (test exists) | ✅ PASS |
| POST /notification-preferences | ✅ Yes (test exists) | ✅ PASS |
| POST /admin/trigger-reminders | ✅ Yes (test exists) | ✅ PASS |
| GET /unsubscribe | N/A (public, HMAC-protected) | ✅ PASS |

#### 3d. Input Validation

| Validation | Expected | Test | Result |
|------------|----------|------|--------|
| `reminder_hour_utc: 25` | 400 VALIDATION_ERROR | ✅ Test exists | ✅ PASS |
| `reminder_hour_utc: -1` | 400 VALIDATION_ERROR | ✅ Implied by range check (0–23) | ✅ PASS |
| `reminder_hour_utc: 8.5` | 400 VALIDATION_ERROR | ✅ Test exists | ✅ PASS |
| `opt_in: "yes"` (non-boolean) | 400 VALIDATION_ERROR | ✅ Test exists | ✅ PASS |
| Empty body `{}` | 400 VALIDATION_ERROR | ✅ Test exists | ✅ PASS |
| Missing/invalid unsubscribe token | 400 INVALID_TOKEN | ✅ Test exists | ✅ PASS |

#### 3e. Accessibility

| Requirement | Expected | Actual | Result |
|-------------|----------|--------|--------|
| Toggle: `role="switch"` | Per SPEC-017 | ✅ `<button role="switch">` | ✅ PASS |
| Toggle: `aria-checked` | Per SPEC-017 | ✅ `aria-checked={optIn}` | ✅ PASS |
| Toggle: `aria-label="Email reminders"` | Per SPEC-017 | ✅ Present | ✅ PASS |
| Toggle: `aria-describedby="reminder-toggle-desc"` | Per SPEC-017 | ✅ Present with matching `id` element | ✅ PASS |
| Timing: `role="radiogroup"` with `aria-label` | Per SPEC-017 | ✅ `<div role="radiogroup" aria-label="Reminder time">` | ✅ PASS |
| Save error: `role="alert"` | Per SPEC-017 | ✅ Present | ✅ PASS |
| Section: `aria-busy` during loading | Per SPEC-017 | ✅ `aria-busy={loading}` | ✅ PASS |

**Integration Test Verdict:** ✅ ALL PASS

---

### 4. Config Consistency Check

**Test Type:** Config Consistency

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Backend PORT (`.env`) | 3000 | `PORT=3000` | ✅ PASS |
| Vite proxy target (`vite.config.js`) | `http://localhost:3000` | `backendTarget = 'http://localhost:3000'` | ✅ PASS — port matches |
| Vite proxy protocol | HTTP (no SSL in .env) | `http://` | ✅ PASS |
| CORS includes `http://localhost:5173` | Must include frontend dev origin | `FRONTEND_URL=http://localhost:5173,http://localhost:5174,http://localhost:4173,http://localhost:4175` | ✅ PASS |
| Docker Compose port mapping | Postgres 5432 | `ports: 5432:5432` | ✅ PASS — no conflict |
| Email env vars in `.env.example` | Documented | Present (lines 34–42) | ✅ PASS |
| `UNSUBSCRIBE_SECRET` in `.env` | Should be set for testing | NOT set in `.env` | ⚠️ NOTE — acceptable: email sending disabled when not configured |

**Config Consistency Verdict:** ✅ ALL PASS — no mismatches

---

### 5. Security Scan

**Test Type:** Security Scan
**Sprint 22 Scope:** T-101 (notification preferences, email service, unsubscribe, admin trigger)

#### Authentication & Authorization
| Item | Result | Evidence |
|------|--------|----------|
| All API endpoints require auth | ✅ PASS | `router.use(authenticate)` on preferences routes; admin trigger has auth; unsubscribe uses HMAC token |
| Auth tokens have expiration | ✅ PASS | JWT_EXPIRES_IN=15m, REFRESH_TOKEN_EXPIRES_DAYS=7 (unchanged from baseline) |
| Password hashing | ✅ PASS | bcrypt (unchanged from baseline) |
| Failed login rate limiting | ✅ PASS | AUTH_RATE_LIMIT_MAX=20 (unchanged from baseline) |

#### Input Validation & Injection Prevention
| Item | Result | Evidence |
|------|--------|----------|
| SQL parameterized queries | ✅ PASS | `NotificationPreference` model uses Knex `.where()`, `.insert()`, `.update()` — no string concatenation |
| XSS prevention in email HTML | ✅ PASS | `_escape()` applied to `userName`, `plant_name`, `care_type` in email template |
| XSS prevention in frontend | ✅ PASS | React auto-escapes JSX; no `dangerouslySetInnerHTML` |
| Input validation server-side | ✅ PASS | `reminder_hour_utc` checked: integer, 0–23 range; `opt_in` checked: boolean type |

#### API Security
| Item | Result | Evidence |
|------|--------|----------|
| CORS configured | ✅ PASS | Whitelist-based origin check in `app.js` |
| Rate limiting on endpoints | ✅ PASS | General limiter on `/api/`, auth limiter on `/api/v1/auth/` |
| Error responses safe | ✅ PASS | `errorHandler.js` never leaks stack traces; returns `{ error: { message, code } }` |
| Security headers (Helmet) | ✅ PASS | `app.use(helmet())` — includes X-Content-Type-Options, X-Frame-Options, etc. |
| Admin endpoint production guard | ✅ PASS | `if (process.env.NODE_ENV !== 'production')` gates `/admin/trigger-reminders` registration |

#### Data Protection
| Item | Result | Evidence |
|------|--------|----------|
| Secrets in env vars, not code | ✅ PASS | `UNSUBSCRIBE_SECRET`, `EMAIL_PASS`, `JWT_SECRET` all via `process.env` |
| No hardcoded secrets in source | ✅ PASS | Searched `backend/src/` — no hardcoded keys/passwords found |
| HMAC uses constant-time comparison | ✅ PASS | `crypto.timingSafeEqual()` in `verifyUnsubscribeToken()` |
| Logs do not contain PII/tokens | ✅ PASS | Email service logs only `[EmailService] Failed to send reminder to <email>: <error.message>` — no token/password leakage |

#### Dependencies
| Item | Result | Evidence |
|------|--------|----------|
| `npm audit` (backend) | ✅ 0 vulnerabilities | Ran 2026-04-05 |
| `npm audit` (frontend) | ✅ 0 vulnerabilities | Ran 2026-04-05 |

**Security Scan Verdict:** ✅ ALL PASS — no P1 issues

---

### 6. Product-Perspective Testing Notes

**Test Type:** Product Perspective

| Scenario | Observation | Category |
|----------|-------------|----------|
| New user visits Profile page | GET preferences auto-creates defaults → toggle off, morning selected. Clean UX — no "set up your preferences" nudge required. | Positive |
| User toggles on → timing selector animates open | `max-height` + `opacity` transition with `prefers-reduced-motion` respect. Smooth, non-jarring. | Positive |
| User saves with success → toast appears | Clear feedback loop. Toast message differentiates "saved" vs "turned off". | Positive |
| User toggles off from on state → "Save changes" label | Good micro-copy distinction — user knows they need to explicitly save the opt-out. | Positive |
| API failure during load | Graceful degradation — "Could not load your current settings." + toggle defaults to off. User can still interact. | Positive |
| API failure during save | Inline error with `role="alert"` + dismiss X. Error stays until dismissed — user won't miss it. | Positive |
| Backend starts without SMTP env vars | Logs warning, does not crash. Email sending is a no-op. Trigger endpoint still works (returns `emails_sent: 0`). | Positive |
| `unsubscribe` API function missing `uid` param | Frontend `api.js` only passes `token` but backend requires `token` + `uid`. Not a bug in Sprint 22 scope (no unsubscribe page built yet), but needs fix when unsubscribe page is built. | UX Issue — Minor — deferred |

**Product Perspective Verdict:** Strong implementation. Clean UX for the novice persona. No blocking issues.

---

### Summary

| Test Type | Result |
|-----------|--------|
| Unit Tests — Backend | ✅ 166/166 PASS (17 new) |
| Unit Tests — Frontend | ✅ 239/239 PASS (12 new) |
| Integration Test | ✅ ALL PASS |
| Config Consistency | ✅ ALL PASS |
| Security Scan | ✅ ALL PASS — 0 vulnerabilities |
| Product Perspective | ✅ No blocking issues |

**Overall QA Verdict: ✅ PASS — Sprint 22 tasks T-101 and T-102 are approved for deployment.**

---

## Sprint 22 — Post-Deploy Health Check
**Date:** 2026-04-05
**Environment:** Staging
**Logged by:** Monitor Agent

### Config Consistency Check

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Backend PORT vs Vite proxy port | PORT=3000, Vite proxy → `http://localhost:3000` | PORT=3000, proxy target `http://localhost:3000` | PASS |
| Protocol (HTTP/HTTPS) | No SSL certs configured → http:// | No `SSL_KEY_PATH`/`SSL_CERT_PATH` in `.env`; Vite proxy uses `http://localhost:3000` | PASS |
| CORS_ORIGIN includes frontend origin | `FRONTEND_URL` includes `http://localhost:5173` | `FRONTEND_URL=http://localhost:5173,http://localhost:5174,http://localhost:4173,http://localhost:4175` | PASS |
| Docker port mapping (if applicable) | `docker-compose.yml` maps `${POSTGRES_PORT:-5432}:5432` (DB only — no backend container) | Docker not available on host; PostgreSQL 15 via Homebrew on port 5432; no backend Docker container — N/A | N/A |

Config Consistency Result: PASS

### Health Checks

**Token acquisition:** POST /api/v1/auth/login → `200 OK` — access token received for `test@plantguardians.local`

**Process check:** Backend (PID 27606) confirmed running on port 3000 via `lsof -i :3000`

**Frontend build:** `frontend/dist/` exists — `assets/`, `favicon.svg`, `icons.svg`, `index.html` present

| Endpoint | Method | Expected | Status Code | Response | Result |
|----------|--------|----------|-------------|----------|--------|
| /api/health | GET | 200 | 200 | `{"status":"ok","timestamp":"2026-04-06T00:13:31.940Z"}` | PASS |
| /api/v1/profile/notification-preferences | GET (with auth) | 200 | 200 | `{"data":{"opt_in":false,"reminder_hour_utc":8}}` | PASS |
| /api/v1/profile/notification-preferences | GET (no auth) | 401 | 401 | Auth error | PASS |
| /api/v1/profile/notification-preferences | POST (with auth, valid body) | 200 | 200 | `{"data":{"opt_in":true,"reminder_hour_utc":8}}` | PASS |
| /api/v1/profile/notification-preferences | POST (no auth) | 401 | 401 | Auth error | PASS |
| /api/v1/profile/notification-preferences | POST (reminder_hour_utc=25) | 400 | 400 | `{"error":{"message":"reminder_hour_utc must be an integer between 0 and 23.","code":"VALIDATION_ERROR"}}` | PASS |
| /api/v1/unsubscribe | GET (no token) | 400 | 400 | `{"error":{"message":"Missing or invalid unsubscribe token.","code":"INVALID_TOKEN"}}` | PASS |
| /api/v1/unsubscribe | GET (malformed token) | 400 | 400 | `{"error":{"message":"Missing or invalid unsubscribe token.","code":"INVALID_TOKEN"}}` | PASS |
| /api/v1/admin/trigger-reminders | POST (with auth) | 200 | 200 | `{"data":{"triggered_at":"2026-04-06T00:13:51.734Z","hour_utc":0,"users_evaluated":0,"emails_sent":0,"users_skipped":0}}` | PASS |
| /api/v1/admin/trigger-reminders | POST (no auth) | 401 | 401 | Auth error | PASS |
| /api/v1/plants | GET (with auth) | 200 | 200 | 200 OK (regression check) | PASS |
| /api/v1/care-actions/streak | GET (with auth) | 200 | 200 | `{"data":{"currentStreak":2,"longestStreak":2,"lastActionDate":"2026-04-05"}}` | PASS |
| /api/v1/profile | GET (with auth) | 200 | 200 | 200 OK | PASS |

**Notes:**
- Email service gracefully disabled (no `EMAIL_HOST` set) — cron trigger endpoint still functions and returns correct response shape
- `POST /api/v1/admin/trigger-reminders` evaluated 0 users (no users have `opt_in=true` at current hour) — expected behavior
- `/api/v1/health` route is at `/api/health` (without `v1`) — matches Deploy Engineer smoke test log; 404 on `/api/v1/health` is expected per existing route configuration

### Summary
- **Deploy Verified:** Yes
- **Config Consistency:** PASS
- **Health Checks:** PASS
- **Issues Found:** None — all Sprint 22 endpoints operational, auth-protected correctly, validation working, graceful degradation confirmed for email service

---

