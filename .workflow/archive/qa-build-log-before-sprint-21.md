## Sprint 20 — Monitor Agent: Post-Deploy Health Check (2026-04-05)

**Date:** 2026-04-05T19:47:xx UTC
**Agent:** Monitor Agent
**Sprint:** #20
**Git SHA:** `90a362d`
**Environment:** Staging (local)
**Deploy Reference:** H-278 (Deploy Engineer → Monitor Agent)

---

### Test Type: Config Consistency

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Backend PORT | — | `3000` (from `backend/.env`) | ✅ |
| SSL_KEY_PATH | — | Not set | ✅ HTTP mode |
| SSL_CERT_PATH | — | Not set | ✅ HTTP mode |
| CORS / FRONTEND_URL | Includes `http://localhost:5173` | `http://localhost:5173,http://localhost:5174,http://localhost:4173,http://localhost:4175` | ✅ PASS |
| Vite proxy target | `http://localhost:3000` (PORT match, HTTP) | `http://localhost:3000` | ✅ PORT match |
| Protocol match | No SSL → both use `http://` | Vite proxy uses `http://` ✅ | ✅ PASS |
| Docker port mapping | N/A — `docker-compose.yml` has no backend container (only postgres) | Postgres only: `${POSTGRES_PORT:-5432}:5432` | ✅ No conflict |

**Config Consistency Result: PASS** — No mismatches detected. All three layers (backend, Vite proxy, CORS) are aligned.

---

### Test Type: Post-Deploy Health Check

**Token acquisition:** `POST /api/v1/auth/login` with `test@plantguardians.local` / `TestPass123!`
**Token status:** ✅ 200 OK — `access_token` returned (user ID: `51b28759-2987-47b3-8562-21eb443f232e`)
**Note:** Login used (NOT /register) to preserve rate-limit quota per T-226 instructions.

#### Baseline Checks

| Check | Endpoint | Expected | Actual | Result |
|-------|----------|----------|--------|--------|
| App responds | `GET /api/health` | 200 `{status: ok}` | 200 `{"status":"ok","timestamp":"2026-04-05T19:46:54.791Z"}` | ✅ PASS |
| Auth — login | `POST /api/v1/auth/login` | 200 + access_token | 200 + access_token | ✅ PASS |
| Auth — refresh (error path) | `POST /api/v1/auth/refresh` (invalid token) | 401 INVALID_REFRESH_TOKEN | 401 `{"error":{"message":"Refresh token is invalid, expired, or already used.","code":"INVALID_REFRESH_TOKEN"}}` | ✅ PASS |
| Frontend accessible | `GET http://localhost:4173` | 200 OK | 200 OK | ✅ PASS |
| Frontend dist/ exists | `frontend/dist/index.html` | Present | Present (4643 modules, 1507 bytes) | ✅ PASS |
| Database connected | Inferred from /api/health + plants query | No error | 200 on all DB-backed endpoints | ✅ PASS |

#### API Endpoint Checks

| Check | Endpoint | Expected | Actual | Result |
|-------|----------|----------|--------|--------|
| GET plants list | `GET /api/v1/plants` | 200, paginated | 200 `{"data":[...],"pagination":{"page":1,"limit":50,"total":4}}` | ✅ PASS |
| GET single plant | `GET /api/v1/plants/:id` | 200, care_schedules + recent_care_actions | 200, shape matches contract | ✅ PASS |
| POST plant | `POST /api/v1/plants` | 201, plant object | 201 `{"data":{"id":"...","name":"Monitor Health Check Plant Sprint 20",...}}` | ✅ PASS |
| DELETE plant | `DELETE /api/v1/plants/:id` | 200, confirmation | 200 `{"data":{"message":"Plant deleted successfully.","id":"..."}}` | ✅ PASS |

#### Sprint #20 Primary Endpoint: `GET /api/v1/plants/:id/care-history`

