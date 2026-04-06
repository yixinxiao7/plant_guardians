# QA & Build Log

Tracks test runs, build results, and post-deploy health checks per sprint. Maintained by QA Engineer, Deploy Engineer, and Monitor Agent.

---

## Sprint 23 — QA Engineer: Re-verification Run (2026-04-05, Run 2)

**Timestamp:** 2026-04-05
**Agent:** QA Engineer
**Purpose:** Fresh re-verification of all Sprint 23 tasks before deploy handoff.

| Check | Result | Notes |
|-------|--------|-------|
| Backend unit tests | **171/171 PASS** | 18 suites, 0 failures. Ran `cd backend && npm test`. |
| Frontend unit tests | **249/249 PASS** | 33 files, 0 failures. Ran `cd frontend && npm test`. |
| npm audit (backend) | **0 vulnerabilities** | `cd backend && npm audit` — clean. |
| Config consistency | **PASS** | PORT=3000 matches vite proxy target `http://localhost:3000`. No SSL mismatch. CORS includes `http://localhost:5173`. |
| Security checklist | **PASS** | No hardcoded secrets in source. Parameterized queries. Error handler leaks no internals. Auth enforced on DELETE /api/v1/profile. |
| Integration: T-103 | **PASS** | api.js unsubscribe(token, uid) sends both params. UnsubscribePage reads from URL, calls API, handles loading/success/error. |
| Integration: T-106+T-107 | **PASS** | profile.delete() sends DELETE with auth header, handles 204/401/error. Modal has DELETE text gate, loading, inline error, redirect. |
| Integration: T-104 | **PASS** | daysAgo(0) uses setUTCHours(0,0,0,0) — always in the past. 9 streak tests pass. |

**Verdict: ALL PASS ✅ — Re-verification confirms prior QA results. Ready for deploy.**

---

## Sprint 23 — QA Engineer: Full QA Verification (2026-04-05)

### Unit Test Results

**Timestamp:** 2026-04-05
**Agent:** QA Engineer
**Test Type:** Unit Test
**Sprint:** 23
**Related Tasks:** T-103, T-104, T-106, T-107

#### Backend Unit Tests — PASS ✅

- **Result:** 171/171 tests passed, 18 test suites, 0 failures
- **Command:** `cd backend && npm test`
- **T-104 (Streak test fix):** `daysAgo(0)` now uses `d.setUTCHours(0, 0, 0, 0)` (start-of-day UTC). All 9 streak tests pass. Fix is correct — start-of-day UTC is always ≤ current time at any UTC hour.
- **T-106 (Account deletion):** 5 new tests in `profileDelete.test.js`:
  1. Happy path — deletes user + all data (plants, care_actions, refresh_tokens), returns 204 ✅
  2. Notification preferences cascade — deletes notification_preferences along with user ✅
  3. 401 (no auth token) ✅
  4. User isolation — deleting user A does not affect user B ✅
  5. Cookie cleared on success — Set-Cookie header clears refresh_token ✅
- **Coverage assessment:** T-106 has 1 happy-path + 1 error-path (401) + 3 additional coverage tests. Meets requirements.
- **Note:** No explicit 404 test for already-deleted user (edge case). Code handles it correctly via NotFoundError. Non-blocking.

#### Frontend Unit Tests — PASS ✅

- **Result:** 249/249 tests passed, 33 test files, 0 failures
- **Command:** `cd frontend && npm test`
- **T-103 (Unsubscribe page):** 7 new tests in `UnsubscribePage.test.jsx`:
  1. Loading state on mount with valid params ✅
  2. Success state after successful unsubscribe ✅
  3. Passes both token and uid to API ✅
  4. Error state when token missing ✅
  5. Error state when uid missing ✅
  6. Error state on INVALID_TOKEN API error ✅
  7. Error state on server failure ✅
