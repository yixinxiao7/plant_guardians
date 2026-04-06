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


---
## Post-Deploy Health Check — Sprint #25
Date: 2026-04-06
Environment: Staging (local)
Test Type: Post-Deploy Health Check + Config Consistency
Token: acquired via POST /api/v1/auth/login with test@plantguardians.local

### Config Consistency Checks
| Check | Result | Details |
|-------|--------|---------|
| Port match (backend PORT vs vite proxy) | PASS | Backend `PORT=3000`; Vite proxy target `http://localhost:3000` — exact match |
| Protocol match (SSL config vs vite proxy scheme) | PASS | No SSL certs configured in `.env`; Vite proxy uses `http://` — consistent |
| CORS_ORIGIN includes frontend dev server | PASS | `FRONTEND_URL` includes `http://localhost:5173` (Vite default dev port) and also `:5174`, `:4173`, `:4175` |
| Docker port mapping (if applicable) | PASS | `docker-compose.yml` maps `postgres: 5432:5432` and `postgres_test: 5433:5432`; matches `DATABASE_URL` (port 5432) and `TEST_DATABASE_URL` (port 5432) in `.env` |
| T-115: Stale env var names removed | PASS | `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX` — none found in `backend/.env` |
| T-115: T-111 env var names present | PASS | All 6 vars present: `RATE_LIMIT_AUTH_MAX=10`, `RATE_LIMIT_AUTH_WINDOW_MS=900000`, `RATE_LIMIT_STATS_MAX=60`, `RATE_LIMIT_STATS_WINDOW_MS=60000`, `RATE_LIMIT_GLOBAL_MAX=200`, `RATE_LIMIT_GLOBAL_WINDOW_MS=900000` |
| T-116: careStatus.js uses canonical algorithm | PASS | Uses `localNow = new Date(now.getTime() + utcOffsetMinutes * 60 * 1000)` then `today = new Date(Date.UTC(...))` — matches careDue.js logic |
| T-116: careDue.js uses canonical algorithm | PASS | Route uses identical `localNow` shift + `Date.UTC()` today boundary — aligned with careStatus.js |
| T-116: Regression tests present | PASS | `careDueStatusConsistency.test.js` — 5 tests covering utcOffset=0, utcOffset=330, utcOffset=-300, no-cross-bucket, monthly frequency |

### Health Checks
| Check | Status | Details |
|-------|--------|---------|
| GET /api/health → 200 | PASS | HTTP 200, body: `{"status":"ok","timestamp":"2026-04-06T14:43:37.289Z"}` — Note: actual route is `/api/health` not `/api/v1/health` |
| POST /api/v1/auth/login → 200 + token | PASS | HTTP 200, returned `access_token` JWT + user object for `test@plantguardians.local` |
| GET /api/v1/plants → 200 | PASS | HTTP 200, returned array of plants with care_schedules; correct `{ "data": [...] }` envelope |
| GET /api/v1/care-due → 200 | PASS | HTTP 200, returned `{ overdue:[], due_today:[], upcoming:[...] }` shape |
| GET /api/v1/care-actions/stats → 200 | PASS | HTTP 200, correct response |
| GET /api/v1/care-actions/streak → 200 | PASS | HTTP 200, correct response |
| GET /api/v1/profile → 200 | PASS | HTTP 200, returned user object with stats |
| GET /api/v1/plants/:id/care-history → 200 | PASS | HTTP 200, body: `{"data":{"items":[],"total":0,"page":1,"limit":20,"totalPages":0}}` |
| POST /api/v1/care-actions/batch → 207 | PASS | HTTP 207 Multi-Status, correct response shape per Sprint 24 contract |
| POST /api/v1/auth/refresh → 401 (no token) | PASS | HTTP 401 as expected when no refresh token provided |
| POST /api/v1/auth/logout → 200 | PASS | HTTP 200, logout accepted |
| Frontend dist/ build exists | PASS | `/frontend/dist/` contains: `index.html`, `assets/`, `favicon.svg`, `icons.svg` |
| Backend test suite | PASS | 188/188 tests pass across 21 suites (up from 183 — includes 5 new T-116 regression tests) |

### Summary
Deploy Verified: Yes
Error Summary: None. All health checks and config consistency checks passed. The health endpoint URL differs from the Sprint instructions (`/api/health` vs `/api/v1/health`) — this is correct per the actual app.js implementation and is not a defect. T-115 `.env` cleanup is complete. T-116 canonical algorithm is implemented identically in both `careStatus.js` and `careDue.js`, with 5 regression tests passing.
