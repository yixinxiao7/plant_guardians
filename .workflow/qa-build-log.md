# QA & Build Log

Tracks test runs, build results, and post-deploy health checks per sprint. Maintained by QA Engineer, Deploy Engineer, and Monitor Agent.

---

## Sprint 12 — Deploy Engineer: Staging Re-Deploy (Orchestrator Sprint #12 — 2026-03-30)

**Date:** 2026-03-30
**Agent:** Deploy Engineer (Orchestrator Sprint #12 — second invocation)
**Sprint:** 12
**Triggered By:** H-148 — QA Engineer confirmed T-056, T-053-frontend, T-057 all QA-passed. Prior processes (PID 71192 backend, PID 71254 frontend) were still running and confirmed healthy; re-deployed fresh to ensure clean state.

---

### Pre-Deploy Gate Check

| Gate | Status | Detail |
|------|--------|--------|
| QA sign-off in handoff log | ✅ PASS | H-148 — QA confirmed T-056, T-053-frontend, T-057 all passed |
| Post-deploy QA re-verification | ✅ PASS | H-151 — All tasks confirmed QA-passed, T-020 unblocked |
| Pending migrations | ✅ None | No new migrations for Sprint 12 |
| All sprint tasks Done | ✅ PASS | T-056, T-053-frontend, T-057 all Done. T-020 Backlog (user-driven) |

---

### Dependency Install

| Step | Result | Detail |
|------|--------|--------|
| `cd backend && npm install` | ✅ Success | Dependencies up to date (2 known audit advisories — non-blocking, tracked FB-051) |
| `cd frontend && npm install` | ✅ Success | Dependencies up to date |

---

### Frontend Build

| Step | Result | Detail |
|------|--------|--------|
| `cd frontend && npm run build` | ✅ Success | 4612 modules transformed, 0 errors |
| Frontend bundle size | 392.51 kB (114.67 kB gzip) | |
| Build warnings | None | |

---

### Migration Check

| Step | Result | Detail |
|------|--------|--------|
| `npx knex migrate:latest` | ✅ Already up to date | No new migrations for Sprint 12 |
| Schema changes | None | T-056, T-053-frontend, T-057 require no DB changes |

---

### Backend Restart

| Step | Result | Detail |
|------|--------|--------|
| Old backend (PID 71192) killed | ✅ | Process terminated cleanly |
| New backend started | ✅ | PID 72167 — `node src/server.js` |
| T-056 pool warm-up | ✅ | "Database pool warmed up with 2 connections." logged on startup |
| Startup time | ~4s | Pool warm-up completes before HTTP traffic accepted |

---

### Frontend Preview

| Step | Result | Detail |
|------|--------|--------|
| Old frontend preview (PID 71254) killed | ✅ | Process terminated cleanly |
| New frontend preview started | ✅ | PID 72179 — Sprint 12 build serving on http://localhost:4175 |
| HTTP status | ✅ 200 | `curl http://localhost:4175/` returns 200 |

---

### Environment Status (Post-Deploy)

| Component | Status | URL / Detail |
|-----------|--------|--------------|
| Backend API | ✅ Running | http://localhost:3000 — PID 72167 |
| Frontend (Sprint 12 build) | ✅ Running | http://localhost:4175 — PID 72179 |
| PostgreSQL (staging) | ✅ Connected | localhost:5432 — plant_guardians_staging |
| Migrations | ✅ Up to date | All 5 migrations applied |
| Health endpoint | ✅ 200 | `GET /api/health` → `{"status":"ok","timestamp":"2026-03-31T00:30:13.887Z"}` |

---

### Cold-Start Verification (T-056 Regression Test)

5 sequential POST /api/v1/auth/login calls immediately after backend restart (PID 72167):

| Request | HTTP Code |
|---------|-----------|
| 1 | 401 |
| 2 | 401 |
| 3 | 401 |
| 4 | 401 |
| 5 | 401 |

**Result: ✅ PASSED — 5/5 login requests returned 401 (expected for invalid credentials) with zero 500s.**
T-056 regression confirmed. Auth 500 cold-start issue is resolved.

---

### Sprint 12 Re-Deploy Summary

| Environment | Build Status | Deploy Status | Health |
|-------------|-------------|---------------|--------|
| Staging | ✅ Success | ✅ Deployed | ✅ Healthy |
| Production | N/A | N/A — not yet deployed | N/A |

**Changes deployed:**
- T-056: Knex pool warm-up in server.js, afterCreate validation hook + idle/reap timeouts in knexfile.js
- T-053-frontend: `credentials: 'include'` on all fetch calls, refreshToken memory var removed, silent re-auth on app init in api.js + useAuth.jsx
- T-057: TEST_DATABASE_URL clarifying comment in .env (no functional staging/production impact)

**Handoff:** Monitor Agent handoff logged (see handoff-log.md)

---

## Sprint 12 — Deploy Engineer: Staging Deploy Complete (2026-03-30)

**Date:** 2026-03-30
**Agent:** Deploy Engineer
**Sprint:** 12
**Triggered By:** H-148 — QA Engineer confirmed T-056, T-053-frontend, T-057 all QA-passed

---

### Pre-Deploy Gate Check

| Gate | Status | Evidence |
|------|--------|----------|
| T-056 (auth 500 fix) QA-passed | ✅ Done | H-148 — QA PASSED 2026-03-30, 74/74 backend tests |
| T-053-frontend (api.js cookie migration) QA-passed | ✅ Done | H-148 — QA PASSED 2026-03-30, 130/130 frontend tests |
| T-057 (TEST_DATABASE_URL fix) QA-passed | ✅ Done | H-148 — QA PASSED 2026-03-30, 74/74 backend tests |
| QA sign-off in handoff log | ✅ H-148 present | 2026-03-30 |

**Deploy Verdict: ✅ CLEARED — all gates passed**

---

### Build

| Step | Result | Detail |
|------|--------|--------|
| `cd frontend && npm run build` | ✅ Success | 4612 modules transformed, 0 errors |
| Frontend bundle size | 392.51 kB (114.67 kB gzip) | |
| Build warnings | None | |

---

### Migration Check

| Step | Result | Detail |
|------|--------|--------|
| `npx knex migrate:latest` | ✅ Already up to date | No new migrations for Sprint 12 |
| Schema changes | None | T-056, T-053-frontend, T-057 require no DB changes |

---

### Backend Restart

| Step | Result | Detail |
|------|--------|--------|
| Old backend (PID 69165) killed | ✅ | Process terminated cleanly |
| New backend started | ✅ | PID 71192 — `node src/server.js` |
| T-056 pool warm-up | ✅ | "Database pool warmed up with 2 connections." logged on startup |
| Startup time | ~3s | Pool warm-up completes before HTTP traffic accepted |

---

### Frontend Preview

| Step | Result | Detail |
|------|--------|--------|
| Old frontend preview PIDs killed | ✅ | PIDs 44508, 2563, 2544 terminated |
| New frontend preview started | ✅ | PID 71254 — Sprint 12 build serving on http://localhost:4175 |
| HTTP status | ✅ 200 | `curl http://localhost:4175/` returns 200 |

---

### Environment Status (Post-Deploy)

| Component | Status | URL / Detail |
|-----------|--------|--------------|
| Backend API | ✅ Running | http://localhost:3000 — PID 71192 |
| Frontend (Sprint 12 build) | ✅ Running | http://localhost:4175 — PID 71254 |
| PostgreSQL (staging) | ✅ Connected | localhost:5432 — plant_guardians_staging |
| Migrations | ✅ Up to date | All 5 migrations applied |
| Health endpoint | ✅ 200 | `GET /api/health` → `{"status":"ok","timestamp":"2026-03-31T00:20:07.885Z"}` |

---

### Cold-Start Verification (T-056 Regression Test)

Immediately after backend restart (PID 71192), ran two rounds of login calls:

**Sequential test (5 requests, back-to-back):**

| Request | HTTP Status | Result |
|---------|-------------|--------|
| 1 | 401 | ✅ No 500 (wrong credentials, expected 401) |
| 2 | 401 | ✅ No 500 |
| 3 | 401 | ✅ No 500 |
| 4 | 401 | ✅ No 500 |
| 5 | 401 | ✅ No 500 |

**Concurrent test (5 requests, simultaneous):**

| Result | HTTP Codes |
|--------|------------|
| ✅ PASSED | 401, 401, 401, 401, 401 — zero 500s |

**Cold-start verdict: ✅ PASSED — 10/10 login requests returned 401 (expected) with zero 500s.**
T-056 regression test confirmed. Auth 500 issue is resolved.

---

### Sprint 12 Deploy Summary

| Environment | Build Status | Deploy Status | Health |
|-------------|-------------|---------------|--------|
| Staging | ✅ Success | ✅ Deployed | ✅ Healthy |
| Production | N/A | N/A — not yet deployed | N/A |

**Changes deployed:**
- T-056: Knex pool warm-up in server.js, afterCreate validation hook + idle/reap timeouts in knexfile.js
- T-053-frontend: `credentials: 'include'` on all fetch calls, refreshToken memory var removed, silent re-auth on app init in api.js + useAuth.jsx
- T-057: TEST_DATABASE_URL clarifying comment in .env (no functional staging/production impact)

**Handoff:** H-150 → Monitor Agent for post-deploy health check

---

## Sprint 12 — Deploy Engineer: Staging Environment Status Check (2026-03-30)

**Date:** 2026-03-30
**Agent:** Deploy Engineer (Orchestrator Sprint #12 — deploy phase)
**Sprint:** 12
**Purpose:** Pre-deploy environment verification + backend restart to maintain staging availability

---

### Environment Status

| Component | Status | Detail |
|-----------|--------|--------|
| Backend | ✅ Running | http://localhost:3000 — PID 69165 — restarted this session (was down) |
| Frontend | ✅ Running | http://localhost:4175 (PID 44508) + http://localhost:5174 (PID 2563) — Sprint 11 build |
| PostgreSQL (staging) | ✅ Connected | localhost:5432 — plant_guardians_staging |
| Migrations | ✅ Up to date | `knex migrate:latest` → "Already up to date" |
| Health endpoint | ✅ 200 | `GET /api/health` → `{"status":"ok","timestamp":"2026-03-31T00:08:19.579Z"}` |
| CORS config | ✅ All ports | FRONTEND_URL covers :5173, :5174, :4173, :4175 |

---

### Backend Test Suite Verification

**Note:** `backend/.env` currently has `TEST_DATABASE_URL` pointing to port 5433 (PostgreSQL Docker container, not running in this environment — Docker not installed). Tests fail when run as-is. Port 5432 hosts the actual `plant_guardians_test` database.

| Test Condition | Result |
|----------------|--------|
| `npm test` (current .env — port 5433) | ❌ 74 tests fail (AggregateError — connection refused) |
| `TEST_DATABASE_URL=...5432/plant_guardians_test npm test` | ✅ **74/74 tests pass** (8 suites) |

**Observation:** The test database exists on port 5432 (plant_guardians_test). The .env TEST_DATABASE_URL mismatch (5433 vs 5432) is the T-057 concern and must be resolved by the Backend Engineer before `npm test` works without env overrides.

---

### Sprint 12 Deploy Readiness Gate Check

| Gate | Status | Notes |
|------|--------|-------|
| T-056 (auth 500 fix) QA-passed | ❌ Not done | Backend Engineer has not yet implemented fix |
| T-053-frontend (api.js cookie migration) QA-passed | ❌ Not done | Frontend Engineer has not yet implemented changes |
| QA sign-off in handoff log | ❌ Pending | No H-14x QA confirmation for Sprint 12 changes |

**Deploy Verdict: ⏳ BLOCKED — awaiting T-056 + T-053-frontend completion and QA sign-off**

Backend restarted to maintain staging availability. No new code deployed. Current build reflects Sprint 11 state.

---

## Sprint 11 — QA Verification Pass #2 (2026-03-30)

**Date:** 2026-03-30
**QA Engineer:** QA Agent (Orchestrator Sprint #11 run)
**Sprint:** 11
**Tasks In Scope:** T-055 (CORS fix), T-052 (Care type badges), T-054 (Photo isDirty fix), T-053 (HttpOnly cookie auth — backend only; frontend blocked)

---

### Test Type: Unit Test — Backend

| Check | Result |
|-------|--------|
| `cd backend && npm test` | ✅ **72/72 tests pass** (8 test suites) |
| T-053 auth cookie tests (14 tests incl. 4 new) | ✅ All pass — cookie set, rotation, revocation, clearing, missing cookie 401, invalid cookie 401, idempotent logout, attribute verification |
| T-055 no test regressions | ✅ Confirmed |
| Pre-existing flaky 429s in auth tests | ✅ Resolved — rate-limit env vars moved before `require(app)` |

**Verdict: PASS**

---

### Test Type: Unit Test — Frontend

| Check | Result |
|-------|--------|
| `cd frontend && npm test` | ✅ **117/117 tests pass** (20 test suites) |
| T-052 StatusBadge tests (care type icons + labels) | ✅ All pass — 3 care types, singular/plural, icon presence, CSS classes |
| T-052 PlantCard tests (careType prop passing) | ✅ All pass |
| T-054 EditPlantPage isDirty test (photo removal) | ✅ Pass — photo removal enables Save button |
| No regressions from Sprint 10 baseline (107 tests) | ✅ 10 new tests added (117 total), all pass |

**Verdict: PASS**

---

### Test Type: Integration Test — T-055 (CORS Fix)

| Check | Result | Notes |
|-------|--------|-------|
| `FRONTEND_URL` includes `:4173` and `:4175` | ✅ | `backend/.env` line 17 |
| `vite preview` uses `--port 4173` | ✅ | `frontend/package.json` preview script |
| `.env.example` documents all canonical ports | ✅ | Comments explain :5173/:5174 dev, :4173 preview, :4175 fallback |
| `.env` structure matches `.env.example` | ✅ | All keys present, order consistent |
| Backend PORT=3000 matches vite proxy target | ✅ | `vite.config.js` line 8: `http://localhost:3000` |

**Verdict: PASS**

---

### Test Type: Integration Test — T-052 (Care Type Badges)

| Check | Result | Notes |
|-------|--------|-------|
| PlantCard passes `careType` prop to StatusBadge | ✅ | `PlantCard.jsx` line 59: `careType={schedule.care_type}` |
| StatusBadge renders icon + label per CARE_TYPE_CONFIG | ✅ | Drop (blue #5B8FA8), Leaf (green #4A7C59), PottedPlant (terracotta #A67C5B) |
| Badge text format: "Watering: X days overdue" | ✅ | `fullLabel = config.label + ": " + statusText` |
| Singular/plural: "1 day" vs "2 days" | ✅ | Ternary on `daysOverdue === 1` |
| No careType fallback (not_set) renders without icon | ✅ | `config = careType ? CARE_TYPE_CONFIG[careType] : null` |
| No XSS vectors — text only, no innerHTML/dangerouslySetInnerHTML | ✅ | Confirmed via grep |
| SPEC-002 Amendment compliance | ✅ | Icon+color system matches CareHistoryPage convention |

**Verdict: PASS**

---

### Test Type: Integration Test — T-054 (Photo Removal isDirty Fix)

| Check | Result | Notes |
|-------|--------|-------|
| `isDirty` compares `photoUrl !== (plant.photo_url \|\| '')` | ✅ | `EditPlantPage.jsx` line 89 |
| `photoUrl` in `isDirty` dependency array | ✅ | Line 116 |
| Remove photo → `setPhotoUrl('')` → isDirty=true → Save enabled | ✅ | `onRemove` callback sets empty string |
| Save button disabled when `!isDirty` | ✅ | Line 311: `disabled={!isDirty \|\| saving}` |
| Unit test verifies scenario | ✅ | EditPlantPage.test.jsx |

**Verdict: PASS**

---

### Test Type: Integration Test — T-053 (HttpOnly Cookie Auth — Backend Only)

| Check | Result | Notes |
|-------|--------|-------|
| `POST /auth/register` sets `Set-Cookie` header | ✅ | `setRefreshTokenCookie(res, refresh_token)` line 90 |
| `POST /auth/login` sets `Set-Cookie` header | ✅ | Line 134 |
| `POST /auth/refresh` reads from `req.cookies.refresh_token` | ✅ | Line 159 |
| `POST /auth/refresh` rotates token + sets new cookie | ✅ | Lines 170, 182 |
| `POST /auth/logout` reads from cookie, revokes, clears | ✅ | Lines 202-208 |
| `DELETE /auth/account` clears cookie | ✅ | Line 254 |
| Cookie attributes: HttpOnly, Secure, SameSite=Strict, Path=/api/v1/auth | ✅ | Lines 47-52 |
| `refresh_token` NOT in response body (register/login) | ✅ | Response only includes `access_token` and `user` |
| `cookie-parser` registered before auth routes in app.js | ✅ | `app.use(cookieParser())` line 35, auth routes line 78 |
| CORS `credentials: true` set | ✅ | `app.js` line 31 |
| **Frontend `api.js` updated for cookie flow?** | ❌ BLOCKED | Still uses body-based `refresh_token` (lines 7, 33-49, 112-116). No `credentials: 'include'`. Silent re-auth not implemented. |

**Backend Verdict: PASS**
**Frontend Verdict: BLOCKED — api.js not updated. See H-131.**
**Overall T-053 Verdict: BLOCKED**

---

### Test Type: Config Consistency Check

| Check | Result | Notes |
|-------|--------|-------|
| Backend PORT (3000) matches vite proxy target | ✅ | `.env` PORT=3000, `vite.config.js` target=`http://localhost:3000` |
| Vite proxy uses http:// (no SSL in dev) | ✅ | Backend has no SSL config in dev |
| CORS_ORIGIN includes frontend dev server origin | ✅ | `http://localhost:5173` is first in FRONTEND_URL |
| Docker postgres port matches DATABASE_URL | ✅ | Both use port 5432 |
| Docker test postgres port matches TEST_DATABASE_URL | ⚠️ Minor | `.env` uses 5432 for test DB, `docker-compose.yml` maps test to 5433, `.env.example` uses 5433. Dev `.env` has test pointing to 5432 (shared staging port). Not a blocker — test runs use the test DB name, not the port. |

**Verdict: PASS (minor .env test port inconsistency noted — non-blocking)**

---

### Test Type: Security Scan

**Date:** 2026-03-30
**Scope:** All Sprint 11 tasks (T-055, T-052, T-053 backend, T-054)

#### Authentication & Authorization

| Check | Result | Notes |
|-------|--------|-------|
| All API endpoints require auth | ✅ | `authenticate` middleware on all protected routes |
| Auth tokens have expiration (15m access, 7d refresh) | ✅ | `.env` JWT_EXPIRES_IN=15m, REFRESH_TOKEN_EXPIRES_DAYS=7 |
| Password hashing uses bcrypt | ✅ | `User.js` line 11: `bcrypt.hash(password, SALT_ROUNDS)` |
| Failed login rate-limited | ✅ | `authLimiter` in app.js (20 req/15min) |
| Refresh token rotation on use | ✅ | Old token revoked before new one issued |
| HttpOnly cookie prevents JS access | ✅ | `httpOnly: true` in cookie options |
| SameSite=Strict prevents CSRF | ✅ | `sameSite: 'strict'` |
| Secure flag set | ✅ | `secure: true` — note: requires HTTPS in production |

#### Input Validation & Injection Prevention

| Check | Result | Notes |
|-------|--------|-------|
| Server-side validation on all inputs | ✅ | `validateBody` middleware on register/login |
| SQL queries use parameterized statements (Knex) | ✅ | All models use `.where()`, `.insert()` — no raw SQL concatenation |
| HTML output sanitized (no XSS) | ✅ | No `dangerouslySetInnerHTML`, no `innerHTML` in app code |
| File uploads validated (type, size) | ✅ | Multer config validates mimetype + size limit |

#### API Security

| Check | Result | Notes |
|-------|--------|-------|
| CORS allows only expected origins | ✅ | Dynamic origin check against allowedOrigins array |
| Rate limiting on public endpoints | ✅ | General (100/15min) + Auth-specific (20/15min) |
| Error responses don't leak internals | ✅ | errorHandler.js: unknown errors → generic "An unexpected error occurred" |
| Security headers via Helmet | ✅ | `app.use(helmet())` |

#### Data Protection

| Check | Result | Notes |
|-------|--------|-------|
| Credentials in .env, not in code | ✅ | JWT_SECRET, GEMINI_API_KEY in .env |
| .env in .gitignore | ✅ | Confirmed in .gitignore |
| .env.example uses placeholder values | ✅ | `your-super-secret-jwt-key-change-in-production` and `your-gemini-api-key` |
| Logs do not contain PII/passwords | ✅ | Only error messages logged, no req.body dumps |

#### npm audit

| Vulnerability | Severity | Package | Status |
|---------------|----------|---------|--------|
| brace-expansion < 1.1.13 | Moderate | nodemon dependency | Pre-existing, not new |
| path-to-regexp < 0.1.13 (ReDoS) | High | Express 4 dependency | Pre-existing, not new. Fix requires Express 5 migration (out of scope). |

**No new vulnerabilities introduced in Sprint 11.**

**Security Verdict: PASS — No P1 security issues. Pre-existing vulns are known and tracked.**

---

### Overall Sprint 11 QA Summary

| Task | Unit Tests | Integration | Security | Verdict |
|------|-----------|-------------|----------|---------|
| **T-055** (CORS fix) | ✅ 72/72 backend | ✅ Config verified | ✅ No issues | **Done** ✅ |
| **T-052** (Care badges) | ✅ 117/117 frontend | ✅ SPEC-002 compliant | ✅ No XSS | **Done** ✅ |
| **T-054** (Photo isDirty) | ✅ 117/117 frontend | ✅ Logic verified | ✅ No issues | **Done** ✅ |
| **T-053** (Cookie auth) | ✅ 72/72 backend | ❌ Frontend not updated | ✅ Backend secure | **Blocked** ⚠️ |

**Deploy Readiness:** T-055, T-052, T-054 are ready. T-053 remains blocked on frontend `api.js` update.

---

## Sprint 11 — Build Log (2026-03-30)

**Date:** 2026-03-30
**Deploy Engineer:** Deploy Agent (Orchestrator Sprint #11 run)
**Sprint:** 11
**Tasks Deployed:** T-055 (CORS fix), T-052 (care type badges), T-054 (photo isDirty fix)
**Excluded (Blocked):** T-053 (HttpOnly cookie auth — frontend `api.js` not updated)

---

### Dependency Install

| Step | Result |
|------|--------|
| `cd backend && npm install` | ✅ Success — `cookie-parser@1.4.7` confirmed installed |
| `cd frontend && npm install` | ✅ Success — all dependencies up to date |
| Known npm audit issues | ⚠️ Pre-existing: `brace-expansion` (moderate), `path-to-regexp` (high via Express 4). No new vulns. |

---

### Frontend Build

| Step | Result |
|------|--------|
| `cd frontend && npm run build` | ✅ **Success — 0 errors** |
| Build tool | Vite v8.0.2 |
| Modules transformed | 4,612 |
| Output: `dist/index.html` | 0.74 kB (gzip: 0.41 kB) |
| Output: `dist/assets/index-B5-ttYap.css` | 39.15 kB (gzip: 7.11 kB) |
| Output: `dist/assets/index-Ct89y25P.js` | 392.34 kB (gzip: 114.66 kB) |
| Build timestamp | 2026-03-30 09:44:04 |

**Build Verdict: PASS ✅**

---

### Database Migrations

| Step | Result |
|------|--------|
| `cd backend && npm run migrate` | ✅ **Already up to date** |
| Sprint 11 new migrations | None — T-053 requires no schema changes (cookie transport only) |
| All 5 Sprint 1 migrations | Confirmed up (users, refresh_tokens, plants, care_schedules, care_actions) |

---

### Staging Deployment

**Environment:** Staging (local)
**Build Status:** ✅ Success

| Service | URL | PID | Status |
|---------|-----|-----|--------|
| **Backend API** | http://localhost:3000 | 41646 | ✅ Running |
| **Frontend (Sprint 11 build)** | http://localhost:4175 | 44508 | ✅ Running |

#### Health Verification

| Check | Result | Notes |
|-------|--------|-------|
| `GET http://localhost:3000/api/v1/plants` | ✅ 401 | Expected — no auth token. Backend responding. |
| `GET http://localhost:4175/` | ✅ 200 | Frontend serving Sprint 11 build |
| CORS preflight (`OPTIONS /api/v1/plants`, Origin: http://localhost:4175) | ✅ 204 | `Access-Control-Allow-Origin: http://localhost:4175` confirmed |
| `Access-Control-Allow-Credentials: true` header | ✅ Present | Required for cookie-based auth (T-053 backend) |
| `cookie-parser@1.4.7` installed in backend | ✅ Confirmed | T-053 backend dependency |

#### Sprint 11 Feature Verification

| Feature | Status | Notes |
|---------|--------|-------|
| T-055 — CORS ports 4173 + 4175 | ✅ Live | Preflight 204 from :4175 confirmed |
| T-052 — Care type badges on PlantCard | ✅ Live | Bundled in Sprint 11 frontend build |
| T-054 — Photo removal enables Save button | ✅ Live | Bundled in Sprint 11 frontend build |
| T-053 — HttpOnly cookie auth (backend) | ✅ Live (backend only) | Frontend `api.js` NOT updated — integrated refresh flow is broken until H-130/H-131 resolved |

#### Known Issues (Not Regressions)

- **T-053 integrated refresh flow broken:** Frontend `api.js` still sends `refresh_token` in request body; backend now reads from cookie. Token refresh will return 401. Tracked in H-131. Not a regression.
- **Port 4173 occupied:** Unrelated triplanner project runs on :4173. Frontend preview on :4175 — CORS verified. Not a blocker.
- **Pre-existing npm audit vulnerabilities:** 2 known (brace-expansion moderate, path-to-regexp high via Express 4). Not new.

**Staging Deploy Verdict: ✅ SUCCESS — T-055, T-052, T-054 live and verified. T-053 partial (backend only).**

---

## Sprint 11 — Re-Deploy Validation (2026-03-30 — Orchestrator Re-Invoke)

**Date:** 2026-03-30
**Deploy Engineer:** Deploy Agent (Orchestrator Sprint #11 deploy phase re-invoke)
**Sprint:** 11
**Purpose:** Validation pass — re-invoke after QA phase checkpoint. No code changes since previous deploy (commit `263eb73`). Services confirmed running; build re-run to verify no drift.

---

### Dependency Install

| Step | Result |
|------|--------|
| `cd backend && npm install` | ✅ Success — all packages up to date |
| `cd frontend && npm install` | ✅ Success — all packages up to date |
| Known npm audit issues | ⚠️ Pre-existing: `brace-expansion` (moderate), `path-to-regexp` (high via Express 4). No new vulns introduced. |

---

### Frontend Build

| Step | Result |
|------|--------|
| `cd frontend && npm run build` | ✅ **Success — 0 errors** |
| Build tool | Vite v8.0.2 |
| Modules transformed | 4,612 |
| Output: `dist/index.html` | 0.74 kB (gzip: 0.41 kB) |
| Output: `dist/assets/index-B5-ttYap.css` | 39.15 kB (gzip: 7.11 kB) |
| Output: `dist/assets/index-Ct89y25P.js` | 392.34 kB (gzip: 114.66 kB) |
| Build timestamp | 2026-03-30 (re-validation) |

**Build Verdict: PASS ✅ — Identical to previous build. No regressions.**

---

### Database Migrations

| Step | Result |
|------|--------|
| `cd backend && npm run migrate` | ✅ **Already up to date** |
| Sprint 11 new migrations | None — T-053 requires no schema changes |
| All 5 Sprint 1 migrations | Confirmed up (users, refresh_tokens, plants, care_schedules, care_actions) |

---

### Staging Environment — Current State

**Environment:** Staging (local)
**Build Status:** ✅ Success

| Service | URL | PID | Status |
|---------|-----|-----|--------|
| **Backend API** | http://localhost:3000 | 41646 | ✅ Running (`node src/server.js`) |
| **Frontend (Sprint 11 build)** | http://localhost:4175 | 44508 | ✅ Running (vite preview) |

#### Health Verification

| Check | Result | Notes |
|-------|--------|-------|
| `GET http://localhost:3000/api/v1/plants` (no auth) | ✅ 401 JSON | Expected — backend responding correctly |
| `GET http://localhost:4175/` | ✅ 200 HTML | Frontend serving Sprint 11 build |
| CORS preflight (`OPTIONS /api/v1/plants`, Origin: http://localhost:4175) | ✅ 204 | `Access-Control-Allow-Origin: http://localhost:4175` confirmed |
| `Access-Control-Allow-Credentials: true` | ✅ Present | Required for T-053 cookie-based auth |
| `Access-Control-Allow-Methods` | ✅ GET,HEAD,PUT,PATCH,POST,DELETE | |

#### Sprint 11 Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| T-055 — CORS ports 4173 + 4175 | ✅ Live | Verified — 204 preflight from :4175 |
| T-052 — Care type badges on PlantCard | ✅ Live | Bundled in Sprint 11 frontend build |
| T-054 — Photo removal enables Save button | ✅ Live | Bundled in Sprint 11 frontend build |
| T-053 — HttpOnly cookie auth (backend) | ✅ Live (backend only) | Frontend `api.js` not updated — H-136 pending |

#### Known Issues (Not Regressions)

- **T-053 integrated flow blocked:** Frontend `api.js` still body-based. Tracked in H-131/H-136.
- **Port 4173 occupied:** Triplanner project on :4173; plant_guardians frontend on :4175 — CORS verified.
- **Pre-existing npm audit vulnerabilities:** 2 known. Not new.

**Re-Validation Verdict: ✅ PASS — Staging environment healthy. T-055, T-052, T-054 confirmed live. Handoff H-137 sent to Monitor Agent.**

---

## Sprint #11 — Post-Deploy Health Check (2026-03-30)

**Test Type:** Post-Deploy Health Check + Config Consistency Validation
**Agent:** Monitor Agent
**Sprint:** 11
**Environment:** Staging (local)
**Timestamp:** 2026-03-30T19:04:00Z
**Triggered By:** H-133 (Deploy Engineer) + H-137 (Deploy Engineer re-validation)
**Deploy Verified:** **No ⚠️**

---

### Config Consistency Validation

| Check | Source A | Source B | Result |
|-------|----------|----------|--------|
| **Port match** | `backend/.env` PORT=3000 | `frontend/vite.config.js` proxy target `http://localhost:3000` | ✅ PASS |
| **Protocol match** | `backend/.env` — no `SSL_KEY_PATH` / `SSL_CERT_PATH` set → HTTP | Vite proxy uses `http://localhost:3000` | ✅ PASS |
| **CORS match** | `backend/.env` FRONTEND_URL=`http://localhost:5173,http://localhost:5174,http://localhost:4173,http://localhost:4175` | Frontend dev server default `:5173`, staging `:4175` | ✅ PASS |
| **Docker port match** | `infra/docker-compose.yml` — only PostgreSQL containers (5432/5433); no backend container | N/A | ✅ N/A |

**Config Consistency Result: ✅ PASS — No mismatches detected.**

Notes:
- Backend serves plain HTTP (no SSL configured); Vite proxy correctly uses `http://`. No protocol mismatch.
- `FRONTEND_URL` now correctly includes all relevant origins: 5173, 5174, 4173, 4175. Prior CORS failure (FB-043, H-117) is resolved by T-055.
- Docker-compose does not define a backend service container; only PostgreSQL is containerised. No backend port mapping to validate.

---

### Health Checks

**Services Running at Time of Check:**

| Service | URL | PID | Status |
|---------|-----|-----|--------|
| Backend API | http://localhost:3000 | 41646 | ✅ Running (`node src/server.js`) |
| Frontend (Sprint 11 build) | http://localhost:4175 | 44508 | ✅ Running (vite preview) |
| PostgreSQL | localhost:5432 | — | ✅ Connected |

#### Check Results

| # | Check | Expected | Actual | Result |
|---|-------|----------|--------|--------|
| 1 | `GET http://localhost:3000/api/health` | 200 `{"status":"ok"}` | 200 `{"status":"ok","timestamp":"2026-03-30T19:02:17.180Z"}` | ✅ PASS |
| 2 | `GET http://localhost:3000/api/v1/health` | 200 (per contract spec) | 404 `{"error":{"message":"Route not found.","code":"NOT_FOUND"}}` | ⚠️ NOTE (health route is `/api/health`, not `/api/v1/health`) |
| 3 | `POST /api/v1/auth/login` (test@plantguardians.local / TestPass123!) | 200 + `access_token` + `Set-Cookie` | **Intermittent:** 500 `INTERNAL_ERROR` on 2 of first 8 calls; 200 on all subsequent calls | ❌ **FAIL — intermittent 500** |
| 4 | `POST /api/v1/auth/login` — Set-Cookie header | `HttpOnly; Secure; SameSite=Strict` present | `Set-Cookie: refresh_token=...; Max-Age=604800; Path=/api/v1/auth; HttpOnly; Secure; SameSite=Strict` | ✅ PASS (T-053 cookie flow live) |
| 5 | `POST /api/v1/auth/refresh` (no cookie) | 401 `INVALID_REFRESH_TOKEN` | `{"error":{"message":"Refresh token is invalid, expired, or already used.","code":"INVALID_REFRESH_TOKEN"}}` HTTP 401 | ✅ PASS |
| 6 | `GET /api/v1/plants` (no auth) | 401 `UNAUTHORIZED` | `{"error":{"message":"Missing or invalid authorization header.","code":"UNAUTHORIZED"}}` HTTP 401 | ✅ PASS |
| 7 | `GET /api/v1/plants` (with Bearer token) | 200 + pagination | `{"data":[],"pagination":{"page":1,"limit":50,"total":0}}` HTTP 200 | ✅ PASS |
| 8 | `GET /api/v1/profile` (with Bearer token) | 200 + user data | `{"data":{"user":{"id":"51b28759...","full_name":"Test User","email":"test@plantguardians.local",...},"stats":{...}}}` HTTP 200 | ✅ PASS |
| 9 | `GET /api/v1/care-actions` (with Bearer token) | 200 + pagination | `{"data":[],"pagination":{"page":1,"limit":20,"total":0}}` HTTP 200 | ✅ PASS |
| 10 | `GET /api/v1/care-due` (with Bearer token) | 200 + overdue/due_today/upcoming | `{"data":{"overdue":[],"due_today":[],"upcoming":[]}}` HTTP 200 | ✅ PASS |
| 11 | `POST /api/v1/plants` (with Bearer token) | 201 + plant object | `{"data":{"id":"81624784-...","name":"Health Check Plant",...,"care_schedules":[]}}` HTTP 201 | ✅ PASS |
| 12 | `GET /api/v1/plants/:id` (with Bearer token) | 200 + plant detail | HTTP 200 with full plant object including `recent_care_actions` | ✅ PASS |
| 13 | `DELETE /api/v1/plants/:id` (with Bearer token) | 200 + confirmation | `{"data":{"message":"Plant deleted successfully.","id":"81624784-..."}}` HTTP 200 | ✅ PASS |
| 14 | `POST /api/v1/ai/advice` (with Bearer token) | 200 with AI care advice | HTTP 200 with full care advice JSON (Gemini API live) | ✅ PASS |
| 15 | CORS preflight `OPTIONS /api/v1/plants` Origin: http://localhost:4175 | 204 + `Access-Control-Allow-Origin: http://localhost:4175` | HTTP 204 + `Access-Control-Allow-Origin: http://localhost:4175`, `Access-Control-Allow-Credentials: true` | ✅ PASS |
| 16 | Frontend `GET http://localhost:4175/` | 200 HTML | HTTP 200 with full React app HTML | ✅ PASS |
| 17 | Database connectivity | Connected, queries succeed | 3 users in `plant_guardians_staging.users`, CRUD operations succeed | ✅ PASS |
| 18 | No 5xx errors on protected routes | 0 5xx | 0 5xx on all protected endpoints (auth/plants/profile/care) | ✅ PASS |
| 19 | Auth rate limit behavior | 429 after AUTH_RATE_LIMIT_MAX | 429 received after ~18 calls within 15-min window | ✅ PASS (rate limiter working) |

---

### Issues Found

#### ❌ FAIL: Intermittent 500 on POST /api/v1/auth/login

**Severity:** Major
**Observed:** 2 of the first 8 login calls returned HTTP 500 `{"error":{"message":"An unexpected error occurred.","code":"INTERNAL_ERROR"}}`
**Pattern:** Failures occurred on calls 1 and 3 of the health check session. All subsequent calls (~15+) returned 200. Suggests a possible cold-start / DB connection pool warm-up issue or a race condition in the T-053 cookie-based auth code path.
**Impact:** Real users hitting the backend after a restart or idle period could receive a 500 error on login. This is a P1 reliability issue that blocks T-020 user testing sign-off.
**Reproducibility:** Could not consistently reproduce — does not appear to be a persistent failure, but was observed twice in a single session.

#### ⚠️ WARNING: Auth Rate Limit Window Partially Exhausted by Health Check

**Severity:** Minor (monitor-induced)
**Observed:** Approximately 18 POST /api/v1/auth/login calls were made during this health check run. Final 2 calls returned HTTP 429 "Too many authentication attempts". The `AUTH_RATE_LIMIT_MAX=20` per 15-minute window is effectively exhausted.
**Impact:** If Playwright smoke tests or further automated tests requiring auth run within the current 15-minute window, they will encounter 429 responses. Wait ~15 minutes before running auth-dependent tests.
**Note:** The system prompt explicitly warns to use `/auth/login` instead of `/auth/register` to avoid consuming registration rate limits. The same caution applies to login rate limits when running many health check calls. Future health checks should limit auth calls to ≤3 per run.

#### ℹ️ NOTE: Health route discrepancy — `/api/health` not `/api/v1/health`

**Severity:** Informational
**Observed:** The health endpoint is reachable at `GET /api/health` (returns 200), but `GET /api/v1/health` returns 404. The API contracts and monitor health check template reference `/api/v1/health`.
**Impact:** Non-blocking — backend is healthy. Contracts and monitoring templates should be updated to reference `/api/health` to avoid confusion.

#### ℹ️ NOTE: T-053 integrated refresh flow broken (known, documented)

**Severity:** Informational (tracked issue, not a regression)
**Details:** Frontend `api.js` still sends refresh token in request body; backend now reads from `req.cookies.refresh_token`. Token refresh returns 401 after 15-minute access token expiry. Tracked in H-131/H-136. Not a regression introduced by this deploy — Frontend Engineer has not yet completed the frontend half of T-053.

---

### Summary

| Category | Result |
|----------|--------|
| Config Consistency | ✅ PASS |
| Backend responding | ✅ PASS (`/api/health` → 200) |
| Auth flow (login + Set-Cookie) | ⚠️ PARTIAL — works after warm-up; intermittent 500 on first calls |
| Auth enforcement (401 without token) | ✅ PASS |
| Protected API endpoints (plants, profile, care-actions, care-due) | ✅ PASS (5/5) |
| CRUD operations (create/read/delete plant) | ✅ PASS |
| AI advice endpoint | ✅ PASS (Gemini API live) |
| CORS (staging origin :4175) | ✅ PASS |
| Frontend (http://localhost:4175/) | ✅ PASS |
| Database connectivity | ✅ PASS |
| No 5xx on core endpoints | ✅ PASS (auth login 500 only, intermittent) |

**Deploy Verified: No ⚠️**

**Reason:** Intermittent HTTP 500 `INTERNAL_ERROR` observed on POST /api/v1/auth/login (2 occurrences in initial session). All other 17 endpoint checks pass. Config consistency fully validated. Cannot certify staging as fully healthy until the auth 500 root cause is identified and confirmed resolved. Investigation handoff sent to Deploy Engineer (H-138).

**T-020 User Testing Gate:** T-020 is conditionally unblocked pending resolution of the intermittent auth 500. If the 500 is confirmed to be a transient cold-start artifact (not reproducible after warm-up), T-020 may proceed with the caveat that the backend should be confirmed warm before testing begins.

---

## Sprint 12 — QA Engineer: Full Test & Verification Run (2026-03-30)

**Date:** 2026-03-30
**Agent:** QA Engineer (Orchestrator Sprint #12 — QA phase)
**Sprint:** 12
**Tasks Under Test:** T-056 (Auth 500 cold-start fix), T-053-frontend (api.js cookie migration), T-057 (TEST_DATABASE_URL port fix)

---

### Test Run 1 — Unit Tests: Backend (T-056, T-057)

| Field | Value |
|-------|-------|
| **Test Type** | Unit Test |
| **Target** | Backend (`npm test`) |
| **Date** | 2026-03-30 |
| **Result** | **PASS — 74/74** |

**Details:**
- First full suite run: 73 passed, 1 failed (`careDue.test.js` → "should handle never-done plants" — `socket hang up`). Re-run of careDue.test.js in isolation: 8/8 pass. Second full suite run: 74/74 pass. The failure is a pre-existing flaky "socket hang up" in the test environment — not related to Sprint 12 changes.
- T-056 regression tests present and passing:
  - `POST /api/v1/auth/login — cold-start regression (T-056)`: 5 rapid sequential login calls → all 200 ✅
  - `POST /api/v1/auth/login — cold-start regression (T-056)`: 5 concurrent login calls → all 200 ✅
- T-057: Tests run successfully with `TEST_DATABASE_URL` at port 5432.
- All 8 test suites pass: auth (16), plants (14), ai (11), careHistory (9), careDue (8), careActions (6), account (4), profile (2).

---

### Test Run 2 — Unit Tests: Frontend (T-053-frontend)

| Field | Value |
|-------|-------|
| **Test Type** | Unit Test |
| **Target** | Frontend (`npm test` / `vitest run`) |
| **Date** | 2026-03-30 |
| **Result** | **PASS — 130/130** |

**Details:**
- 22 test files, 130 tests, all pass.
- 13 new tests for T-053-frontend:
  - `api.test.js` (10 new): credentials include, refresh with no body, logout with no body, auto-refresh on 401, deleteAccount credentials, etc.
  - `useAuth.test.jsx` (3 new tests in 5 describe blocks): silent refresh success, silent refresh failure, skip refresh for fresh visitor, login stores access token only, logout clears tokens.
- No regressions to existing 117 tests.
- Build: 0 errors (vitest transform + setup clean).

---

### Test Run 3 — Integration Test: T-056 (Auth 500 Cold-Start Fix)

| Field | Value |
|-------|-------|
| **Test Type** | Integration Test |
| **Target** | T-056 — backend pool warm-up and cold-start fix |
| **Date** | 2026-03-30 |
| **Result** | **PASS** |

**Verification checklist:**

| Check | Result |
|-------|--------|
| `knexfile.js` has `afterCreate` connection validation hook in all 4 environments (dev, test, staging, prod) | ✅ PASS |
| `knexfile.js` has `idleTimeoutMillis: 30000` for dev/staging/prod, `10000` for test | ✅ PASS |
| `knexfile.js` has `reapIntervalMillis: 1000` for dev/staging/prod | ✅ PASS |
| `server.js` warms pool with `Math.max(poolMin, 2)` concurrent `SELECT 1` queries before `app.listen()` | ✅ PASS |
| `cookieParser()` registered at line 35, auth routes at line 78 — correct middleware order | ✅ PASS |
| 2 regression tests (sequential + concurrent rapid login) present and passing | ✅ PASS |
| 74/74 backend tests pass (no regressions) | ✅ PASS |

---

### Test Run 4 — Integration Test: T-053-frontend (api.js Cookie Migration)

| Field | Value |
|-------|-------|
| **Test Type** | Integration Test |
| **Target** | T-053-frontend — HttpOnly cookie auth in api.js + useAuth.jsx |
| **Date** | 2026-03-30 |
| **Result** | **PASS** |

**Verification checklist:**

| Check | Result |
|-------|--------|
| `credentials: 'include'` on `refreshAccessToken()` (line 40) | ✅ PASS |
| `credentials: 'include'` on `request()` (line 66) | ✅ PASS |
| `credentials: 'include'` on 401 retry in `request()` (line 73) | ✅ PASS |
| `credentials: 'include'` on `deleteAccount()` initial call (line 127) | ✅ PASS |
| `credentials: 'include'` on `deleteAccount()` retry (line 134) | ✅ PASS |
| `refreshToken` memory variable fully removed — only `accessToken` remains | ✅ PASS |
| `getRefreshToken()` export removed | ✅ PASS |
| `setTokens(access, _refresh)` kept as legacy alias — only stores access token | ✅ PASS |
| `setAccessToken(token)` added as direct access token setter | ✅ PASS |
| `refreshAccessToken()` sends POST /auth/refresh with NO body (cookie-based) | ✅ PASS |
| `auth.logout()` sends POST /auth/logout with NO body | ✅ PASS |
| 401 auto-refresh: attempts refresh on any 401 (no longer checks `refreshToken` existence) | ✅ PASS |
| Silent re-auth in `useAuth.jsx`: `useEffect` calls `refreshAccessToken()` on mount when `pg_user` exists | ✅ PASS |
| Loading state starts as `true` when stored user exists (prevents login flash) | ✅ PASS |
| On refresh failure: clears sessionStorage, sets user to null | ✅ PASS |
| `login()` and `register()` no longer read `refresh_token` from response body | ✅ PASS |
| `persistSession()` accepts `(userData, accessToken)` — no refresh token | ✅ PASS |
| API contract match: request/response shapes consistent with Sprint 11 auth contract (GROUP 11A) | ✅ PASS |
| 130/130 frontend tests pass (no regressions) | ✅ PASS |

---

### Test Run 5 — Integration Test: T-057 (TEST_DATABASE_URL Port Fix)

| Field | Value |
|-------|-------|
| **Test Type** | Integration Test |
| **Target** | T-057 — .env TEST_DATABASE_URL port consistency |
| **Date** | 2026-03-30 |
| **Result** | **PASS** |

**Verification checklist:**

| Check | Result |
|-------|--------|
| `backend/.env` `TEST_DATABASE_URL` uses port 5432 (matches local PG) | ✅ PASS |
| Explanatory comment documents .env.example discrepancy (port 5433 for Docker) | ✅ PASS |
| `knexfile.js` test fallback URL updated to 5433 for future Docker compatibility | ✅ PASS |
| No other env vars changed in `.env` | ✅ PASS |
| 74/74 backend tests pass | ✅ PASS |

---

### Test Run 6 — Config Consistency Check

| Field | Value |
|-------|-------|
| **Test Type** | Config Consistency |
| **Date** | 2026-03-30 |
| **Result** | **PASS — No mismatches** |

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Backend PORT matches vite proxy target | PORT=3000, proxy `http://localhost:3000` | PORT=3000, proxy `http://localhost:3000` | ✅ MATCH |
| Protocol match (SSL/no SSL) | No SSL → http:// | http:// in both | ✅ MATCH |
| CORS includes frontend dev origin | `http://localhost:5173` in FRONTEND_URL | Present (plus :5174, :4173, :4175) | ✅ MATCH |
| Docker compose backend container | No backend container in docker-compose.yml | Confirmed — only postgres services | ✅ N/A |

---

### Test Run 7 — Security Scan

| Field | Value |
|-------|-------|
| **Test Type** | Security Scan |
| **Date** | 2026-03-30 |
| **Result** | **PASS (with advisory notes)** |

#### Authentication & Authorization

| Check | Result |
|-------|--------|
| All API endpoints require appropriate authentication | ✅ PASS — `authenticate` middleware on all protected routes; register/login/refresh are public by design |
| Auth tokens have appropriate expiration and refresh | ✅ PASS — access token 15m, refresh token 7 days, rotation on refresh |
| Password hashing uses bcrypt | ✅ PASS — `bcrypt.hash(password, SALT_ROUNDS)` in User.js |
| Failed login attempts are rate-limited | ✅ PASS — `authLimiter` at 20 req/15min on `/api/v1/auth/` |
| Refresh token stored as HttpOnly, Secure, SameSite=Strict cookie | ✅ PASS — `auth.js` line 46–52 |

#### Input Validation & Injection Prevention

| Check | Result |
|-------|--------|
| All user inputs validated server-side | ✅ PASS — `validateBody` middleware on register/login; Knex parameterized queries throughout |
| SQL queries use parameterized statements | ✅ PASS — All queries via Knex query builder. `.raw()` only used for `gen_random_uuid()` (migrations) and `MAX()` aggregate (no user input) |
| HTML output sanitized (XSS prevention) | ✅ PASS — React default escaping. No `dangerouslySetInnerHTML` in production code (only in test assertion) |

#### API Security

| Check | Result |
|-------|--------|
| CORS allows only expected origins | ✅ PASS — Comma-separated FRONTEND_URL with explicit origin list |
| Rate limiting on public-facing endpoints | ✅ PASS — General (100/15min) + auth-specific (20/15min) |
| API responses do not leak internal details | ✅ PASS — `errorHandler.js` returns generic `INTERNAL_ERROR` for unknown errors, never stack traces |
| HTTP security headers | ✅ PASS — Helmet middleware applied |

#### Data Protection

| Check | Result |
|-------|--------|
| Database credentials in environment variables | ✅ PASS — DATABASE_URL, JWT_SECRET, GEMINI_API_KEY all from .env |
| .env is gitignored | ✅ PASS — Confirmed per handoff notes |
| Logs do not contain PII/passwords/tokens | ✅ PASS — Only error messages and pool status logged |

#### npm audit Results

| Vulnerability | Severity | Package | Fix Available | Status |
|--------------|----------|---------|---------------|--------|
| brace-expansion `<1.1.13` | Moderate | nodemon transitive dep (dev only) | Yes (`npm audit fix`) | Advisory — dev dependency, no production risk |
| path-to-regexp `<0.1.13` (ReDoS) | High | Express 4 transitive dep | Yes (`npm audit fix`) | Advisory — known Express 4 issue. Express 5 migration is out of scope per Sprint 12. Rate limiting mitigates ReDoS risk in practice. |

**Security scan verdict:** PASS. No P1 security failures. The 2 npm audit items are known transitive dependency issues with mitigations in place (rate limiting for path-to-regexp ReDoS, dev-only for brace-expansion). Recommend running `npm audit fix` as a Sprint 13 housekeeping task.

---

### QA Verdict — Sprint 12

| Task | Unit Tests | Integration | Security | Config | Overall |
|------|-----------|-------------|----------|--------|---------|
| T-056 | ✅ 74/74 | ✅ PASS | ✅ PASS | ✅ N/A | **QA PASSED** |
| T-053-frontend | ✅ 130/130 | ✅ PASS | ✅ PASS | ✅ N/A | **QA PASSED** |
| T-057 | ✅ 74/74 | ✅ PASS | ✅ PASS | ✅ PASS | **QA PASSED** |

**All Sprint 12 engineering tasks pass QA.** Ready for deployment.

T-020 (user testing) remains in Backlog — its prerequisites (T-056, T-053-frontend) are now Done. T-020 can proceed.

---

## Sprint 12 — Post-Deploy QA Re-Verification (2026-03-30)

**Date:** 2026-03-30
**Agent:** QA Engineer (Orchestrator Sprint #12 — post-deploy re-verification)
**Sprint:** 12
**Triggered By:** Orchestrator QA phase after H-150 staging deploy

---

### Test Run 6: Post-Deploy Unit Tests — Backend

| Field | Value |
|-------|-------|
| Test Type | Unit Test |
| Target | Backend (all test suites) |
| Command | `cd backend && npm test` |
| Result | **74/74 PASS** |
| Suites | 8/8 passed: auth (16), plants (16), ai (11), careHistory (9), careDue (8), careActions (6), account (4), profile (2) |
| T-056 regression | 2 cold-start tests (sequential + concurrent login) — PASS |
| Duration | ~20s |

**Verdict: ✅ PASS — 74/74 backend tests pass post-deploy. No regressions.**

---

### Test Run 7: Post-Deploy Unit Tests — Frontend

| Field | Value |
|-------|-------|
| Test Type | Unit Test |
| Target | Frontend (all test suites) |
| Command | `cd frontend && npm test` |
| Result | **130/130 PASS** |
| Suites | 22/22 passed |
| T-053-frontend tests | 13 new tests (10 api.test.js + 5 useAuth.test.jsx — 2 share describe blocks) — all PASS |
| Duration | ~3.5s |

**Verdict: ✅ PASS — 130/130 frontend tests pass post-deploy. No regressions.**

---

### Test Run 8: Post-Deploy Integration Test

| Field | Value |
|-------|-------|
| Test Type | Integration Test |
| Scope | T-056 (auth cold-start), T-053-frontend (cookie auth), T-057 (env config) |

#### API Contract Verification

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| `credentials: 'include'` on all fetch calls in api.js | Present on request(), refreshAccessToken(), deleteAccount() | Verified in source: lines 40, 66, 73, 127, 134 | ✅ PASS |
| refreshAccessToken() sends no body | POST /auth/refresh with no body, cookie-only | Verified: lines 38-42, no body param | ✅ PASS |
| auth.logout() sends no body | POST /auth/logout with no body | Verified: lines 116-118, no body param | ✅ PASS |
| Silent re-auth on mount (useAuth.jsx) | useEffect calls refreshAccessToken() when pg_user in sessionStorage | Verified: lines 20-54 | ✅ PASS |
| Loading state prevents login flash | loading starts true when stored user exists | Verified: lines 13-15 | ✅ PASS |
| Backend reads refresh_token from cookie | req.cookies.refresh_token in /refresh and /logout | Verified: auth.js lines 159, 202 | ✅ PASS |
| HttpOnly cookie attributes | httpOnly:true, secure:true, sameSite:'strict', path:'/api/v1/auth' | Verified: auth.js lines 46-52 | ✅ PASS |
| Refresh token rotation | Old token revoked, new token issued | Verified: auth.js lines 170-182 | ✅ PASS |
| Cookie cleared on logout | clearRefreshTokenCookie() called | Verified: auth.js line 208 | ✅ PASS |
| Cookie cleared on account deletion | clearRefreshTokenCookie() called | Verified: auth.js line 254 | ✅ PASS |
| 401 auto-refresh in api.js | On 401, attempts refreshAccessToken(), retries original request | Verified: api.js lines 69-78 | ✅ PASS |
| Auth failure callback | onAuthFailure clears user, tokens, sessionStorage | Verified: useAuth.jsx lines 56-62 | ✅ PASS |

#### T-056 Integration Checks

| Check | Status |
|-------|--------|
| knexfile.js: `afterCreate` hook in all 4 environments (dev, test, staging, production) | ✅ Verified: lines 18-21, 38-41, 59-62, 79-82 |
| knexfile.js: `idleTimeoutMillis` configured (dev: 30000, test: 10000, staging: 30000, production: 30000) | ✅ Verified |
| knexfile.js: `reapIntervalMillis` in dev/staging/production (1000) | ✅ Verified |
| server.js: Pool warm-up with concurrent SELECT 1 queries | ✅ Verified: line 16 |
| cookie-parser before auth routes in app.js | ✅ Verified: cookieParser() at line 35, auth routes at line 78 |

#### T-057 Integration Checks

| Check | Status |
|-------|--------|
| .env TEST_DATABASE_URL uses port 5432 | ✅ Verified: line 12 |
| Clarifying comment about .env.example discrepancy | ✅ Verified: lines 9-11 |
| knexfile.js test fallback uses 5433 for future Docker | ✅ Verified: line 31 |
| No other env vars changed | ✅ Verified |

**Integration verdict: ✅ PASS — All contracts match between frontend and backend. T-056, T-053-frontend, T-057 all verified.**

---

### Test Run 9: Post-Deploy Config Consistency Check

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Backend PORT | 3000 | `PORT=3000` in .env | ✅ |
| Vite proxy target | http://localhost:3000 | `backendTarget = 'http://localhost:3000'` in vite.config.js | ✅ |
| Protocol match | Both HTTP (no SSL in dev) | Backend: no SSL config; Vite: `http://` | ✅ |
| CORS origins include frontend dev server | http://localhost:5173 | `FRONTEND_URL=http://localhost:5173,http://localhost:5174,http://localhost:4173,http://localhost:4175` | ✅ |
| docker-compose postgres port | 5432 | `${POSTGRES_PORT:-5432}:5432` | ✅ |
| docker-compose test postgres port | 5433 | `${POSTGRES_TEST_PORT:-5433}:5432` | ✅ |
| knexfile test fallback port | 5433 (for Docker) | Verified | ✅ |
| .env TEST_DATABASE_URL port | 5432 (for local, no Docker) | Verified | ✅ |

**Config consistency verdict: ✅ PASS — No mismatches found.**

---

### Test Run 10: Post-Deploy Security Scan

| Security Checklist Item | Status | Evidence |
|------------------------|--------|----------|
| **Authentication & Authorization** | | |
| All API endpoints require auth | ✅ | `authenticate` middleware on all protected routes; tests verify 401 without auth |
| Auth tokens have expiration | ✅ | JWT_EXPIRES_IN=15m; refresh token 7 days with rotation |
| Password hashing uses bcrypt | ✅ | bcrypt with SALT_ROUNDS=12 in User.js |
| Failed login attempts rate-limited | ✅ | authLimiter: 20 attempts per 15 minutes |
| **Input Validation & Injection** | | |
| Server-side input validation | ✅ | validateBody middleware with type/length/enum/email checks |
| SQL queries parameterized | ✅ | All queries use Knex query builder; `.raw()` calls use only static SQL (no user input) |
| File uploads validated | ✅ | Multer file type + size validation; LIMIT_FILE_SIZE error handled |
| HTML output sanitized (XSS) | ✅ | React auto-escapes by default; no dangerouslySetInnerHTML found |
| **API Security** | | |
| CORS configured for expected origins only | ✅ | Explicit allowedOrigins list in app.js; denies unknown origins |
| Rate limiting on public endpoints | ✅ | General: 100/15min; Auth: 20/15min |
| Error responses don't leak internals | ✅ | errorHandler.js: unknown errors return generic "An unexpected error occurred." |
| Sensitive data not in URL params | ✅ | Tokens in headers/cookies, not query params |
| Security headers (Helmet) | ✅ | `app.use(helmet())` — includes X-Content-Type-Options, X-Frame-Options, etc. |
| **Data Protection** | | |
| Credentials in env vars, not code | ✅ | JWT_SECRET, DATABASE_URL, GEMINI_API_KEY all in .env |
| .env is gitignored | ✅ | Verified in .gitignore |
| Refresh tokens hashed before storage | ✅ | SHA-256 hash in RefreshToken.hashToken() |
| Logs don't contain PII/tokens | ✅ | Only console.error for Gemini API errors (no user data) |
| **Infrastructure** | | |
| npm audit | ⚠️ Advisory | 2 vulnerabilities: path-to-regexp (high — ReDoS, mitigated by rate limiting), brace-expansion (moderate — dev-only). Neither exploitable in practice. `npm audit fix` recommended for Sprint 13. |
| Default credentials removed | ✅ | No default/sample credentials in code |
| Error pages don't reveal tech info | ✅ | Generic JSON error responses only |

**Security scan verdict: ✅ PASS — No P1 security failures. npm audit advisory (non-blocking) already tracked as FB-051.**

---

### Post-Deploy QA Verdict — Sprint 12

| Task | Unit Tests | Integration | Security | Config | Overall |
|------|-----------|-------------|----------|--------|---------|
| T-056 | ✅ 74/74 | ✅ PASS | ✅ PASS | ✅ PASS | **QA PASSED** |
| T-053-frontend | ✅ 130/130 | ✅ PASS | ✅ PASS | ✅ PASS | **QA PASSED** |
| T-057 | ✅ 74/74 | ✅ PASS | ✅ PASS | ✅ PASS | **QA PASSED** |

**Post-deploy re-verification confirms all Sprint 12 engineering tasks remain QA-passed after staging deployment.**

- T-056: Done ✅
- T-053-frontend: Done ✅
- T-057: Done ✅
- T-020: Backlog → prerequisites met (T-056 + T-053-frontend Done). User testing can begin on http://localhost:4175.
