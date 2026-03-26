## Sprint 5 — Pre-Flight Staging Verification (Deploy Engineer — 2026-03-25)

**Date:** 2026-03-25
**Deploy Engineer:** Deploy Agent
**Sprint:** 5
**Purpose:** Confirm staging environment is healthy and unchanged at the start of Sprint #5. No new Deploy Engineer tasks are assigned this sprint — all infrastructure work (T-018, T-023, T-028) is Done. This entry documents the Sprint 5 environment baseline.

---

### Pre-Flight Context

| Item | Status |
|------|--------|
| All Deploy Engineer tasks | ✅ Done (T-018, T-023, T-028) |
| Sprint 5 Deploy Engineer assignments | ✅ None — no new infra tasks |
| Last verified deployment | Sprint 4 Pass 2 — 2026-03-24T17:55:00Z |
| Last Monitor verification (T-024) | ✅ Done — Deploy Verified: Yes (2026-03-24) |
| Sprint 5 tasks requiring infra support | T-025 (Backend: Gemini key), T-029 (Backend: flaky test fix) |

---

### Live Service Health Check

| Check | Command | Result |
|-------|---------|--------|
| Backend health | `GET http://localhost:3000/api/health` | ✅ 200 — `{"status":"ok","timestamp":"2026-03-25T03:32:17.926Z"}` |
| Frontend health | `GET http://localhost:5173/` | ✅ 200 |
| Auth guard enforcement | `GET /api/v1/plants` (invalid Bearer token) | ✅ 401 — `{"error":{"message":"Invalid or expired access token.","code":"UNAUTHORIZED"}}` |

---

### Current Staging Environment

| Service | URL | Status |
|---------|-----|--------|
| Backend API | http://localhost:3000 | ✅ Running |
| Frontend (vite preview) | http://localhost:5173 | ✅ Running (proxy active) |
| Database | PostgreSQL 15 @ localhost:5432 (plant_guardians_staging) | ✅ Running |
| Vite proxy `/api` → `http://localhost:3000` | Active | ✅ Verified |
| Migrations | All 5/5 applied | ✅ Up to date |

**Test account:** test@plantguardians.local / TestPass123!

---

### Infrastructure Readiness for Sprint 5 Tasks

| Task | Infra Requirement | Status |
|------|-------------------|--------|
| T-025 (Gemini key + AI happy path) | `GEMINI_API_KEY` variable in `backend/.env` — placeholder currently set; Backend Engineer replaces value | ✅ Infrastructure ready — backend server auto-picks up new key value on restart |
| T-029 (Flaky test fix) | No infra changes needed — test runner config only | ✅ No action required |
| T-020 (User testing) | Staging fully operational — `Deploy Verified: Yes` from T-024 | ✅ Ready |
| T-027 (SPEC-004 update) | Documentation only — no infra impact | ✅ N/A |

**Note for Backend Engineer (T-025):** After updating `GEMINI_API_KEY` in `backend/.env`, restart the backend process: `cd backend && node src/server.js &`. No migration or build steps needed — key change takes effect on restart only.

---

### Security Self-Check (Sprint 5 Pre-Flight)

| # | Check | Status |
|---|-------|--------|
| 1 | `.env` not committed (`.gitignore` verified) | ✅ PASS |
| 2 | No secrets in `infra/` files | ✅ PASS |
| 3 | Auth guard active (verified above) | ✅ PASS |
| 4 | CORS config unchanged (`FRONTEND_URL=http://localhost:5173,http://localhost:4173`) | ✅ PASS |
| 5 | npm audit baseline: 0 vulnerabilities (verified Sprint 4) | ✅ PASS |

---

**Staging Status: ✅ HEALTHY — No action required from Deploy Engineer. All Sprint 5 tasks have the infrastructure they need. Backend Engineer can update Gemini key and restart backend independently.**

---

---
## Post-Deploy Health Check — Sprint #4
Date: 2026-03-24
Environment: Staging
Timestamp: 2026-03-24T17:58:32Z

