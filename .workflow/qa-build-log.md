# QA & Build Log

Tracks test runs, build results, and post-deploy health checks per sprint. Maintained by QA Engineer, Deploy Engineer, and Monitor Agent.

---

## Sprint 1 — QA Report

**Date:** 2026-03-23
**QA Engineer:** QA Agent
**Tasks in scope:** T-008, T-009, T-010, T-011, T-012, T-013, T-014

---

### Test Run 1 — Backend Unit Tests

| Field | Value |
|-------|-------|
| **Test Type** | Unit Test |
| **Date** | 2026-03-23 |
| **Target** | Backend (all endpoints) |
| **Command** | `cd backend && npm test` |
| **Result** | ✅ PASS — 40/40 tests passed |
| **Duration** | 7.83s |

#### Test Breakdown

| Suite | Tests | Result |
|-------|-------|--------|
| `tests/auth.test.js` | 10 (register ×4, login ×3, refresh ×2, logout ×2) | ✅ All pass |
| `tests/plants.test.js` | 14 (CRUD ×9, photo upload ×5) | ✅ All pass |
| `tests/careActions.test.js` | 6 (create ×4, delete ×2) | ✅ All pass |
| `tests/ai.test.js` | 3 (validation, auth, unconfigured API key) | ✅ All pass |
| `tests/profile.test.js` | 2 (happy path, auth) | ✅ All pass |

#### Coverage Verification (Rule 10 Compliance)

| Endpoint | Happy Path | Error Path | Verdict |
|----------|-----------|-----------|---------|
| POST /auth/register | ✅ Registers user, returns tokens | ✅ Missing fields (400), short password (400), duplicate email (409) | Pass |
| POST /auth/login | ✅ Returns user + tokens | ✅ Wrong password (401), unknown email (401) | Pass |
| POST /auth/refresh | ✅ Rotates token | ✅ Already-rotated token (401) | Pass |
| POST /auth/logout | ✅ Invalidates refresh token | ✅ No auth token (401) | Pass |
| GET /plants | ✅ Returns plants with schedules | ✅ No auth (401) | Pass |
| POST /plants | ✅ Creates plant with schedules | ✅ Missing name (400), duplicate care types (400) | Pass |
| GET /plants/:id | ✅ Returns detail + recent actions | ✅ Not found (404), other user's plant (404) | Pass |
| PUT /plants/:id | ✅ Updates + replaces schedules | ✅ Not found (404) | Pass |
| DELETE /plants/:id | ✅ Deletes + cascade verified | ✅ Not found (404) | Pass |
| POST /plants/:id/photo | ✅ Upload JPEG returns photo_url | ✅ No file (400/MISSING_FILE), invalid type (400/INVALID_FILE_TYPE), no auth (401), wrong plant (404) | Pass |
| POST /ai/advice | — (requires real API) | ✅ No input (400), no auth (401), unconfigured key (502) | Pass (no happy path possible without real Gemini key) |
| POST /plants/:id/care-actions | ✅ Records action, updates schedule | ✅ No schedule (422), future date (400), wrong plant (404) | Pass |
| DELETE /plants/:id/care-actions/:id | ✅ Deletes + reverts schedule | ✅ Not found (404) | Pass |
| GET /profile | ✅ Returns user + stats | ✅ No auth (401) | Pass |

**Note on infrastructure:** Backend .env was not present; tests initially failed with "role postgres does not exist." Created .env from .env.example with local PostgreSQL credentials. Docker compose was not running (Docker not installed on this machine). This is an infrastructure setup issue, not a code defect.

---

### Test Run 2 — Frontend Unit Tests

| Field | Value |
|-------|-------|
| **Test Type** | Unit Test |
| **Date** | 2026-03-23 |
| **Target** | Frontend (components + pages) |
| **Command** | `cd frontend && npx vitest run` |
| **Result** | ⚠️ PARTIAL PASS — 46/48 tests passed, 2 failed |
| **Duration** | 1.37s |

#### Test Breakdown

| Suite | Tests | Result |
|-------|-------|--------|
| Button.test.jsx | Pass | ✅ |
| Input.test.jsx | Pass | ✅ |
| StatusBadge.test.jsx | Pass | ✅ |
| Modal.test.jsx | Pass | ✅ |
| PlantCard.test.jsx | Pass | ✅ |
| PhotoUpload.test.jsx | Pass | ✅ |
| CareScheduleForm.test.jsx | Pass | ✅ |
| AIAdviceModal.test.jsx | Pass | ✅ |
| ToastContainer.test.jsx | Pass | ✅ |
| Sidebar.test.jsx | Pass | ✅ |
| AppShell.test.jsx | Pass | ✅ |
| InventoryPage.test.jsx | Pass | ✅ |
| ProfilePage.test.jsx | Pass | ✅ |
| PlantDetailPage.test.jsx | Pass | ✅ |
| AddPlantPage.test.jsx | Pass | ✅ |
| EditPlantPage.test.jsx | Pass | ✅ |
| **LoginPage.test.jsx** | **2 failed** | ❌ |

#### LoginPage Test Failures (P2 — Test Code Issue, Not Implementation Bug)

**Failure 1:** `renders without crashing`
- **Cause:** `screen.getByText('Plant Guardians')` finds 2 elements — `<h1>` in brand panel and `<span>` in mobile logo. Both are correct per SPEC-001. Test should use `getAllByText` or a more specific selector.