- **Coverage assessment:** T-103 has 2 happy-path + 5 error-path tests. Exceeds minimum 4 requirement.
- **T-107 (Account deletion UI):** 14+ tests across `DeleteAccountModal.test.jsx` (11 tests), `ProfilePage.test.jsx` (7 Danger Zone tests), `LoginPage.test.jsx` (5 tests including deletion banner):
  - Modal not rendered when closed ✅
  - Modal renders with consequence list and confirmation input ✅
  - Confirm button disabled when empty / wrong case / incomplete ✅
  - Confirm button enabled when exactly "DELETE" ✅
  - Calls onConfirmDelete on confirm click ✅
  - Shows inline error on API failure (role="alert") ✅
  - Cancel and Close × buttons work ✅
  - Danger Zone collapsed by default (aria-expanded="false") ✅
  - Danger Zone expands on click ✅
  - Modal opens from Danger Zone ✅
  - profile.delete() called and redirects to /login?deleted=true on success ✅
  - Inline error when deletion fails ✅
  - Login page shows deletion banner with ?deleted=true ✅
  - Banner dismisses on × click ✅
- **Coverage assessment:** T-107 has 14+ tests (6+ required). Comprehensive coverage of all states.

---

### Integration Test Results

**Timestamp:** 2026-04-05
**Agent:** QA Engineer
**Test Type:** Integration Test
**Sprint:** 23
**Related Tasks:** T-103, T-106 + T-107

#### T-103 — Unsubscribe Page Integration — PASS ✅

| Check | Result | Notes |
|-------|--------|-------|
| `/unsubscribe` route registered in App.jsx | ✅ | Line 93, outside ProtectedRoute (public) |
| Route requires no auth | ✅ | Not wrapped in ProtectedRoute |
| UnsubscribePage reads token + uid from URL query string | ✅ | `useSearchParams()` at lines 8, 12-13 |
| Calls `notificationPreferences.unsubscribe(token, uid)` on mount | ✅ | useEffect at line 15, calls with both params |
| api.js `unsubscribe(token, uid)` sends both as query params | ✅ | Lines 335-341: `URLSearchParams` with token and uid |
| API target: `GET /api/v1/unsubscribe?token=<t>&uid=<u>` | ✅ | Uses `skipAuth: true`, matches contract |
| Loading state ("Processing your request…") | ✅ | Spinner + text, aria-busy="true" |
| Success state ("You've been unsubscribed") | ✅ | CheckCircle icon, confirmation text, CTA link |
| Error state — missing params | ✅ | Shows "Link not valid" immediately without API call |
| Error state — INVALID_TOKEN | ✅ | Catches error code, shows appropriate message |
| Error state — server failure | ✅ | Shows "Something went wrong" generic message |
| Dark mode via CSS custom properties | ✅ | Uses `var(--color-*)` throughout, no hardcoded colors |
| No XSS — URL params not rendered to DOM | ✅ | Token/uid used only in API call, not displayed |
| Cleanup on unmount (cancelled flag) | ✅ | Prevents state updates after unmount |

#### T-106 + T-107 — Account Deletion Integration — PASS ✅

| Check | Result | Notes |
|-------|--------|-------|
| Backend: `DELETE /api/v1/profile` registered | ✅ | profile.js line 50, under `authenticate` middleware |
| Backend: Auth required (JWT) | ✅ | `router.use(authenticate)` at line 12 |
| Backend: Transaction deletes all 6 tables | ✅ | care_actions → notification_preferences → care_schedules → plants → refresh_tokens → users |
| Backend: Returns 204 No Content | ✅ | `res.status(204).send()` at line 81 |
| Backend: Returns 401 for unauthenticated | ✅ | Via authenticate middleware |
| Backend: Returns 404 for missing user | ✅ | NotFoundError thrown when deletedCount === 0 |
| Backend: Clears refresh_token cookie | ✅ | `clearRefreshTokenCookie(res)` called |
| Backend: Parameterized Knex queries | ✅ | All queries use `.where()` / `.whereIn()` — no SQL concatenation |
| Frontend: `profile.delete()` in api.js | ✅ | Sends DELETE with auth header, handles 204/401/error |
| Frontend: Danger Zone collapsed by default | ✅ | aria-expanded="false" on trigger button |
| Frontend: Confirmation modal with "DELETE" text gate | ✅ | `confirmText === 'DELETE'` exact match, case-sensitive |
| Frontend: Confirm button disabled until match | ✅ | `disabled={!isConfirmEnabled}`, `aria-disabled` |
| Frontend: Loading spinner during API call | ✅ | `deleting` state toggles spinner |
| Frontend: Success → auth cleared → redirect to /login?deleted=true | ✅ | onConfirmDelete handles logout + navigate with replace |
| Frontend: Login page deletion banner with ?deleted=true | ✅ | Dismissible banner, role="status" |
| Frontend: Inline error on failure | ✅ | "Could not delete your account. Please try again.", role="alert" |
| Frontend: Focus trap in modal | ✅ | Tab/Shift+Tab cycle, Escape closes |
| Frontend: Accessibility | ✅ | role="dialog", aria-modal, aria-labelledby, aria-label, aria-disabled |
| Frontend: Dark mode via CSS custom properties | ✅ | var(--color-*) throughout |
| Request/response shape matches contract | ✅ | DELETE, no body, 204/401/404/500 all handled |

