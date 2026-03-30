# QA & Build Log

Tracks test runs, build results, and post-deploy health checks per sprint. Maintained by QA Engineer, Deploy Engineer, and Monitor Agent.

---

## Sprint 10 — QA Verification — T-050 Focus Management (2026-03-29)

**Date:** 2026-03-29
**QA Engineer:** QA Agent (Orchestrator Sprint #10 run)
**Sprint:** 10
**Tasks In Scope:** T-050 (Focus management after mark-done in Care Due Dashboard)

---

### Test Type: Unit Test — Frontend (T-050)

| Check | Result |
|-------|--------|
| `cd frontend && npm test -- --run` | ✅ **107/107 tests pass** (20 test files) |
| 6 new T-050 focus management tests present | ✅ All 6 scenarios covered |
| Focus: next sibling in same section | ✅ PASS |
| Focus: last in section → first in next section | ✅ PASS |
| Focus: skip empty sections | ✅ PASS |
| Focus: cross-section (Due Today → Coming Up) | ✅ PASS |
| Focus: all-clear → "View my plants" button | ✅ PASS |
| Focus: reduced motion → synchronous (no delay) | ✅ PASS |
| Existing 101 tests (pre-T-050) still pass | ✅ No regressions |
| Build: 0 errors | ✅ Confirmed |

**Verdict: PASS**

---

### Test Type: Unit Test — Backend (Regression)

| Check | Result |
|-------|--------|
| `cd backend && npm test` | ✅ **69/69 tests pass** (8 test suites) |
| No backend changes in Sprint 10 | ✅ Confirmed — baseline matches Sprint 9 |

**Verdict: PASS**

---

### Test Type: Integration Test — T-050

**Scope:** Verify T-050 frontend changes integrate correctly with existing backend API.

| Check | Result | Notes |
|-------|--------|-------|
| T-050 uses existing `POST /api/v1/care-actions` | ✅ Verified | No new API calls added; `useCareDue.markDone()` calls `careActions.markDone(plantId, careType)` — unchanged from Sprint 8 |
| API contract match (care-due response shape) | ✅ Verified | `useCareDue` hook expects `{ overdue, due_today, upcoming }` arrays — matches `api-contracts.md` Sprint 8 contract |
| Optimistic removal after mark-done | ✅ Verified | `setData` filters the marked item from all three arrays; post-removal data passed to `getNextFocusTarget` |
| Focus decision tree uses correct data keys | ✅ Verified | `plant_id`, `care_type` from API response used as ref map keys (`${plant_id}__${care_type}`) |
| No new frontend-to-backend API surface | ✅ Verified | Pure frontend accessibility enhancement — no API changes |
| All UI states handled (loading, error, all-clear, populated) | ✅ Verified | CareDuePage.jsx renders all 4 states; focus management only activates in populated state after mark-done |
| Button.jsx forwardRef compatibility | ✅ Verified | `ref` passed correctly to all-clear "View my plants" button |
| SPEC-009 Amendment compliance | ✅ Verified | All 4 focus decision tree branches match the spec exactly |

**Verdict: PASS**

---

### Test Type: Config Consistency Check

| Check | Result | Notes |
|-------|--------|-------|
| Backend PORT (3000) matches vite proxy target | ✅ PASS | `backend/.env` PORT=3000; `vite.config.js` target=`http://localhost:3000` |
| Vite proxy uses http:// (no SSL in dev) | ✅ PASS | Backend has no SSL config; vite proxy correctly uses `http://` |
| CORS_ORIGIN includes frontend dev server | ✅ PASS | `FRONTEND_URL=http://localhost:5173,http://localhost:5174,http://localhost:4173` — all dev/preview ports covered |
| Docker Compose DB config matches .env | ✅ PASS | DB user/password/port consistent between `docker-compose.yml` defaults and `backend/.env` DATABASE_URL |

**Verdict: PASS — no config mismatches**

---

### Test Type: Security Scan

**Checklist:** `.workflow/security-checklist.md` — all items verified for Sprint 10 scope.

#### Authentication & Authorization

| Item | Status | Notes |
|------|--------|-------|
| All API endpoints require auth | ✅ PASS | `ai.js`, `plants.js`, `careActions.js`, `careHistory.js`, `careDue.js`, `profile.js` all use `router.use(authenticate)` or per-route `authenticate` middleware. Auth routes appropriately public. |
| Auth tokens have expiration | ✅ PASS | JWT_EXPIRES_IN=15m, REFRESH_TOKEN_EXPIRES_DAYS=7 |
| Password hashing uses bcrypt | ✅ PASS | `bcrypt` with 12 rounds in auth.js |
| Failed login rate-limited | ✅ PASS | `authLimiter` (20 req/15min) applied to `/api/v1/auth/` |

#### Input Validation & Injection Prevention

| Item | Status | Notes |
|------|--------|-------|
| SQL queries use parameterized statements | ✅ PASS | All queries via Knex query builder; `knex.raw()` only used for `gen_random_uuid()` defaults and `MAX()` aggregate — no user input |
| HTML output sanitized (XSS) | ✅ PASS | React default escaping; no `dangerouslySetInnerHTML` usage in T-050 changes |
| Input validation on server side | ✅ PASS | AI endpoint validates plant_type length, care-actions validates care_type enum, auth validates email/password |

#### API Security

| Item | Status | Notes |
|------|--------|-------|
| CORS configured for expected origins only | ✅ PASS | Comma-separated allowlist in FRONTEND_URL |
| Rate limiting on public endpoints | ✅ PASS | General (100/15min) + auth-specific (20/15min) limiters |
| Error responses don't leak internals | ✅ PASS | `errorHandler.js` returns generic message for unknown errors; never leaks stack traces |
| Security headers (helmet) | ✅ PASS | `app.use(helmet())` sets X-Content-Type-Options, X-Frame-Options, etc. |

#### Data Protection

| Item | Status | Notes |
|------|--------|-------|
| Credentials in env vars, not code | ✅ PASS | JWT_SECRET, GEMINI_API_KEY, DATABASE_URL all via `process.env` |
| .env files gitignored | ✅ PASS | `.gitignore` includes `.env`, `.env.local`, `.env.*.local`, `.env.production`, `backend/.env.staging` |
| Logs don't contain PII/tokens | ✅ PASS | Only error messages logged; no token or user data in console output |

#### Infrastructure

| Item | Status | Notes |
|------|--------|-------|
| Dependencies checked for vulnerabilities | ⚠️ KNOWN | `npm audit`: 2 pre-existing vulns (path-to-regexp high, brace-expansion moderate) — both fixable via `npm audit fix`. These are transitive deps (Express 4.x, nodemon). Not new in Sprint 10. Previously documented in Sprint 9 qa-build-log. |
| Default credentials removed | ✅ PASS | `.env.example` uses placeholder values |

**Verdict: PASS — no new security issues. 2 pre-existing dependency vulnerabilities (known since Sprint 9, not P1).**

---

### Overall Sprint 10 QA Summary

| Test Category | Result |
|---------------|--------|
| Frontend Unit Tests (107/107) | ✅ PASS |
| Backend Unit Tests (69/69) | ✅ PASS |
| Integration Test (T-050) | ✅ PASS |
| Config Consistency | ✅ PASS |
| Security Scan | ✅ PASS (2 known pre-existing dep vulns) |

**T-050 Status: PASS — ready for Done.**

---

## Sprint 10 — QA Regression & Product-Perspective Testing (2026-03-29)

**Date:** 2026-03-29
**QA Engineer:** QA Agent (Orchestrator Sprint #10 — second pass)
**Sprint:** 10
**Purpose:** Regression verification, product-perspective testing, T-051 status check, deploy readiness confirmation.

---

### Test Type: Unit Test — Regression Check

| Check | Result |
|-------|--------|
| `cd backend && npm test` | ✅ **69/69 tests pass** (8 test suites) — matches Sprint 9 baseline |
| `cd frontend && npm test -- --run` | ✅ **107/107 tests pass** (20 test files) — matches T-050 baseline |
| Any new regressions since first QA pass | ✅ None detected |

**Verdict: PASS — no regressions**

---

### Test Type: Config Consistency Check (Re-verified)

| Check | Result | Notes |
|-------|--------|-------|
| Backend PORT (3000) matches vite proxy target | ✅ PASS | `backend/.env` PORT=3000; `vite.config.js` target=`http://localhost:3000` |
| Vite proxy uses http:// (no SSL in dev) | ✅ PASS | No SSL config in backend; proxy correctly uses `http://` |
| CORS_ORIGIN includes frontend dev server | ✅ PASS | `FRONTEND_URL=http://localhost:5173,http://localhost:5174,http://localhost:4173` |
| Docker Compose DB config matches .env | ✅ PASS | User/password/port consistent |

**Verdict: PASS — no config mismatches**

---

### Test Type: Security Scan (Re-verified)

| Check | Result | Notes |
|-------|--------|-------|
| `npm audit` (backend) | ⚠️ KNOWN | 2 pre-existing vulns: path-to-regexp (high), brace-expansion (moderate). Same as Sprint 9. Transitive deps of Express 4 and nodemon. |
| .env gitignored | ✅ PASS | `git check-ignore backend/.env` confirms gitignored |
| No hardcoded secrets in source | ✅ PASS | JWT_SECRET, GEMINI_API_KEY accessed via `process.env` only |
| No dangerouslySetInnerHTML | ✅ PASS | Zero instances in frontend/src/ |
| knex.raw() usage safe | ✅ PASS | Only used for `gen_random_uuid()` defaults in migrations — no user input |
| Auth middleware on all protected routes | ✅ PASS | All route files use `router.use(authenticate)` or per-route middleware |

**Verdict: PASS — no new security issues**

---

### Test Type: Product-Perspective Testing

Tested from a user's perspective against the project-brief.md flows.

#### Confirmed Known Issues (Already in feedback-log.md)

| Issue | FB ID | Status | Confirmed |
|-------|-------|--------|-----------|
| Plant card badges don't show care type labels | FB-038 | New | ✅ Confirmed — `StatusBadge.jsx` receives `careType` prop but only uses it in `title` attribute (tooltip), not in visible text. User cannot distinguish which badge refers to which care type at a glance. |
| Auth tokens lost on page refresh | FB-039 | New | ✅ Confirmed — tokens stored in memory-only variables in `api.js`. Any page refresh or tab close loses the session. |
| Photo removal doesn't enable Save button | FB-040 | New | ✅ Confirmed — `isDirty` memo (EditPlantPage.jsx:83-115) checks `if (photo) return true` for new uploads but never compares `photoUrl` against `plant.photo_url`. Removing an existing photo sets `photoUrl=''` but isDirty stays false. |

#### New Observations

| Observation | Category | Severity | Notes |
|-------------|----------|----------|-------|
| AI advice error handling is robust | Positive | — | Gemini fallback chain (T-048) works correctly — 429 errors cascade through 4 models before failing. Error messages are user-friendly ("AI service returned an error or timed out.") |
| Care Due Dashboard UX is excellent | Positive | — | Three urgency sections (overdue/due today/coming up) with distinct visual hierarchy. Mark-done is optimistic with toast feedback. Focus management (T-050) properly handles all edge cases. |
| Plant card keyboard navigation works well | Positive | — | Cards have tabIndex, Enter key triggers navigation, edit/delete buttons have proper aria-labels. |
| Confetti animation on mark-done | Positive | — | Satisfying feedback per project-brief Flow 1 requirement. |

#### T-051 Status Check

| Task | Current Status | Notes |
|------|---------------|-------|
| T-051 (Monitor Agent: fix stale test account) | **Backlog** | `.agents/monitor-agent.md` still references `test@triplanner.local` (4 occurrences). Should be `test@plantguardians.local`. Monitor Agent has not started this task yet. This is a documentation-only change — no code QA impact, but should be completed before next Monitor Agent health check to avoid incorrect credentials. |

---

### Overall Sprint 10 QA Summary (Second Pass)

| Test Category | Result |
|---------------|--------|
| Frontend Unit Tests (107/107) | ✅ PASS |
| Backend Unit Tests (69/69) | ✅ PASS |
| Config Consistency | ✅ PASS |
| Security Scan | ✅ PASS (2 known pre-existing dep vulns) |
| Product-Perspective Testing | ✅ PASS (3 known issues already in feedback-log, no new bugs found) |

**Sprint 10 Engineering Tasks:**
- **T-050:** Done ✅ (QA passed — first pass)
- **T-051:** Backlog (documentation-only, Monitor Agent responsibility)
- **T-020:** Backlog (user testing, User Agent / Project Owner responsibility)

**Deploy Readiness:** All engineering code changes (T-050) are QA-verified and deploy-ready. No new security issues. No regressions. Pre-existing dependency vulnerabilities (path-to-regexp, brace-expansion) are known and tracked.

---

## Sprint 10 — Build & Staging Deployment (2026-03-29)

**Deploy Engineer:** Sprint #10 build and staging deploy
**Date:** 2026-03-29
**Sprint:** 10
**QA Sign-off Reference:** H-112 (QA Engineer → Deploy Engineer)

---

### Pre-Deploy Checks

| Check | Result | Notes |
|-------|--------|-------|
| QA confirmation in handoff-log | ✅ PASS | H-112: 107/107 frontend tests, 69/69 backend tests — all pass |
| Pending migrations | ✅ NONE | No new migrations in Sprint 10. All 5 Sprint 1 migrations already applied (verified: `knex migrate:latest` → "Already up to date") |
| Sprint 10 tasks ready | ✅ VERIFIED | T-050 Done; T-051 Backlog (doc-only, no deploy impact); T-020 Backlog (user testing, not a code change) |
| Docker availability | ⚠️ N/A | Docker not available in this environment. Using local process deployment (standard for this workspace). |

---

### Build Log

| Step | Result | Details |
|------|--------|---------|
| `cd backend && npm install` | ✅ SUCCESS | Dependencies up to date; 2 known pre-existing audit warnings (path-to-regexp, brace-expansion) — unchanged from Sprint 9 |
| `cd frontend && npm install` | ✅ SUCCESS | Dependencies up to date |
| `cd frontend && npm run build` | ✅ SUCCESS | Vite 8.0.2 — 4612 modules transformed, 0 errors, 0 warnings |

**Build Output:**
```
dist/index.html                            0.74 kB │ gzip:   0.41 kB
dist/assets/index-BNRL_D3i.css            39.06 kB │ gzip:   7.09 kB
dist/assets/confetti.module-No8_urVw.js   10.57 kB │ gzip:   4.20 kB
dist/assets/index-CMumk1kN.js            391.89 kB │ gzip: 114.51 kB
✓ built in 283ms
```

---

### Staging Deployment Log

| Step | Result | Details |
|------|--------|---------|
| Database migrations | ✅ SUCCESS | `npm run migrate` → "Already up to date" — all 5 Sprint 1 migrations verified applied |
| Backend start | ✅ SUCCESS | PID 31589 — `node src/server.js` started on port 3000 |
| Backend health check | ✅ SUCCESS | `GET /api/health` → `{"status":"ok","timestamp":"2026-03-29T20:13:54.436Z"}` |
| Frontend preview start | ✅ SUCCESS | PID 31671 — `vite preview` started; port 4173 and 4174 already in use from prior sprints; running on port 4175 |
| Frontend HTTP check | ✅ SUCCESS | `GET http://localhost:4175` → HTTP 200 |

**Environment:** Staging (local processes)

| Service | URL | Status |
|---------|-----|--------|
| Backend API | http://localhost:3000 | ✅ Running |
| Backend health endpoint | http://localhost:3000/api/health | ✅ Healthy |
| Frontend (production build) | http://localhost:4175 | ✅ Running |

**Build Status: SUCCESS**

---

### Sprint 10 Changes Deployed

| Task | Change | Files Affected |
|------|--------|---------------|
| T-050 | Focus management after mark-done in Care Due Dashboard | `CareDuePage.jsx`, `Button.jsx`, `CareDuePage.test.jsx` |

No backend changes, no migration changes, no new environment variables.


---

## Sprint 10 — Post-Deploy Health Check (2026-03-29)

**Monitor Agent:** Sprint #10 post-deploy health check
**Date:** 2026-03-29T21:05:00Z
**Sprint:** 10
**Environment:** Staging
**Reference Deploy Handoff:** H-114 (Deploy Engineer → Monitor Agent)

---

### Config Consistency Validation

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Backend PORT | `3000` (from `backend/.env`) | `3000` | ✅ PASS |
| Vite proxy target port | Port `3000` (matches backend PORT) | `http://localhost:3000` | ✅ PASS |
| Protocol (SSL) | HTTP (no `SSL_KEY_PATH`/`SSL_CERT_PATH` in `.env`) | Vite proxy uses `http://` | ✅ PASS |
| CORS_ORIGIN includes staging frontend | `FRONTEND_URL` must include `http://localhost:4175` (Sprint #10 staging port) | `FRONTEND_URL=http://localhost:5173,http://localhost:5174,http://localhost:4173` — port 4175 **NOT included** | ❌ **FAIL** |
| Docker backend port mapping | N/A — no backend container in `docker-compose.yml` (postgres only) | N/A | ✅ N/A |

**Config Consistency Result: ❌ FAIL**

**CORS Mismatch Detail:**
- Sprint #10 staging frontend runs on port `4175` (ports 4173/4174 in use from prior sessions — documented in H-114)
- `backend/.env` `FRONTEND_URL` = `http://localhost:5173,http://localhost:5174,http://localhost:4173` — does NOT include `http://localhost:4175`
- `backend/src/app.js` CORS middleware throws `new Error(...)` for unrecognized origins → Express error handler returns **HTTP 500**
- Verified via curl: `curl -H "Origin: http://localhost:4175" http://localhost:3000/api/v1/plants` → **HTTP 500** `{"error":{"message":"Route not found.","code":"NOT_FOUND"}}` (CORS error intercepted before route)
- CORS OPTIONS preflight from `http://localhost:4175` → **HTTP 500**
- **Impact:** All browser-initiated API calls from the staging frontend at `http://localhost:4175` are blocked by CORS policy. The staging app is non-functional for browser testing.
- **Fix:** Add `http://localhost:4175` to `FRONTEND_URL` in `backend/.env` and restart backend.

---

### Health Check — Endpoint Verification

**Token acquisition:** `POST /api/v1/auth/login` with `test@plantguardians.local` / `TestPass123!`
**Note:** System prompt referenced stale `test@triplanner.local` — returns HTTP 401. Correct credential is `test@plantguardians.local` (T-051 documents this fix).

| # | Endpoint | Method | Expected | Actual Status | Result | Notes |
|---|----------|--------|----------|---------------|--------|-------|
| 1 | `/api/health` | GET | 200 | **200** `{"status":"ok","timestamp":"2026-03-29T20:18:34.651Z"}` | ✅ PASS | — |
| 2 | `/api/v1/auth/login` | POST | 200 + tokens | **200** with `access_token`, `refresh_token`, user object | ✅ PASS | `test@plantguardians.local` |
| 3 | `/api/v1/auth/register` | POST | 201 | **201** | ✅ PASS | New user created successfully |
| 4 | `/api/v1/auth/refresh` | POST | 200 + new access_token | **200**, `access_token` present | ✅ PASS | — |
| 5 | `/api/v1/auth/logout` | POST | 200 | **200** `{"data":{"message":"Logged out successfully."}}` | ✅ PASS | Requires `refresh_token` in body |
| 6 | `/api/v1/plants` | GET | 200 | **200**, `data` key present | ✅ PASS | Auth required — 401 without token (verified) |
| 7 | `/api/v1/plants` | POST | 201 | **201**, plant ID returned | ✅ PASS | Includes `care_schedules` array |
| 8 | `/api/v1/plants/:id` | GET | 200 | **200** | ✅ PASS | Includes `care_schedules` + `recent_care_actions` |
| 9 | `/api/v1/plants/:id` | PUT | 200 | **200** | ✅ PASS | Note: endpoint is `PUT`, not `PATCH` |
| 10 | `/api/v1/plants/:id` | DELETE | 200 | **200** | ✅ PASS | — |
| 11 | `/api/v1/plants/:id/photo` | POST | 400 (no file) | **400** | ✅ PASS | Endpoint exists; multipart required |
| 12 | `/api/v1/plants/:id/care-actions` | POST | 201 | **201** | ✅ PASS | Requires plant to have matching care schedule |
| 13 | `/api/v1/plants/:id/care-actions/:id` | DELETE | 200 | **200** | ✅ PASS | Correctly reverts `last_done_at` on schedule |
| 14 | `/api/v1/care-actions` | GET | 200 + pagination | **200**, `pagination` key present | ✅ PASS | — |
| 15 | `/api/v1/care-due` | GET | 200 | **200**, `data` key present | ✅ PASS | — |
| 16 | `/api/v1/profile` | GET | 200 | **200** with `user` + `stats` | ✅ PASS | — |
| 17 | `/api/v1/ai/advice` | POST | 200 | **200** with AI care advice | ✅ PASS | Gemini API live and responding |

**Endpoint Health Result: ✅ 17/17 PASS — No 5xx errors on any endpoint**

---

### Auth Protection Check

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| `GET /api/v1/plants` without token | HTTP 401 | **401** | ✅ PASS |
| `GET /api/v1/plants` with valid Bearer token | HTTP 200 | **200** | ✅ PASS |

---

### Frontend Accessibility

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| `frontend/dist/` exists (production build) | Files present | `index.html`, `assets/`, `favicon.svg`, `icons.svg` | ✅ PASS |
| `GET http://localhost:4175` | HTTP 200 | **200** | ✅ PASS |

---

### Database Connectivity

- Health endpoint `GET /api/health` responds successfully → database connection pooling operational
- All 17 DB-backed endpoints respond with 2xx → zero connection pool errors observed
- No 500 errors attributed to database in any tested endpoint

**Database Connectivity Result: ✅ PASS**

---

### 5xx Error Check

**No 5xx errors observed on any of the 17 tested API endpoints.**

> Note: `POST http://localhost:3000/api/v1/plants` with `Origin: http://localhost:4175` header → **HTTP 500** (CORS policy error). This is not an application bug — it is the CORS config mismatch documented above.

---

### Health Check Summary

| Category | Result |
|----------|--------|
| App responds (GET /api/health → 200) | ✅ PASS |
| Auth works (login with test@plantguardians.local) | ✅ PASS |
| All 17 API endpoints respond | ✅ PASS (17/17) |
| No 5xx errors in tested endpoints | ✅ PASS |
| Database connected | ✅ PASS |
| Frontend accessible at http://localhost:4175 | ✅ PASS |
| Config: backend PORT matches vite proxy target | ✅ PASS |
| Config: protocol (HTTP/HTTPS) match | ✅ PASS |
| Config: CORS_ORIGIN includes staging frontend port 4175 | ❌ **FAIL** — port 4175 missing from FRONTEND_URL |

---

### Error Summary

**CORS Mismatch — Staging Frontend Port 4175 Not in FRONTEND_URL**

- **File:** `backend/.env`
- **Variable:** `FRONTEND_URL`
- **Current value:** `http://localhost:5173,http://localhost:5174,http://localhost:4173`
- **Missing:** `http://localhost:4175`
- **Evidence:** `curl -H "Origin: http://localhost:4175" http://localhost:3000/api/v1/plants` → HTTP 500
- **Root cause:** Each sprint, `vite preview` increments port when previous ports are occupied. Sprint #10 landed on 4175. `FRONTEND_URL` was not updated to include the new port.
- **Impact:** Browser API calls from the staging app at `http://localhost:4175` are blocked. The app cannot be used for browser-based user testing (T-020).
- **Fix:** Append `,http://localhost:4175` to `FRONTEND_URL` in `backend/.env`, restart backend. Same fix pattern as T-045 (Sprint 9).

---

### Test Type: Post-Deploy Health Check

| Field | Value |
|-------|-------|
| **Test Type** | Post-Deploy Health Check |
| **Environment** | Staging |
| **Timestamp** | 2026-03-29T21:05:00Z |
| **Token** | Acquired via `POST /api/v1/auth/login` with `test@plantguardians.local` (NOT `/auth/register`) |
| **Deploy Verified** | **No** |
| **Blocker** | CORS mismatch — `http://localhost:4175` not in `FRONTEND_URL` → HTTP 500 on all browser API requests from staging frontend |
| **Action Required** | Add `http://localhost:4175` to `FRONTEND_URL` in `backend/.env`, restart backend. Handoff H-117 sent to Backend Engineer. |


---

### Build Entry: T-055 — CORS Port Drift Fix

| Field | Value |
|-------|-------|
| **Task** | T-055 |
| **Agent** | Deploy Engineer |
| **Date** | 2026-03-30 |
| **Sprint** | 11 |
| **Build Status** | Success |
| **Environment** | Staging |

#### Changes Applied

| File | Change |
|------|--------|
| `backend/.env` | Added `http://localhost:4175` to `FRONTEND_URL` (now includes :5173, :5174, :4173, :4175) |
| `frontend/package.json` | Updated `preview` script from `vite preview` → `vite preview --port 4173` (fixed port, prevents future drift) |
| `backend/.env.example` | Updated CORS comment to document all canonical ports including :4175 fallback |

#### CORS Preflight Verification

| Origin | HTTP Status | Access-Control-Allow-Origin |
|--------|-------------|------------------------------|
| `http://localhost:4173` | 204 No Content ✅ | `http://localhost:4173` ✅ |
| `http://localhost:4175` | 204 No Content ✅ | `http://localhost:4175` ✅ |

#### Backend Test Results

- **Total:** 70/72 pass
- **Note:** 2 pre-existing failures in `auth.test.js` logout tests — rate-limiter returns 429 on last 2 tests in the full suite run. These failures exist because T-053 partial implementation (cookie-based auth) increased auth request count per suite run. Not caused by T-055 changes. Zero previously-passing tests were broken.
- **Unchanged:** All 7 non-auth test suites pass (plants, ai, careHistory, careDue, careActions, account, profile).

#### Backend Restart

Backend restarted to pick up updated `FRONTEND_URL`. New process confirmed serving CORS headers correctly.

#### T-020 Gate Status

T-055 acceptance criteria met. T-020 (User testing) is now **fully unblocked**.

---

## Sprint #11 — QA Verification (2026-03-30)

**QA Engineer — Full test run for Sprint #11 tasks: T-055, T-052, T-053 (backend), T-054**

---

### Unit Test Results

**Test Type:** Unit Test
**Date:** 2026-03-30

#### Backend Tests

- **Result:** 72/72 PASS ✅
- **Suites:** 8/8 pass (plants, auth, ai, careHistory, careDue, careActions, account, profile)
- **T-053 auth tests:** 14 tests covering register (cookie set), login (cookie set), refresh (cookie rotation, missing cookie → 401, invalid cookie → 401, already-rotated → 401), logout (cookie cleared, idempotent, no Bearer → 401), plus cookie attribute verification
- **Pre-existing 429 flakes:** RESOLVED — test setup now sets rate-limit env vars before `require(app)`
- **Regression:** No regressions from Sprint 10 baseline (was 69; now 72 with 3 net new T-053 tests)

#### Frontend Tests

- **Result:** 117/117 PASS ✅
- **Suites:** 20/20 pass
- **T-052 new tests:** 6 StatusBadge tests (watering/fertilizing/repotting icons, singular/plural days, no-icon fallback, with-icon class) + 3 PlantCard tests (multi-badge, no-schedules, singular day) = 9 new
- **T-054 new test:** 1 EditPlantPage test (remove photo → Save enabled)
- **Regression:** No regressions from Sprint 10 baseline (was 107; now 117 with 10 new tests)

---

### Integration Test Results

**Test Type:** Integration Test
**Date:** 2026-03-30

#### T-055 — CORS Port Drift Fix ✅ PASS

| Check | Result |
|-------|--------|
| `FRONTEND_URL` in `.env` includes `:4173` and `:4175` | ✅ `http://localhost:5173,http://localhost:5174,http://localhost:4173,http://localhost:4175` |
| `frontend/package.json` preview script pinned to `--port 4173` | ✅ `"preview": "vite preview --port 4173"` |
| `.env.example` documents all canonical ports | ✅ Comments explain each port's purpose |
| `.env.example` matches `.env` structure | ✅ Same variable names and format |
| CORS middleware parses comma-separated `FRONTEND_URL` | ✅ `app.js` line 24 splits and trims |
| `credentials: true` set in CORS config | ✅ `app.js` line 31 |

#### T-052 — Care-Type Badge Icons ✅ PASS

| Check | Result |
|-------|--------|
| StatusBadge accepts `careType` prop | ✅ Renders icon + label prefix |
| Watering badge: blue Drop icon (#5B8FA8) + "Watering: [status]" | ✅ CARE_TYPE_CONFIG map correct |
| Fertilizing badge: green Leaf icon (#4A7C59) + "Fertilizing: [status]" | ✅ |
| Repotting badge: terracotta PottedPlant icon (#A67C5B) + "Repotting: [status]" | ✅ |
| Badge text format: "Watering: 1 day overdue" (singular) / "3 days overdue" (plural) | ✅ Line 30 handles `daysOverdue === 1` |
| No-schedules badge: "Not set" without icon | ✅ `config` is null when no `careType` |
| Icons are `aria-hidden="true"` | ✅ Line 58 |
| Icon size 13px, bold weight | ✅ Lines 56-57 |
| Padding adjusted for icon badges | ✅ `.status-badge-with-icon` class applied |
| Matches SPEC-002 Amendment | ✅ All 7 spec requirements met |

#### T-054 — Photo Removal isDirty Fix ✅ PASS

| Check | Result |
|-------|--------|
| `isDirty` useMemo compares `photoUrl` against `(plant.photo_url \|\| '')` | ✅ Line 89 |
| `photoUrl` in dependency array | ✅ Line 116 |
| `onRemove` sets `photoUrl` to `''` | ✅ Line 277 |
| Save button disabled when `!isDirty` | ✅ Line 311 |
| Unit test covers remove-photo → Save enabled flow | ✅ EditPlantPage.test.jsx |

#### T-053 — HttpOnly Refresh Token Cookie (Backend Only) ✅ PASS

| Check | Result |
|-------|--------|
| `cookie-parser` registered before auth routes in `app.js` | ✅ Line 35 (`cookieParser()`), auth routes at line 78 |
| `POST /register`: `Set-Cookie` with HttpOnly, Secure, SameSite=Strict, Path=/api/v1/auth | ✅ `setRefreshTokenCookie()` at line 90 |
| `POST /register`: `refresh_token` NOT in response body | ✅ Response has only `user` + `access_token` (line 92-102) |
| `POST /login`: same cookie behavior | ✅ Line 134, response lines 136-150 |
| `POST /refresh`: reads from `req.cookies.refresh_token` | ✅ Line 159 |
| `POST /refresh`: rotates token (revoke old + issue new) | ✅ Lines 170-182 |
| `POST /refresh`: returns only `access_token` in body | ✅ Lines 184-188 |
| `POST /logout`: reads cookie, revokes token, clears cookie | ✅ Lines 202-208 |
| `POST /logout`: idempotent (no cookie = still 200) | ✅ `if (rawToken)` guard at line 203 |
| `DELETE /account`: clears cookie | ✅ Line 253 |
| Cookie Max-Age matches REFRESH_TOKEN_EXPIRES_DAYS (7d = 604800s) | ✅ Lines 43-44 |
| API contract match (Sprint 11 api-contracts.md) | ✅ All 4 endpoints match contract exactly |

#### T-053 — Frontend api.js ⚠️ NOT YET UPDATED

| Check | Result |
|-------|--------|
| `api.js` uses `credentials: 'include'` on auth calls | ❌ Still missing |
| `refreshAccessToken()` reads token from cookie (no body) | ❌ Still sends `{ refresh_token }` in body (line 38) |
| `auth.logout()` does not send `refresh_token` in body | ❌ Still sends (line 115) |
| `setTokens()`/`clearTokens()` manages refresh token in memory | ❌ Still manages `refreshToken` variable (lines 7, 11, 24) |
| Silent re-auth on app init | ❌ Not implemented |

**Note:** Frontend `api.js` update is assigned to Frontend Engineer per H-130. T-053 CANNOT move to Done until the frontend half is complete. Backend half passes all checks.

---

### Config Consistency Check

**Test Type:** Config Consistency
**Date:** 2026-03-30

| Check | Result |
|-------|--------|
| Backend PORT (3000) matches vite proxy target (`http://localhost:3000`) | ✅ |
| No SSL in dev → vite proxy uses `http://` (not `https://`) | ✅ |
| `CORS_ORIGIN` includes frontend dev server `http://localhost:5173` | ✅ First entry in `FRONTEND_URL` |
| `CORS_ORIGIN` includes frontend preview `http://localhost:4173` | ✅ |
| Docker-compose postgres port (5432) matches `DATABASE_URL` | ✅ |
| Docker-compose test DB port (5433) matches `TEST_DATABASE_URL` | ✅ `.env` uses 5432 for test (same host, different DB name); docker-compose exposes test on 5433 — **minor inconsistency** but both approaches work (same-port/different-DB-name vs different-port) |
| `credentials: true` in CORS config (required for cookies) | ✅ `app.js` line 31 |

**Result:** No blocking mismatches. One minor note: `.env` test DB uses port 5432 (same Postgres instance, different database name) while `docker-compose.yml` provisions a separate test Postgres on port 5433. Both approaches work — the `.env` approach shares the Postgres instance, docker-compose provides full isolation. No action needed.

---

### Security Scan

**Test Type:** Security Scan
**Date:** 2026-03-30

#### npm audit (Backend)

- **Result:** 2 vulnerabilities (1 moderate, 1 high) — both PRE-EXISTING
  - `brace-expansion` < 1.1.13 (moderate) — in nodemon transitive deps
  - `path-to-regexp` < 0.1.13 (high, ReDoS) — in Express 4 core dependency
- **Remediation:** Both fixable via `npm audit fix` for the moderate one. The `path-to-regexp` issue is an Express 4 core dep — noted in Sprint 11 Out of Scope as "Express 5 migration — advisory backlog; no fix available without breaking changes."
- **Assessment:** Not a P1 — known pre-existing, mitigated by input validation on routes. No new vulnerabilities introduced by Sprint 11 changes.

#### Security Checklist Verification

| Item | Status | Notes |
|------|--------|-------|
| **Authentication & Authorization** | | |
| All API endpoints require auth | ✅ | `authenticate` middleware on all protected routes |
| Auth tokens have expiration and refresh | ✅ | JWT 15m expiry, refresh token 7d, rotation on use |
| Password hashing uses bcrypt | ✅ | Via `User.create()` and `User.verifyPassword()` |
| Failed login attempts rate-limited | ✅ | `authLimiter` at 20 requests per 15min window |
| **Input Validation & Injection Prevention** | | |
| SQL queries use parameterized statements | ✅ | All queries via Knex query builder; `knex.raw` only in migrations |
| User inputs validated server-side | ✅ | `validateBody` middleware on register/login/plants |
| HTML output sanitized (XSS) | ✅ | React auto-escapes; no `dangerouslySetInnerHTML` anywhere |
| File uploads validated (type, size) | ✅ | Multer with mime-type + size limits |
| **API Security** | | |
| CORS configured for expected origins only | ✅ | Dynamic origin check against `FRONTEND_URL` list |
| Rate limiting applied | ✅ | General (100/15m) + auth-specific (20/15m) |
| API responses don't leak internals | ✅ | Centralized `errorHandler` returns safe messages |
| Sensitive data not in URL query params | ✅ | Tokens in headers/cookies only |
| Security headers (helmet) | ✅ | `app.use(helmet())` — X-Content-Type-Options, X-Frame-Options, etc. |
| **Data Protection** | | |
| Credentials in env vars, not code | ✅ | JWT_SECRET, GEMINI_API_KEY, DATABASE_URL all from `.env` |
| `.env` in `.gitignore` | ✅ | Verified |
| Logs don't contain PII/tokens | ✅ | Console output checked — only error messages, no token values |
| **T-053 Cookie Security** | | |
| HttpOnly flag (XSS protection) | ✅ | `httpOnly: true` in `setRefreshTokenCookie()` |
| Secure flag (HTTPS only in prod) | ✅ | `secure: true` |
| SameSite=Strict (CSRF protection) | ✅ | `sameSite: 'strict'` |
| Cookie scoped to auth routes only | ✅ | `path: '/api/v1/auth'` |
| Token rotation on refresh | ✅ | Old token revoked before issuing new one |
| Refresh token never in response body | ✅ | Removed from all JSON responses |

**Security Scan Result:** ✅ PASS — No P1 security issues. Pre-existing npm audit vulnerabilities are known and mitigated.

---

### Product-Perspective Testing Notes

**Date:** 2026-03-30

#### T-052 — Care Type Badges (User Perspective)

- **Positive:** Badge labels like "Watering: 2 days overdue" are much clearer than the previous unlabeled badges. Users can now instantly tell which care type needs attention without clicking into plant detail. This is a significant UX improvement.
- **Positive:** Color-coded icons (blue water drop, green leaf, terracotta pot) provide strong visual recognition even before reading text.
- **Edge case reviewed:** Plant with all three care types active shows all badges in a wrapped flex layout — readable and not cramped.

#### T-054 — Photo Removal Save Button (User Perspective)

- **Positive:** The fix correctly enables Save when a user removes a photo. Previously this was a dead end — user removed photo but couldn't save. Simple fix with high impact.

#### T-053 — Cookie-Based Auth (User Perspective)

- **Note:** Backend is ready for persistent login. Once frontend is updated, users will no longer need to re-login after page refresh. This addresses a real user pain point (FB-039).
- **Risk:** Frontend `api.js` still sends `refresh_token` in request body. Until updated, the refresh endpoint will return 401 (body-based token not found in cookies). This means **current frontend refresh flow is broken** against the updated backend. Frontend Engineer must update `api.js` before this can ship.

#### T-055 — CORS Fix (User Perspective)

- **Positive:** CORS port drift permanently resolved. Fixed preview port eliminates the recurring "staging doesn't work" issue that has blocked T-020 for 10 sprints.

---

## Sprint #11 — Build & Staging Deployment (2026-03-30)

**Deploy Engineer:** Sprint #11 staging deploy
**Date:** 2026-03-30
**Sprint:** 11
**Tasks Deployed:** T-055 (CORS config already live), T-052 (care type badges), T-054 (photo isDirty fix)
**Tasks Held:** T-053 (backend auth cookie changes running; frontend `api.js` not yet updated — do NOT test T-053 integrated flow until H-132 condition is met)

---

### Pre-Deploy Checks

| Check | Result | Details |
|-------|--------|---------|
| QA sign-off received | ✅ | H-132 — QA confirms T-055, T-052, T-054 ready to deploy |
| Migrations pending | ✅ None | `knex migrate:status` — 5/5 migrations up to date, no pending |
| Backend tests | ✅ 72/72 | `cd backend && npm test` — 8/8 suites pass |
| Frontend tests | ✅ 117/117 | `cd frontend && npm test` — 20/20 suites pass |
| Security checklist | ✅ | Reviewed per H-129. No P1 issues. 2 pre-existing npm audit vulns (noted, not new) |

---

### Build

| Step | Result | Details |
|------|--------|---------|
| `cd frontend && npm run build` | ✅ SUCCESS | 4612 modules transformed, 0 errors |
| dist/assets/index-Ct89y25P.js | ✅ | 392.34 kB (gzip: 114.66 kB) |
| dist/assets/index-B5-ttYap.css | ✅ | 39.15 kB (gzip: 7.11 kB) |
| Build timestamp | ✅ | 2026-03-30 09:32 — includes T-052 + T-054 changes |

---

### Staging Deployment Log

| Step | Result | Details |
|------|--------|---------|
| Killed stale frontend preview (PID 31688 / port 4173) | ✅ | Previous Sprint 10/T-055 preview removed |
| Killed stale frontend preview (PID 39822 / port 4174) | ✅ | Stale plant_guardians preview removed |
| Start new frontend preview | ✅ | PID 44508 — started 2026-03-30 09:32:48 |
| Frontend preview port | ⚠️ 4175 | `--port 4173` requested; 4173 occupied by unrelated project (triplanner), 4174 killed; landed on 4175. Port 4175 is in `FRONTEND_URL` — CORS is covered |
| Backend running | ✅ | PID 41646 (node src/server.js) — no restart needed; T-055 CORS config already live |
| No migrations to run | ✅ | All 5 migrations already at "up to date" |

---

### Post-Deploy CORS Verification

| Origin | CORS Preflight | Access-Control-Allow-Origin |
|--------|---------------|----------------------------|
| http://localhost:4173 | ✅ 204 No Content | http://localhost:4173 |
| http://localhost:4175 | ✅ 204 No Content | http://localhost:4175 |

---

### Staging URLs

| Service | URL | PID | Status |
|---------|-----|-----|--------|
| Backend API | http://localhost:3000 | 41646 | ✅ Running |
| Frontend (Sprint 11 build) | http://localhost:4175 | 44508 | ✅ Running |
| Database | postgresql://localhost:5432/plant_guardians_staging | — | ✅ Migrations up to date |

---

### Deploy Verdict

**Environment:** Staging
**Build Status:** ✅ Success
**Deploy Status:** ✅ Deployed
**Tasks Live:** T-052 (care type badges), T-054 (photo isDirty fix), T-055 (CORS config)
**T-053 Status:** Backend changes running (PID 41646 started 09:19). Frontend `api.js` NOT yet updated — integrated refresh-token flow is broken until Frontend Engineer completes H-130/H-131 changes. Do not test T-053 end-to-end until QA re-verification (per H-132 recommendation).
**T-020 Gate:** CORS is live and verified. T-020 (user testing) is unblocked. Staging URL: http://localhost:4175

**Handoff H-133 sent to Monitor Agent for post-deploy health checks.**

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