**Failure 2:** `renders login form with tabs`
- **Cause:** `screen.getByLabelText('Email')` fails because the `<label>` contains "Email" text plus a ` *` span (with `aria-hidden`). The Testing Library query doesn't match. The label association via `htmlFor`/`id` is correct — this is a test selector issue.

**Verdict:** The LoginPage component renders correctly per SPEC-001. The failures are in the test selectors, not the implementation. The Frontend Engineer needs to fix the test file with more specific queries.

---

### Test Run 3 — Integration Test (Backend API Contract Verification)

| Field | Value |
|-------|-------|
| **Test Type** | Integration Test |
| **Date** | 2026-03-23 |
| **Target** | Backend API vs api-contracts.md |
| **Result** | ✅ PASS |

#### Contract Compliance Verification

| Contract | Endpoint | Status Codes Match | Response Shape Match | Error Codes Match | Auth Enforced | Verdict |
|----------|----------|-------------------|---------------------|-------------------|--------------|---------|
| GROUP 1 — Auth | POST /auth/register | ✅ 201, 400, 409 | ✅ `{ data: { user, access_token, refresh_token } }` | ✅ VALIDATION_ERROR, EMAIL_ALREADY_EXISTS | ✅ Public | Pass |
| GROUP 1 — Auth | POST /auth/login | ✅ 200, 400, 401 | ✅ Same shape | ✅ INVALID_CREDENTIALS | ✅ Public | Pass |
| GROUP 1 — Auth | POST /auth/refresh | ✅ 200, 400, 401 | ✅ `{ data: { access_token, refresh_token } }` | ✅ INVALID_REFRESH_TOKEN | ✅ Public | Pass |
| GROUP 1 — Auth | POST /auth/logout | ✅ 200, 400, 401 | ✅ `{ data: { message } }` | ✅ UNAUTHORIZED | ✅ Bearer required | Pass |
| GROUP 2 — Plants | GET /plants | ✅ 200, 401 | ✅ `{ data: [...], pagination }` with care_schedules | ✅ UNAUTHORIZED | ✅ Bearer required | Pass |
| GROUP 2 — Plants | POST /plants | ✅ 201, 400, 401 | ✅ Full plant with schedules | ✅ VALIDATION_ERROR | ✅ Bearer required | Pass |
| GROUP 2 — Plants | GET /plants/:id | ✅ 200, 401, 404 | ✅ Plant with recent_care_actions | ✅ PLANT_NOT_FOUND | ✅ Bearer + ownership | Pass |
| GROUP 2 — Plants | PUT /plants/:id | ✅ 200, 400, 401, 404 | ✅ Full plant with replaced schedules | ✅ PLANT_NOT_FOUND | ✅ Bearer + ownership | Pass |
| GROUP 2 — Plants | DELETE /plants/:id | ✅ 200, 401, 404 | ✅ `{ data: { message, id } }` | ✅ PLANT_NOT_FOUND | ✅ Bearer + ownership | Pass |
| GROUP 3 — Photo | POST /plants/:id/photo | ✅ 200, 400, 401, 404 | ✅ `{ data: { photo_url } }` | ✅ MISSING_FILE, INVALID_FILE_TYPE, FILE_TOO_LARGE, PLANT_NOT_FOUND | ✅ Bearer + ownership | Pass |
| GROUP 4 — AI | POST /ai/advice | ✅ 400, 401, 502 | ✅ Structured error responses | ✅ VALIDATION_ERROR, AI_SERVICE_UNAVAILABLE | ✅ Bearer required | Pass |
| GROUP 5 — Care Actions | POST /plants/:id/care-actions | ✅ 201, 400, 401, 404, 422 | ✅ `{ data: { care_action, updated_schedule } }` | ✅ NO_SCHEDULE_FOR_CARE_TYPE | ✅ Bearer + ownership | Pass |
| GROUP 5 — Care Actions | DELETE /plants/:id/care-actions/:id | ✅ 200, 401, 404 | ✅ `{ data: { deleted_action_id, updated_schedule } }` | ✅ ACTION_NOT_FOUND | ✅ Bearer + ownership | Pass |
| GROUP 6 — Profile | GET /profile | ✅ 200, 401 | ✅ `{ data: { user, stats } }` | ✅ UNAUTHORIZED | ✅ Bearer required | Pass |

#### Frontend API Client Verification

Reviewed `frontend/src/utils/api.js`:
- ✅ All endpoints from api-contracts.md are implemented
- ✅ Auth token stored in memory (not localStorage) — matches security recommendation
- ✅ Auto-refresh on 401 with retry logic — matches contract spec
- ✅ FormData handling for photo upload (no Content-Type override)
- ✅ Error handling extracts `error.message` and `error.code` from structured response
- ✅ API base URL configurable via `VITE_API_BASE_URL` env var

---

### Test Run 4 — Config Consistency Check

| Field | Value |
|-------|-------|
| **Test Type** | Config Consistency |
| **Date** | 2026-03-23 |
| **Target** | backend/.env.example, frontend/vite.config.js, infra/docker-compose.yml |
| **Result** | ⚠️ 1 Issue Found |

#### Findings