#### T-104 — Streak Test Fix Integration — PASS ✅

| Check | Result | Notes |
|-------|--------|-------|
| `daysAgo(0)` no longer produces future timestamp | ✅ | Uses `setUTCHours(0, 0, 0, 0)` — always start-of-day UTC |
| All 9 streak tests pass | ✅ | Verified in full suite run (171/171) |
| No endpoint or behavioral changes | ✅ | Test-only change, no source code modified |

---

### Config Consistency Check

**Timestamp:** 2026-04-05
**Agent:** QA Engineer
**Test Type:** Config Consistency
**Sprint:** 23

| Check | Result | Notes |
|-------|--------|-------|
| Backend PORT (3000) matches vite proxy target | ✅ | backend/.env: `PORT=3000`, vite.config.js: `http://localhost:3000` |
| SSL consistency (no SSL in dev) | ✅ | Backend uses no SSL, vite proxy uses `http://` — consistent |
| CORS_ORIGIN includes frontend dev server | ✅ | FRONTEND_URL includes `http://localhost:5173` (and 5174, 4173, 4175) |
| Docker postgres ports | ✅ | Dev: 5432 (matches DATABASE_URL), Test: 5433 (Docker) / 5432 (local) — documented |

**Result:** No config consistency issues found.

---

### Security Scan Results

**Timestamp:** 2026-04-05
**Agent:** QA Engineer
**Test Type:** Security Scan
**Sprint:** 23
**Related Tasks:** T-103, T-104, T-106, T-107

#### npm audit — PASS ✅
- `cd backend && npm audit` → **0 vulnerabilities found**

#### Security Checklist Verification

| Checklist Item | Status | Notes |
|----------------|--------|-------|
| **Auth & Authorization** | | |
| All API endpoints require authentication | ✅ | DELETE /api/v1/profile uses `authenticate` middleware. Unsubscribe is public but uses HMAC token verification. |
| Auth tokens have expiration | ✅ | JWT 15min, refresh 7 days (existing) |
| Password hashing uses bcrypt | ✅ | bcrypt with 12 salt rounds (User.js line 4) |
| **Input Validation** | | |
| User inputs validated server-side | ✅ | DELETE /api/v1/profile requires no body. Unsubscribe validates token via HMAC. |
| SQL queries use parameterized statements | ✅ | All Knex `.where()` / `.whereIn()` — no string concatenation |
| HTML output sanitized (XSS) | ✅ | React auto-escapes. Token/uid in UnsubscribePage never rendered to DOM. No dangerouslySetInnerHTML. |
| **API Security** | | |
| CORS configured for expected origins | ✅ | FRONTEND_URL includes localhost:5173 + variants |
| API responses don't leak internals | ✅ | Error responses use structured `{ error: { message, code } }`. No stack traces. |
| Sensitive data not in URL params | ✅ | DELETE /api/v1/profile uses auth header. Unsubscribe uses HMAC token (not sensitive). |
| Security headers (helmet) | ✅ | helmet() middleware applied in app.js |
| **Data Protection** | | |
| Database credentials in env vars | ✅ | DATABASE_URL, JWT_SECRET in .env, not in code |
| .env not committed to git | ✅ | .gitignore includes `.env`. `git ls-files --cached backend/.env` returns empty. |
| Logs do not contain PII/tokens | ✅ | EmailService logs warnings only (no PII). Error middleware logs code only. |
| **Infrastructure** | | |
| Dependencies checked for vulnerabilities | ✅ | npm audit: 0 vulnerabilities |

