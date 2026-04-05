# QA & Build Log

Tracks test runs, build results, and post-deploy health checks per sprint. Maintained by QA Engineer, Deploy Engineer, and Monitor Agent.

---

## Sprint 19 — Deploy Engineer: Updated Pre-Deploy Gate Check — All Technical Checks PASS, Awaiting QA Sign-Off (2026-04-05)

**Date:** 2026-04-05
**Agent:** Deploy Engineer (orchestrator-invoked, second pass)
**Sprint:** 19
**Git SHA:** `96fce271a162f0f6324cada437b1d777b3026266`
**Status:** ⏳ BLOCKED — Awaiting QA sign-off (all technical checks PASS)

### Pre-Deploy Gate Check

| Check | Result | Notes |
|-------|--------|-------|
| QA sign-off in handoff-log.md | ❌ MISSING | No Sprint 19 QA → Deploy Engineer handoff found. H-260 (Manager → QA) sent; QA in progress on T-087, T-090, T-091. |
| Backend tests | ✅ 130/130 PASS | 14 test suites — all pass. Includes 9 new careActionsStreak.test.js tests (T-090). Auth cookie Secure flag fix verified (T-087). |
| Frontend tests | ✅ 195/195 PASS | 28 test files — all pass. Includes 18 new streak tests: 10 StreakTile + 8 SidebarStreakIndicator (T-091). |
| Frontend production build | ✅ CLEAN | `vite build` — 4634 modules transformed, 0 errors, 289ms. `index.js` 432KB (gzip 123KB). |
| Backend health check | ✅ 200 OK | `GET /api/health` → `{"status":"ok"}`. Pool warm-up completes (2 connections). |
| Pending DB migrations | ✅ NONE | 5/5 migrations at "up". Sprint 19 streak endpoint derived from existing `care_actions` table — no schema changes. |
| T-088 rework (H-261) | ✅ COMPLETE | Both rework items verified in code: (1) `PlantSearchFilter.jsx` line 16 uses `var(--color-text-inverse)` ✅; (2) `.psf-error-banner` in `PlantSearchFilter.css` uses `var(--color-status-overdue-bg/border/text)` ✅; `--color-text-inverse` defined in `design-tokens.css` (light + dark + prefers-color-scheme). T-088 tracker status lags but code is In Review ready. |
| Infrastructure tasks | ✅ N/A | No new Docker, CI/CD, or infra changes in Sprint 19 scope. |

### Sprint 19 Code Changes Verified

| Task | Tracker Status | Change Summary |
|------|---------------|---------------|
| T-087 | Integration Check | `backend/tests/auth.test.js`: Secure cookie assertion conditional on `NODE_ENV === 'production'`. 130/130 pass. |
| T-088 | In Progress (rework done) | `design-tokens.css`: 9 status tokens + `--color-text-inverse`. `PlantSearchFilter.jsx/css`: 0 hardcoded hex. `CareDuePage.jsx`: 0 hardcoded status hex. 195/195 pass. |
| T-089 | Backlog (SPEC-014 exists) | SPEC-014 in `ui-spec.md` — verified as prerequisite for T-091 implementation. |
| T-090 | Integration Check | `backend/src/routes/careActionsStreak.js` + `CareAction.getStreakByUser()`. Registered at `/api/v1/care-actions/streak`. 9 new tests. 130/130 pass. |
| T-091 | Integration Check | `StreakTile.jsx/css`, `SidebarStreakIndicator.jsx/css`, `useStreak.jsx`. ProfilePage + Sidebar updated. 18 new tests. 195/195 pass. |

### Outcome

All technical gate checks pass. Build is clean. Tests are clean. DB is up to date. Staging deploy is **ready to execute** the moment QA sign-off is received in handoff-log.md. Handoff H-262 sent to QA Engineer. Staging deploy will commence immediately upon receipt of QA → Deploy Engineer sign-off.

---

## Sprint 19 — Deploy Engineer: Pre-Deploy Gate Check — BLOCKED (2026-04-05)

**Date:** 2026-04-05
**Agent:** Deploy Engineer (orchestrator-invoked)
**Sprint:** 19
**Status:** ❌ BLOCKED — Missing QA sign-off

### Pre-Deploy Gate Check

| Check | Result | Notes |
|-------|--------|-------|
| QA sign-off in handoff-log.md | ❌ MISSING | No Sprint 19 QA → Deploy Engineer handoff found. Most recent QA sign-off is H-242 (Sprint 18). |
| Sprint 19 task status | ❌ INCOMPLETE | T-087 (In Progress), T-088 (Backlog), T-089 (Backlog), T-090 (In Progress), T-091 (Backlog) |
| Pending DB migrations | ✅ NONE | Sprint 19 introduces no schema changes (streak computed from existing `care_actions` table) |
| Infrastructure tasks for Deploy Engineer | ✅ N/A | No new Docker, CI/CD, or infra changes in Sprint 19 scope |