| Check | Expected | Actual | Verdict |
|-------|----------|--------|---------|
| Backend PORT matches Vite proxy target | PORT=3000, Vite proxy → http://localhost:3000 | Backend PORT=3000 in .env.example. **Vite has NO proxy configured** — `vite.config.js` only has `plugins` and `test` config. Frontend uses direct API calls via `VITE_API_BASE_URL` defaulting to `http://localhost:3000/api/v1`. | ⚠️ No proxy — Frontend calls backend directly (acceptable for dev with CORS configured) |
| CORS_ORIGIN includes frontend dev origin | Should include http://localhost:5173 | `FRONTEND_URL=http://localhost:5173` in .env.example, used as CORS origin in app.js | ✅ Match |
| Docker Compose DB matches .env.example | DB user/password/name should match | docker-compose: `plant_guardians`/`plant_guardians_dev`/`plant_guardians_dev`. .env.example: `postgresql://plant_guardians:plant_guardians_dev@localhost:5432/plant_guardians_dev` | ✅ Match |
| Docker test DB matches .env.example | Test DB port and name should match | docker-compose: port 5433, db `plant_guardians_test`. .env.example: `postgresql://...@localhost:5433/plant_guardians_test` | ✅ Match |
| SSL consistency | If backend has SSL, vite proxy should use https:// | No SSL configured for dev | ✅ N/A |

**Note:** The lack of a Vite proxy is fine because the frontend makes direct API calls to `http://localhost:3000/api/v1` and the backend has CORS configured for `http://localhost:5173`. This works for local development. For production, the Deploy Engineer should configure a reverse proxy or matching origins.

---

### Test Run 5 — Security Scan

| Field | Value |
|-------|-------|
| **Test Type** | Security Scan |
| **Date** | 2026-03-23 |
| **Target** | Backend codebase |
| **Result** | ✅ PASS (with 1 advisory note) |

#### Security Checklist Verification

**Authentication & Authorization:**

| Item | Status | Evidence |
|------|--------|----------|
| All API endpoints require appropriate authentication | ✅ | All routes use `authenticate` middleware except public auth endpoints (register, login, refresh) |
| Role-based access control enforced | ✅ N/A | Sprint 1 has no roles — all users are equal. Ownership-based access enforced instead (user_id scoping). |
| Auth tokens have appropriate expiration and refresh | ✅ | Access: 15min (`JWT_EXPIRES_IN`), Refresh: 7 days, rotated on each use |
| Password hashing uses bcrypt/scrypt/argon2 | ✅ | bcrypt with 12 salt rounds (`models/User.js:4,11`) |
| Failed login attempts are rate-limited | ✅ | Auth endpoints: 20 requests per 15 minutes (`app.js:47-55`) |

**Input Validation & Injection Prevention:**

| Item | Status | Evidence |
|------|--------|----------|
| All user inputs validated server-side | ✅ | `validateBody` middleware on all POST/PUT routes; `validateCareSchedules` custom validation; `validateUUIDParam` on all :id params |
| SQL queries use parameterized statements | ✅ | All queries use Knex query builder (`.where()`, `.insert()`, `.update()`, etc.). No `db.raw()` in source code. No string concatenation for queries. |
| NoSQL injection prevention | ✅ N/A | PostgreSQL only, no NoSQL |
| File uploads validated for type, size, content | ✅ | MIME type whitelist (JPEG/PNG/WebP), 5MB size limit, UUID filenames to prevent path traversal (`middleware/upload.js`) |
| HTML output sanitized to prevent XSS | ✅ | API returns JSON only; no HTML rendering on backend. Frontend uses React (auto-escapes by default). |

**API Security:**

| Item | Status | Evidence |
|------|--------|----------|
| CORS configured for expected origins only | ✅ | `cors({ origin: process.env.FRONTEND_URL \|\| 'http://localhost:5173' })` in `app.js:21-24` |
| Rate limiting on public endpoints | ✅ | General: 100/15min, Auth: 20/15min (`app.js:37-59`) |
| API responses don't leak internal details | ✅ | Error handler returns structured JSON. Unknown errors get generic "An unexpected error occurred." with INTERNAL_ERROR code. Stack traces never sent. (`middleware/errorHandler.js`) |
| Sensitive data not in URL query params | ✅ | Tokens sent in headers (Bearer) and request body, never in URLs |
| Security headers included | ✅ | Helmet enabled (`app.js:18`) — sets X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, and more |

**Data Protection:**

| Item | Status | Evidence |
|------|--------|----------|
| Sensitive data at rest encrypted | ⚠️ Advisory | Passwords hashed with bcrypt. Refresh tokens stored as SHA-256 hash. Database-level encryption is deployment config (out of scope for Sprint 1). |
| DB credentials and API keys in env vars | ✅ | All secrets in `.env` / env vars. `.env.example` has placeholder values only. No hardcoded secrets in source. |
| Logs do not contain PII/passwords/tokens | ✅ | Only `console.error('Unhandled error:', err)` and `console.error('Gemini API error:', err.message)`. No token/password logging. Register response never includes `password_hash` (verified in test). |
| Backups configured | ⚠️ N/A | Sprint 1 — local dev only. Deploy Engineer to handle for staging/production. |

**Infrastructure:**

| Item | Status | Evidence |
|------|--------|----------|
| HTTPS enforced | ⚠️ N/A | Local dev uses HTTP. Deploy Engineer to enforce for staging/production. |
| Dependencies checked for vulnerabilities | ⚠️ Advisory | `npm audit` shows 2 high-severity vulnerabilities in `tar` package (transitive dependency via `@mapbox/node-pre-gyp` → `bcrypt`). These are file extraction vulnerabilities, not network-exploitable in this context. Fix available via `npm audit fix`. |
| Default credentials removed | ✅ | `.env.example` has placeholder values (`your-super-secret-jwt-key-change-in-production`, `your-gemini-api-key`). Deploy Engineer must set real values. |
| Error pages don't reveal server info | ✅ | Helmet hides X-Powered-By. 404 handler returns generic JSON. Error handler never leaks stack traces. |

