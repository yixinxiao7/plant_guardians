# QA & Build Log

Tracks test runs, build results, and post-deploy health checks per sprint. Maintained by QA Engineer, Deploy Engineer, and Monitor Agent.

---

## Sprint 23 — Deploy Engineer: Staging Build & Deploy (2026-04-05)

**Timestamp:** 2026-04-05
**Agent:** Deploy Engineer
**Sprint:** 23
**Environment:** Staging (local)

### Pre-Deploy Verification

| Check | Result | Notes |
|-------|--------|-------|
| QA sign-off | ✅ PASS | H-316: 171/171 backend, 249/249 frontend tests pass. 0 vulnerabilities. |
| All Sprint 23 tasks Done | ✅ PASS | T-103, T-104, T-105, T-106, T-107 — all Done |
| Pending migrations | ✅ NONE | No new migrations for Sprint 23 per H-314. Sprint 22 migration already applied. |
| Docker availability | ⚠️ N/A | Docker not installed on this host — using local process-based staging |

### Dependency Install

| Step | Result | Notes |
|------|--------|-------|
| `backend npm install` | ✅ SUCCESS | 0 vulnerabilities |
| `frontend npm install` | ✅ SUCCESS | 0 vulnerabilities |

### Frontend Build

| Step | Result | Notes |
|------|--------|-------|
| `frontend npm run build` | ✅ SUCCESS | Vite 8.0.2, 4649 modules, built in 340ms |
| dist/index.html | ✅ | 1.50 kB (gzip: 0.67 kB) |
| dist/assets/index.css | ✅ | 88.73 kB (gzip: 14.09 kB) |
| dist/assets/index.js | ✅ | 459.38 kB (gzip: 130.02 kB) |

### Database Migrations

| Step | Result | Notes |
|------|--------|-------|
| `npm run migrate` (staging DB) | ✅ SUCCESS | "Already up to date" — all 6 migrations applied: users, refresh_tokens, plants, care_schedules, care_actions, notification_preferences |

### Backend Start

| Step | Result | Notes |
|------|--------|-------|
| `npm start` (port 3000) | ✅ SUCCESS | Server started: "Plant Guardians API running on port 3000 [development]" |
| Database pool warm-up | ✅ SUCCESS | 2 connections established (pool.min=2) |
| HTTP response check | ✅ RESPONDING | HTTP 404 on unregistered path — server live and handling requests |
| EmailService | ⚠️ WARNING | EMAIL_HOST not configured — email sending disabled (expected, no SMTP in staging) |

### Build Status Summary

| Field | Value |
|-------|-------|
| **Build Status** | SUCCESS |
| **Environment** | Staging (local) |
| **Backend URL** | http://localhost:3000 |
| **Frontend dist** | frontend/dist/ (production build ready to serve) |
| **Migrations** | Up to date (6/6 applied) |
| **Date** | 2026-04-05 |

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

## Sprint 23 — Post-Deploy Health Check
**Date:** 2026-04-05
**Agent:** Monitor Agent
**Environment:** Staging (local)
**Test Type:** Config Consistency + Post-Deploy Health Check

### Config Consistency Results

| Check | Result | Details |
|-------|--------|---------|
| Port match | PASS | `backend/.env` PORT=3000 matches Vite proxy target `http://localhost:3000` |
| Protocol match | PASS | No `SSL_KEY_PATH` or `SSL_CERT_PATH` set in `.env` — backend serves plain HTTP. Vite proxy target uses `http://` — consistent. |
| CORS match | PASS | `FRONTEND_URL=http://localhost:5173,http://localhost:5174,http://localhost:4173,http://localhost:4175` — includes `http://localhost:5173` (Vite dev server default). `app.js` reads this env var correctly. |
| Docker port match | N/A | `infra/docker-compose.yml` only defines Postgres containers (ports 5432/5433). No backend container defined — no port mapping to validate. |

### Health Check Results

- **Timestamp:** 2026-04-05T00:00:00Z
- **Token:** Not acquired — backend unreachable
- **App responds (GET /api/v1/health):** FAIL — curl exit code 7 (connection refused). Backend is not running on port 3000.
- **Auth works (POST /api/v1/auth/login):** FAIL — curl exit code 7 (connection refused).
- **GET /api/v1/plants:** FAIL — backend not running, not tested.
- **GET /api/v1/care-due:** FAIL — backend not running, not tested.
- **GET /api/v1/care-actions:** FAIL — backend not running, not tested.
- **GET /api/v1/profile:** FAIL — backend not running, not tested.
- **Frontend dev server (http://localhost:5173):** FAIL — curl exit code 7 (not running).
- **Frontend production build (frontend/dist/):** PASS — `dist/index.html`, `dist/assets/index.js`, `dist/assets/index.css`, `dist/assets/confetti.module-*.js` confirmed present.
- **No 5xx errors:** N/A — backend unreachable; no responses received.
- **Database connected:** Unknown — backend did not start; pool warm-up status unverifiable.
- **Config PORT match:** PASS
- **Config protocol match:** PASS
- **Config CORS match:** PASS

**Deploy Verified:** No
**Error Summary:** Backend process is not running on port 3000 at time of Monitor Agent health check. All API endpoints are unreachable (curl exit code 7: connection refused). Frontend production build artifacts exist in `frontend/dist/` (built by Deploy Engineer per qa-build-log), but the dev server is also not running. The Deploy Engineer log (above) confirms the backend started successfully during the deploy phase — the process has since terminated. Recommend Deploy Engineer restart the backend (`npm start` in `backend/`) and confirm it remains running before Monitor Agent re-runs health checks. Config consistency is fully valid; no config issues require frontend or backend code changes.

---

