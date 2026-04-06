# QA & Build Log

Tracks test runs, build results, and post-deploy health checks per sprint. Maintained by QA Engineer, Deploy Engineer, and Monitor Agent.

---

## Build — Sprint #25 | 2026-04-06

**Agent:** Deploy Engineer
**Sprint:** 25
**Timestamp:** 2026-04-06T14:41:00Z
**Tasks:** T-115 (env cleanup), T-116 (care status date boundary fix)

### Pre-Deploy Checks

| Check | Result | Details |
|-------|--------|---------|
| QA confirmation (H-340) | ✅ PASS | 188/188 backend tests, 259/259 frontend tests — all pass |
| All Sprint 25 tasks Done | ✅ PASS | T-112 (cancelled), T-113 (cancelled), T-114 (cancelled), T-115 Done, T-116 Done |
| Pending migrations | ✅ None | `knex migrate:latest` → "Already up to date" — all 6 migrations previously applied |

### Dependency Install

| Step | Result | Details |
|------|--------|---------|
| `backend npm install` | ✅ PASS | 0 vulnerabilities |
| `frontend npm install` | ✅ PASS | 0 vulnerabilities |

### Frontend Build

| Step | Result | Details |
|------|--------|---------|
| `npm run build` | ✅ PASS | Vite v8.0.2 — 4651 modules transformed |
| Output | ✅ PASS | `dist/index.html` 1.50 kB, `dist/assets/index-*.js` 465.07 kB (131.48 kB gzip), `dist/assets/index-*.css` 92.65 kB |
| Build time | ✅ PASS | 351ms |
| Errors | None | Clean build, no warnings |

### Staging Deployment

**Environment:** Staging (local processes — Docker not available on this host)