#### Additional Security Checks

| Check | Status | Notes |
|-------|--------|-------|
| Hardcoded secrets scan | ✅ | No hardcoded secrets in source. JWT_SECRET and GEMINI_API_KEY loaded from env vars. |
| SQL injection vectors | ✅ | All queries use Knex parameterized builder. No `db.raw()` in source. |
| XSS vulnerabilities | ✅ | Backend returns JSON only. Frontend uses React JSX (auto-escapes). Access token stored in memory (not localStorage). |
| Missing auth checks | ✅ | All routes behind `authenticate` middleware. Plant ownership enforced via `findByIdAndUser` returning 404 (not 403). |
| Information leakage in error responses | ✅ | Generic errors for unknown issues. Login uses same error for wrong email and wrong password (INVALID_CREDENTIALS). |
| Refresh token security | ✅ | Stored as SHA-256 hash. Rotated on use. Old tokens rejected. Expiration enforced. |

#### npm audit Results

```
2 high severity vulnerabilities (tar package)
- tar <=7.5.10 — path traversal and symlink poisoning vulnerabilities
- Affects: @mapbox/node-pre-gyp (transitive, via bcrypt)
- Impact: Low risk for this app (tar is used only during `npm install` for bcrypt native compilation, not at runtime)
- Fix: `npm audit fix` available
- Severity: P3 for this context — recommend fixing before production deploy
```

---

### Summary

| Test Type | Result | Details |
|-----------|--------|---------|
| Backend Unit Tests | ✅ PASS | 40/40 tests pass |
| Frontend Unit Tests | ⚠️ PARTIAL | 46/48 pass; 2 LoginPage.test.jsx failures (test selector issue, not impl bug) |
| Integration Test (API Contracts) | ✅ PASS | All 14 endpoints match contracts |
| Frontend API Client | ✅ PASS | All endpoints wired correctly, auth flow correct |
| Config Consistency | ✅ PASS | All configs consistent |
| Security Scan | ✅ PASS | All checklist items verified; npm audit advisory (P3) |

### Blockers

1. **LoginPage.test.jsx** — 2 test failures need fixing by Frontend Engineer (P2)
2. **npm audit** — `tar` vulnerability fix recommended before production deploy (P3)

### Verdict

**Backend tasks T-008, T-009, T-010, T-011, T-012, T-013, T-014 → PASS. Ready for Deploy.**

Frontend tasks (T-001 through T-007) are still in Backlog status — not yet implemented. QA integration tests for frontend-backend flows (T-015, T-016, T-017) are blocked on frontend implementation. Backend-only verification is complete.

---

## Sprint 1 — Build & Staging Deployment

**Date:** 2026-03-23
**Deploy Engineer:** Deploy Agent
**Sprint:** 1

---

### Build 1 — Frontend Production Build

| Field | Value |
|-------|-------|
| **Date** | 2026-03-23 |
| **Command** | `cd frontend && npm run build` |
| **Result** | ✅ SUCCESS |
| **Output** | 4604 modules transformed; `dist/index.html` (0.74 kB), `dist/assets/index-*.css` (29.12 kB), `dist/assets/index-*.js` (357.08 kB) |
| **Duration** | 520ms |
| **Fix Applied** | Initial build failed: `useToast.js` and `useAuth.js` contained JSX but had `.js` extension — Vite 8/rolldown does not process JSX in `.js` files. Fixed by renaming both to `.jsx` and updating all import paths. No logic changes. |

---

### Build 2 — Backend Dependency Install & Security Fix

| Field | Value |
|-------|-------|
| **Date** | 2026-03-23 |
| **Command** | `cd backend && npm install && npm audit fix` |
| **Result** | ⚠️ PARTIAL — Dependencies installed. `npm audit fix` could not auto-resolve the `tar` transitive vulnerability without `--force`. |
| **Notes** | 2 high-severity vulnerabilities in `tar` (via bcrypt → @mapbox/node-pre-gyp). Low runtime risk — tar only invoked during `npm install`, not at server runtime. Flagged for follow-up before production deploy. |

---

### Build 3 — Database Migrations (Staging)

| Field | Value |
|-------|-------|
| **Date** | 2026-03-23 |
| **Environment** | Staging (local — PostgreSQL 15, database: `plant_guardians_staging`) |
| **Command** | `cd backend && npm run migrate` |
| **Result** | ✅ SUCCESS |
| **Output** | Batch 1 run: 5 migrations |
| **Migrations Applied** | `20260323_01_create_users`, `20260323_02_create_refresh_tokens`, `20260323_03_create_plants`, `20260323_04_create_care_schedules`, `20260323_05_create_care_actions` |

---

### Deployment 1 — Staging

| Field | Value |
|-------|-------|
| **Date** | 2026-03-23 |
| **Environment** | Staging (local processes — Docker not available on this machine) |
| **Build Status** | ✅ Success |
| **Backend URL** | `http://localhost:3000` |
| **Frontend URL** | `http://localhost:4173` (Vite preview of production build) |
| **Health Check** | ✅ `GET /api/health` → `{"status":"ok","timestamp":"2026-03-23T22:34:16.630Z"}` |
| **Auth Middleware** | ✅ `GET /api/v1/plants` with invalid token → 401 UNAUTHORIZED |
| **Uploads Dir** | ✅ `backend/uploads/` exists and writable |
| **Database** | PostgreSQL 15 (Homebrew), database: `plant_guardians_staging`, user: `plant_guardians` |
| **Migrations** | ✅ 5/5 applied in Batch 1 |