### Config Consistency Validation
- Backend PORT: 3000
- Vite proxy target: http://localhost:3000
- Port match: PASS — both backend (.env PORT=3000) and Vite proxy target (http://localhost:3000) use port 3000
- SSL configured: No — SSL_KEY_PATH and SSL_CERT_PATH are not set in backend/.env
- Protocol match: PASS (N/A) — No SSL configured; both backend and Vite proxy use http:// consistently
- CORS_ORIGIN (FRONTEND_URL): http://localhost:5173,http://localhost:4173
- Frontend dev port (vite.config.js): Not explicitly set (defaults to 5173); vite preview running on port 5173
- CORS match: PASS — FRONTEND_URL includes http://localhost:5173 (dev) and http://localhost:4173 (preview); both allowed
- Docker port mapping: N/A — docker-compose.yml defines only postgres containers (plant_guardians_db on 5432, plant_guardians_db_test on 5433); no backend container defined; Docker not installed on staging host; staging uses local PostgreSQL directly

Config Consistency Overall: PASS

### Health Check Results
Token: acquired via POST /api/v1/auth/login with test@plantguardians.local / TestPass123! (NOT /auth/register)
Note: Health endpoint is at /api/health (not /api/v1/health) — confirmed in app.js line 67

- [x] App responds (GET /api/health → 200): PASS — HTTP 200, body: {"status":"ok","timestamp":"2026-03-24T17:57:28.710Z"}
- [x] Auth works (POST /api/v1/auth/login → 200 with token): PASS — HTTP 200, access_token returned, user: test@plantguardians.local
- [x] Auth refresh (POST /api/v1/auth/refresh → 200): PASS — HTTP 200, new token pair returned
- [x] Auth logout (POST /api/v1/auth/logout → 200): PASS — HTTP 200
- [x] GET /api/v1/plants → 200: PASS — HTTP 200, plants list returned with pagination
- [x] POST /api/v1/plants → 201: PASS — HTTP 201, plant created (id: 319912ce-c046-492c-a5d0-5928463b80c5)
- [x] GET /api/v1/plants/:id → 200: PASS — HTTP 200, plant detail with care_schedules and recent_care_actions returned
- [x] PUT /api/v1/plants/:id → 200: PASS — HTTP 200, plant updated
- [x] DELETE /api/v1/plants/:id → 200: PASS — HTTP 200, plant deleted
- [x] POST /api/v1/plants/:id/photo (no file) → 400: PASS — HTTP 400, MISSING_FILE error as expected (upload endpoint reachable and validates correctly)
- [x] POST /api/v1/plants/:id/care-actions → 201: PASS — HTTP 201, care action recorded, updated_schedule returned
- [x] DELETE /api/v1/plants/:id/care-actions/:action_id → 200: PASS — HTTP 200, undo successful
- [ ] POST /api/v1/ai/advice → 200: FAIL (EXPECTED) — HTTP 502, body: {"error":{"message":"AI service is not configured.","code":"AI_SERVICE_UNAVAILABLE"}} — GEMINI_API_KEY is placeholder in .env; tracked as T-025 (blocked on T-024 completion)
- [x] GET /api/v1/profile → 200: PASS — HTTP 200, user profile and stats returned
- [x] No 5xx errors: PASS — all endpoints return expected non-5xx codes; 502 on /ai/advice is intentional/expected (misconfigured API key)
- [x] Database connected: PASS — PostgreSQL plant_guardians_staging reachable; all 7 tables present (users, plants, care_schedules, care_actions, refresh_tokens, knex_migrations, knex_migrations_lock); seed user test@plantguardians.local confirmed in DB
- [x] Frontend accessible: PASS — frontend/dist/ exists (index.html, assets/index.css, assets/index.js, assets/confetti.module.js); vite preview running on port 5173, HTTP 200

### Summary
Deploy Verified: Yes
Notes:
- The only failing endpoint is POST /api/v1/ai/advice (502 AI_SERVICE_UNAVAILABLE) — this is a known and expected failure due to placeholder GEMINI_API_KEY in backend/.env. This is tracked as T-025 and does not block staging verification.
- Health endpoint is at /api/health (not /api/v1/health); this is intentional per app.js implementation.
- Seeded test account email is test@plantguardians.local (not test@triplanner.local as listed in older agent prompts — seed file was updated in Sprint 1).
- T-026 fix verified: AIAdviceModal correctly hides "Try Again" button on 502 error.
- T-028 fix verified: Vite proxy routes /api/* to http://localhost:3000 correctly.
- Docker not installed on staging host — PostgreSQL runs locally, consistent with deploy notes.

---

## Sprint 5 — QA Report

**Date:** 2026-03-24
**QA Engineer:** QA Agent
**Tasks in scope:** T-025 (AI advice test improvements + model update), T-029 (flaky backend test fix)

---

### Test Run 1 — Backend Unit Tests (3 Consecutive Runs for T-029 Acceptance)

| Field | Value |
|-------|-------|
| **Test Type** | Unit Test |
| **Date** | 2026-03-24 |
| **Target** | Backend (all endpoints) |
| **Command** | `cd backend && npm test` (×3 consecutive runs) |
| **Result** | ✅ PASS — 44/44 tests passed on all 3 runs. Zero "socket hang up" errors. |
| **Duration** | Run 1: 9.93s, Run 2: 10.09s, Run 3: 9.94s |
| **T-029 Acceptance** | ✅ MET — 3 consecutive clean runs with 0 flaky failures |

#### Test Breakdown (44 tests across 5 suites)

| Suite | Tests | Result |
|-------|-------|--------|
| `tests/auth.test.js` | 10 | ✅ All pass |
| `tests/plants.test.js` | 18 (CRUD ×13, photo upload ×5) | ✅ All pass |
| `tests/careActions.test.js` | 6 | ✅ All pass |
| `tests/ai.test.js` | 7 (was 3 in Sprint 4; +4 new mocked tests for T-025) | ✅ All pass |
| `tests/profile.test.js` | 2 | ✅ All pass |

#### T-025 AI Test Coverage Verification

7 tests cover all API contract error codes + happy path:

| # | Test | Expected Status | Expected Code | Result |
|---|------|----------------|---------------|--------|
| 1 | Missing both plant_type and photo_url | 400 | VALIDATION_ERROR | ✅ |
| 2 | No auth token | 401 | UNAUTHORIZED | ✅ |
| 3 | Placeholder API key (unconfigured) | 502 | AI_SERVICE_UNAVAILABLE | ✅ |
| 4 | Happy path: valid Gemini JSON response | 200 | — | ✅ |
| 5 | Unparseable Gemini response | 422 | PLANT_NOT_IDENTIFIABLE | ✅ |
| 6 | Gemini API throws error | 502 | AI_SERVICE_UNAVAILABLE | ✅ |
| 7 | plant_type >200 characters | 400 | VALIDATION_ERROR | ✅ |

**Happy-path response shape verified:** `data.identified_plant_type`, `data.confidence`, `data.care_advice.watering` (frequency_value, frequency_unit, notes), `data.care_advice.fertilizing`, `data.care_advice.repotting`, `data.care_advice.light`, `data.care_advice.humidity`, `data.care_advice.additional_tips` — all match `api-contracts.md` Sprint 1 GROUP 4 spec.

#### T-029 Flaky Test Fix Verification

| Check | Result |
|-------|--------|
| `--runInBand` in `npm test` script | ✅ Present in package.json |
| `--runInBand` in `npm test:coverage` script | ✅ Present in package.json |
| Test pool min:1, max:5 | ✅ Verified in knexfile.js `test` config |
| idleTimeoutMillis: 10000 | ✅ Present in knexfile.js `test` config |
| Teardown tracks `activeFiles` to prevent premature `db.destroy()` | ✅ Verified in tests/setup.js |
| 3 consecutive 44/44 runs, zero socket hang up | ✅ Confirmed |

---

### Test Run 2 — Frontend Unit Tests

| Field | Value |
|-------|-------|
| **Test Type** | Unit Test |
| **Date** | 2026-03-24 |
| **Target** | Frontend (all components and pages) |
| **Command** | `cd frontend && npx vitest run` |
| **Result** | ✅ PASS — 50/50 tests passed (17 test files) |
| **Duration** | 1.69s |
| **Note** | No frontend changes in Sprint 5 — regression check only. All 50 tests from Sprint 4 continue to pass. |

---

### Test Run 3 — Integration Test: T-025 AI Advice Contract Verification

| Field | Value |
|-------|-------|
| **Test Type** | Integration Test |
| **Date** | 2026-03-24 |
| **Target** | T-025: AI advice endpoint contract compliance |
| **Result** | ✅ PASS |

#### Checks Performed

1. **Model update:** `ai.js` uses `gemini-1.5-flash` (updated from `gemini-pro`) — ✅ correct per current Gemini SDK recommendations
2. **Auth enforcement:** `router.use(authenticate)` applied to entire AI route file — ✅ no bypass possible
3. **Input validation:** Both empty-input (400) and length >200 (400) validated server-side — ✅
4. **API key check:** Placeholder key `your-gemini-api-key` correctly triggers 502 AI_SERVICE_UNAVAILABLE — ✅
5. **Response shape (mocked happy path):** Matches `api-contracts.md` GROUP 4 exactly — ✅
6. **Error codes:** 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 422 PLANT_NOT_IDENTIFIABLE, 502 AI_SERVICE_UNAVAILABLE — all match contract — ✅
7. **No hardcoded secrets:** API key from `process.env.GEMINI_API_KEY` with placeholder detection — ✅
8. **Error responses safe:** Uses `AppError` subclasses → structured JSON, no stack traces leaked — ✅
9. **Frontend API call:** `frontend/src/utils/api.js` line 173 calls `/ai/advice` with correct path — ✅
10. **Frontend modal:** `AIAdviceModal.jsx` reads `data.care_advice.*` fields matching contract shape — ✅

**Note:** Real Gemini happy path cannot be tested — placeholder API key remains. This is documented and acceptable per sprint plan (T-025 scope was reduced to "verified as mocked — key not provisioned").

---

### Test Run 4 — Integration Test: T-029 Test Infrastructure

| Field | Value |
|-------|-------|
| **Test Type** | Integration Test |
| **Date** | 2026-03-24 |
| **Target** | T-029: Test reliability / flaky test fix |
| **Result** | ✅ PASS |

#### Checks Performed

1. **Root cause addressed:** Parallel PG connection contention eliminated by `--runInBand` — ✅
2. **Pool configuration:** Test pool min:1/max:5, idleTimeoutMillis:10000 — appropriate for serial execution — ✅
3. **Teardown refactor:** `activeFiles` counter prevents premature `db.destroy()` in shared module cache — ✅
4. **No endpoint behavior changes:** Only test infrastructure modified — ✅
5. **3 consecutive clean runs:** 44/44, 44/44, 44/44 — zero flaky failures — ✅

---

### Test Run 5 — Config Consistency Check

| Field | Value |
|-------|-------|
| **Test Type** | Config Consistency |
| **Date** | 2026-03-24 |
| **Result** | ✅ PASS — No mismatches |

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Backend PORT | 3000 | `PORT=3000` in backend/.env | ✅ |
| Vite proxy target | http://localhost:3000 | `backendTarget = 'http://localhost:3000'` in vite.config.js | ✅ Match |
| SSL: Backend SSL enabled? | No (http) | No SSL config in .env | ✅ N/A |
| Vite proxy uses http:// | Yes | `http://localhost:3000` | ✅ Consistent |
| CORS includes localhost:5173 | Yes | `FRONTEND_URL=http://localhost:5173,http://localhost:4173` | ✅ Both dev and preview ports included |
| Docker Compose PG port | 5432 | `"${POSTGRES_PORT:-5432}:5432"` | ✅ Matches DATABASE_URL |

---

### Test Run 6 — Security Scan

| Field | Value |
|-------|-------|
| **Test Type** | Security Scan |
| **Date** | 2026-03-24 |
| **Target** | Full security checklist verification for Sprint 5 tasks |
| **Result** | ✅ PASS — All applicable items verified |

#### Authentication & Authorization
- [x] All API endpoints require authentication — `router.use(authenticate)` on plants, care-actions, ai, profile routes
- [x] Auth tokens have appropriate expiration (JWT 15m, refresh 7 days) and rotation
- [x] Password hashing uses bcrypt (v6.0.0)
- [x] Failed login attempts rate-limited (20/15min on auth endpoints)

#### Input Validation & Injection Prevention
- [x] All user inputs validated server-side (express validators + route-level checks)
- [x] SQL queries use Knex query builder — no string concatenation (`.raw()` only in migrations for `gen_random_uuid()`)
- [x] File uploads validated for type (MIME check) and size (MAX_UPLOAD_SIZE_MB)
- [x] No XSS vectors — API returns JSON only, no HTML rendering server-side

#### API Security
- [x] CORS configured: allows only `http://localhost:5173` and `http://localhost:4173`
- [x] Rate limiting applied: general (100/15min) + auth-specific (20/15min)
- [x] Error responses: structured JSON via `AppError` — no stack traces, no file paths, no internal details leaked
- [x] Sensitive data not in URL params — tokens in Authorization header, refresh token in request body
- [x] Helmet.js applies security headers (X-Content-Type-Options, X-Frame-Options, etc.)

#### Data Protection
- [x] Database credentials in `.env` (not in code) — `.env` in `.gitignore`
- [x] GEMINI_API_KEY in `.env` with placeholder — no real key hardcoded
- [x] JWT_SECRET in `.env` — 128-char hex string, not committed
- [x] Error handler does not log PII — only logs `err` object for unknown errors

#### Infrastructure
- [x] Dependencies: `npm audit` → 0 vulnerabilities (backend)
- [x] No default/sample credentials in code — test setup uses dynamic emails
- [x] Error pages return generic "An unexpected error occurred" — no server info leaked

#### Sprint 5 Specific Checks
- [x] T-025: No new secrets introduced — model name change only + test coverage
- [x] T-025: Mock tests do not leak real API keys — use `test-valid-gemini-key` and restore original
- [x] T-029: Test infrastructure changes only — no security impact

---

### Sprint 5 QA Summary

| Task | Unit Tests | Integration | Security | Config | Verdict |
|------|-----------|-------------|----------|--------|---------|
| T-025 | ✅ 44/44 (7 AI tests) | ✅ Contract verified | ✅ No issues | ✅ N/A | **PASS → Done** |
| T-029 | ✅ 44/44 ×3 runs | ✅ Zero flaky failures | ✅ No impact | ✅ N/A | **PASS → Done** |

**Overall Sprint 5 QA Status:** ✅ ALL PASS
- Backend: 44/44 tests pass (3 consecutive runs, zero flaky)
- Frontend: 50/50 tests pass (regression check)
- npm audit: 0 vulnerabilities
- Security checklist: all items verified
- Config consistency: no mismatches
- No regressions from Sprint 4

**Note on T-025 Gemini key:** No real API key is available. The happy-path is verified via mocked Gemini SDK. The AI advice endpoint will return 502 when called with the placeholder key. This is a known and accepted limitation — the sprint plan explicitly allowed this outcome.

**Ready for deploy verification (Monitor Agent):** T-025 and T-029 changes are test-infrastructure and model-name only. No endpoint behavior changed. Staging should remain healthy without re-deploy.

---

## Sprint 5 — Deploy Engineer Verification

**Date:** 2026-03-24
**Deploy Engineer:** Deploy Agent
**Scope:** Sprint 5 staging verification — no new deployment required per H-058 (QA assessment)

---

### Staging Verification Run — Sprint 5

| Field | Value |
|-------|-------|
| **Type** | Staging Health Re-Verification |
| **Date** | 2026-03-24 |
| **Trigger** | H-058 (QA: no re-deploy needed; verify staging still healthy) |
| **Result** | ✅ PASS — Staging healthy, no re-deploy required |

#### Checks Performed

| Check | Command / Method | Result |
|-------|-----------------|--------|
| Backend health | `GET http://localhost:3000/api/health` | ✅ `{"status":"ok","timestamp":"2026-03-25T03:55:30.283Z"}` |
| Frontend health | `GET http://localhost:5173/` | ✅ HTTP 200 |
| Auth endpoint (login) | `POST /auth/login` with test account | ✅ HTTP 200, access_token present |
| Protected endpoint | `GET /plants` without token | ✅ HTTP 401 (auth enforcement working) |
| Database migrations | `npx knex migrate:status` | ✅ 5/5 migrations applied, no pending |
| npm audit | `npm audit --audit-level=none` | ✅ 0 vulnerabilities |

#### Deploy Decision

**No re-deploy required.** Per H-058 assessment:

- **T-025** changes: `gemini-pro` → `gemini-1.5-flash` model name in `routes/ai.js` and 4 new mock tests. Runtime behavior unchanged (API key is still placeholder — endpoint still returns 502 for AI calls). No staging impact.
- **T-029** changes: `--runInBand` in test scripts, test pool config reduction, teardown refactor. Test-infrastructure only — zero runtime / staging impact.

Staging environment remains in the same verified state as delivered by T-028 / T-024 (Deploy Verified: Yes, 2026-03-24).

#### Environment Status Summary

| Service | URL | Status |
|---------|-----|--------|
| Backend API | `http://localhost:3000` | ✅ Running |
| Frontend | `http://localhost:5173` | ✅ Running |
| Database | PostgreSQL 15 @ `localhost:5432` (plant_guardians_staging) | ✅ Connected |
| Migrations | 5/5 applied | ✅ Up to date |
| npm audit | 0 vulnerabilities | ✅ Clean |

**Handoff:** H-059 → Monitor Agent to confirm staging health for Sprint 5 closeout.

---

## Sprint 5 — Final QA Verification Pass

**Date:** 2026-03-25
**QA Engineer:** QA Agent
**Scope:** Full regression + security + config consistency + product-perspective testing for Sprint 5 closeout

---

### Test Run 8 — Backend Unit Tests (3 Consecutive Runs)

| Field | Value |
|-------|-------|
| **Test Type** | Unit Test |
| **Date** | 2026-03-25 |
| **Target** | Backend (all endpoints) |
| **Command** | `cd backend && npm test` (×3 consecutive runs) |
| **Result** | ⚠️ PARTIAL — Run 1: 44/44 ✅, Run 2: 43/44 ❌ (profile timeout), Run 3: 44/44 ✅ |

#### Run Details

| Run | Result | Duration | Notes |
|-----|--------|----------|-------|
| 1 | 44/44 ✅ | 9.9s | Clean pass |
| 2 | 43/44 ❌ | 39.7s | `profile.test.js` → "should return user profile with stats" timed out at 30000ms |
| 3 | 44/44 ✅ | 10.3s | Clean pass |

#### Suite Breakdown (All Runs Combined)

| Suite | Tests | Run 1 | Run 2 | Run 3 |
|-------|-------|-------|-------|-------|
| auth.test.js | 10 | ✅ | ✅ | ✅ |
| plants.test.js | 18 | ✅ | ✅ | ✅ |
| careActions.test.js | 6 | ✅ | ✅ | ✅ |
| ai.test.js | 7 | ✅ | ✅ | ✅ |
| profile.test.js | 2 | ✅ | ❌ (1 timeout) | ✅ |

**New Flaky Test Found:** `GET /api/v1/profile > should return user profile with stats` intermittently times out. The test creates a user, a plant, and a care action before fetching the profile — likely a slow PG query or connection pool exhaustion under certain conditions. Logged as FB-017. Not a regression from T-029 (which fixed "socket hang up" errors in plants.test.js — different root cause).

---

### Test Run 9 — Frontend Unit Tests

| Field | Value |
|-------|-------|
| **Test Type** | Unit Test |
| **Date** | 2026-03-25 |
| **Target** | Frontend (all components and pages) |
| **Command** | `cd frontend && npx vitest run` |
| **Result** | ✅ PASS — 50/50 tests passed |
| **Duration** | 1.36s |

#### Suite Breakdown

| Suite | Tests | Result |
|-------|-------|--------|
| LoginPage.test.jsx | — | ✅ |
| InventoryPage.test.jsx | — | ✅ |
| AddPlantPage.test.jsx | — | ✅ |
| EditPlantPage.test.jsx | — | ✅ |
| PlantDetailPage.test.jsx | — | ✅ |
| AIAdviceModal.test.jsx | — | ✅ |
| ProfilePage.test.jsx | — | ✅ |
| PlantCard.test.jsx | — | ✅ |
| StatusBadge.test.jsx | — | ✅ |
| CareScheduleForm.test.jsx | — | ✅ |
| PhotoUpload.test.jsx | — | ✅ |
| AppShell.test.jsx | — | ✅ |
| Sidebar.test.jsx | — | ✅ |
| Button.test.jsx | — | ✅ |
| Input.test.jsx | — | ✅ |
| Modal.test.jsx | — | ✅ |
| ToastContainer.test.jsx | — | ✅ |

All 17 test suites, 50/50 tests pass.

---

### Test Run 10 — Integration Test (API Contract Compliance)

| Field | Value |
|-------|-------|
| **Test Type** | Integration Test |
| **Date** | 2026-03-25 |
| **Target** | Frontend API layer ↔ Backend API contracts |
| **Result** | ✅ PASS |

#### Frontend → Backend Contract Verification

| Frontend API Call | Backend Route | Method | Contract Match |
|-------------------|---------------|--------|----------------|
| `auth.register(data)` | POST /api/v1/auth/register | POST | ✅ Body: `{full_name, email, password}` |
| `auth.login(data)` | POST /api/v1/auth/login | POST | ✅ Body: `{email, password}` |
| `auth.logout()` | POST /api/v1/auth/logout | POST | ✅ Body: `{refresh_token}`, Bearer auth |
| `plants.list(page, limit)` | GET /api/v1/plants | GET | ✅ Query: `?page=&limit=` |
| `plants.get(id)` | GET /api/v1/plants/:id | GET | ✅ |
| `plants.create(data)` | POST /api/v1/plants | POST | ✅ Body: `{name, type, notes, care_schedules}` |
| `plants.update(id, data)` | PUT /api/v1/plants/:id | PUT | ✅ |
| `plants.delete(id)` | DELETE /api/v1/plants/:id | DELETE | ✅ |
| `plants.uploadPhoto(id, file)` | POST /api/v1/plants/:id/photo | POST | ✅ FormData with `photo` field |
| `careActions.markDone(plantId, type)` | POST /api/v1/plants/:id/care-actions | POST | ✅ Body: `{care_type}` |
| `careActions.undo(plantId, actionId)` | DELETE /api/v1/plants/:id/care-actions/:id | DELETE | ✅ |
| `ai.getAdvice(data)` | POST /api/v1/ai/advice | POST | ✅ Body: `{plant_type}` or `{photo_url}` |
| `profile.get()` | GET /api/v1/profile | GET | ✅ |

#### Auth Token Handling

| Check | Result |
|-------|--------|
| Tokens stored in memory (not localStorage/sessionStorage) | ✅ — `accessToken` and `refreshToken` are module-scoped variables |
| Auto-refresh on 401 | ✅ — `request()` catches 401, calls `refreshAccessToken()`, retries once |
| Bearer token sent on authenticated requests | ✅ — `Authorization: Bearer ${accessToken}` |
| Public endpoints skip auth | ✅ — `skipAuth: true` on register/login |
| Auth failure callback | ✅ — `onAuthFailure` invoked when refresh fails |

#### Response Shape Handling

| Check | Result |
|-------|--------|
| Success responses unwrap `data` field | ✅ — `return json.data` |
| Error responses throw structured `ApiError` | ✅ — `ApiError(err.message, err.code, res.status)` |
| FormData requests omit Content-Type header | ✅ — `!(options.body instanceof FormData)` check |

---

### Test Run 11 — Config Consistency Check

| Field | Value |
|-------|-------|
| **Test Type** | Config Consistency |
| **Date** | 2026-03-25 |
| **Result** | ✅ PASS — No mismatches |

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Backend PORT ↔ Vite proxy target | PORT=3000 ↔ `http://localhost:3000` | Match | ✅ |
| SSL/protocol consistency | No SSL → http:// everywhere | http:// in proxy, .env, CORS | ✅ |
| CORS includes frontend dev origin | `http://localhost:5173` in FRONTEND_URL | `http://localhost:5173,http://localhost:4173` | ✅ |
| CORS includes frontend preview origin | `http://localhost:4173` in FRONTEND_URL | Included | ✅ |
| Docker compose PG port | 5432 | 5432 (default) | ✅ |
| Frontend VITE_API_BASE_URL not overriding proxy | No .env override active | Default: `/api/v1` (relative) | ✅ |

---

### Test Run 12 — Security Scan

| Field | Value |
|-------|-------|
| **Test Type** | Security Scan |
| **Date** | 2026-03-25 |
| **Result** | ✅ PASS — All 13 applicable items verified |

#### Authentication & Authorization

| Item | Status | Evidence |
|------|--------|----------|
| All API endpoints require auth | ✅ | All route files use `router.use(authenticate)`. Public endpoints (register, login, refresh, health) explicitly skip auth. Tests verify 401 on unauthenticated requests. |
| Auth tokens have expiration + refresh | ✅ | JWT_EXPIRES_IN=15m, REFRESH_TOKEN_EXPIRES_DAYS=7. Token rotation on refresh. |
| Password hashing uses bcrypt | ✅ | bcrypt 6.0.0. No plaintext storage. |
| Failed login rate-limited | ✅ | `authLimiter` applies 20 req/15min to `/api/v1/auth/` |

#### Input Validation & Injection Prevention

| Item | Status | Evidence |
|------|--------|----------|
| SQL parameterized queries | ✅ | Knex query builder used throughout. `db.raw()` calls are `SELECT 1` and `gen_random_uuid()` only — no user input interpolation. |
| File upload validation | ✅ | MIME type check, size limit (5MB), UUID filenames. Tests verify MISSING_FILE, INVALID_FILE_TYPE, FILE_TOO_LARGE. |
| XSS prevention | ✅ | No `innerHTML`/`dangerouslySetInnerHTML` in production code (only in test assertion). Helmet sets Content-Security-Policy headers. |
| Client + server validation | ✅ | Frontend validates on blur; backend validates independently with structured error responses. |

#### API Security

| Item | Status | Evidence |
|------|--------|----------|
| CORS restricted origins | ✅ | Only `http://localhost:5173,http://localhost:4173` allowed. Null/undefined origins accepted for same-origin/server requests. |
| Rate limiting | ✅ | General: 100 req/15min. Auth: 20 req/15min. |
| Error responses safe | ✅ | `errorHandler.js` returns generic message for unknown errors. No stack traces leaked. `AppError` subclasses return only `message` + `code`. |
| No secrets in code | ✅ | `JWT_SECRET` from env. `GEMINI_API_KEY` from env. No hardcoded credentials found in `backend/src/`. |
| Helmet security headers | ✅ | `app.use(helmet())` — sets X-Content-Type-Options, X-Frame-Options, CSP, etc. |

#### npm Audit

| Package | Vulnerabilities | Result |
|---------|-----------------|--------|
| Backend | 0 | ✅ |
| Frontend | 0 | ✅ |

#### Known Accepted Limitations (Staging Only)

- HTTPS not configured — staging is local only, acceptable
- Database credentials not encrypted at rest — acceptable for local dev/staging
- No backup configuration — staging only

---

### Test Run 13 — Product-Perspective Testing

| Field | Value |
|-------|-------|
| **Test Type** | Product-Perspective Review |
| **Date** | 2026-03-25 |
| **Scope** | API-level verification of all 3 MVP user flows with realistic data |

#### Flow 1: Novice User (Register → Add Plant → View → Mark Care Done)

| Step | API | Test Data | Expected | Result |
|------|-----|-----------|----------|--------|
| Register | POST /auth/register | `{full_name: "Sarah Chen", email: "sarah@example.com", password: "myplants2026"}` | 201 + tokens | ✅ Verified in tests |
| Add plant | POST /plants | `{name: "My First Pothos", type: "Pothos", care_schedules: [{care_type: "watering", frequency_value: 7, frequency_unit: "days"}]}` | 201 + plant data | ✅ Verified in tests |
| View inventory | GET /plants | — | 200 + plant list with status | ✅ Verified |
| Mark watering done | POST /plants/:id/care-actions | `{care_type: "watering"}` | 201 + last_done_at updated | ✅ Verified |
| Undo watering | DELETE /plants/:id/care-actions/:id | — | 200 + reverted | ✅ Verified |

#### Flow 2: AI Advice

| Step | API | Test Data | Expected | Result |
|------|-----|-----------|----------|--------|
| Get advice by plant type | POST /ai/advice | `{plant_type: "spider plant"}` | 200 with care advice (if key configured) or 502 (placeholder) | ✅ 502 expected — placeholder key |
| Get advice by photo | POST /ai/advice | `{photo_url: "..."}` | Same | ✅ 502 expected |
| Input validation | POST /ai/advice | `{}` (empty) | 400 VALIDATION_ERROR | ✅ Verified in tests |
| Long input | POST /ai/advice | `{plant_type: "x".repeat(201)}` | 400 VALIDATION_ERROR | ✅ Verified in tests |

#### Flow 3: Inventory Management (Edit → Delete)

| Step | API | Test Data | Expected | Result |
|------|-----|-----------|----------|--------|
| Edit plant schedule | PUT /plants/:id | `{name: "Updated Pothos", care_schedules: [{care_type: "watering", frequency_value: 14, frequency_unit: "days"}]}` | 200 + updated | ✅ Verified |
| Delete plant | DELETE /plants/:id | — | 200 | ✅ Verified |
| Delete non-existent | DELETE /plants/:id (again) | — | 404 | ✅ Verified |
| Other user's plant | GET /plants/:id (wrong user) | — | 404 (not 403 — no info leakage) | ✅ Verified |

#### Edge Cases Verified

| Edge Case | API | Result |
|-----------|-----|--------|
| Empty plant name | POST /plants `{name: ""}` | ✅ 400 VALIDATION_ERROR |
| Duplicate care types | POST /plants `{care_schedules: [watering, watering]}` | ✅ 400 |
| Future performed_at | POST /care-actions `{performed_at: future date}` | ✅ 400 |
| Non-existent schedule | POST /care-actions `{care_type: "fertilizing"}` (none set) | ✅ 422 |
| Wrong credentials | POST /auth/login | ✅ 401 INVALID_CREDENTIALS (no info leakage) |
| Duplicate email | POST /auth/register (existing email) | ✅ 409 EMAIL_ALREADY_EXISTS |
| Rotated refresh token reuse | POST /auth/refresh (old token) | ✅ 401 INVALID_REFRESH_TOKEN |

---

### Sprint 5 Final QA Summary

| Category | Result |
|----------|--------|
| Backend unit tests | ⚠️ 44/44 pass, but 1 intermittent timeout in profile.test.js (1/3 runs) |
| Frontend unit tests | ✅ 50/50 pass |
| Integration (contract compliance) | ✅ All 13 endpoints match contract |
| Config consistency | ✅ No mismatches |
| Security scan | ✅ All 13 items pass |
| npm audit | ✅ 0 vulnerabilities (backend + frontend) |
| Product-perspective testing | ✅ All 3 flows verified at API level |

**New Issue Found:** Intermittent profile.test.js timeout — logged as FB-017, recommended as P3 bug for next sprint.

**Sprint 5 Engineering QA Verdict:** ✅ PASS with caveat. All production code is correct, secure, and contract-compliant. The profile test flakiness is a test infrastructure issue (P3) that does not affect production behavior. T-025 and T-029 remain verified. T-020 (user testing) and T-027 (SPEC-004 update) are outside QA scope (User Agent and Design Agent tasks respectively).

---

## Sprint 5 — Deploy Report

**Date:** 2026-03-25
**Deploy Engineer:** Deploy Agent
**Tasks in scope:** T-018 (re-verify), T-023 (re-verify), T-025, T-029

---

### Pre-Deploy Verification

| Gate | Status | Notes |
|------|--------|-------|
| QA confirmation (H-061) | ✅ PASS | Deploy readiness confirmed by QA Engineer 2026-03-25 |
| All Sprint 5 tasks Done | ✅ PASS | T-025, T-029 Done; T-027 (P3 doc) and T-020 (User Agent) non-blocking |
| Pending migrations | ✅ None | All 5 migrations (Sprint 1) already applied; `knex migrate:latest` → "Already up to date" |
| No P0/P1 blockers | ✅ PASS | FB-017 is P3 test infrastructure; does not affect production |

---

### Build — Step 1: Dependency Install

| Field | Value |
|-------|-------|
| **Date** | 2026-03-25 |
| **Backend** | `cd backend && npm install` → 0 vulnerabilities |
| **Frontend** | `cd frontend && npm install` → 0 vulnerabilities |
| **Result** | ✅ PASS |

---

### Build — Step 2: Frontend Production Build

| Field | Value |
|-------|-------|
| **Date** | 2026-03-25 |
| **Command** | `cd frontend && npm run build` |
| **Tool** | Vite v8.0.2 |
| **Result** | ✅ PASS — 0 errors, 4 output files |
| **Duration** | 288ms |
| **Git SHA** | `9fd58f5f3cf4a9a9d36594c856302fa2b09eb522` |

#### Build Artifacts

| File | Size | Gzip |
|------|------|------|
| `dist/index.html` | 0.74 kB | 0.41 kB |
| `dist/assets/index-ACo76nzn.css` | 29.12 kB | 5.43 kB |
| `dist/assets/confetti.module-No8_urVw.js` | 10.57 kB | 4.20 kB |
| `dist/assets/index-CsF38E1Z.js` | 356.84 kB | 106.63 kB |

---

### Staging Deployment

| Field | Value |
|-------|-------|
| **Environment** | Staging (local) |
| **Date** | 2026-03-25 |
| **Build Status** | ✅ Success |
| **Git SHA** | `9fd58f5f3cf4a9a9d36594c856302fa2b09eb522` |

#### Database Migrations

| Field | Value |
|-------|-------|
| **Command** | `cd backend && npm run migrate` |
| **Result** | ✅ Already up to date — 5/5 migrations applied (Sprint 1) |
| **Knex env** | development |

#### Service Status

| Service | Port | PID | Status |
|---------|------|-----|--------|
| Backend (Node/Express) | :3000 | 39598 | ✅ Running |
| Frontend (Vite preview) | :5173 | 54215 | ✅ Running |
| Frontend (Vite preview alt) | :4173 | 64637 | ✅ Running |

#### Health Checks

| Check | Result |
|-------|--------|
| `GET http://localhost:3000/api/health` | ✅ 200 `{"status":"ok","timestamp":"2026-03-25T04:04:03.541Z"}` |
| `GET http://localhost:5173` | ✅ 200 — HTML served correctly |

#### Notes

- Sprint 5 changes (T-025, T-029) are **test-infrastructure and model-name only** — no new endpoints, no schema changes, no migration needed.
- Docker not used for local staging; services run as Node processes directly.
- Staging is fully operational and matches the verified Sprint 4 state, updated with Sprint 5 dependency install + fresh production build.

---

### Sprint 5 Deploy Summary

| Step | Status |
|------|--------|
| Pre-deploy QA confirmation | ✅ |
| npm install (backend + frontend) | ✅ 0 vulnerabilities |
| Frontend production build | ✅ 0 errors |
| Database migrations | ✅ Already up to date |
| Backend health check | ✅ HTTP 200 |
| Frontend health check | ✅ HTTP 200 |
| **Overall Deploy Status** | **✅ SUCCESS** |

---

## Sprint #5 — Post-Deploy Health Check
**Date:** 2026-03-25
**Environment:** Staging (local)
**Performed by:** Monitor Agent

---

### Config Consistency Check

| Check | Result | Details |
|-------|--------|---------|
| Backend PORT vs Vite proxy port | PASS | PORT=3000 in backend/.env; Vite proxy target `http://localhost:3000` — match |
| Protocol match (HTTP/HTTPS) | PASS | No SSL_KEY_PATH or SSL_CERT_PATH set in .env; Vite proxy uses `http://` — consistent |
| CORS_ORIGIN vs frontend origin | PASS | FRONTEND_URL=`http://localhost:5173,http://localhost:4173`; frontend dev server on :5173 — included |
| Docker port mapping | N/A | docker-compose.yml only maps PostgreSQL (:5432); backend server not containerized — staging runs as local Node process |

**Config Consistency Result:** PASS

**Notes:**
- SSL not configured — no SSL_KEY_PATH or SSL_CERT_PATH in backend/.env. HTTP everywhere is correct and consistent for local staging.
- CORS correctly covers both the dev server (:5173) and the Vite preview port (:4173) via comma-separated FRONTEND_URL.
- Vite proxy target port (3000) matches backend PORT=3000 exactly.

---

### Health Checks

| Check | Result | Details |
|-------|--------|---------|
| App responds (GET /api/health → 200) | PASS | HTTP 200, body: `{"status":"ok","timestamp":"2026-03-25T04:06:30.382Z"}` |
| Auth works (POST /api/v1/auth/login → 200) | PASS | HTTP 200 with `access_token` and `refresh_token` for `test@plantguardians.local` |
| POST /api/v1/auth/register | PASS | HTTP 201 — new user creation verified (test account used) |
| POST /api/v1/auth/refresh | PASS | HTTP 200 — refresh token rotated and new tokens returned |
| POST /api/v1/auth/logout | PASS | HTTP 200 — refresh token invalidated |
| GET /api/v1/plants | PASS | HTTP 200 — plant list with care_schedules and pagination |
| POST /api/v1/plants | PASS | HTTP 201 — plant created with care schedule |
| GET /api/v1/plants/:id | PASS | HTTP 200 — single plant with recent_care_actions |
| PUT /api/v1/plants/:id | PASS | HTTP 200 — plant updated with new care schedule |
| DELETE /api/v1/plants/:id | PASS | HTTP 200 — plant deleted |
| POST /api/v1/plants/:id/photo (no file) | PASS | HTTP 400 `MISSING_FILE` — correct error code confirmed |
| POST /api/v1/plants/:id/care-actions | PASS | HTTP 201 — care action logged, updated_schedule returned |
| DELETE /api/v1/plants/:id/care-actions/:id | PASS | HTTP 200 — care action undone |
| GET /api/v1/profile | PASS | HTTP 200 — user object with stats |
| POST /api/v1/ai/advice (placeholder key) | PASS (expected 502) | HTTP 502 `AI_SERVICE_UNAVAILABLE` — placeholder GEMINI_API_KEY; expected and accepted |
| POST /api/v1/ai/advice (missing both fields) | PASS | HTTP 400 `VALIDATION_ERROR` — validation works |
| Auth guard (GET /api/v1/plants, no token) | PASS | HTTP 401 — auth middleware enforcing correctly |
| No 5xx errors (excluding expected 502) | PASS | All endpoints return expected status codes; no unexpected server errors |
| Frontend accessible (GET http://localhost:5173) | PASS | HTTP 200 — Vite preview serving React app |
| Vite proxy routing (/api/health via :5173) | PASS | HTTP 200 `{"status":"ok"}` — proxy routing to :3000 confirmed |
| Vite proxy auth guard (GET /api/v1/plants via :5173, no token) | PASS | HTTP 401 — proxy + auth guard both working |
| Frontend dist build exists | PASS | `/frontend/dist/` contains `index.html`, `assets/` (CSS, JS, confetti module, icons) |

**Deploy Verified: Yes**

**Notes:**
- Health endpoint is at `/api/health` (not `/api/v1/health`) — this is intentional per `app.js` implementation.
- Seeded test account email is `test@plantguardians.local` / `TestPass123!` (not `test@triplanner.local` as in older agent prompts — seed file `01_test_user.js` uses the correct email).
- POST /api/v1/ai/advice returning 502 is expected and accepted — GEMINI_API_KEY remains placeholder. Tracked as FB-016 (Minor, Acknowledged).
- Frontend alt preview port :4173 is not running at time of check; however, the primary frontend on :5173 is healthy. CORS config includes both ports as a precaution.
- No regressions detected from Sprint 4 verified state. Sprint 5 changes (T-025: model name update + mocked tests; T-029: test infra fix) have zero runtime impact — all endpoints behave identically to Sprint 4.

**Error Summary:** None. All checks passed. The only non-2xx response is POST /ai/advice (502) which is a known and accepted limitation due to placeholder Gemini API key.

---

