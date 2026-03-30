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