#### Infrastructure Notes

- **Docker:** Not available on this machine. Staging uses local PostgreSQL 15 (Homebrew) and local Node.js processes.
- **Backend:** Started with `node src/server.js` on port 3000.
- **Frontend:** Served via `vite preview` at `http://localhost:4173`. Calls backend directly at `http://localhost:3000/api/v1`.
- **JWT Secret:** Generated fresh with `openssl rand -hex 64` for this staging deployment.
- **GEMINI_API_KEY:** Placeholder — AI advice endpoint will return 502 until a real key is configured.

#### Pre-Deploy Checklist

| Requirement | Status |
|-------------|--------|
| QA confirmation in handoff log (H-011) | ✅ |
| All backend tasks Done (T-008 – T-014) | ✅ |
| Migrations documented in technical-context.md | ✅ |
| Migrations run successfully | ✅ |
| Backend starts and health check passes | ✅ |
| Frontend build succeeds | ✅ |
| Uploads directory exists | ✅ |
| JWT secret generated (not default placeholder) | ✅ |

---

## Sprint 1 — Staging Re-Deployment (Deploy Engineer — Issue Fixes)

**Date:** 2026-03-23
**Deploy Engineer:** Deploy Agent
**Sprint:** 1
**Triggered by:** H-015 (CORS mismatch), H-016 (missing seed data + race condition)

---

### Fix 1 — CORS Multi-Origin Support

| Field | Value |
|-------|-------|
| **Issue** | `FRONTEND_URL=http://localhost:5173` only; staging frontend at `:4173` blocked by browser CORS |
| **Fix Applied** | Updated `backend/.env`: `FRONTEND_URL=http://localhost:5173,http://localhost:4173` |
| **Code Change** | `backend/src/app.js` — CORS origin now accepts comma-separated list via split+includes logic (no-origin requests like curl also allowed) |
| **Verified** | `curl -H "Origin: http://localhost:4173" /api/health` → `Access-Control-Allow-Origin: http://localhost:4173` ✅ |
| **Also verified** | `:5173` origin still works ✅ |

---

### Fix 2 — Startup Race Condition

| Field | Value |
|-------|-------|
| **Issue** | Server accepted HTTP connections before Knex DB pool was ready — first 1-2 requests returned HTTP 500 |
| **Fix Applied** | `backend/src/server.js` — `app.listen()` is now called inside `db.raw('SELECT 1').then(...)`. If DB unreachable at boot, process exits with error code 1. |
| **Verified** | Backend started cleanly; no 500s on first requests ✅ |

---

### Fix 3 — Seed Data (Test Account)

| Field | Value |
|-------|-------|
| **Issue** | Monitor Agent health check protocol expects `test@plantguardians.local` account — was not seeded |
| **Fix Applied** | Created `backend/src/seeds/01_test_user.js` — idempotent seed for test account (`test@plantguardians.local` / `TestPass123!`) |
| **Knexfile** | Added `seeds.directory: './src/seeds'` to `development` and `staging` environments in `knexfile.js` |
| **Command run** | `npx knex seed:run` → `[seed] Created test user: test@plantguardians.local` ✅ |

---

### Deployment 2 — Staging (Re-deploy after fixes)

| Field | Value |
|-------|-------|
| **Date** | 2026-03-23 |
| **Environment** | Staging (local processes — Docker not available) |
| **Backend PID** | 17701 (restarted after CORS + server.js fixes) |
| **Backend URL** | `http://localhost:3000` |
| **Frontend URL** | `http://localhost:4173` (Vite preview — unchanged, PID 16455) |
| **Build Status** | ✅ Success (no rebuild needed — JS/config fixes only) |
| **Migrations** | ✅ 5/5 already applied from Deployment 1 — no new migrations |
| **Seed Data** | ✅ `test@plantguardians.local` created |

#### Post-Fix Verification

| Check | Result |
|-------|--------|
| `GET /api/health` → 200 | ✅ `{"status":"ok","timestamp":"2026-03-23T22:44:05.305Z"}` |
| CORS: `:4173` origin allowed | ✅ `Access-Control-Allow-Origin: http://localhost:4173` |
| CORS: `:5173` origin allowed | ✅ `Access-Control-Allow-Origin: http://localhost:5173` |
| Login with test user | ✅ HTTP 200 + JWT tokens returned |
| Protected endpoint without token → 401 | ✅ |
| Frontend at `:4173` → 200 | ✅ |
| DB startup race condition | ✅ Fixed — server waits for DB before accepting connections |

---

## Sprint 1 — Post-Deploy Health Check (Monitor Agent)

**Date:** 2026-03-23T22:37:00Z
**Monitor Agent**
**Environment:** Staging (local — `http://localhost:3000` backend, `http://localhost:4173` frontend preview)
**Triggered by:** H-014 (Deploy Engineer staging deployment complete)

---

### Config Consistency Check

| Field | Value |
|-------|-------|
| **Test Type** | Config Consistency |
| **Date** | 2026-03-23T22:37:00Z |
| **Files Inspected** | `backend/.env`, `frontend/vite.config.js`, `infra/docker-compose.yml`, `backend/src/app.js` |
| **Result** | ❌ FAIL — 1 critical mismatch found |

#### Findings