| Check | Input | Expected | Actual | Result |
|-------|-------|----------|--------|--------|
| Auth guard | No `Authorization` header | 401 UNAUTHORIZED | 401 `{"error":{"message":"Missing or invalid authorization header.","code":"UNAUTHORIZED"}}` | ✅ PASS |
| Invalid UUID | `:id = 00000000-0000-0000-0000-000000000001` (not v4) | 400 VALIDATION_ERROR | 400 `{"error":{"message":"id must be a valid UUID.","code":"VALIDATION_ERROR"}}` | ✅ PASS |
| Non-existent plant | `:id = a1b2c3d4-e5f6-4789-abcd-ef1234567890` | 404 NOT_FOUND | 404 `{"error":{"message":"Plant not found.","code":"NOT_FOUND"}}` | ✅ PASS |
| Happy path (empty) | plant with no care records | 200, `items:[], total:0` | 200 `{"data":{"items":[],"total":0,"page":1,"limit":20,"totalPages":0}}` | ✅ PASS |
| Happy path (with data) | plant with 4 watering records | 200, items array, correct shape | 200 — 4 items, `careType`/`performedAt`/`notes` fields present, newest first | ✅ PASS |
| Response shape | — | `{data:{items,total,page,limit,totalPages}}` | Exact match | ✅ PASS |
| careType filter | `?careType=watering` | 200, filtered results | 200 — 4 watering records returned, 0 other types | ✅ PASS |
| Pagination | `?page=1&limit=2` | 200, 2 items, totalPages=2 | 200 — 2 items, `total:4`, `totalPages:2`, `limit:2` | ✅ PASS |
| Invalid careType | `?careType=pruning` | 400 `careType must be one of: watering, fertilizing, repotting` | 400 — exact message match | ✅ PASS |
| limit out of range (low) | `?limit=0` | 400 `limit must be an integer between 1 and 100` | 400 — exact message match | ✅ PASS |
| limit out of range (high) | `?limit=101` | 400 `limit must be an integer between 1 and 100` | 400 — exact message match | ✅ PASS |
| page out of range | `?page=0` | 400 `page must be a positive integer` | 400 — exact message match | ✅ PASS |
| 403 cross-user check | Plant belonging to a different user | 403 FORBIDDEN | ⚠️ NOT TESTED — No second-user plant in staging DB; cannot register (rate-limit preservation per T-226). All other auth/ownership paths verified. QA confirmed implementation in H-275/H-277. | ⚠️ SKIPPED |

#### 5xx Error Check

No 5xx errors observed across all 18 endpoint calls. All responses were either expected 2xx, 4xx, or appropriate error shapes.

---

### Summary