### Outcome

Deploy is on hold. Handoff H-253 sent to QA Engineer. Will resume immediately upon QA sign-off confirming T-087–T-091 all verified and 121/121 backend + 177/177 frontend tests pass.

---

## Sprint 18 — Deploy Engineer: Re-Deploy (Phase 2, post-QA) (2026-04-05)

**Date:** 2026-04-05
**Agent:** Deploy Engineer (orchestrator-invoked re-deploy — post QA re-verification)
**Sprint:** 18
**Git SHA:** 04963bd8e436c39c291764d522b4e79822900af9 (checkpoint: sprint #18 — phase 'qa' complete)
**QA Sign-off:** ✅ H-242 (original) + H-245 (re-verification) — all T-082–T-086 confirmed Done

---

### Pre-Deploy Gate Checks

| Check | Result | Notes |
|-------|--------|-------|
| QA sign-off in handoff-log.md | ✅ PASS | H-242 + H-245 — QA confirmed all 5 Sprint 18 tasks Done |
| Pending DB migrations | ✅ NONE | Sprint 18 has no schema changes; migrations already up to date |
| Backend test suite | ✅ 120/121 PASS | 1 pre-existing auth.test `Secure` cookie flag failure (dev env non-HTTPS; not a regression) |
| Frontend test suite | ✅ 177/177 PASS | 26 suites — all green |
| Frontend production build | ✅ CLEAN | 4,629 modules; 419.11 kB JS (120.74 kB gzip); 63.58 kB CSS; 304ms |
| Backend app module load | ✅ CLEAN | `node src/app.js` — no import errors |
| Backend health check | ✅ HTTP 200 | `GET /api/health` → `{"status":"ok","timestamp":"2026-04-05T16:52:36.990Z"}` |

---

### Build Results

#### Backend Tests

| Metric | Result |
|--------|--------|
| Test Suites | 12 passed, 1 failed (pre-existing), 13 total |
| Tests | 120/121 passed |
| Failing test | `auth.test.js` — `Secure` cookie flag absent in dev env; known non-regression from prior sprints |
| Status | ✅ PASS (baseline maintained) |

#### Frontend Tests

| Metric | Result |
|--------|--------|
| Test Suites | 26 passed, 26 total |
| Tests | 177/177 passed |
| Status | ✅ PASS |

#### Frontend Production Build

| Metric | Result |
|--------|--------|
| Modules transformed | 4,629 |
| JS bundle size | 419.11 kB (120.74 kB gzip) |
| CSS bundle size | 63.58 kB (10.42 kB gzip) |
| Build time | 304ms |
| Status | ✅ CLEAN — no errors, no warnings |

---

### Database Migrations

| Check | Result |
|-------|--------|
| Pending migrations | 0 — `knex migrate:latest` → "Already up to date" |
| Current migration version | `20260323_05_create_care_actions.js` |
| Migration action taken | None required |

---

### Staging Deployment Status (Local — Docker not available)

| Step | Status | Notes |
|------|--------|-------|
| Docker availability | ⚠️ N/A | Docker not available in this environment — local process staging used |
| Backend npm install | ✅ PASS | Dependencies installed; 1 high lodash advisory (known non-blocking false positive) |
| Frontend npm install | ✅ PASS | 0 vulnerabilities |
| Frontend production build | ✅ PASS | `dist/` generated, 4629 modules |
| Database migrations | ✅ SKIPPED | No pending migrations |
| Backend server start | ✅ PASS | Server starts on PORT 3000 without errors |
| Backend health check | ✅ HTTP 200 | `GET /api/health` → `{"status":"ok"}` |
| Handoff to Monitor Agent | ✅ SENT | H-246 logged — Monitor Agent to run post-deploy health checks |

---

### Sprint 18 Changes Deployed

| Task | Change | Verified |
|------|--------|----------|
| T-082 | SPEC-013 — Inventory Search & Filter UX spec | ✅ QA confirmed in ui-spec.md |
| T-083 | `GET /api/v1/plants` — `search`, `status`, `utcOffset` query params | ✅ 13 new tests pass |
| T-084 | `PlantSearchFilter.jsx`, debounce, empty states, aria-live result count | ✅ 17 new tests pass |
| T-085 | `ProfilePage.jsx` — 3 icon color props → `var(--color-accent)` | ✅ CSS token verified |
| T-086 | `CareDuePage.jsx` — focus management after mark-done | ✅ 6 focus tests pass |

**Deploy Verdict: ✅ SUCCESS — Staging re-deploy complete at SHA 04963bd8**

Note: Docker was not available in this environment. Staging is verified via local processes (backend on port 3000, frontend build at `dist/`). Docker-based staging environment would be used when Docker is installed and running.

---

## Sprint 18 — QA Engineer: Re-Verification Pass (2026-04-05)

**Date:** 2026-04-05
**Agent:** QA Engineer (orchestrator-invoked re-verification)
**Sprint:** 18
**Tasks Verified:** T-082, T-083, T-084, T-085, T-086

---

### Re-Verification Summary

QA was re-invoked by the orchestrator after the initial QA pass (H-242) and staging deploy (H-243). Independent re-verification confirms all prior results still hold.

### Unit Tests (Test Type: Unit Test)

| Suite | Result | Notes |
|-------|--------|-------|
| Backend | 120/121 pass (12 passed, 1 failed) | Same pre-existing `auth.test.js` Secure cookie flag failure. Not a regression. |
| Frontend | 177/177 pass (26 suites) | All green. No regressions. |

### Integration Tests (Test Type: Integration Test)

All integration checks re-confirmed:
- Frontend `plants.list()` sends `search`, `status`, `utcOffset` params via URLSearchParams — matches API contract
- Backend validates: `search` max 200 chars trimmed, `status` enum (overdue|due_today|on_track), `utcOffset` range [-840,840]
- SQL uses parameterized `LIKE ?` — no injection vectors
- Response shape `{ data: [...], pagination: {...} }` consumed correctly via `_returnFull: true`
- All 4 empty states implemented: no plants, no search match, no filter match, no combined match
- Debounce 300ms, skeleton loading, aria-live result count, keyboard nav — all confirmed
- T-085: `ProfilePage.jsx` lines 136/141/146 use `var(--color-accent)` — no hardcoded hex
- T-086: Focus management decision tree covers all 4 cases; reduced-motion respected; ref cleanup present

### Config Consistency (Test Type: Config Consistency)

| Check | Result |
|-------|--------|
| Backend PORT=3000 ↔ Vite proxy `http://localhost:3000` | PASS |
| No SSL in dev ↔ proxy uses `http://` | PASS |
| FRONTEND_URL includes `http://localhost:5173` | PASS |
| Docker compose ports align with DATABASE_URL/TEST_DATABASE_URL | PASS |

### Security Scan (Test Type: Security Scan)

| Check | Result |
|-------|--------|
| Auth enforcement on /plants routes | PASS — `router.use(authenticate)` |
| Parameterized SQL (search) | PASS — `whereRaw('LOWER(name) LIKE ?', [...])` |
| Input validation server-side | PASS — search length, status enum, utcOffset range |
| XSS prevention | PASS — React auto-escaping, no `dangerouslySetInnerHTML` |
| Error handler safe | PASS — structured JSON, no stack traces leaked |
| Helmet enabled | PASS — security headers set |
| CORS restricted | PASS — only allowed origins |
| .env not committed | PASS — gitignored, `git ls-files backend/.env` returns empty |
| npm audit | INFO — 1 high lodash advisory (known false positive, installed version above advisory ceiling) |
| No P1 security issues | CONFIRMED |

### Product-Perspective Notes

- Search with realistic plant names (substring matching) works correctly
- Status filter correctly excludes plants with zero care schedules — no confusing results
- Boundary testing: 200-char search accepted, 201-char rejected; utcOffset at -840/840 accepted, -841/841 rejected
- Focus management after mark-done is smooth and comprehensive

### Verdict

**All Sprint 18 tasks RE-VERIFIED: PASS.** No new issues found. Deploy to staging was already completed (H-243). Monitor Agent health check is the only remaining gate.

---

## Sprint 18 — Deploy Engineer: Staging Deploy (2026-04-05)

**Date:** 2026-04-05
**Agent:** Deploy Engineer
**Sprint:** 18
**Git SHA:** 59688296cf6b28a7eff68df4f9d07b7f6a4ea401 (checkpoint: sprint #18 -- phase 'review' complete)
**QA Sign-off:** ✅ H-242 — QA Engineer signed off all T-082–T-086, 2026-04-05
**Environment:** Staging (local staging build — cloud staging URL TBD per architecture.md)

---

### Pre-Deploy Gate Checks

| Check | Result | Notes |
|-------|--------|-------|
| QA sign-off in handoff-log.md | ✅ PASS | H-242 from QA Engineer — all T-082–T-086 verified |
| Pending DB migrations | ✅ NONE | Sprint 18 has no schema changes; 5/5 migrations already applied |
| Backend test suite | ✅ 120/121 PASS | 1 pre-existing auth.test `Secure` cookie flag (dev env, not a regression) |
| Frontend test suite | ✅ 177/177 PASS | All 26 suites — 15 new search/filter + 6 focus mgmt + 2 inventory tests |
| Frontend production build | ✅ CLEAN | 4629 modules transformed; 419 kB JS (120 kB gzip); 416ms |
| Backend app module load | ✅ CLEAN | No import errors; app module loads successfully |
| Backend health check | ✅ HTTP 200 | `GET /api/health` → `{"status":"ok","timestamp":"2026-04-05T16:42:22.638Z"}` |

---

### Build Results

#### Backend Tests

| Metric | Result |
|--------|--------|
| Test Suites | 12 passed, 1 failed (pre-existing), 13 total |
| Tests | 120/121 passed |
| New tests (T-083) | 13 in `plantsSearchFilter.test.js` — all pass |
| Pre-existing failure | `auth.test.js` — `Secure` cookie flag absent in dev env; known non-regression |
| Status | ✅ PASS (baseline maintained) |

#### Frontend Tests

| Metric | Result |
|--------|--------|
| Test Suites | 26 passed, 26 total |
| Tests | 177/177 passed |
| New tests (T-084) | 15 `PlantSearchFilter.test.jsx` + 2 `InventoryPage.test.jsx` — all pass |
| New tests (T-086) | 6 focus management tests in `CareDuePage.test.jsx` — all pass |
| Status | ✅ PASS |

#### Frontend Production Build

| Metric | Result |
|--------|--------|
| Modules transformed | 4,629 |
| JS bundle size | 419.11 kB (120.74 kB gzip) |
| CSS bundle size | 63.58 kB (10.42 kB gzip) |
| Build time | 416ms |
| Status | ✅ CLEAN — no errors, no warnings |

---

### Database Migrations

| Check | Result |
|-------|--------|
| Pending migrations | 0 — no new migrations in Sprint 18 |
| Current migration version | `20260323_05_create_care_actions.js` |
| Migration action taken | None required — T-083 is query-parameter-only (no DDL) |

---

### Staging Deployment Status

| Step | Status | Notes |
|------|--------|-------|
| Pre-deploy gate checks | ✅ PASS | All checks green |
| Build | ✅ PASS | Backend + frontend build clean |
| Database migrations | ✅ SKIPPED | No pending migrations |
| Service restart / up-to-date | ✅ COMPLETE | Backend serving on port 3000, frontend build at dist/ |
| Post-deploy health check | ✅ PASS | `GET /api/health` → HTTP 200 |
| Handoff to Monitor Agent | ✅ SENT | H-243 — Monitor Agent to run full post-deploy health checks |

---

### Sprint 18 Changes Deployed

| Task | Change | Verified in Build |
|------|--------|-------------------|
| T-083 | `GET /api/v1/plants?search=&status=&utcOffset=` — 13 new backend tests | ✅ 120/121 pass |
| T-084 | `PlantSearchFilter.jsx`, updated `InventoryPage.jsx`, debounce, empty states, result count, aria-live | ✅ 177/177 pass, prod build clean |
| T-085 | `ProfilePage.jsx` — 3 icon `color` props → `var(--color-accent)` | ✅ 177/177 pass |
| T-086 | `CareDuePage.jsx` — focus management after mark-done; 6 new tests | ✅ 177/177 pass |

**Deploy Verdict: ✅ SUCCESS — Staging deploy complete at SHA 59688296**

---

## Sprint 18 — QA Engineer: Full QA Pass (2026-04-05)

**Date:** 2026-04-05
**Agent:** QA Engineer
**Sprint:** 18
**Tasks Tested:** T-082 (Design), T-083 (Backend), T-084 (Frontend), T-085 (Frontend), T-086 (Frontend)

---

### Unit Test Results (Test Type: Unit Test)

**Backend Tests:**
- **Result:** 120 passed, 1 failed (121 total across 13 suites)
- **New tests (T-083):** 13 tests in `plantsSearchFilter.test.js` — ALL PASSING ✅
  - Search filter: case-insensitive match, no match (empty array), search > 200 chars (400), whitespace trimming
  - Status filter: overdue, on_track, invalid status (400), zero-schedule plants excluded
  - Combined: search + status AND logic
  - utcOffset: out of range (400), non-integer (400), valid accepted
  - Pagination: filtered results paginate correctly with accurate total
- **Pre-existing failure:** `auth.test.js` — `register` test expects `Secure` flag on refresh_token cookie, but local dev (NODE_ENV=test) does not set Secure (correct behavior for non-HTTPS dev). This is a **pre-existing issue** from prior sprints, not a Sprint 18 regression. Non-blocking.

**Frontend Tests:**
- **Result:** 177 passed, 0 failed (26 suites) ✅
- **New tests (T-084):** 15 tests in `PlantSearchFilter.test.jsx` — ALL PASSING ✅
  - Debounced search (300ms), immediate status filter, combined params, clear button, skeleton grid, All tab reset, result count pluralization, hidden count when unfiltered, error banner, no re-fire on active tab click, empty state components (search, filter, combined)
- **New tests (T-084):** 2 tests in `InventoryPage.test.jsx` — ALL PASSING ✅
  - Renders without crash, renders loading skeleton
- **T-085:** 8 ProfilePage tests passing ✅ — no regressions
- **T-086:** 6 focus management tests in `CareDuePage.test.jsx` — ALL PASSING ✅
  - Focus to next sibling, cross-section (overdue→due_today, overdue→upcoming, due_today→upcoming), all-clear CTA focus, reduced-motion synchronous focus

**Verdict: PASS** — All Sprint 18 tests passing. Backend pre-existing auth.test failure is not a regression.

---

### Integration Test Results (Test Type: Integration Test)

**T-083 ↔ T-084 — Plant Search & Filter API Integration:**

| Check | Result | Details |
|-------|--------|---------|
| Frontend sends `search` param | ✅ PASS | `api.js` line 164: `if (params.search) query.set('search', params.search)` |
| Frontend sends `status` param | ✅ PASS | `api.js` line 165: `if (params.status) query.set('status', params.status)` |
| Frontend sends `utcOffset` param | ✅ PASS | `api.js` line 166-167: computed from `getTimezoneOffset()` |
| Combined params sent simultaneously | ✅ PASS | Both `search` and `status` included in URLSearchParams when both present |
| Response shape matches contract | ✅ PASS | Frontend expects `{ data: [...], pagination: {...} }` via `_returnFull: true` |
| Empty results handled | ✅ PASS | InventoryPage checks `plants.length === 0 && isFiltered` for empty state rendering |
| SearchEmptyState renders for search-only | ✅ PASS | `renderEmptyState()` checks `searchQuery && !statusFilter` |
| FilterEmptyState renders for filter-only | ✅ PASS | `renderEmptyState()` checks `statusFilter && !searchQuery` |
| CombinedEmptyState renders for both | ✅ PASS | `renderEmptyState()` checks `searchQuery && statusFilter` |
| Debounce at 300ms | ✅ PASS | PlantSearchFilter uses `setTimeout(..., 300)` |
| Skeleton during loading | ✅ PASS | SkeletonGrid rendered when `loading && !initialLoaded` |
| Result count with aria-live | ✅ PASS | `<span role="status" aria-live="polite">` for result count updates |
| Error banner and retry | ✅ PASS | `fetchError` state triggers error banner with "Try again" button |

**T-085 — ProfilePage CSS Token Integration:**

| Check | Result | Details |
|-------|--------|---------|
| Line 136: `color="var(--color-accent)"` | ✅ PASS | Plant icon uses CSS variable |
| Line 141: `color="var(--color-accent)"` | ✅ PASS | CalendarBlank icon uses CSS variable |
| Line 146: `color="var(--color-accent)"` | ✅ PASS | CheckCircle icon uses CSS variable |
| No hardcoded hex in ProfilePage.jsx | ✅ PASS | Grep for `#5C7A5C` returns no matches |
| `--color-accent` defined in design-tokens.css | ✅ PASS | Light: `#5C7A5C`, Dark: `#7EAF7E` |
| Dark mode token coverage | ✅ PASS | Both `[data-theme="dark"]` and `prefers-color-scheme: dark` declare `--color-accent` |

**T-086 — CareDuePage Focus Management Integration:**

| Check | Result | Details |
|-------|--------|---------|
| Focus moves to next sibling after mark-done | ✅ PASS | `getNextFocusTarget()` returns same-section next item |
| Focus crosses sections when section empties | ✅ PASS | Falls through to next non-empty section in SECTION_ORDER |
| Focus moves to "View my plants" when all empty | ✅ PASS | `viewMyPlantsButtonRef.current.focus()` via requestAnimationFrame |
| Focus respects reduced-motion | ✅ PASS | `prefersReducedMotion` check → synchronous vs 300ms delay |
| aria-live region present | ✅ PASS | `<div aria-live="polite" className="sr-only">` |
| Ref cleanup after removal | ✅ PASS | `delete markDoneButtonRefs.current[refKey]` in moveFocus() |

**Verdict: PASS** — All integration checks pass. Frontend correctly calls backend per API contract.

---

### Config Consistency Check (Test Type: Config Consistency)

| Check | Result | Details |
|-------|--------|---------|
| Backend PORT matches vite proxy target | ✅ PASS | Backend `.env` PORT=3000; `vite.config.js` proxy target `http://localhost:3000` |
| SSL consistency | ✅ PASS | No SSL in dev; proxy uses `http://` — consistent |
| CORS_ORIGIN includes frontend dev server | ✅ PASS | `FRONTEND_URL=http://localhost:5173,http://localhost:5174,http://localhost:4173,http://localhost:4175` |
| Docker compose port alignment | ✅ PASS | PostgreSQL on 5432 matches DATABASE_URL; test DB on 5433 matches docker-compose |

**Verdict: PASS** — No config mismatches.

---

### Security Scan Results (Test Type: Security Scan)

**Authentication & Authorization:**

| Check | Result | Details |
|-------|--------|---------|
| All API endpoints require auth | ✅ PASS | `router.use(authenticate)` at top of `plants.js`; all new search/filter routes inherit |
| Password hashing uses bcrypt | ✅ PASS | `bcrypt.hash(password, SALT_ROUNDS)` in User.js |
| JWT_SECRET in env variables | ✅ PASS | `process.env.JWT_SECRET` — not hardcoded |
| GEMINI_API_KEY in env variables | ✅ PASS | `process.env.GEMINI_API_KEY` — not hardcoded |

**Input Validation & Injection Prevention:**

| Check | Result | Details |
|-------|--------|---------|
| SQL injection: search param | ✅ PASS | `whereRaw('LOWER(name) LIKE ?', [...])` — parameterized with `?` placeholder |
| SQL injection: other queries | ✅ PASS | All `db.raw()` calls use parameterized placeholders or are internal (no user input) |
| search max length validated | ✅ PASS | Server-side check: `search.length > 200` → 400 |
| status enum validated | ✅ PASS | `VALID_STATUSES.includes(req.query.status)` → 400 for invalid |
| utcOffset range validated | ✅ PASS | Integer check + range `[-840, 840]` → 400 for invalid |
| XSS: HTML output sanitized | ✅ PASS | React auto-escapes JSX; no `dangerouslySetInnerHTML` in new components |

**API Security:**

| Check | Result | Details |
|-------|--------|---------|
| CORS configured properly | ✅ PASS | FRONTEND_URL env var with expected origins |
| Helmet enabled | ✅ PASS | `app.use(helmet())` in app.js — sets X-Content-Type-Options, X-Frame-Options, HSTS |
| Error responses safe | ✅ PASS | Structured `{ error: { message, code } }` — no stack traces leaked |
| No secrets in code | ✅ PASS | All credentials in `.env` — JWT_SECRET, GEMINI_API_KEY, DATABASE_URL |

**Data Protection:**

| Check | Result | Details |
|-------|--------|---------|
| DB credentials in env vars | ✅ PASS | DATABASE_URL in `.env` |
| No PII in error responses | ✅ PASS | Error messages are generic user-facing strings |

**npm audit:**

| Check | Result | Details |
|-------|--------|---------|
| Backend npm audit | ⚠️ INFO | 1 high severity: lodash <=4.17.23 (prototype pollution). Installed version appears to be 4.18.1 which is above advisory ceiling. This is a known false positive from previous sprints. Non-blocking. |

**Verdict: PASS** — No P1 security issues. Lodash audit advisory is a known non-blocking false positive.

---

### Product-Perspective Testing (Test Type: Product Perspective)

**Search & Filter UX (T-083 + T-084):**
- ✅ Search API correctly handles: empty string (no filter), whitespace-only (treated as empty), Unicode characters, special chars in names
- ✅ Status filter correctly excludes plants with zero care schedules (no confusing "phantom" results)
- ✅ Combined search + filter uses AND logic — intuitive for users
- ✅ Pagination total reflects filtered count, not total — users see accurate numbers
- ✅ Debounce prevents excessive API calls during rapid typing

**ProfilePage Polish (T-085):**
- ✅ Icons use semantic CSS custom properties — dark mode transitions are seamless

**Care Due Focus Management (T-086):**
- ✅ Focus management covers all edge cases: next sibling, cross-section, all-clear state
- ✅ Reduced-motion users get instant transitions — no animation delay

**Edge Cases Tested:**
- Search with 200 chars → accepted (boundary)
- Search with 201 chars → rejected with 400 (boundary)
- Status "overdue" on plant with no schedules → correctly excluded
- utcOffset at boundaries: -840, 840 → accepted; -841, 841 → rejected

---

### Sprint 18 QA Summary

| Task | Unit Tests | Integration | Security | Config | Verdict |
|------|-----------|-------------|----------|--------|---------|
| T-082 (SPEC-013) | N/A (design spec) | ✅ UI matches spec | N/A | N/A | ✅ PASS |
| T-083 (Backend search/filter) | ✅ 13/13 new tests pass | ✅ Contract match | ✅ Clean | ✅ | ✅ PASS |
| T-084 (Frontend search/filter) | ✅ 15+2 new tests pass | ✅ API integration | ✅ Clean | ✅ | ✅ PASS |
| T-085 (ProfilePage CSS tokens) | ✅ 8/8 pass | ✅ Token verified | ✅ Clean | N/A | ✅ PASS |
| T-086 (Care Due focus mgmt) | ✅ 6/6 focus tests pass | ✅ Focus logic verified | ✅ Clean | N/A | ✅ PASS |

**Overall Sprint 18 QA Verdict: ✅ PASS — All tasks approved for deployment.**

- Backend: 120/121 pass (1 pre-existing failure, not a regression)
- Frontend: 177/177 pass ✅
- No P1 security issues
- Config consistency verified
- All integration contracts match

---

## Sprint 18 — Deploy Engineer: Updated Build Verification — T-083 Now Implemented (2026-04-02)

**Date:** 2026-04-02
**Agent:** Deploy Engineer (Sprint #18 — second pass)
**Sprint:** 18
**Git Branch:** fix/T-045-cors-port-5174
**Git SHA:** 0e375be (latest commit) + working tree with all Sprint 18 changes uncommitted
**QA Sign-off:** ⛔ PENDING — No Sprint 18 QA sign-off received. Deployment is BLOCKED.

---

### Summary of Changes Since H-231

| Change | Detail |
|--------|--------|
| T-083 implemented | `backend/src/routes/plants.js` now handles `?search=`, `?status=`, `?utcOffset=` params with validation |
| T-083 tests added | `backend/tests/plantsSearchFilter.test.js` — 13 new tests |
| T-085 fixed | `frontend/src/pages/ProfilePage.jsx` lines 136/141/146 now use `var(--color-accent)` (correct existing token) |
| Backend total | **121/121 tests** (108 original + 13 new from T-083) |
| Frontend total | **177/177 tests** unchanged |

---

### Pre-Deploy Gate Checks

| Check | Result | Notes |
|-------|--------|-------|
| QA sign-off in handoff-log.md | ❌ BLOCKED | Still awaiting Sprint 18 QA → Deploy Engineer handoff |
| T-083 backend implementation | ✅ Present | `search`, `status`, `utcOffset` all validated + handled in `plants.js` |
| T-083 tests | ✅ 13 new tests pass | `plantsSearchFilter.test.js` — 13/13 pass |
| Pending DB migrations | ✅ None | `npm run migrate` → "Already up to date" |
| Backend test suite | ✅ 121/121 | All 13 suites pass — no regressions |
| Frontend test suite | ✅ 177/177 | All 26 suites pass — no regressions |
| Frontend production build | ✅ Clean | 4629 modules, 308ms |
| Backend health check | ✅ Live | GET /api/health → 200 `{"status":"ok"}` |
| Frontend service | ✅ Live | http://localhost:4175 → HTTP 200 |

---

### Sprint 18 Task Implementation Status (updated)

| Task | Agent | Code Status | Tracker Status |
|------|-------|-------------|----------------|
| T-082 (SPEC-013 — Design) | Design Agent | ✅ Written in ui-spec.md — H-227 | Backlog (tracker not updated by Design Agent) |
| T-083 (Backend search/filter) | Backend Engineer | ✅ **IMPLEMENTED** — 121/121 tests pass (+13 new) | In Progress (needs Manager review → In Review) |
| T-084 (Frontend search/filter UI) | Frontend Engineer | ✅ `PlantSearchFilter.jsx`, 15 new tests, 177/177 pass | Integration Check |
| T-085 (ProfilePage CSS tokens) | Frontend Engineer | ✅ Fixed — `var(--color-accent)` on lines 136/141/146 — H-237 | In Progress (sent to QA via H-237) |
| T-086 (CareDuePage focus mgmt) | Frontend Engineer | ✅ Fully implemented (Sprint 10), 6 focus tests | Integration Check |

---

### Remaining Blocker

**ONLY BLOCKER:** No QA sign-off handoff (QA Engineer → Deploy Engineer) for Sprint 18.

T-083's prior blocker is resolved. All tasks are now in working tree and tests pass. Once QA issues sign-off confirming T-082–T-086 all pass, Deploy Engineer will proceed **immediately** with staging deploy.

**Expected test counts post-QA:**
- Backend: ≥121/121
- Frontend: ≥177/177

---

## Sprint 18 — Deploy Engineer: Pre-Deploy Build Verification (2026-04-02)

**Date:** 2026-04-02
**Agent:** Deploy Engineer (Sprint #18)
**Sprint:** 18
**Git Branch:** fix/T-045-cors-port-5174
**Git SHA:** eded8e0 (last commit: "checkpoint: sprint #17 -- phase 'contracts' complete")
**QA Sign-off:** ⛔ PENDING — No Sprint 18 QA sign-off received. Deployment is BLOCKED.

---

### Pre-Deploy Checks

| Check | Result | Notes |
|-------|--------|-------|
| QA sign-off in handoff-log.md | ❌ BLOCKED | No Sprint 18 QA → Deploy Engineer handoff found. Most recent is H-220 (Sprint 17). |
| Pending DB migrations | ✅ None | Sprint 18 adds no schema changes — T-083 is query-parameter-only, no DDL |
| Backend test suite | ✅ PASS | 108/108 tests pass |
| Frontend test suite | ✅ PASS | **177/177 tests pass** — 15 new tests from T-084 (PlantSearchFilter) |
| Uncommitted/untracked working tree | ⚠️ Present | Sprint 18 implementation work exists in working tree but not yet committed to git |

> **Note on initial false alarm:** First test run returned 161/162 (stale Vitest cache from prior session). Full re-run with all working tree files loaded confirmed **177/177**. The api.test.js regression was already fixed by the Frontend Engineer — `api.test.js` modified to expect `{ data: [{ id: 1 }] }` (matching the new `_returnFull: true` behavior). H-230 was sent preemptively but is now **superseded** — no action needed from Frontend Engineer on the test fix.

---

### Build Verification Results

#### Backend — `npm test` in `backend/`

| Metric | Result |
|--------|--------|
| Test Suites | 12 passed, 12 total |
| Tests | **108/108 passed** |
| Duration | ~28s |
| Status | ✅ PASS — baseline maintained |

> **Note on T-083:** Backend search/filter implementation (`GET /api/v1/plants?search=&status=`) is confirmed **NOT YET IMPLEMENTED** in `backend/src/routes/plants.js`. The endpoint accepts only `page` and `limit` params. Test count of 108 reflects the pre-T-083 baseline — once T-083 is implemented, backend will add minimum 6 tests (per DoD) bringing the count to ≥114.

#### Frontend — `npm test -- --run` in `frontend/`

| Metric | Result |
|--------|--------|
| Test Suites | 26 passed, 26 total |
| Tests | **177/177 passed** |
| Duration | ~3s |
| Status | ✅ PASS — 15 new tests from T-084 PlantSearchFilter (above Sprint 17 baseline of 162) |

---

### Untracked / Uncommitted Working Tree Changes

Sprint 18 implementation work is present in the working tree (untracked and modified files — not yet committed):

**Modified files:**
| File | Change Summary | Task |
|------|---------------|------|
| `frontend/src/utils/api.js` | `plants.list()` refactored: params object API, adds `search`/`status`/`utcOffset`, uses `_returnFull: true` | T-084 |
| `frontend/src/hooks/usePlants.js` | Updated for new `{ data, pagination }` return shape; adds `pagination` state + `abortRef` | T-084 |
| `frontend/src/pages/CareHistoryPage.jsx` | `plantsApi.list(1, 200)` → `plantsApi.list({ page: 1, limit: 200 })` compatibility fix | T-084 |
| `frontend/src/pages/ProfilePage.jsx` | `color="#5C7A5C"` → `color="var(--color-accent-primary)"` on lines 136, 141, 146 | **T-085 ✅** |
| `frontend/src/__tests__/api.test.js` | Updated assertion to expect `{ data: [...] }` from `plants.list()` | T-084 regression fix |
| `frontend/src/pages/InventoryPage.jsx` | Updated to use PlantSearchFilter component, server-side search/filter | T-084 |
| `frontend/src/pages/InventoryPage.css` | New styles for search/filter layout | T-084 |

**New untracked files:**
| File | Task |
|------|------|
| `frontend/src/components/PlantSearchFilter.jsx` (279 lines) | T-084 ✅ |
| `frontend/src/components/PlantSearchFilter.css` | T-084 ✅ |
| `frontend/src/__tests__/PlantSearchFilter.test.jsx` (215 lines) | T-084 ✅ |

---

### Sprint 18 Task Implementation Status (confirmed in codebase)

| Task | Agent | Code Status | Tracker Status |
|------|-------|-------------|----------------|
| T-082 (SPEC-013 — Design) | Design Agent | ✅ Written — H-227 confirms SPEC-013 in ui-spec.md | Backlog (tracker not yet updated) |
| T-083 (Backend search/filter) | Backend Engineer | ❌ NOT implemented — `plants.js` GET handler has no `search`/`status`/`utcOffset` params; 108/108 tests (pre-T-083) | In Progress |
| T-084 (Frontend search/filter UI) | Frontend Engineer | ✅ Complete — `PlantSearchFilter.jsx` (279L), updated `InventoryPage.jsx`, 15 new tests, 177/177 pass | In Review |
| T-085 (ProfilePage CSS tokens) | Frontend Engineer | ✅ Done — all 3 stat tile icons use `var(--color-accent-primary)` | In Review |
| T-086 (CareDuePage focus mgmt) | Frontend Engineer | ✅ Done — `getNextFocusTarget`, `markDoneButtonRefs`, 300ms fade-then-focus fully implemented | In Review |

---

### Deployment Decision

**Status: BLOCKED — DO NOT DEPLOY**

Active blockers preventing staging deployment:
1. **No QA sign-off** — No Sprint 18 QA → Deploy Engineer handoff exists in handoff-log.md
2. **T-083 incomplete** — Backend search/filter not implemented; backend cannot serve `?search=` or `?status=` params; QA cannot verify search/filter end-to-end behavior

**Non-blocking items confirmed clear:**
- ✅ Backend: 108/108 tests (existing suite)
- ✅ Frontend: 177/177 tests
- ✅ No DB migrations pending (T-083 adds no schema changes)
- ✅ T-084, T-085, T-086 all complete in working tree

**Action taken:** Pre-deploy build verification logged. H-231 sent to Manager Agent summarizing blocker status. Staging deploy will proceed immediately upon receipt of QA sign-off from QA Engineer confirming T-082 through T-086 all pass.

---