| Check | Expected | Actual | Verdict |
|-------|----------|--------|---------|
| **Backend PORT** | PORT defined in .env | `PORT=3000` | ✅ PASS |
| **SSL/HTTPS** | If SSL_KEY_PATH + SSL_CERT_PATH set → vite proxy must use `https://` | Neither `SSL_KEY_PATH` nor `SSL_CERT_PATH` is set in `.env` → backend runs HTTP. No SSL mismatch possible. | ✅ PASS — N/A |
| **Vite proxy target port** | Must match backend PORT (3000) | `vite.config.js` has **no `server.proxy` defined at all** — only `plugins` and `test` config. Frontend makes direct API calls via `VITE_API_BASE_URL` env var. | ⚠️ NOTE — No proxy configured. Acceptable because CORS is configured. Not a blocking failure. |
| **CORS_ORIGIN vs dev frontend** | `FRONTEND_URL` must include the frontend dev server origin | `FRONTEND_URL=http://localhost:5173` in `backend/.env`. Default Vite dev server runs on `:5173`. | ✅ PASS (for dev) |
| **CORS_ORIGIN vs staging frontend** | `FRONTEND_URL` must include the staging frontend origin (`http://localhost:4173`) | Staging frontend is served via `vite preview` at **`http://localhost:4173`** (confirmed in H-014). Backend CORS is configured to `http://localhost:5173` only. **`http://localhost:4173` is NOT in the allowed CORS origins.** | ❌ **FAIL — CORS MISMATCH** |
| **Docker port mapping** | If docker-compose has backend, container port must match `PORT=3000` | `infra/docker-compose.yml` only defines `postgres` and `postgres_test` services — no backend or frontend containers. Backend runs as a direct Node.js process. PostgreSQL container maps `${POSTGRES_PORT:-5432}:5432`, which matches `DATABASE_URL=...localhost:5432/...` in `.env`. | ✅ PASS |

#### CORS Mismatch — Detail

- **Backend CORS config** (`backend/src/app.js` line 22): `origin: process.env.FRONTEND_URL || 'http://localhost:5173'`
- **`backend/.env`**: `FRONTEND_URL=http://localhost:5173`
- **Staging frontend URL** (per H-014): `http://localhost:4173` (Vite preview)
- **Impact:** Any API call made from the browser at `http://localhost:4173` will be blocked by the browser CORS preflight check. The `Access-Control-Allow-Origin` response header will be `http://localhost:5173`, not `http://localhost:4173`, causing a CORS error. Direct curl/API testing is unaffected, but all browser-based frontend testing is blocked.
- **Fix required:** Update `FRONTEND_URL` in `backend/.env` to `http://localhost:4173` for staging. Or configure the backend to accept an array of origins (dev: `:5173`, staging preview: `:4173`).

---

### Post-Deploy Health Check

| Field | Value |
|-------|-------|
| **Test Type** | Post-Deploy Health Check |
| **Date** | 2026-03-23T22:37:00Z |
| **Environment** | Staging |
| **Backend URL** | http://localhost:3000 |
| **Frontend URL** | http://localhost:4173 |
| **Token Acquisition** | `POST /api/v1/auth/login` with seeded account `test@triplanner.local` — **FAILED** (account not seeded; `knex seed:run` was not run). Fell back to `POST /api/v1/auth/register` with ephemeral test account `healthcheck_test_001@test.local`. Login then used for all protected endpoint checks. |

#### Health Check Results

| # | Check | Method | Status | Response |
|---|-------|--------|--------|----------|
| 1 | App responds | `GET http://localhost:3000/api/health` | ✅ HTTP 200 | `{"status":"ok","timestamp":"2026-03-23T22:36:41.241Z"}` — matches expected shape |
| 2 | Auth: Register | `POST /api/v1/auth/register` with valid payload | ✅ HTTP 201 | `{"data":{"user":{...},"access_token":"...","refresh_token":"..."}}` — matches contract |
| 3 | Auth: Login | `POST /api/v1/auth/login` with registered account | ✅ HTTP 200 | `{"data":{"user":{...},"access_token":"...","refresh_token":"..."}}` — matches contract |
| 4 | Auth: Invalid credentials | `POST /api/v1/auth/login` with wrong password | ✅ HTTP 401 | `{"error":{"message":"Invalid email or password.","code":"INVALID_CREDENTIALS"}}` |
| 5 | Auth enforced | `GET /api/v1/plants` with no token | ✅ HTTP 401 | `{"error":{"message":"Missing or invalid authorization header.","code":"UNAUTHORIZED"}}` |
| 6 | Auth enforced | `GET /api/v1/plants` with tampered token | ✅ HTTP 401 | `{"error":{"message":"Invalid or expired access token.","code":"UNAUTHORIZED"}}` |
| 7 | Plants list | `GET /api/v1/plants` with valid token | ✅ HTTP 200 | `{"data":[],"pagination":{"page":1,"limit":50,"total":0}}` — correct shape |
| 8 | Plant create | `POST /api/v1/plants` with name + care_schedule | ✅ HTTP 201 | Full plant object with computed `next_due_at`, `status:"on_track"`, `days_overdue:0` returned — matches contract |
| 9 | Plant get | `GET /api/v1/plants/:id` | ✅ HTTP 200 | Full plant with `care_schedules` and empty `recent_care_actions` array — matches contract |
| 10 | Plant update | `PUT /api/v1/plants/:id` (schedule replacement) | ✅ HTTP 200 | Schedules fully replaced; new ID assigned to replaced schedule — matches contract |
| 11 | Care action create | `POST /api/v1/plants/:id/care-actions` | ✅ HTTP 201 | `{"data":{"care_action":{...},"updated_schedule":{...}}}` — matches contract; `last_done_at` updated |
| 12 | Care action delete (undo) | `DELETE /api/v1/plants/:id/care-actions/:action_id` | ✅ HTTP 200 | `{"data":{"deleted_action_id":"...","updated_schedule":{...}}}` — `last_done_at` reverted to `null`; `status` moved to `"due_today"` — correct behavior |
| 13 | Plant delete | `DELETE /api/v1/plants/:id` | ✅ HTTP 200 | `{"data":{"message":"Plant deleted successfully.","id":"..."}}` — matches contract |
| 14 | Profile | `GET /api/v1/profile` | ✅ HTTP 200 | `{"data":{"user":{...},"stats":{"plant_count":1,"days_as_member":0,"total_care_actions":1}}}` — stats computed correctly |
| 15 | AI advice (no API key) | `POST /api/v1/ai/advice` with `{"plant_type":"Pothos"}` | ✅ HTTP 502 (expected) | `{"error":{"message":"AI service is not configured.","code":"AI_SERVICE_UNAVAILABLE"}}` — known limitation per H-014 |
| 16 | Frontend accessible | `GET http://localhost:4173/` | ✅ HTTP 200 | HTML response; `frontend/dist/` exists with `index.html`, `assets/`, `favicon.svg` |
| 17 | Database connectivity | All 5 migration tables present | ✅ Connected | Tables verified: `users`, `refresh_tokens`, `plants`, `care_schedules`, `care_actions`, `knex_migrations` |
| 18 | Seeded test account | `POST /api/v1/auth/login` with `test@triplanner.local` | ⚠️ HTTP 401 | `INVALID_CREDENTIALS` — seed data not present; `knex seed:run` was not executed during deployment |
| 19 | CORS headers (staging) | `Access-Control-Allow-Origin` must include `http://localhost:4173` | ❌ **FAIL** | Header value is `http://localhost:5173` — staging frontend at `:4173` is excluded; browser API calls from staging UI will be rejected with CORS error |