| Category | Result |
|----------|--------|
| Config Consistency | ✅ PASS |
| App responds (health) | ✅ PASS |
| Authentication | ✅ PASS |
| Plants CRUD | ✅ PASS |
| `GET /api/v1/plants/:id/care-history` (Sprint #20) | ✅ PASS (403 cross-user skipped — rate-limit preservation) |
| Validation error handling | ✅ PASS — all 4 error cases exact message match |
| Frontend accessible | ✅ PASS |
| No 5xx errors | ✅ PASS |
| Database connectivity | ✅ PASS |

**Deploy Verified: Yes**

All checks pass. The 403 cross-user scenario was not directly tested due to the absence of a second seeded user's plant in the staging database and the rate-limit constraint on `/register`. This gap was already covered by QA Engineer's test suite (H-275, H-277) — 142/142 backend tests pass including T-093's 7 error-path tests.

---

## Sprint 20 — Deploy Engineer: Staging Build & Deploy (2026-04-05)

**Date:** 2026-04-05
**Agent:** Deploy Engineer
**Sprint:** #20
**Git SHA:** `90a362d`
**QA Sign-Off:** H-275 + H-277 (QA Engineer) — All tasks PASS, deploy approved
**Environment:** Staging (local)

### Pre-Deploy Verification

| Check | Result |
|-------|--------|
| QA sign-off in handoff-log | ✅ H-275 + H-277 — All Sprint #20 tasks PASS |
| All Sprint #20 tasks Done | ✅ T-092, T-093, T-094, T-095 — all Done |
| Pending migrations | ✅ None — 5/5 already applied, 0 pending |

### Build

| Step | Result | Detail |
|------|--------|--------|
| `cd backend && npm install` | ✅ PASS | 0 vulnerabilities |
| `cd frontend && npm install` | ✅ PASS | 0 vulnerabilities |
| `cd frontend && npm run build` | ✅ PASS | 4643 modules, 316ms, 0 errors |
| Build output | ✅ CLEAN | `dist/assets/index-CoqjSbE7.js` 443 kB; CSS 76 kB |

**Build Status: SUCCESS**

### Staging Deployment

| Step | Result | Detail |
|------|--------|--------|
| Docker | ⚠️ Not available | `docker` command not found — local process fallback used |
| Migrations | ✅ UP TO DATE | `knex migrate:latest` → "Already up to date" (5/5 applied) |
| Backend start (`npm start`) | ✅ RUNNING | PID 16043, port 3000 |
| Backend health check | ✅ 200 OK | `GET /api/health` → `{"status":"ok","timestamp":"2026-04-05T19:45:07.577Z"}` |
| Frontend preview (`vite preview`) | ✅ RUNNING | PID 16076, port 4173 |
| Frontend HTTP check | ✅ 200 OK | `GET http://localhost:4173/` → 200 |

**Environment:** Staging
**Build Status:** Success

### Running Services

| Service | URL | Port | PID |
|---------|-----|------|-----|
| Backend API | http://localhost:3000 | 3000 | 16043 |
| Frontend (production build preview) | http://localhost:4173 | 4173 | 16076 |
| Database | postgresql://localhost:5432/plant_guardians_staging | 5432 | — |

### Notes

- Docker not available in this environment; services run as local Node.js processes
- Frontend served via `vite preview` from the production `dist/` build
- Backend connecting to local PostgreSQL (plant_guardians_staging DB)
- CORS configured for: http://localhost:5173, 5174, 4173, 4175

**Deploy Status: STAGING DEPLOY COMPLETE — Awaiting Monitor Agent health check**

---

## Sprint 20 — QA Engineer: Re-Verification Pass — T-092, T-093, T-094, T-095 (2026-04-05)

**Date:** 2026-04-05
**Agent:** QA Engineer (Sprint #20 — Re-Verification)
**Sprint:** #20
**Tasks Verified:** T-092 (SPEC-015), T-093 (care-history API), T-094 (care-history UI), T-095 (lodash audit fix)

### Re-Verification Summary

QA Engineer re-ran full verification suite to confirm prior QA sign-off (H-275) is still valid. All checks pass.

| Check | Result |
|-------|--------|
| Backend unit tests | ✅ 142/142 PASS (15 test suites, ~35s) |
| Frontend unit tests | ✅ 205/205 PASS (29 test files, ~3.2s) |
| npm audit (backend) | ✅ 0 vulnerabilities |
| npm audit (frontend) | ✅ 0 vulnerabilities |
| Config consistency (PORT, proxy, CORS) | ✅ PASS — backend PORT=3000 matches Vite proxy `http://localhost:3000`; CORS includes all frontend origins |
| Security checklist | ✅ ALL PASS — auth enforced, parameterized Knex queries, no XSS, no stack trace leaks, helmet active, .env gitignored |

### Unit Test Coverage Review (Test Type: Unit Test)

**Backend T-093 (plantCareHistory.test.js) — 12 tests:**
- Happy-path (5): paginated response with correct shape/ordering, empty plant returns `items: []`, careType filter works, pagination page 2, notes null check ✅
- Error-path (7): 401 no auth, 404 plant not found, 403 wrong owner, 400 invalid careType, 400 page < 1, 400 limit > 100, 400 invalid UUID ✅
- Verdict: Exceeds requirement (12 vs 9 minimum). All status codes and error codes match API contract.

**Frontend T-094 (CareHistorySection.test.jsx) — 10 tests:**
- Loading skeleton with `aria-busy="true"` ✅
- Empty state generic ("No care history yet.") ✅
- Empty state filtered ("No Watering history yet.") ✅
- Error state with retry ✅
- Populated list with aria-labels ✅
- Filter tab triggers changeFilter ✅
- Load More button calls loadMore ✅
- Notes aria-label includes "Has notes." ✅
- fetchHistory called on mount ✅
- Load more error displayed inline ✅
- Verdict: Exceeds requirement (10 vs 7 minimum). All UI states covered.

### Integration Test Review (Test Type: Integration Test)

**API Contract Compliance — `GET /api/v1/plants/:id/care-history`:**
- Auth enforcement: `router.use(authenticate)` on careActions.js route. 401 for missing/invalid token ✅
- Plant ownership: `Plant.findById` + `plant.user_id !== req.user.id` → 403 FORBIDDEN ✅
- Plant not found: `NotFoundError('Plant')` → 404 NOT_FOUND ✅
- Response shape: `{ data: { items, total, page, limit, totalPages } }` — exact match ✅
- Item shape: `{ id, careType, performedAt, notes }` — SQL aliases correct (`care_type as careType`, `performed_at as performedAt`, `note as notes`) ✅
- Ordering: `.orderBy('performed_at', 'desc')` — reverse chronological ✅
- Pagination defaults: page=1, limit=20, totalPages=Math.ceil(total/limit) ✅
- careType validation: against `VALID_CARE_TYPES = ['watering', 'fertilizing', 'repotting']` → 400 VALIDATION_ERROR ✅
- page/limit validation: range checks, isNaN, isInteger → 400 VALIDATION_ERROR ✅
- UUID param validation: `validateUUIDParam('id')` middleware → 400 for invalid UUIDs ✅
- Empty result: 200 with `{ items: [], total: 0, totalPages: 0 }` ✅
- Parameterized queries: Knex builder `.where('plant_id', plantId)` — no concatenation ✅
- Error format: `{ error: { message, code } }` — no stack traces ✅

**Frontend → Backend Wiring:**
- API method: `careHistory.get(plantId, params)` in `frontend/src/utils/api.js` → `/plants/${plantId}/care-history` ✅
- Auth header: auto-added by `request()` helper ✅
- Hook: `usePlantCareHistory` manages all state; race condition prevention via `requestId` ref ✅
- Load More: appends via `setItems(prev => [...prev, ...data.items])` — does not replace ✅
- Filter reset: `changeFilter` → `fetchHistory(careType)` resets page/items/loading ✅

**UI States (SPEC-015 Compliance):**
- Loading skeleton with shimmer + `aria-busy="true"` ✅
- Empty state (generic): "No care history yet." + "Go to Overview" CTA ✅
- Empty state (filtered): "No {Type} history yet." + "Show All" ✅
- Error state: "Couldn't load care history." + "Try Again" — non-breaking ✅
- Populated: month-grouped list with care type icon/label/relative date ✅
- Load More: ghost button, loading spinner, inline error on failure ✅
- End of list: "You've seen all care history for this plant." ✅
- Filter pills: All/Watering/Fertilizing/Repotting with `aria-pressed`, `role="group"` ✅
- Tab bar: Overview/History tabs on PlantDetailPage ✅
- Accessibility: `role="list"`, `role="listitem"`, `aria-label`, `aria-busy` ✅

### Config Consistency (Test Type: Config Consistency)

- Backend PORT=3000 matches Vite proxy target `http://localhost:3000` ✅
- No SSL in dev — Vite proxy uses `http://` consistently ✅
- CORS: `FRONTEND_URL=http://localhost:5173,http://localhost:5174,http://localhost:4173,http://localhost:4175` covers all dev/preview ports ✅
- Docker postgres on 5432 (dev) / 5433 (test) — consistent with .env ✅

### Security Scan (Test Type: Security Scan)

- [x] Auth on all endpoints — `authenticate` middleware ✅
- [x] JWT expiration: 15m access, 7d refresh ✅
- [x] Password hashing: bcrypt ✅
- [x] Auth rate limiting: `authLimiter` on auth routes ✅
- [x] Parameterized SQL (Knex) — no injection vectors ✅
- [x] Server-side validation on all inputs ✅
- [x] No `dangerouslySetInnerHTML` — React default escaping ✅
- [x] CORS allowlist from env var ✅
- [x] Helmet.js security headers ✅
- [x] Error handler: generic message for unknown errors, no stack traces ✅
- [x] `.env` not in git ✅
- [x] npm audit: 0 vulnerabilities in both packages ✅

**Security Verdict: ALL CHECKS PASS. No P1 issues.**

### Product-Perspective Notes

Observations logged in feedback-log.md (FB-091 through FB-094). Key highlights:
- Care History is a natural companion to Sprint #19 Care Streak — closes the feedback loop for novice users ✅
- Race condition handling in `usePlantCareHistory` prevents stale data from filter switching ✅
- Three cosmetic SPEC-015 deviations (FB-093) are non-blocking backlog items ✅
- Error handling is exemplary — 404 vs 403 distinction doesn't leak cross-user info ✅

### QA Verdict

| Task | Status |
|------|--------|
| T-092 (SPEC-015) | ✅ PASS |
| T-093 (care-history API) | ✅ PASS |
| T-094 (care-history UI) | ✅ PASS |
| T-095 (lodash audit fix) | ✅ PASS |

**ALL SPRINT #20 TASKS PASS QA. Deploy approved. Prior sign-off H-275 confirmed valid.**

---

## Sprint 20 — QA Engineer: Full QA Verification — T-092, T-093, T-094, T-095 (2026-04-05)

**Date:** 2026-04-05
**Agent:** QA Engineer (Sprint #20 — Integration Check)
**Sprint:** #20
**Tasks Verified:** T-092 (SPEC-015), T-093 (care-history API), T-094 (care-history UI), T-095 (lodash audit fix)

---

### Unit Test Results (Test Type: Unit Test)

| Suite | Result | Detail |
|-------|--------|--------|
| Backend | ✅ 142/142 PASS | 15 test suites, ~35s. Includes 12 new tests for T-093 (plantCareHistory.test.js): 5 happy-path + 7 error-path. |
| Frontend | ✅ 205/205 PASS | 29 test files, ~3.1s. Includes 10 new tests for T-094 (CareHistorySection.test.jsx). |

**Backend T-093 test coverage review (plantCareHistory.test.js — 12 tests):**
- Happy-path: paginated response, empty plant (0 items), careType filter, pagination (page 2), notes field (null check) ✅
- Error-path: 401 no auth, 404 non-existent plant, 403 wrong owner, 400 invalid careType, 400 page < 1, 400 limit > 100, 400 invalid UUID ✅
- Verdict: **Exceeds minimum** (12 tests vs 9 required). All status codes and error codes match API contract.

**Frontend T-094 test coverage review (CareHistorySection.test.jsx — 10 tests):**
- Happy-path: renders list with items, renders empty state (generic), renders empty state (filtered), filter tab changes, Load More button, items with notes aria-label, fetchHistory called on mount ✅
- Error-path: error state with retry button, load more error inline ✅
- Loading: renders skeleton with aria-busy="true" ✅
- Verdict: **Exceeds minimum** (10 tests vs 7 required). Covers all UI states: loading, empty (generic + filtered), error, populated, Load More.

---

### Integration Test Results (Test Type: Integration Test)

**API Contract Compliance — `GET /api/v1/plants/:id/care-history`:**

| Check | Result | Notes |
|-------|--------|-------|
| Auth enforcement (JWT) | ✅ PASS | `router.use(authenticate)` at top of careActions.js. 401 returned for missing/invalid token. |
| Plant ownership (403) | ✅ PASS | `Plant.findById` → ownership check `plant.user_id !== req.user.id` → `ForbiddenError`. |
| Plant not found (404) | ✅ PASS | `NotFoundError('Plant')` thrown when `Plant.findById` returns null. |
| Response shape | ✅ PASS | `{ data: { items, total, page, limit, totalPages } }` — matches contract exactly. |
| Item shape | ✅ PASS | `{ id, careType, performedAt, notes }` — aliases (`care_type as careType`, `performed_at as performedAt`, `note as notes`) correct. |
| Ordering | ✅ PASS | `.orderBy('performed_at', 'desc')` — reverse chronological. |
| Pagination defaults | ✅ PASS | Default page=1, limit=20. `totalPages = Math.ceil(total / limit)`. |
| careType validation | ✅ PASS | Validated against `VALID_CARE_TYPES = ['watering', 'fertilizing', 'repotting']`. Returns 400 VALIDATION_ERROR for invalid values. |
| page/limit validation | ✅ PASS | Checks `isNaN`, `< 1`, `> 100`, `Number.isInteger`. Returns 400 VALIDATION_ERROR. |
| UUID validation | ✅ PASS | `validateUUIDParam('id')` middleware applied. Returns 400 for invalid UUID. |
| Empty result (200) | ✅ PASS | Returns `{ items: [], total: 0, totalPages: 0 }` per contract. |
| Parameterized queries | ✅ PASS | Knex query builder: `.where('plant_id', plantId)`, `.andWhere('care_type', careType)` — no string concatenation. |
| Error response format | ✅ PASS | All errors return `{ error: { message, code } }`. No stack traces leaked. |

**Frontend → Backend Integration:**

| Check | Result | Notes |
|-------|--------|-------|
| API method exists | ✅ PASS | `careHistory.get(plantId, params)` in `frontend/src/utils/api.js`. |
| URL construction | ✅ PASS | `/plants/${plantId}/care-history` with URLSearchParams for page/limit/careType. |
| Auth header sent | ✅ PASS | `request()` helper auto-adds `Authorization: Bearer` from stored accessToken. |
| Hook data flow | ✅ PASS | `usePlantCareHistory` manages state: items, total, page, totalPages, filter, isLoading, isLoadingMore, error, loadMoreError. |
| Race condition handling | ✅ PASS | `requestId.current` ref prevents stale responses from overwriting newer data. |
| Load More appends | ✅ PASS | `setItems(prev => [...prev, ...(data.items || [])])` — appends, doesn't replace. |
| Filter reset | ✅ PASS | `changeFilter` → `fetchHistory(careType)` → resets items, page, isLoading. |
| Auto-refresh on 401 | ✅ PASS | `request()` in api.js retries with refreshed token on 401. |

**UI States Verification (SPEC-015):**

| State | Implemented | Notes |
|-------|-------------|-------|
| Loading skeleton | ✅ | `CareHistorySkeleton` with shimmer animation, `aria-busy="true"`. |
| Empty (generic) | ✅ | "No care history yet." + "Go to Overview" CTA. |
| Empty (filtered) | ✅ | "No {Type} history yet." + "Show All" button resets filter. |
| Error state | ✅ | "Couldn't load care history." + "Try Again" retry button. Non-breaking. |
| Populated list | ✅ | Month-grouped items with care type icon, label, relative date. |
| Load More | ✅ | Ghost button, appends items, loading spinner, inline error on failure. |
| End of list | ✅ | "You've seen all care history for this plant." message. |
| Filter pills | ✅ | All/Watering/Fertilizing/Repotting. `aria-pressed`, `role="group"`. |
| Tab bar | ✅ | Overview/History tabs on PlantDetailPage. |
| Accessibility | ✅ | `role="list"`, `role="listitem"`, `aria-label` with absolute date, `aria-expanded` on note toggle, `aria-busy`. |

---

### Config Consistency Check (Test Type: Config Consistency)

| Check | Result | Notes |
|-------|--------|-------|
| Backend PORT vs Vite proxy target | ✅ PASS | Backend `.env` PORT=3000. Vite proxy target: `http://localhost:3000`. Match. |
| SSL consistency | ✅ PASS | Backend has no SSL enabled (development mode). Vite proxy uses `http://` (not `https://`). Consistent. |
| CORS_ORIGIN includes frontend dev server | ✅ PASS | `FRONTEND_URL=http://localhost:5173,http://localhost:5174,http://localhost:4173,http://localhost:4175`. Covers Vite dev (5173), secondary (5174), preview (4173, 4175). |
| Docker compose ports | ✅ PASS | PostgreSQL exposed on 5432 (dev) and 5433 (test). Backend `.env` DATABASE_URL uses 5432, TEST_DATABASE_URL uses 5432 (local direct, not Docker test container). Documented discrepancy in `.env.example` comments — not a mismatch, intentional for local dev vs Docker. |

**No config consistency issues found.**

---

### Security Scan Results (Test Type: Security Scan)

**Authentication & Authorization:**
- [x] All API endpoints require authentication — `router.use(authenticate)` applied globally to plants and care-actions routes. ✅
- [x] Auth tokens have expiration (15m access, 7d refresh) — configured in `.env`. ✅
- [x] Password hashing uses bcrypt — confirmed dependency. ✅
- [x] Failed login rate-limited — `authLimiter` applied to auth routes. ✅

**Input Validation & Injection Prevention:**
- [x] SQL queries use parameterized statements — Knex query builder throughout (`CareAction.findPaginatedByPlant`). No string concatenation. ✅
- [x] User inputs validated server-side — page/limit/careType validated in route handler; UUID validated by middleware. ✅
- [x] HTML output sanitized (XSS) — No `dangerouslySetInnerHTML` in application code. Notes rendered as plain text via React default escaping. ✅
- [x] File uploads validated — multer with size limit. ✅

**API Security:**
- [x] CORS configured for expected origins — comma-separated allowlist parsed from `FRONTEND_URL` env var. Rejects unknown origins. ✅
- [x] Rate limiting applied — `generalLimiter` and `authLimiter` on public-facing endpoints. ✅
- [x] Error responses do not leak internals — errorHandler.js: unknown errors return generic "An unexpected error occurred." with code INTERNAL_ERROR. No stack traces. ✅
- [x] Security headers — Helmet.js applied (`app.use(helmet())`). ✅

**Data Protection:**
- [x] Credentials in environment variables — `.env` file, not tracked in git (`.gitignore` excludes `.env`). ✅
- [x] `.env` not committed — confirmed `git ls-files --error-unmatch backend/.env` returns "NOT TRACKED". ✅

**Dependency Audit:**
- [x] `npm audit` (backend): 0 vulnerabilities ✅ (T-095 resolved lodash advisory)
- [x] `npm audit` (frontend): 0 vulnerabilities ✅

**Security Verdict: ALL CHECKS PASS. No P1 security issues.**

**Note:** The `GEMINI_API_KEY` in `backend/.env` contains what appears to be a real API key. This is acceptable for local development (`.env` is gitignored), but should be rotated before any production deployment. The `.env.example` correctly shows a placeholder value.

---

### Product-Perspective Testing Notes

See `.workflow/feedback-log.md` for detailed observations (FB-091 through FB-094).

---

### QA Verdict

| Task | Status | Decision |
|------|--------|----------|
| T-092 (SPEC-015) | ✅ PASS | Spec is comprehensive: entry point, list layout, pagination, empty states, filter, dark mode, accessibility all covered. |
| T-093 (care-history API) | ✅ PASS | 12 tests, all pass. API contract fully matched. Security checks pass. Parameterized queries. |
| T-094 (care-history UI) | ✅ PASS | 10 tests, all pass. SPEC-015 compliant. All states implemented. Accessibility excellent. |
| T-095 (lodash audit fix) | ✅ PASS | 0 vulnerabilities in both backend and frontend. All tests pass post-upgrade. |

**Overall: ALL SPRINT #20 TASKS PASS QA.** Ready for staging deploy.

---

## Sprint 20 — Deploy Engineer: Pre-Deploy Gate Check + Test Fix (2026-04-05)

**Date:** 2026-04-05
**Agent:** Deploy Engineer (Sprint #20 — pre-deploy gate check)
**Git SHA:** 5fb8470be8aa929691da02c2406763124624a659 (checkpoint: sprint #20 — phase 'contracts' complete; Sprint #20 implementation uncommitted in working tree)
**QA Sign-Off:** ❌ MISSING — No Sprint #20 QA → Deploy Engineer handoff found in handoff-log.md
**Environment:** Staging (localhost) — deploy BLOCKED
**Status:** ⛔ BLOCKED — All technical checks PASS; awaiting Manager code review + QA sign-off

### Gate Check Results (Final — after test fix)

| Check | Result | Detail |
|-------|--------|--------|
| Backend tests | ✅ 142/142 PASS | 15 test suites, 35.43s (T-093 adds 12 new tests) |
| Frontend tests | ✅ 205/205 PASS | 29 test files, 3.03s (T-094 adds 10 new tests; 1 test fixed by Deploy Engineer — see below) |
| Frontend production build | ✅ PASS | 4643 modules, 314ms, 0 errors |
| DB migrations | ✅ PASS | 5/5 complete, 0 pending (no new migrations for Sprint #20) |
| Backend health check | ✅ PASS | `GET /api/health` → 200 OK `{"status":"ok"}` |
| npm audit — backend | ✅ 0 vulnerabilities | T-095 resolved lodash vulnerability |
| npm audit — frontend | ✅ 0 vulnerabilities | Already clean; T-095 confirmed |
| QA sign-off in handoff-log.md | ❌ MISSING | Last QA sign-off is H-265 (Sprint #19). No Sprint #20 sign-off. |

### Test Fix Applied by Deploy Engineer

**Failing test:** `CareHistorySection.test.jsx > filter tab changes trigger changeFilter`
**Root cause:** `MOCK_ITEMS` includes two `watering` items, putting multiple "Watering" text nodes on screen. `screen.getByRole('button', { name: 'Watering' })` became ambiguous with the `<span class="ch-item-label">Watering</span>` in list items.
**Fix applied:** Added `within` import; scoped button query to the filter group (`getByRole('group', { name: /Filter care history by type/ })`) before querying for the "Watering" pill button. This is the correct Testing Library pattern when multiple same-text elements exist on the page.
**Fix location:** `frontend/src/__tests__/CareHistorySection.test.jsx` — lines 1 and 132–133
**Result:** 205/205 frontend tests now pass cleanly.

### Sprint #20 Task Status at Gate Check

| Task | Assigned To | Status | Notes |
|------|------------|--------|-------|
| T-092 | Design Agent | In Review | SPEC-015 published per H-268 |
| T-093 | Backend Engineer | In Review | 12 new backend tests; 142/142 pass |
| T-094 | Frontend Engineer | In Review | 10 new frontend tests; 205/205 pass (after test fix) |
| T-095 | Backend Engineer | In Review | `npm audit` — 0 vulnerabilities in both packages |

### Conclusion

**All Sprint #20 tasks are In Review.** All technical checks pass. The codebase is clean and ready for staging deploy the moment QA sign-off is received. Handoff H-271 sent to QA Engineer.

---