| Step | Result | Details |
|------|--------|---------|
| Docker availability | ⚠️ N/A | `docker` command not found — running local processes instead (same as Sprint #24) |
| Database migrations | ✅ PASS | `npm run migrate` → "Already up to date" (all 6 migrations applied) |
| Backend start | ✅ PASS | `node src/server.js` — PID 45166 |
| Backend port | ✅ PASS | Listening on port 3000 |
| DB pool | ✅ PASS | "Database pool warmed up with 2 connections" |
| Email service | ✅ PASS (expected) | "EMAIL_HOST not configured — email sending disabled" — graceful degradation |
| `GET /api/health` | ✅ PASS | HTTP 200 `{"status":"ok","timestamp":"2026-04-06T14:41:36.846Z"}` |

**Build Status: ✅ SUCCESS**
**Environment: Staging**
**Backend URL:** http://localhost:3000
**Frontend dist:** frontend/dist/ (ready to serve)

---

## QA Verification — Sprint #25 | 2026-04-06

**Agent:** QA Engineer
**Sprint:** 25
**Timestamp:** 2026-04-06
**Tasks Verified:** T-115 (.env cleanup), T-116 (care status date boundary fix)

---

### Test Type: Unit Test

#### Backend Tests
| Metric | Result |
|--------|--------|
| Test suites | 21 passed, 21 total |
| Tests | 188 passed, 188 total |
| Snapshots | 0 total |
| Result | ✅ **PASS** |

Notable test coverage for T-116:
- `careDueStatusConsistency.test.js` — 5 regression tests covering:
  - Overdue consistency at `utcOffset=0`
  - Timezone boundary at `utcOffset=330` (UTC+5:30, India)
  - Negative offset at `utcOffset=-300` (US Eastern)
  - `due_today` consistency between both endpoints
  - Monthly frequency calendar arithmetic (T-116 month fix)
- Happy-path and error-path coverage verified for all endpoints

#### Frontend Tests
| Metric | Result |
|--------|--------|
| Test suites | 33 passed, 33 total |
| Tests | 259 passed, 259 total |
| Result | ✅ **PASS** |

**Baseline maintained:** Backend 188/188 (up from 183/183 baseline with 5 new T-116 regression tests). Frontend 259/259 unchanged.

---

### Test Type: Integration Test

#### T-116 — Care Status Consistency Verification

| Check | Result | Details |
|-------|--------|---------|
| Shared algorithm | ✅ PASS | `careDue.js` imports and uses `computeNextDueAt` from `careStatus.js` — single source of truth |
| Math.floor alignment | ✅ PASS | Both `careDue.js:78` and `careStatus.js:58` use `Math.floor` (not `Math.round`) |
| Day-truncation logic | ✅ PASS | Both files truncate dates to UTC day boundary identically via `Date.UTC(y, m, d)` |
| Baseline handling | ✅ PASS | Both use `last_done_at || plant_created_at` as baseline for `computeNextDueAt` |
| Month arithmetic | ✅ PASS | `computeNextDueAt` uses `setUTCMonth()` for calendar months (not `value × 30`) |
| utcOffset handling | ✅ PASS | Both compute `localNow` then truncate to `today` identically |
| Critical invariant | ✅ PASS | Overdue plant in GET /plants also in overdue[] of GET /care-due — verified via 5 regression tests |

#### T-115 — .env Cleanup Verification

| Check | Result | Details |
|-------|--------|---------|
| Legacy vars removed | ✅ PASS | `grep -r "RATE_LIMIT_WINDOW_MS\|AUTH_RATE_LIMIT_MAX" backend/` returns nothing |
| T-111 vars in .env | ✅ PASS | All 6 vars present: `RATE_LIMIT_AUTH_MAX`, `RATE_LIMIT_AUTH_WINDOW_MS`, `RATE_LIMIT_STATS_MAX`, `RATE_LIMIT_STATS_WINDOW_MS`, `RATE_LIMIT_GLOBAL_MAX`, `RATE_LIMIT_GLOBAL_WINDOW_MS` |
| .env.example aligned | ✅ PASS | Same 6 vars with matching default values |
| .env.staging.example aligned | ✅ PASS | Same 6 vars with matching default values |
| rateLimiter.js reads correct names | ✅ PASS | Middleware references all 6 T-111 env var names with safe fallback defaults |
| No behavioral change | ✅ PASS | 188/188 tests pass — no regressions |

**Integration Test Result: ✅ PASS**

---

### Test Type: Config Consistency

| Check | Result | Details |
|-------|--------|---------|
| Port match | ✅ PASS | `backend/.env` PORT=3000; `vite.config.js` proxy target=`http://localhost:3000` — match |
| Protocol match | ✅ PASS | No SSL env vars in `.env`; Vite proxy uses `http://` — match |
| CORS match | ✅ PASS | `FRONTEND_URL=http://localhost:5173,...` includes Vite default dev origin |
| Docker port match | ✅ N/A | `docker-compose.yml` only defines Postgres services, no backend container |

**Config Consistency: ✅ PASS**

---

### Test Type: Security Scan

#### Security Checklist Verification

| Item | Result | Details |
|------|--------|---------|
| **Auth & Authorization** | | |
| API endpoints require auth | ✅ PASS | `careDue.js` uses `router.use(authenticate)` — all routes protected |
| Auth tokens | ✅ PASS | JWT with access/refresh tokens (architecture confirmed) |
| Password hashing | ✅ PASS | bcrypt used (verified in prior sprints, no changes this sprint) |
| Rate limiting on auth | ✅ PASS | `authLimiter` applied to login/register/refresh endpoints |
| **Input Validation** | | |
| Parameterized queries | ✅ PASS | No raw SQL string concatenation found in `backend/src/` |
| XSS prevention | ✅ PASS | No `dangerouslySetInnerHTML` in production frontend code (only in test assertions) |
| utcOffset validation | ✅ PASS | `careDue.js` validates range [-840, 840], integer check, returns 400 on invalid |
| **API Security** | | |
| CORS configured | ✅ PASS | `app.js` allows only origins listed in `FRONTEND_URL` env var |
| Rate limiting | ✅ PASS | Three-tier rate limiting: auth (10/15min), stats (60/1min), global (200/15min) |
| Error responses safe | ✅ PASS | `errorHandler.js` returns generic "An unexpected error occurred" for unknown errors; no stack traces leaked |
| Helmet headers | ✅ PASS | `app.use(helmet())` in `app.js` — security headers applied |
| **Data Protection** | | |
| Secrets in env vars | ✅ PASS | `GEMINI_API_KEY` in `.env` (gitignored); no hardcoded secrets in source code |
| .env gitignored | ✅ PASS | `.gitignore` includes `.env` |
| **Infrastructure** | | |
| npm audit | ✅ PASS | `npm audit` found 0 vulnerabilities |
| No default credentials | ✅ PASS | Docker-compose uses env var defaults, not production creds |

**Security Scan Result: ✅ PASS — No P1 issues found**

---

### Summary

| Category | T-115 | T-116 |
|----------|-------|-------|
| Unit Tests | ✅ PASS (188/188) | ✅ PASS (188/188) |
| Integration Test | ✅ PASS | ✅ PASS |
| Config Consistency | ✅ PASS | ✅ PASS |
| Security Scan | ✅ PASS | ✅ PASS |
| **Overall** | **✅ PASS — Ready for Deploy** | **✅ PASS — Ready for Deploy** |

---

## Post-Deploy Health Check — Sprint #24 | 2026-04-06

**Agent:** Monitor Agent
**Environment:** Staging (local)
**Timestamp:** 2026-04-06T14:00:25Z
**Token:** Acquired via `POST /api/v1/auth/login` with `test@plantguardians.local` (NOT /auth/register)

---

### Test Type: Config Consistency

| Check | Result | Details |
|-------|--------|---------|
| **Port match** | ✅ PASS | `backend/.env` PORT=3000; Vite proxy target=`http://localhost:3000` — ports match |
| **Protocol match** | ✅ PASS | No `SSL_KEY_PATH` or `SSL_CERT_PATH` set in `.env` → backend serves HTTP. Vite proxy uses `http://` — protocols match |
| **CORS match** | ✅ PASS | `FRONTEND_URL=http://localhost:5173,...` (read as CORS allowlist via `process.env.FRONTEND_URL` in `app.js:35`). Includes `http://localhost:5173` — Vite default dev server origin is covered |
| **Docker port match** | ✅ N/A | `infra/docker-compose.yml` defines only Postgres services (no backend container). Backend deployed as local Node.js process — no container port mapping to validate |

**Config Consistency: PASS** — all stack config is internally consistent.

**Note (non-blocking, pre-existing FB-107):** `backend/.env` contains stale rate-limit variable names from prior sprints (`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX`) that do not match the T-111 variable names (`RATE_LIMIT_AUTH_MAX`, `RATE_LIMIT_AUTH_WINDOW_MS`, etc.). The backend `rateLimiter.js` correctly reads the T-111 names and falls back to safe defaults — no functional impact. No action required this sprint; cleanup already logged as FB-107.

---

### Test Type: Post-Deploy Health Check

#### Backend Process
| Check | Result | Details |
|-------|--------|---------|
| Backend process start | ✅ PASS | Server logs confirmed: `Plant Guardians API running on port 3000 [development]` |
| Database pool | ✅ PASS | `Database pool warmed up with 2 connections (pool.min=2)` — DB connectivity confirmed at startup |
| Email service | ✅ PASS (expected) | `[EmailService] WARNING: EMAIL_HOST not configured — email sending disabled`. Graceful degradation as designed |

#### Health Endpoint
| Check | Result | Details |
|-------|--------|---------|
| `GET /api/health` | ✅ PASS | HTTP 200 — `{"status":"ok","timestamp":"2026-04-06T14:00:25.448Z"}` |

#### Auth Flow (T-111 — Rate Limiting)
| Check | Result | Details |
|-------|--------|---------|
| `POST /api/v1/auth/login` — 200 | ✅ PASS | HTTP 200 — returned `access_token` + user object for `test@plantguardians.local` |
| `POST /api/v1/auth/login` — RateLimit-Limit header | ✅ PASS | `RateLimit-Limit: 10` present — auth limiter active |
| `POST /api/v1/auth/login` — RateLimit-Remaining header | ✅ PASS | `RateLimit-Remaining: 8` present |
| `POST /api/v1/auth/login` — RateLimit-Reset header | ✅ PASS | `RateLimit-Reset: 880` present |
| `POST /api/v1/auth/login` — RateLimit-Policy header | ✅ PASS | `RateLimit-Policy: 10;w=900` — confirms 10 req / 15 min window |

#### Endpoint: GET /api/v1/care-due (regression check)
| Check | Result | Details |
|-------|--------|---------|
| Response status | ✅ PASS | HTTP 200 |
| Response shape | ✅ PASS | `{"data":{"overdue":[],"due_today":[],"upcoming":[...]}}` — matches contract |
| No 5xx errors | ✅ PASS | Clean response |

#### Endpoint: POST /api/v1/care-actions/batch (T-109 — new Sprint 24 endpoint)
| Check | Result | Details |
|-------|--------|---------|
| Happy path (1 valid action) | ✅ PASS | HTTP 207 — `{"data":{"results":[{"plant_id":"ee21a6cd-...","care_type":"watering","performed_at":"2026-04-06T14:00:00.000Z","status":"created","error":null}],"created_count":1,"error_count":0}}` |
| Auth enforced (no token) | ✅ PASS | HTTP 401 — `{"error":{"message":"Missing or invalid authorization header.","code":"UNAUTHORIZED"}}` |
| Validation enforced (empty array) | ✅ PASS | HTTP 400 — `{"error":{"message":"actions must be a non-empty array with at most 50 items","code":"VALIDATION_ERROR"}}` |
| 207 response shape | ✅ PASS | `results[]` with per-item `plant_id`, `care_type`, `performed_at`, `status`, `error`; top-level `created_count` and `error_count` — matches api-contracts.md exactly |

#### Frontend Static Build
| Check | Result | Details |
|-------|--------|---------|
| `frontend/dist/` exists | ✅ PASS | Build output present: `index.html`, `assets/`, `favicon.svg`, `icons.svg` |

---

### Summary

| Category | Result |
|----------|--------|
| Config Consistency | ✅ PASS |
| Backend health endpoint | ✅ PASS |
| Database connectivity | ✅ PASS |
| Auth flow + rate limit headers | ✅ PASS |
| GET /api/v1/care-due | ✅ PASS |
| POST /api/v1/care-actions/batch | ✅ PASS |
| Frontend dist build | ✅ PASS |
| 5xx errors | ✅ None detected |

**Deploy Verified: Yes**

All Sprint #24 endpoints respond correctly. Rate limiting headers confirmed present on auth routes. Config is consistent across backend, Vite proxy, and CORS allowlist. No regressions detected. Staging environment is healthy and ready for Manager review.

---

## Build — Sprint #24 | 2026-04-06

- **Triggered by:** Deploy Engineer (Sprint #24)
- **Build Status:** Success
- **Frontend Build:** Vite v8.0.2 — 4651 modules transformed, built in 373ms. Output: `frontend/dist/` (index.html 1.50 kB, index.css 92.65 kB, index.js 465.07 kB, confetti module 10.59 kB). No errors or warnings.
- **Backend Install:** `npm install` — up to date, 446 packages audited, 0 vulnerabilities.
- **Frontend Install:** `npm install` — up to date, 243 packages audited, 0 vulnerabilities.
- **Notes:** No schema changes this sprint (per H-320). All Sprint 24 tasks (T-108–T-111) confirmed Done. QA confirmed 183/183 backend tests and 259/259 frontend tests passing (H-328).

---

## Deployment — Sprint #24 | 2026-04-06

- **Environment:** Staging (local)
- **Build Status:** Success
- **Backend URL:** http://localhost:3000
- **Frontend:** Built static files at `frontend/dist/`
- **Migrations Run:** No — `npm run migrate` returned "Already up to date". Sprint 24 requires no schema changes (batch care actions write to existing `care_actions` table; rate limiting is application-layer only).
- **Docker:** Not Available — `docker` command not found on this machine. Backend started as local Node.js process.
- **Backend Startup:** Confirmed — server logs: `Plant Guardians API running on port 3000 [development]`, `Database pool warmed up with 2 connections (pool.min=2)`. Email service disabled (EMAIL_HOST not configured) — expected, graceful degradation.
- **Notes:** Docker unavailable; staging deployment is local Node.js process on port 3000. Monitor Agent should verify backend health at http://localhost:3000/api/health (or /health).

---

## Sprint 24 — QA Engineer: Full QA Verification (2026-04-06)

**Timestamp:** 2026-04-06
**Agent:** QA Engineer
**Sprint:** 24
**Tasks Tested:** T-108, T-109, T-110, T-111

---

### Test Type: Unit Test — Backend (T-109, T-111)

| Check | Result | Notes |
|-------|--------|-------|
| `npm test` in `backend/` | ✅ **183/183 PASS** (20 suites) | 0 failures. 45.4s runtime. |
| T-109 batch tests (`careActionsBatch.test.js`) | ✅ **10/10 PASS** | 3 happy path (all created, partial ownership, all fail), 5 validation (missing array, empty, >50, invalid care_type, missing performed_at, invalid UUID), 1 auth (401 no token). Exceeds 6+ requirement. |
| T-111 rate limiter tests (`rateLimiter.test.js`) | ✅ **2/2 PASS** | Verifies export of 3 limiters and test env skip. Meets 2+ requirement. |
| Pre-existing rate limit test (`statsRateLimit.test.js`) | ✅ **1/1 PASS** | Confirms 429 response on stats endpoint after threshold (functional rate limit test). |
| `npm audit` | ✅ **0 vulnerabilities** | Clean. |

**Test coverage assessment (T-109):**
- Happy paths: ✅ All succeed (207 all created), partial ownership (207 mixed), all fail (207 all error)
- Error paths: ✅ Missing array (400), empty array (400), >50 items (400), invalid care_type (400), missing performed_at (400), invalid UUID (400), no auth (401)
- Coverage: **Excellent** — 10 tests covering all acceptance criteria

**Test coverage assessment (T-111):**
- Module export verification: ✅ All 3 limiters exported as functions
- Test env skip: ✅ Verified NODE_ENV=test causes skip
- Functional 429 test: ✅ Covered by pre-existing `statsRateLimit.test.js`
- Coverage: **Adequate** — meets minimum requirements

---

### Test Type: Unit Test — Frontend (T-110)

| Check | Result | Notes |
|-------|--------|-------|
| `npm test` in `frontend/` | ✅ **259/259 PASS** (33 files) | 0 failures. 3.43s runtime. |
| T-110 batch tests (in `CareDuePage.test.jsx`) | ✅ **10/10 PASS** | Selection toggle, checkbox toggle, select all, action bar count, confirmation flow, API success + toast, partial failure message, retry sends only failed, cancel flows, empty state after batch. Exceeds 8+ requirement. |

**Test coverage assessment (T-110):**
- Happy paths: ✅ Selection toggle, select all, mark done → success → toast, empty state after all marked
- Error paths: ✅ Partial failure display, retry sends only failed items
- UI states: ✅ Idle, confirm, loading (implicit in flow), partial-failure
- Interaction: ✅ Cancel in action bar vs cancel in header
- Coverage: **Excellent** — 10 tests covering all SPEC-019 acceptance criteria

---

### Test Type: Integration Test — T-109 + T-110 (Batch Mark-Done End-to-End)

| Check | Result | Notes |
|-------|--------|-------|
| Frontend calls correct endpoint | ✅ PASS | `careActions.batch(actions)` → `POST /api/v1/care-actions/batch` with body `{ actions: [...] }` |
| Request shape matches contract | ✅ PASS | Frontend sends `{ actions: [{ plant_id, care_type, performed_at }] }` — matches API contract exactly |
| Response handling — full success | ✅ PASS | Frontend checks `error_count === 0`, removes items, shows toast, exits selection mode |
| Response handling — partial failure | ✅ PASS | Frontend parses per-item `status`, removes successes, keeps failures selected, shows inline error |
| Response handling — all fail | ✅ PASS | Frontend sets partial-failure state with 0 success count |
| Response handling — network error | ✅ PASS | Frontend catches errors, shows generic toast, resets to idle |
| 401 handling | ✅ PASS | `api.js` `request()` auto-refreshes on 401, retries — standard auth flow |
| 207 response shape | ✅ PASS | Backend returns `{ data: { results: [...], created_count, error_count } }` — frontend destructures correctly |
| Retry flow | ✅ PASS | After partial failure, frontend only sends failed items' keys to build new batch |

**UI States Verification (SPEC-019 compliance):**

| State | Implemented | Notes |
|-------|-------------|-------|
| Loading (skeleton) | ✅ | Skeleton shimmer with `aria-busy="true"`, `aria-label` |
| Error | ✅ | Error message + retry button with `aria-label` |
| Empty (all clear) | ✅ | Illustration + "All your plants are happy!" + CTA |
| Populated (normal) | ✅ | 3 sections with items, mark-done buttons |
| Selection mode | ✅ | Toggle button, per-item checkboxes, select all |
| Action bar idle | ✅ | Count (`aria-live="polite"`) + "Mark done" button (`aria-disabled` when 0) |
| Action bar confirm | ✅ | Confirmation text + Cancel/Confirm buttons |
| Action bar loading | ✅ | Spinner + "Marking done..." + `aria-busy="true"` |
| Action bar partial-failure | ✅ | Warning icon + error message (`aria-live="assertive"`) + Retry button |
| Dark mode | ✅ | CSS custom properties throughout (`--batch-bar-bg`, `--checkbox-checked-bg`, etc.) |

---

### Test Type: Integration Test — T-111 (Rate Limiting)

| Check | Result | Notes |
|-------|--------|-------|
| Rate limiter registered in app.js | ✅ PASS | `globalLimiter` on `/api/`, `authLimiter` on `/api/v1/auth/`, `statsLimiter` on stats/streak |
| Auth tier config | ✅ PASS | 10 req / 15 min per IP (env overridable via `RATE_LIMIT_AUTH_MAX`, `RATE_LIMIT_AUTH_WINDOW_MS`) |
| Stats tier config | ✅ PASS | 60 req / 1 min per IP (env overridable via `RATE_LIMIT_STATS_MAX`, `RATE_LIMIT_STATS_WINDOW_MS`) |
| Global tier config | ✅ PASS | 200 req / 15 min per IP (env overridable via `RATE_LIMIT_GLOBAL_MAX`, `RATE_LIMIT_GLOBAL_WINDOW_MS`) |
| 429 response shape | ✅ PASS | `{ error: { message: "Too many requests...", code: "RATE_LIMIT_EXCEEDED" } }` — matches API contract |
| Test env skip | ✅ PASS | `skip: isTest` on all 3 limiters — `isTest()` returns `true` when `NODE_ENV=test` |
| Standard headers | ✅ PASS | `standardHeaders: true, legacyHeaders: false` — sends `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` |
| Trust proxy | ✅ PASS | `app.set('trust proxy', 1)` when `RENDER=true` or `NODE_ENV=production` |
| .env.example updated | ✅ PASS | All 6 env vars documented with correct defaults |

---

### Test Type: Config Consistency Check

| Check | Result | Notes |
|-------|--------|-------|
| Backend PORT vs vite proxy target | ✅ CONSISTENT | Backend `PORT=3000`, vite proxy target `http://localhost:3000` |
| SSL consistency | ✅ CONSISTENT | No SSL in dev — backend on `http://`, vite proxy uses `http://` |
| CORS includes frontend dev server | ✅ CONSISTENT | `FRONTEND_URL=http://localhost:5173,...` includes standard Vite dev port |
| CORS includes preview ports | ✅ CONSISTENT | Also includes `:5174`, `:4173`, `:4175` |
| Docker compose ports | ✅ CONSISTENT | `postgres: 5432:5432`, `postgres_test: 5433:5432` — matches `.env` DATABASE_URL and TEST_DATABASE_URL |

**Observation (non-blocking):** The `backend/.env` file has legacy rate limit env vars (`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX`) that don't match the new T-111 naming convention (`RATE_LIMIT_AUTH_MAX`, `RATE_LIMIT_STATS_MAX`, `RATE_LIMIT_GLOBAL_MAX`). The rateLimiter.js code falls back to correct hardcoded defaults, so there is no functional issue. The `.env.example` is correctly updated. The `.env` should be updated by the developer to match `.env.example` — logged as observation, not a blocker.

---

### Test Type: Security Scan

**Sprint 24 Security Checklist Verification:**

| Security Item | Status | Notes |
|---------------|--------|-------|
| **Auth & Authorization** | | |
| All API endpoints require auth | ✅ PASS | `POST /batch` uses `router.use(authenticate)` on careHistory.js — all routes protected |
| Role-based access control | ✅ PASS | Batch endpoint verifies plant ownership per user via `batchCreate(userId, actions)` |
| Auth tokens have expiration | ✅ PASS | JWT 15min + refresh 7 days (pre-existing) |
| Password hashing | ✅ PASS | bcrypt (pre-existing, no changes) |
| Failed login rate limiting | ✅ PASS | **NEW in T-111** — auth endpoints rate limited to 10 req/15min/IP |
| **Input Validation & Injection** | | |
| Inputs validated server-side | ✅ PASS | Batch endpoint validates: array length 1-50, each item's plant_id (UUID), care_type (enum), performed_at (ISO8601) |
| Parameterized queries | ✅ PASS | `CareAction.batchCreate()` uses Knex `.whereIn('id', uniquePlantIds)` and `trx('care_actions').insert(rows)` — no string concatenation |
| HTML output sanitized (XSS) | ✅ PASS | Frontend does not render user input as raw HTML; checkbox labels use `item.plant_name` via JSX (auto-escaped) |
| **API Security** | | |
| CORS configured correctly | ✅ PASS | Only allows specified origins; rejects unknown origins with error |
| Rate limiting on public endpoints | ✅ PASS | **NEW in T-111** — 3 tiers configured correctly |
| API responses don't leak internals | ✅ PASS | Error handler returns structured `{ error: { message, code } }` — never leaks stack traces (verified in `errorHandler.js`) |
| Sensitive data not in URL params | ✅ PASS | Batch endpoint uses POST body, not query params |
| Security headers | ✅ PASS | `helmet()` middleware applied (pre-existing) |
| **Data Protection** | | |
| Credentials in env vars | ✅ PASS | JWT_SECRET, DATABASE_URL, GEMINI_API_KEY in `.env` (not committed — `.gitignore` includes `.env`) |
| Logs don't contain PII | ✅ PASS | Error handler logs error object only; batch endpoint does not log request bodies |
| **Infrastructure** | | |
| npm audit clean | ✅ PASS | 0 vulnerabilities (both backend and frontend) |
| No hardcoded secrets in code | ✅ PASS | Searched implementation files — all secrets come from `process.env` |
| Default credentials removed | ✅ PASS | `.env.example` has placeholder values |
| Error pages don't reveal server info | ✅ PASS | 404 handler returns generic JSON; error handler returns generic message for unknown errors |

**Security Scan Result: ✅ ALL PASS — No P1 security issues.**

---

### Summary

| Category | Result |
|----------|--------|
| Backend unit tests | ✅ 183/183 (20 suites) |
| Frontend unit tests | ✅ 259/259 (33 files) |
| npm audit (backend) | ✅ 0 vulnerabilities |
| npm audit (frontend) | ✅ 0 vulnerabilities |
| Integration test (T-109 + T-110) | ✅ All checks pass |
| Integration test (T-111) | ✅ All checks pass |
| Config consistency | ✅ All consistent |
| Security checklist | ✅ All items verified |
| **Overall QA Verdict** | **✅ PASS — Ready for Deploy** |

---

## Sprint 24 — QA Engineer: Independent Re-verification Run (2026-04-06, Run 2)

**Timestamp:** 2026-04-06
**Agent:** QA Engineer
**Purpose:** Independent re-verification of all Sprint 24 tasks — re-ran actual test commands, reviewed source code, and confirmed prior QA results.

| Check | Result | Notes |
|-------|--------|-------|
| Backend unit tests | **183/183 PASS** | 20 suites, 0 failures, 45.36s. `cd backend && npm test`. |
| Frontend unit tests | **259/259 PASS** | 33 files, 0 failures, 3.59s. `cd frontend && npm test -- --run`. |
| npm audit (backend) | **0 vulnerabilities** | Clean. |
| npm audit (frontend) | **0 vulnerabilities** | Clean. |
| T-109 batch tests (careActionsBatch.test.js) | **10/10 PASS** | Happy path (all created, partial ownership, all fail), 6 validation (missing/empty/oversized array, invalid care_type, missing performed_at, invalid UUID), 1 auth (401). |
| T-111 rate limiter tests (rateLimiter.test.js) | **2/2 PASS** | Module export + test env skip verified. |
| T-110 batch UI tests (CareDuePage.test.jsx) | **10/10 PASS** | Selection toggle, checkbox, select all, action bar, confirm+API, success+toast, partial failure, retry, cancel, empty state. |
| Security: parameterized queries | **PASS** | `batchCreate()` uses Knex `.whereIn()` and `trx().insert()` — no SQL concatenation. |
| Security: auth enforcement | **PASS** | `router.use(authenticate)` on careHistory.js applies to all routes including `/batch`. |
| Security: error handler | **PASS** | Unknown errors return generic `{ error: { message: "An unexpected error occurred.", code: "INTERNAL_ERROR" } }` — no stack leakage. |
| Security: no hardcoded secrets | **PASS** | All secrets from `process.env`. `.env` in `.gitignore`. |
| Security: rate limiting wiring | **PASS** | `app.js` applies `globalLimiter` on `/api/`, `authLimiter` on `/api/v1/auth/`, `statsLimiter` on stats/streak. |
| Config consistency | **PASS** | Backend PORT=3000 matches vite proxy `http://localhost:3000`. CORS includes `http://localhost:5173`. No SSL mismatch. Docker ports match DB URLs. |
| Integration: frontend→backend contract | **PASS** | `careActions.batch(actions)` → `POST /care-actions/batch` with `{ actions }` body. Response parsed as `{ results, created_count, error_count }`. Matches API contract. |
| Integration: BatchActionBar component | **PASS** | `role="toolbar"`, `aria-label`, `aria-live="polite"` on count, `aria-live="assertive"` on error, `aria-busy` on loading. All SPEC-019 states implemented. |

**Verdict: ALL PASS ✅ — Independent re-verification confirms prior QA results. Deploy confirmed.**

---