#### Startup Race Condition — Observed

On the very first auth requests immediately after server start, both `POST /api/v1/auth/register` and `POST /api/v1/auth/login` returned:
```
HTTP 500 — {"error":{"message":"An unexpected error occurred.","code":"INTERNAL_ERROR"}}
```
Subsequent identical requests succeeded (HTTP 201 and HTTP 200). Likely cause: Knex connection pool not fully initialized when first requests arrive. The server begins accepting connections before the database pool is ready. Impact is limited to the first 1–2 requests post-boot; all subsequent requests succeed.

---

### Final Summary

| Check | Result |
|-------|--------|
| Config: Backend PORT=3000 | ✅ PASS |
| Config: SSL/HTTPS consistency | ✅ PASS (N/A) |
| Config: Vite proxy configuration | ⚠️ NOTE — No proxy; direct CORS calls (acceptable) |
| Config: CORS_ORIGIN vs staging frontend (:4173) | ❌ **FAIL — CORS MISMATCH** |
| Config: Docker port consistency | ✅ PASS |
| Health: GET /api/health → 200 | ✅ PASS |
| Health: Auth register + login | ✅ PASS |
| Health: Auth enforcement on all protected routes | ✅ PASS |
| Health: Plants CRUD (all 5 endpoints) | ✅ PASS |
| Health: Care actions (create + undo) | ✅ PASS |
| Health: Profile | ✅ PASS |
| Health: AI advice (502 expected — no API key) | ✅ PASS (known) |
| Health: Frontend accessible at :4173 | ✅ PASS |
| Health: Database connected, 5 migrations applied | ✅ PASS |
| Health: Seeded test account present | ⚠️ MISSING |
| Health: No 5xx errors under load | ⚠️ WARN — Startup race condition; first 1–2 requests return 500 |

| Field | Value |
|-------|-------|
| **Deploy Verified** | ❌ **No** |
| **Blocking Issue** | CORS origin mismatch: backend allows `http://localhost:5173`; staging frontend is `http://localhost:4173`. Browser-based end-to-end testing is fully blocked until fixed. |
| **API Health (direct curl)** | ✅ All 14 endpoints are functional. Backend is healthy. |
| **User Agent Ready** | No — CORS must be fixed before User Agent can test via browser. |

---

### Post-Fix Re-Verification (Ops Agent)

All three issues from the initial health check were resolved by Deploy Engineer in commit `4659ca6`:

1. **CORS mismatch** — Fixed. `FRONTEND_URL` now accepts both `:5173` and `:4173`. CORS middleware updated to parse comma-separated origins.
2. **Startup race condition** — Fixed. `server.js` now awaits `db.raw('SELECT 1')` before calling `app.listen()`.
3. **Seed data** — Fixed. `01_test_user.js` seed added and run.

| Field | Value |
|-------|-------|
| **Deploy Verified** | ✅ Yes |
| **Verified By** | Ops Agent (manual — Monitor Agent exceeded max turns on retry) |
| **API Health** | ✅ All 14 endpoints functional |
| **User Agent Ready** | Yes |

---

## Sprint 3 — Staging Deployment (T-023)

**Date:** 2026-03-24
**Deploy Engineer:** Deploy Agent
**Sprint:** 3
**Task:** T-023 — Re-deploy to staging with full frontend implementation

---

### Build 1 — Backend: npm ci + Security Verification (T-022 fix)

| Field | Value |
|-------|-------|
| **Date** | 2026-03-24 |
| **Command** | `cd backend && npm ci` |
| **Result** | ✅ SUCCESS |
| **bcrypt version** | 6.0.0 (upgraded from 5.1.1 — T-022 fix applied) |
| **npm audit** | ✅ 0 vulnerabilities (was 2 high-severity tar CVEs before T-022 fix) |