#### Hardcoded Secrets Scan

| Finding | Severity | Notes |
|---------|----------|-------|
| `GEMINI_API_KEY` in backend/.env | ⚠️ INFO | Real API key in .env file, but .env is gitignored. Not hardcoded in source code. backend/src/routes/ai.js reads from `process.env.GEMINI_API_KEY`. Acceptable for local dev. |
| `JWT_SECRET` in backend/.env | ⚠️ INFO | In .env file (gitignored), not in source code. Read from `process.env.JWT_SECRET`. Acceptable. |
| Test seed password `TestPass123!` | ⚠️ INFO | In seeds/01_test_user.js. Test-only, non-production. Acceptable. |

**No P1 security issues found.** All Sprint 23 changes follow security best practices.

---

### Product-Perspective Testing

**Timestamp:** 2026-04-05
**Agent:** QA Engineer
**Sprint:** 23

#### Unsubscribe Flow (T-103)

- **Realistic scenario:** User clicks unsubscribe link in email → lands on `/unsubscribe?token=abc&uid=user-1` → sees loading spinner → sees success confirmation.
- **Edge cases tested:**
  - Missing token → immediate error state (no API call made) ✅
  - Missing uid → immediate error state ✅
  - Invalid/expired token → API returns 400, error shown ✅
  - Already-deleted user → API returns 404, error shown ✅
  - Network failure → generic error message ✅
- **UX observation:** Success page has clear "Go to Plant Guardians" CTA and text about re-enabling from profile. Good UX.
- **Cleanup on unmount:** Cancelled flag prevents stale state updates. Good defensive coding.

#### Account Deletion Flow (T-106 + T-107)

- **Realistic scenario:** User navigates to Profile → scrolls to bottom → expands "Danger Zone" → clicks "Delete my account" → modal appears → types "DELETE" → clicks confirm → loading spinner → redirect to login with banner.
- **Edge cases tested:**
  - Typing "delete" (wrong case) → button stays disabled ✅
  - Typing "DELET" (incomplete) → button stays disabled ✅
  - Typing "DELETE " (trailing space) → button stays disabled (exact match) ✅
  - API failure → inline error, modal stays open, can retry ✅
  - Escape key closes modal ✅
  - Backdrop click closes modal ✅
  - Focus trapped inside modal ✅
  - Deletion banner on login page dismisses on click ✅
- **Data isolation:** Deleting one user does not affect another's plants/actions (verified by test) ✅
- **Transaction safety:** If any delete step fails, entire transaction rolls back — no partial data loss ✅

---

## Sprint 23 QA Summary

| Task | Unit Tests | Integration | Security | Product | Final |
|------|-----------|-------------|----------|---------|-------|
| T-103 | ✅ PASS (7 tests) | ✅ PASS | ✅ PASS | ✅ PASS | **PASS** |
| T-104 | ✅ PASS (9 tests) | ✅ PASS | N/A (test-only) | N/A | **PASS** |
| T-106 | ✅ PASS (5 tests) | ✅ PASS | ✅ PASS | ✅ PASS | **PASS** |
| T-107 | ✅ PASS (14+ tests) | ✅ PASS | ✅ PASS | ✅ PASS | **PASS** |

**Overall Sprint 23 QA Verdict: ALL PASS ✅**

- Backend: 171/171 tests passing (5 new for T-106)
- Frontend: 249/249 tests passing (7 new for T-103, 14+ new/updated for T-107)
- Security: 0 npm vulnerabilities, no P1 issues, all checklist items verified
- Config: All ports, CORS, and proxy settings consistent
- Ready for Deploy Engineer handoff

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

