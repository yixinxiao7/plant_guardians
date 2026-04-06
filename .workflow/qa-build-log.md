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