---

### Build 2 — Frontend Production Build

| Field | Value |
|-------|-------|
| **Date** | 2026-03-24 |
| **Command** | `cd frontend && npm run build` |
| **Result** | ✅ SUCCESS |
| **Output** | 4604 modules transformed; dist/index.html (0.74 kB), dist/assets/index.css (29.12 kB), dist/assets/index.js (357.08 kB), dist/assets/confetti.module.js (10.57 kB) |
| **Duration** | 302ms |
| **Screens included** | All 7: Login/Signup, Plant Inventory, Add Plant, Edit Plant, Plant Detail, AI Advice Modal, Profile |

---

### Test Run 1 — Backend Unit Tests (pre-deploy)

| Field | Value |
|-------|-------|
| **Date** | 2026-03-24 |
| **Command** | `cd backend && npm test` |
| **Result** | ✅ PASS — 40/40 tests passed |
| **Duration** | 9.16s |

| Suite | Tests | Result |
|-------|-------|--------|
| tests/auth.test.js | 10 | ✅ All pass |
| tests/plants.test.js | 14 (CRUD + photo) | ✅ All pass |
| tests/careActions.test.js | 6 | ✅ All pass |
| tests/ai.test.js | 3 | ✅ All pass |
| tests/profile.test.js | 2 | ✅ All pass |

---

### Test Run 2 — Frontend Unit Tests (pre-deploy)

| Field | Value |
|-------|-------|
| **Date** | 2026-03-24 |
| **Command** | `cd frontend && npx vitest run` |
| **Result** | ✅ PASS — 48/48 tests passed |
| **Duration** | 1.30s |
| **Test Files** | 17/17 passed (all suites including LoginPage.test.jsx — T-021 fix confirmed) |

---

### Build 3 — Database Migrations (Staging)

| Field | Value |
|-------|-------|
| **Date** | 2026-03-24 |
| **Environment** | Staging (local — PostgreSQL 15, db: plant_guardians_staging) |
| **Command** | `cd backend && npm run migrate` |
| **Result** | ✅ SUCCESS — 5/5 migrations applied (Batch 1 from Sprint 1; no new migrations in Sprint 3) |

---

### Build 4 — Seed Data

| Field | Value |
|-------|-------|
| **Date** | 2026-03-24 |
| **Command** | `cd backend && npx knex seed:run` |
| **Result** | ✅ [seed] Created test user: test@plantguardians.local |

---

### Deployment 3 — Staging (Sprint 3: Full Frontend + T-022 Fix)

| Field | Value |
|-------|-------|
| **Date** | 2026-03-24 |
| **Environment** | Staging (local — Docker not available) |
| **Backend URL** | http://localhost:3000 |
| **Frontend URL** | http://localhost:4173 (Vite preview of production build) |
| **Build Status** | ✅ Success |
| **Database** | PostgreSQL 15 (Homebrew), plant_guardians_staging |
| **Migrations** | ✅ 5/5 applied |
| **Seed Data** | ✅ test@plantguardians.local / TestPass123! present |
| **T-022 Fix** | ✅ bcrypt@6.0.0 — npm audit shows 0 vulnerabilities |

#### Post-Deploy Health Checks

| Check | Result |
|-------|--------|
| GET /api/health → 200 | ✅ {"status":"ok","timestamp":"2026-03-24T01:24:07.541Z"} |
| Auth enforcement — no token → 401 | ✅ |
| Auth login (test account) → 200 + JWT | ✅ test@plantguardians.local works |
| GET /plants with valid token → 200 | ✅ |
| GET /profile with valid token → 200 | ✅ |
| CORS for http://localhost:4173 | ✅ Access-Control-Allow-Origin: http://localhost:4173 |
| CORS for http://localhost:5173 | ✅ Access-Control-Allow-Origin: http://localhost:5173 |
| Frontend at :4173 → HTTP 200 + HTML | ✅ |
| uploads/ directory exists | ✅ |
| canvas-confetti dynamic chunk in dist | ✅ confetti.module-No8_urVw.js present |
| DB startup race condition fix | ✅ server.js awaits db.raw('SELECT 1') before listen |

#### Pre-Deploy Checklist

| Requirement | Status |
|-------------|--------|
| Backend tasks Done (T-008 – T-014) | ✅ |
| Frontend tasks Done (T-001 – T-007, T-021) | ✅ per H-023 |
| T-022 fix applied (bcrypt 6.0.0, 0 audit vulns) | ✅ |
| All frontend unit tests pass (48/48) | ✅ |
| All backend unit tests pass (40/40) | ✅ |
| Migrations run successfully | ✅ |
| Backend starts and health check passes | ✅ |
| Frontend build succeeds with all 7 screens | ✅ |
| uploads/ directory exists | ✅ |
| JWT secret generated (not default placeholder) | ✅ |
| Seed data present | ✅ |
| CORS configured for both :5173 and :4173 | ✅ |
| QA integration tests confirmed (T-015, T-016) | ⏳ PENDING — awaiting QA run |

#### Known Limitations

- GEMINI_API_KEY is a placeholder — POST /ai/advice returns 502 (expected; frontend handles gracefully)
- Docker not installed — staging uses local PostgreSQL 15 directly
- HTTPS not configured (staging only; production phase)
- T-023 marked In Progress pending QA integration test confirmation (T-015, T-016, T-017)

---

