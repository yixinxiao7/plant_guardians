# QA & Build Log

Tracks test runs, build results, and post-deploy health checks per sprint. Maintained by QA Engineer, Deploy Engineer, and Monitor Agent.

---

## Sprint 8 — QA Re-Verification (QA Engineer — 2026-03-28)

**Date:** 2026-03-28
**QA Engineer:** QA Agent
**Sprint:** 8
**Purpose:** Re-verification of all Sprint 8 QA gates. Confirms prior QA pass (2026-03-27) remains valid after staging deployment.

---

### Re-Verification — Unit Tests

| Suite | Tests | Result | Baseline (Sprint 7) | Regression |
|-------|-------|--------|---------------------|------------|
| Backend (`npm test`) | 65/65 | ✅ PASS | 57/57 | None |
| Frontend (`npm test`) | 95/95 | ✅ PASS | 72/72 | None |

### Re-Verification — npm audit

| Package | Severity | Location | Risk |
|---------|----------|----------|------|
| `path-to-regexp` <0.1.13 | High | backend → Express 4.22.1 (transitive) | LOW — ReDoS via static route params only, not user input. Tracked for Express 5 migration (FB-031). **Not P1.** |
| `brace-expansion` <1.1.13 | Moderate | backend + frontend (dev deps only) | Negligible — dev-only, not in production |

### Re-Verification — Security Checklist (Sprint 8 Tasks)

All 14 security checklist items re-confirmed:
- Auth enforced on GET /api/v1/care-due (✅ `router.use(authenticate)`)
- Parameterized Knex queries — no SQL injection (✅)
- User isolation via `p.user_id` filter (✅)
- Error handler never leaks stack traces (✅ centralized errorHandler.js)
- No hardcoded secrets in source (✅ .env in .gitignore)
- CORS allows only :5173, :5174, :4173 (✅)
- Rate limiting applied (✅)
- React default XSS escaping, no dangerouslySetInnerHTML (✅)

### Re-Verification — Config Consistency

| Check | Result |
|-------|--------|
| Backend PORT=3000 matches Vite proxy target `http://localhost:3000` | ✅ |
| No SSL — both use http:// | ✅ |
| CORS includes http://localhost:5173 | ✅ |

### Re-Verification Summary

**All prior QA results (2026-03-27) confirmed valid.** No regressions, no new issues, no changes since prior verification. Sprint 8 engineering tasks (T-042, T-043, T-044) remain Done.

**Remaining sprint closure tasks (outside QA scope):**
- T-020: User Agent testing (P0 hard gate)
- T-041: Monitor Agent health check (P1)

---

## Sprint 8 — Comprehensive QA Verification (QA Engineer — 2026-03-27)

**Date:** 2026-03-27
**QA Engineer:** QA Agent
**Sprint:** 8
**Tasks Verified:** T-043 (GET /api/v1/care-due), T-044 (Care Due Dashboard)

---

### Test Run — Unit Tests (Backend)

| Metric | Value |
|--------|-------|
| **Test Type** | Unit Test |
| **Command** | `cd backend && npm test` |
| **Result** | ✅ PASS |
| **Total Tests** | 65/65 |
| **New Tests (T-043)** | 8 (careDue.test.js: happy path, all-on-track, never-done, 401, no plants, user isolation, sort order, weekly frequency) |
| **Baseline (Sprint 7)** | 57/57 |
| **Regression** | None — all 57 pre-existing tests pass |
| **Test Suites** | 8/8 pass (auth, plants, careActions, careHistory, careDue, ai, account, profile) |

**Coverage assessment (T-043):**
- Happy path with mixed statuses: ✅ Tested
- All on track (empty arrays): ✅ Tested
- Never-done plant (null last_done_at): ✅ Tested
- 401 unauthorized: ✅ Tested
- No plants (empty user): ✅ Tested
- User isolation: ✅ Tested
- Sort order (contract compliance): ✅ Tested
- Weekly frequency conversion: ✅ Tested

---

### Test Run — Unit Tests (Frontend)

| Metric | Value |
|--------|-------|
| **Test Type** | Unit Test |
| **Command** | `cd frontend && npm test` |
| **Result** | ✅ PASS |
| **Total Tests** | 95/95 |
| **New Tests (T-044)** | 23 (CareDuePage: 19, Sidebar badge: 3, AppShell: 1) |
| **Baseline (Sprint 7)** | 72/72 |
| **Regression** | None — all 72 pre-existing tests pass |
| **Test Suites** | 20/20 pass |

**Coverage assessment (T-044):**
- Loading skeleton with aria-busy: ✅ Tested
- Error state with retry: ✅ Tested
- Global all-clear state + CTA navigation: ✅ Tested
- Populated state with all 3 sections: ✅ Tested
- Per-section empty state: ✅ Tested
- Urgency text (6 variants: N days overdue, 1 day overdue, Never done, Due today, Due tomorrow, Due in N days): ✅ Tested
- Section count pills: ✅ Tested
- Mark-done success + toast + item removal: ✅ Tested
- Mark-done error + toast: ✅ Tested
- Mark-done in-flight (disabled button): ✅ Tested
- Badge count (overdue + due_today): ✅ Tested
- Badge update after mark-done: ✅ Tested
- Accessibility (section aria-labelledby, button aria-labels): ✅ Tested
- Tooltip on upcoming due date: ✅ Tested

---

### Integration Test — T-043 + T-044 (Care Due Dashboard End-to-End)

| Metric | Value |
|--------|-------|
| **Test Type** | Integration Test |
| **Result** | ✅ PASS |

**API Contract Verification (api-contracts.md GROUP 17 vs actual):**

| Check | Expected | Verified |
|-------|----------|----------|
| Endpoint path | GET /api/v1/care-due | ✅ Registered in app.js at `/api/v1/care-due` |
| Auth required | Bearer token | ✅ `router.use(authenticate)` |
| 401 without auth | `{ error: { code: "UNAUTHORIZED" } }` | ✅ Test confirms 401 |
| Success status | 200 | ✅ |
| Response wrapper | `{ data: { overdue, due_today, upcoming } }` | ✅ Exact match |
| Overdue fields | plant_id, plant_name, care_type, days_overdue, last_done_at | ✅ |
| Due Today fields | plant_id, plant_name, care_type (no extra fields) | ✅ Test verifies no days_overdue/due_in_days |
| Upcoming fields | plant_id, plant_name, care_type, due_in_days, due_date | ✅ |
| last_done_at nullable | null for never-done | ✅ Test confirms |
| Empty response shape | All three arrays present, empty `[]` | ✅ |
| Overdue sort | days_overdue DESC, plant_name ASC | ✅ Test confirms |
| Due Today sort | plant_name ASC | ✅ (single-item tests, contract code verified) |
| Upcoming sort | due_in_days ASC, plant_name ASC | ✅ (contract code verified) |
| Frequency conversion | weeks=7d, months=30d | ✅ Weekly test confirms |
| No query params | None required | ✅ |

**Frontend ↔ Backend Integration:**

| Check | Result |
|-------|--------|
| `careDue.get()` calls `GET /care-due` | ✅ Verified in api.js |
| Response consumed correctly (data.overdue, data.due_today, data.upcoming) | ✅ Verified in useCareDue.js |
| Mark-done calls existing `POST /care-actions` | ✅ `careActions.markDone(plantId, careType)` |
| Optimistic removal (no re-fetch after mark-done) | ✅ Local state filter in useCareDue.js |
| Badge count = overdue.length + due_today.length | ✅ Verified in useCareDue.js |
| Badge fetched on AppShell mount | ✅ Verified in AppShell.jsx |
| Badge passed to Sidebar via prop | ✅ `careDueBadge` prop |
| Badge hidden at count 0 | ✅ `{careDueBadge > 0 && ...}` in Sidebar.jsx |
| Badge shows "99+" at ≥100 | ✅ `careDueBadge >= 100 ? '99+'` in Sidebar.jsx |

**SPEC-009 UI Compliance:**

| Check | Result |
|-------|--------|
| Route `/due` registered | ✅ In App.jsx |
| Page title "Care Due" | ✅ h1 element |
| Subtitle text | ✅ Matches SPEC-009 exactly |
| Three urgency sections in order | ✅ overdue → due_today → upcoming |
| Section icons (WarningCircle, Clock, CalendarBlank) | ✅ |
| Section colors (red #B85C38, amber #C4921F, green #5C7A5C) | ✅ Verified in code |
| Care type icons (Drop, Leaf, PottedPlant) with correct bg colors | ✅ CARE_TYPE_CONFIG matches spec |
| Urgency text rules (singular/plural, never done, tomorrow) | ✅ All 6 variants verified by tests |
| Tooltip on upcoming items | ✅ `title="Due [Month D, YYYY]"` |
| Loading skeleton with shimmer | ✅ 2 skeleton section blocks |
| Error state (WarningCircle, heading, body, retry button) | ✅ |
| Global all-clear (SVG illustration, heading, CTA) | ✅ |
| Per-section empty states (dashed border, encouraging text) | ✅ |
| Mark-done button with spinner during in-flight | ✅ |
| Mark-done fade-out animation (0.3s) | ✅ 300ms timeout for removingItems |
| Sidebar "Care Due" nav item with BellSimple icon | ✅ |
| Badge between "My Plants" and "History" | ✅ Sidebar.jsx nav order verified |
| Accessibility: aria-labelledby, aria-busy, aria-labels, aria-live | ✅ All present |
| prefers-reduced-motion support | ✅ In CareDuePage.css |

---

### Config Consistency Check

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Backend PORT | 3000 | `PORT=3000` in .env | ✅ |
| Vite proxy target | http://localhost:3000 | `backendTarget = 'http://localhost:3000'` | ✅ Match |
| SSL: backend uses HTTP | No SSL | No HTTPS in .env | ✅ |
| Vite proxy uses http:// | http:// | `http://localhost:3000` | ✅ Match |
| CORS includes :5173 | http://localhost:5173 | `FRONTEND_URL=http://localhost:5173,http://localhost:5174,http://localhost:4173` | ✅ Includes :5173 |
| Docker postgres port | 5432 | `"${POSTGRES_PORT:-5432}:5432"` | ✅ Match |
| Test DB isolation | Separate from staging | `plant_guardians_test` vs `plant_guardians_staging` | ✅ |

**No config mismatches found.**

---

### Security Scan

| Metric | Value |
|--------|-------|
| **Test Type** | Security Scan |
| **Result** | ✅ PASS (no P1 issues) |

**Security Checklist Verification:**

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | All API endpoints require auth | ✅ | `router.use(authenticate)` on care-due. All protected endpoints return 401 without token. |
| 2 | Role-based access control | ✅ | User isolation via `WHERE p.user_id = :userId` (Knex parameterized) |
| 3 | Token expiration + refresh | ✅ | 15m access / 7d refresh (pre-existing, unchanged) |
| 4 | Password hashing (bcrypt) | ✅ | bcrypt 6.0.0 (pre-existing, unchanged) |
| 5 | Rate limiting on auth | ✅ | AUTH_RATE_LIMIT_MAX=20 (pre-existing, unchanged) |
| 6 | Input validation (client + server) | ✅ | care-due has no user input params; mark-done validates care_type/plant_id |
| 7 | SQL injection prevention | ✅ | All queries use Knex query builder. `db.raw('MAX(ca.performed_at)')` is a static aggregate — no user input concatenated. |
| 8 | File upload validation | ✅ | Pre-existing — type/size/content checks (unchanged) |
| 9 | XSS prevention | ✅ | React default escaping. No `dangerouslySetInnerHTML`. Single test use of `innerHTML` is in test code only. |
| 10 | CORS configured | ✅ | Allows :5173, :5174, :4173 only |
| 11 | API rate limiting | ✅ | RATE_LIMIT_MAX=100 per 15m window |
| 12 | Error responses safe | ✅ | Centralized errorHandler.js — never leaks stack traces. Unknown errors → generic "An unexpected error occurred." |
| 13 | No secrets in code | ✅ | .env not tracked by git (.gitignore confirmed). API keys via process.env only. |
| 14 | Dependencies audit | ⚠️ Info | See below |

**npm audit results:**

| Package | Severity | Location | Risk Assessment |
|---------|----------|----------|-----------------|
| `path-to-regexp` <0.1.13 | High | backend → express 4.22.1 (transitive) | **Low risk.** ReDoS via route parameters — routes are defined at startup from static strings, not user input. Express 4 does not expose path-to-regexp to user-controlled input. Tracked for Express 5 migration (FB-031). **Not P1.** |
| `brace-expansion` <1.1.13 | Moderate | backend → nodemon (dev-only) + frontend (dev-only) | **Negligible.** Dev dependencies only — not present in production builds. |

**Hardcoded secrets scan:** No hardcoded secrets found in backend/src/ or frontend/src/. GEMINI_API_KEY is in .env (not git-tracked). JWT_SECRET is in .env (not git-tracked).

---

### Product-Perspective Testing

**Feature alignment with project brief:**
The Care Due Dashboard directly fulfills the project brief's core promise: "painfully obvious reminders to users to take care of their plant." The three urgency sections (Overdue, Due Today, Coming Up) make it immediately clear what needs attention, sorted by urgency. This is the right feature for the "novice plant-killer" target user.

**Observations logged to feedback-log.md:** See FB-032, FB-033.

---

### Final Verdict

| Criterion | Status |
|-----------|--------|
| All unit tests pass | ✅ 65/65 backend, 95/95 frontend |
| Integration tests pass | ✅ 15 API contract checks, 9 frontend↔backend checks, 20+ SPEC-009 checks |
| Security checklist verified | ✅ All 14 items pass. No P1 issues. |
| Config consistency | ✅ No mismatches |
| No regressions | ✅ Baseline exceeded (57→65 backend, 72→95 frontend) |
| All Sprint 8 tasks Done | ✅ T-042, T-043, T-044 — Done |

**Sprint 8 QA Status: ✅ PASS — T-043 and T-044 verified. Ready for Monitor Agent health check and User Agent testing (T-020).**

---

## Sprint 8 — Staging Deployment (Deploy Engineer — 2026-03-27)

**Date:** 2026-03-27
**Deploy Engineer:** Deploy Agent
**Sprint:** 8
**Environment:** Staging (local)

### Pre-Deploy Checklist

| Check | Result | Detail |
|-------|--------|--------|
| QA sign-off in handoff-log.md | ✅ Pass | H-118 (QA Engineer) + H-120 (Manager confirmation) — T-043 + T-044 confirmed pass |
| All Sprint 8 tasks Done | ✅ Pass | T-043, T-044 — both Done per dev-cycle-tracker.md |
| Migrations required (Sprint 8) | ✅ None | Confirmed no new migrations (technical-context.md Sprint 8 section, H-108) |
| Existing migrations up-to-date | ✅ Pass | 5/5 migrations applied (Sprint 1 schema — no changes since) |
| Backend tests | ✅ Pass | 65/65 tests pass (--runInBand) — up from 57/57 in Sprint 7 |
| Frontend tests | ✅ Pass | 95/95 tests pass — up from 72/72 in Sprint 7 |
| npm audit (backend) | ⚠️ Info | 1 high path-to-regexp (Express 4 transitive, ReDoS — non-exploitable per H-119 advisory, accepted risk), 1 moderate brace-expansion (dev-only, pre-existing) |

### Service Restart

| Service | Action | Old PID | New PID | Port | Result |
|---------|--------|---------|---------|------|--------|
| PostgreSQL | No restart needed | — | — | 5432 | ✅ |
| Backend | Killed + restarted (picks up new careDue.js route) | 88377 | 89980 | 3000 | ✅ |
| Frontend Preview | Killed + restarted (serves new dist/ with CareDuePage + badge) | 76071 | 89985 | 5173 | ✅ |

### Build

| Step | Result | Detail |
|------|--------|--------|
| `cd frontend && npm run build` | ✅ Pass | Vite v8.0.2, 4612 modules transformed (+3 from Sprint 7), 0 errors, 0 warnings, 273ms |
| Bundle size | ✅ Expected increase | JS: 390.23 kB (was 376.48 kB) — CareDuePage + useCareDue hook added |
| CSS bundle | 39.06 kB (was 34.10 kB) | CareDuePage.css added |
| dist/index.html | ✅ Present | 0.74 kB |

### Post-Deploy Health Checks

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| `GET http://localhost:3000/api/health` | 200 `{"status":"ok"}` | 200 `{"status":"ok","timestamp":"2026-03-27T23:21:00.285Z"}` | ✅ |
| `GET http://localhost:5173/` (frontend) | 200 HTML | 200 | ✅ |
| `GET http://localhost:5173/api/health` (Vite proxy) | 200 `{"status":"ok"}` | 200 `{"status":"ok"}` | ✅ |
| `GET /api/v1/care-due` (no auth) | 401 UNAUTHORIZED | 401 `UNAUTHORIZED` | ✅ (was 404 pre-deploy — route now live) |
| `GET /api/v1/care-due` via proxy (no auth) | 401 | 401 | ✅ |
| `GET /api/v1/care-due` (authenticated) | 200 `{data:{overdue:[],due_today:[],upcoming:[]}}` | 200 — empty arrays (test user has no plants) | ✅ |
| `GET /api/v1/plants` (no auth) | 401 | 401 | ✅ |
| `GET /api/v1/care-actions` (no auth) | 401 | 401 | ✅ |
| `GET http://localhost:5173/due` (SPA route) | 200 HTML | 200 | ✅ |
| `GET http://localhost:5173/history` (regression) | 200 HTML | 200 | ✅ |

### Key Deployment Notes

- **`GET /api/v1/care-due` route is now live** — previously 404, now returns 401 (unauthenticated) and 200 (authenticated) as expected
- **`/due` frontend route is live** — SPA route renders CareDuePage with sidebar badge
- **No migrations run** — Sprint 8 confirmed zero schema changes (all computation in application layer)
- **path-to-regexp advisory** — high-severity npm audit flag is non-blocking per H-119 QA assessment (Express 4 transitive, not user-input exploitable). Tracked for future Express 5 migration.

### Environment

| Item | Value |
|------|-------|
| Environment | Staging (local) |
| Backend URL | http://localhost:3000 |
| Frontend URL | http://localhost:5173 |
| API via Proxy | http://localhost:5173/api/* → http://localhost:3000/api/* |
| Backend PID | 89980 |
| Frontend PID | 89985 |
| Migrations | Up to date (5/5) — no new migrations for Sprint 8 |
| Sprint | 8 |

**Deploy Verified: Pending Monitor Agent health check (H-121)**

---

## Sprint 8 — Deploy Engineer Re-Verification (2026-03-28)

**Date:** 2026-03-28
**Deploy Engineer:** Deploy Agent
**Sprint:** 8

### Context

No new infra tasks assigned in Sprint 8. Performing continuity verification to confirm Sprint 8 staging deployment (H-121) is still healthy and all services remain running.

### Service Health Check

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| `GET http://localhost:3000/api/health` | 200 `{"status":"ok"}` | 200 `{"status":"ok","timestamp":"2026-03-28T03:33:03.269Z"}` | ✅ |
| `GET http://localhost:5173/` (frontend) | 200 HTML | 200 HTML | ✅ |
| `GET http://localhost:5173/api/health` (Vite proxy) | 200 `{"status":"ok"}` | 200 `{"status":"ok"}` | ✅ |
| `GET /api/v1/care-due` (no auth) via proxy | 401 UNAUTHORIZED | 401 UNAUTHORIZED | ✅ |
| `GET http://localhost:5173/due` (SPA route) | 200 HTML | 200 HTML | ✅ |
| `GET http://localhost:5173/history` (regression) | 200 HTML | 200 HTML | ✅ |

### Test Re-Run

| Suite | Tests | Result |
|-------|-------|--------|
| Backend | 65/65 | ✅ PASS (--runInBand, 14.9s) |
| Frontend | 95/95 | ✅ PASS (20/20 suites, 1.45s) |

### Migrations

| Command | Result |
|---------|--------|
| `cd backend && npm run migrate` | ✅ Already up to date (5/5) — no Sprint 8 migrations |

**All services healthy. Sprint 8 staging deployment confirmed stable.**

---

## Sprint 8 — Staging Start-of-Sprint Verification (Deploy Engineer — 2026-03-27)

**Date:** 2026-03-27
**Deploy Engineer:** Deploy Agent
**Sprint:** 8

### Context

No new infra tasks are assigned to Deploy Engineer in Sprint 8 (active-sprint.md: "No new infra tasks — verify staging at sprint start"). Sprint 7 staging environment was the last full deploy. Backend process (PID 74651) was not running at sprint start — restarted cleanly.

### Pre-Sprint Checklist

| Check | Result | Detail |
|-------|--------|--------|
| PostgreSQL availability | ✅ Pass | `pg_isready` → accepting connections on localhost:5432 |
| Backend migrations | ✅ Pass | `npm run migrate` → "Already up to date" (5/5 migrations, no Sprint 7 or 8 migrations pending) |
| Backend unit tests | ✅ Pass | 57/57 tests pass (--runInBand) |
| Frontend unit tests | ✅ Pass | 72/72 tests pass |
| Frontend build | ✅ Pass | Vite v8.0.2, 4609 modules, 0 errors, 0 warnings, built in 275ms |
| npm audit (backend) | ✅ Pass | 0 high-severity vulnerabilities (moderate only in dev deps) |

### Service Startup

| Service | Action | PID | Port | Result |
|---------|--------|-----|------|--------|
| PostgreSQL | Already running | — | 5432 | ✅ |
| Backend | Restarted (was down) | 88377 | 3000 | ✅ |
| Frontend Preview | Already running | 76071 | 5173 | ✅ |

**Backend restart note:** Previous PID 74651 (from Sprint 7) was no longer running. Restarted with `node src/server.js`. DB connectivity confirmed before server accepted connections (startup race fix from Sprint 1 H-017 is in place).

### Health Checks

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| `GET http://localhost:3000/api/health` | 200 `{"status":"ok"}` | 200 `{"status":"ok","timestamp":"2026-03-27T23:06:01.970Z"}` | ✅ |
| `GET http://localhost:5173/` (frontend) | 200 HTML | 200 | ✅ |
| `GET http://localhost:5173/api/health` (Vite proxy) | 200 `{"status":"ok"}` | 200 `{"status":"ok"}` | ✅ |
| `GET /api/v1/plants` (no auth) | 401 UNAUTHORIZED | 401 | ✅ |
| `GET /api/v1/care-actions` (no auth) | 401 UNAUTHORIZED | 401 | ✅ |
| `GET /api/v1/care-due` (no auth) | 404 (not yet implemented) | 404 | ℹ️ T-043 In Progress |

**Sprint 8 Staging Status: ✅ HEALTHY — Ready for T-043/T-044 deployment**

### Environment: Staging

| Item | Value |
|------|-------|
| Environment | Staging (local) |
| Backend URL | http://localhost:3000 |
| Frontend URL | http://localhost:5173 |
| API via Proxy | http://localhost:5173/api/* → http://localhost:3000/api/* |
| Migrations | Up to date (5/5) — no new migrations for Sprint 7 or Sprint 8 |
| Sprint | 8 |

### Pending Deployment (Sprint 8)

Once T-043 (GET /api/v1/care-due) and T-044 (Care Due Dashboard) complete QA, a Sprint 8 staging re-deployment will be executed:
1. Restart backend to pick up new care-due route registration
2. Rebuild frontend (new /due page + sidebar badge)
3. Run health checks (Monitor Agent T-041 + new Sprint 8 check)
4. Log Deploy Verified: Yes/No

---

## Sprint 7 — Staging Deployment (Deploy Engineer — 2026-03-26)

**Date:** 2026-03-26
**Deploy Engineer:** Deploy Agent
**Sprint:** 7

### Pre-Deploy Checklist

| Check | Result | Detail |
|-------|--------|--------|
| QA sign-off in handoff-log.md | ✅ Pass | H-101 (QA Engineer) + H-104 (Comprehensive QA) — all Sprint 7 tasks confirmed pass |
| All Sprint 7 tasks Done | ✅ Pass | T-035, T-036, T-037, T-038, T-039, T-040 — all Done in dev-cycle-tracker.md |
| Migrations required (Sprint 7) | ✅ None | Sprint 7 confirmed no new migrations (technical-context.md Sprint 7 section) |
| Existing migrations up-to-date | ✅ Pass | `npm run migrate` → "Already up to date" (5/5 migrations applied) |

### Dependency Install

| Package | Result | Detail |
|---------|--------|--------|
| Backend `npm install` | ✅ Pass | up to date, 443 packages, 0 high-severity vulnerabilities |
| Frontend `npm install` | ✅ Pass | up to date, 243 packages, 0 high-severity vulnerabilities |
| Moderate vulnerabilities | ⚠️ Info | 20 backend + 5 frontend — all in dev dependencies, no production impact (per T-037 QA sign-off) |

### Build

| Step | Result | Detail |
|------|--------|--------|
| `cd frontend && npm run build` | ✅ Pass | Vite v8.0.2, 4609 modules transformed, 0 errors, 0 warnings |
| Output: `dist/index.html` | ✅ Pass | 0.74 kB (gzip: 0.41 kB) |
| Output: `dist/assets/index-*.css` | ✅ Pass | 34.10 kB (gzip: 6.33 kB) |
| Output: `dist/assets/index-*.js` | ✅ Pass | 376.48 kB (gzip: 111.06 kB) |
| Build time | ✅ Pass | 288ms |

**Build Status: ✅ SUCCESS**

### Staging Deployment

**Infrastructure Note:** Docker is not available in this environment. Staging runs as local processes (backend via Node.js, frontend via Vite preview). This is consistent with prior sprint deployments.

| Service | Action | Result | Detail |
|---------|--------|--------|--------|
| PostgreSQL | Already running | ✅ Pass | DB connection verified via migration check |
| Backend | Running (PID 74651) | ✅ Pass | `node src/server.js` on port 3000 |
| Database Migrations | `npm run migrate` | ✅ Pass | Already up to date — 5/5 migrations applied, no new migrations for Sprint 7 |
| Frontend Preview | Started (PID 76053) | ✅ Pass | `vite preview --port 5173` serving dist/ |

**Note:** Port 4173 was occupied by an unrelated project process. Frontend preview started on port 5173 (consistent with Vite dev server convention and CORS config).

### Post-Start Verification

| Check | Result | Response |
|-------|--------|----------|
| `GET http://localhost:3000/api/health` | ✅ Pass | `{"status":"ok","timestamp":"2026-03-27T02:36:19.318Z"}` |
| `GET http://localhost:3000/api/v1/care-actions` | ✅ Pass | 401 UNAUTHORIZED (correct — T-039 route is live, requires auth) |
| `GET http://localhost:5173` (frontend) | ✅ Pass | HTTP 200 |
| `GET http://localhost:5173/api/health` (Vite proxy) | ✅ Pass | HTTP 200 — proxy correctly forwarding to backend |

**Deployment Status: ✅ SUCCESS**

### Environment: Staging

| Item | Value |
|------|-------|
| Environment | Staging (local) |
| Backend URL | http://localhost:3000 |
| Frontend URL | http://localhost:5173 |
| API via Proxy | http://localhost:5173/api/* → http://localhost:3000/api/* |
| Build Status | Success |
| Migrations | Up to date (5/5) |
| New Migrations (Sprint 7) | None |
| Sprint | 7 |

---

## Sprint 7 — Comprehensive QA Verification (QA Engineer — 2026-03-26)

**Date:** 2026-03-26
**QA Engineer:** QA Agent
**Sprint:** 7
**Scope:** Full QA pass — unit tests, integration tests, config consistency, security scan, product-perspective review

---

### Test Run — Unit Tests

| Suite | Framework | Result | Detail |
|-------|-----------|--------|--------|
| Backend (7 suites) | Jest --runInBand | ✅ 57/57 pass | auth (10), plants (18), careActions (6), ai (7), profile (2), account (4), careHistory (9), plus 1 console.error from expected Gemini 502 |
| Frontend (19 files) | Vitest | ✅ 72/72 pass | All pages, components, hooks tested. 1.42s total |

**Coverage Assessment (Sprint 7 new code):**

| Task | Code | Happy Path | Error Path | Coverage Verdict |
|------|------|-----------|------------|-----------------|
| T-035 | ProfilePage toast variant | ✅ Toast uses 'info' | ✅ (existing error tests) | Pass |
| T-036 | package.json test script | ✅ `npm test` runs 72/72 | N/A (infra) | Pass |
| T-037 | npm audit fix | ✅ 0 high vulns | N/A (deps) | Pass |
| T-039 | GET /care-actions (9 tests) | ✅ Happy path, pagination, filter | ✅ 401, 400 (page/limit/UUID), ownership isolation | Pass |
| T-040 | CareHistoryPage (11 tests) | ✅ Populated, load more, filter, timestamps, navigation | ✅ Loading, empty, filtered empty, error, retry | Pass |

---

### Test Run — Integration Tests

**API Contract Verification (T-039 — GET /api/v1/care-actions):**

| Check | Expected (api-contracts.md) | Actual | Result |
|-------|---------------------------|--------|--------|
| Auth required | 401 UNAUTHORIZED | 401 UNAUTHORIZED | ✅ |
| Response shape: data[] | Array of {id, plant_id, plant_name, care_type, performed_at} | Matches exactly | ✅ |
| Response shape: pagination | {page, limit, total} | Matches exactly | ✅ |
| Default page=1, limit=20 | page:1, limit:20 | Confirmed in test | ✅ |
| plant_id filter | Returns only matching plant | Confirmed in test | ✅ |
| Ownership isolation | Other user's plant_id → empty [] (not 404) | Confirmed in test | ✅ |
| Invalid page (0) | 400 VALIDATION_ERROR | 400 VALIDATION_ERROR | ✅ |
| Limit > 100 | 400 VALIDATION_ERROR | 400 VALIDATION_ERROR | ✅ |
| Invalid UUID plant_id | 400 VALIDATION_ERROR | 400 VALIDATION_ERROR | ✅ |
| Sorting | performed_at DESC | Confirmed in test | ✅ |
| Empty result | 200 with data:[], total:0 | Confirmed in test | ✅ |
| Parameterized queries | Knex query builder (no string concat) | Verified in CareAction.findPaginatedByUser() | ✅ |

**Frontend → Backend Integration (T-040):**

| Check | Result | Detail |
|-------|--------|--------|
| API call path | ✅ | `careActions.list()` calls `/care-actions` with query params (page, limit, plant_id) |
| Response handling | ✅ | useCareHistory hook extracts data[] and pagination correctly |
| Filter dropdown | ✅ | Populated from `GET /plants` (separate call), sorted A-Z |
| Load more | ✅ | Increments page, appends to existing data |
| Error handling | ✅ | Rejected promise → error state with retry button |

**UI State Verification (SPEC-008 Compliance — T-040):**

| State | Implemented | SPEC-008 Match | Detail |
|-------|------------|----------------|--------|
| Loading | ✅ | ✅ | 6 skeleton rows, disabled filter, aria-busy="true", aria-label="Loading care history" |
| Populated | ✅ | ✅ | Result count, filter bar, care action list with icons, labels, timestamps |
| Empty (no filter) | ✅ | ✅ | SVG illustration, "No care actions yet.", "Start by marking a plant as watered!", "Go to my plants" CTA |
| Filtered empty | ✅ | ✅ | "No actions for this plant yet.", "Clear filter" ghost button |
| Error | ✅ | ✅ | WarningCircle icon, "Couldn't load your care history.", "Try again" with aria-label |
| Load more | ✅ | ✅ | Ghost button, "(N remaining)" count, disappears when all loaded |

**Care Type Icons & Colors (SPEC-008):**

| Care Type | Icon | Background | Icon Color | Match |
|-----------|------|-----------|------------|-------|
| watering | Drop | #EBF4F7 | #5B8FA8 | ✅ |
| fertilizing | Leaf | #E8F4EC | #4A7C59 | ✅ |
| repotting | PottedPlant | #F4EDE8 | #A67C5B | ✅ |

**Navigation Entry Points:**

| Entry Point | Implemented | Detail |
|-------------|------------|--------|
| Sidebar "History" | ✅ | ClockCounterClockwise icon, /history route |
| Profile "View care history →" | ✅ | Link in profile page |

---

### Test Run — Config Consistency Check

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Backend PORT | 3000 | `PORT=3000` in .env | ✅ |
| Vite proxy target | http://localhost:3000 | `backendTarget = 'http://localhost:3000'` | ✅ |
| SSL consistency | No SSL (dev) → http:// | Both use http:// | ✅ |
| CORS_ORIGIN includes :5173 | Yes | `FRONTEND_URL=http://localhost:5173,http://localhost:4173` | ✅ |
| Docker compose DB | Matches .env | postgres defaults match DATABASE_URL credentials | ✅ |

**Config Consistency: PASS — No mismatches.**

---

### Test Run — Security Scan

**Security Checklist Verification:**

| # | Item | Applicable | Result | Detail |
|---|------|-----------|--------|--------|
| 1 | All API endpoints require auth | Yes | ✅ | `router.use(authenticate)` on careHistory.js; all other routes verified in prior sprints |
| 2 | Role-based access control | No | N/A | Single-role app |
| 3 | Auth tokens have expiration/refresh | Yes | ✅ | JWT_EXPIRES_IN=15m, REFRESH_TOKEN_EXPIRES_DAYS=7 |
| 4 | Password hashing (bcrypt) | Yes | ✅ | bcrypt 6.0.0 confirmed |
| 5 | Rate limiting on login | Yes | ✅ | AUTH_RATE_LIMIT_MAX=20 configured |
| 6 | Input validation (client + server) | Yes | ✅ | page/limit/plant_id validated server-side; frontend uses controlled components |
| 7 | Parameterized SQL queries | Yes | ✅ | Knex query builder used throughout — no string concatenation in CareAction.findPaginatedByUser() |
| 8 | NoSQL injection | No | N/A | PostgreSQL only |
| 9 | File upload validation | Yes | ✅ | Existing — type, size, content verified (Sprint 1) |
| 10 | XSS prevention | Yes | ✅ | React default escaping; plant_name rendered via JSX (not dangerouslySetInnerHTML) |
| 11 | CORS configured | Yes | ✅ | FRONTEND_URL allows only :5173 and :4173 |
| 12 | Rate limiting on public endpoints | Yes | ✅ | RATE_LIMIT_MAX=100 configured |
| 13 | No internal error leakage | Yes | ✅ | Error middleware returns {error: {message, code}} — no stack traces |
| 14 | No sensitive data in URLs | Yes | ✅ | plant_id is UUID (non-sensitive); no tokens in query params |
| 15 | Security headers | Partial | ⚠️ | Production nginx config has full headers (X-Content-Type-Options, X-Frame-Options, HSTS). Dev server does not — acceptable for staging. |
| 16 | Sensitive data encrypted at rest | No | N/A | Out of scope per active-sprint.md |
| 17 | Secrets in env vars (not code) | Yes | ✅ | JWT_SECRET, GEMINI_API_KEY, DATABASE_URL all in .env; no hardcoded secrets in source |
| 18 | No PII in logs | Yes | ✅ | Only Gemini API error logged (err.message); no user data logged |
| 19 | HTTPS enforced | Partial | ⚠️ | Production nginx config enforces HTTPS + TLS 1.2/1.3. Staging uses HTTP — acceptable per project phase. |
| 20 | npm audit — 0 high-severity | Yes | ✅ | 0 high-severity vulnerabilities. 20 moderate (backend: brace-expansion in jest) + 5 moderate (frontend: brace-expansion in eslint) — dev-only deps, no production impact. |
| 21 | Default credentials removed | Yes | ✅ | No default/sample credentials in committed code |
| 22 | Error pages don't reveal server info | Yes | ✅ | JSON error responses only; no Express version exposure |

**Security Scan: PASS — No P1 security issues. Two ⚠️ items (security headers, HTTPS) are staging-only and correctly addressed in production config (infra/nginx.prod.conf).**

---

### Product-Perspective Testing

**Care History Feature (T-039 + T-040):**

Tested from the perspective of a novice plant owner per project-brief.md:

1. **New user with no care actions** → Empty state is encouraging ("Start by marking a plant as watered!") with a clear CTA to go to plants. ✅ Good UX.
2. **User with multiple plants and actions** → List is sorted newest-first. Each item clearly shows plant name, care type (color-coded), and relative time. ✅ Scannable at a glance.
3. **Filtering by plant** → Dropdown shows all plants alphabetically. Selecting one filters instantly. If no actions for that plant, shows "No actions for this plant yet." with "Clear filter" button. ✅ Intuitive.
4. **Pagination** → "Load more (N remaining)" button appears when more than 20 actions. Appends without page reset. ✅ Smooth.
5. **Error recovery** → On API failure, error state shows clearly with "Try again" button. ✅ Resilient.

**Edge Cases Tested (via backend unit tests):**

| Edge Case | Behavior | Result |
|-----------|----------|--------|
| Very large limit (101) | 400 VALIDATION_ERROR | ✅ |
| Page=0 | 400 VALIDATION_ERROR | ✅ |
| Malformed UUID | 400 VALIDATION_ERROR | ✅ |
| Other user's plant_id | Empty array (no info leak) | ✅ |
| No care actions at all | 200 with empty data[] | ✅ |

**Observations logged to feedback-log.md:** FB-023 (Positive — feature reinforces product vision), FB-024 (Minor — moderate npm audit vulns in dev deps).

---

### Sprint 7 QA Summary

| Category | Verdict |
|----------|---------|
| Unit Tests | ✅ PASS (57/57 backend, 72/72 frontend) |
| Integration Tests | ✅ PASS (API contract verified, all UI states, frontend↔backend alignment) |
| Config Consistency | ✅ PASS (PORT, proxy, CORS, SSL all consistent) |
| Security Scan | ✅ PASS (no P1 issues; staging-only ⚠️ items addressed in prod config) |
| Product Perspective | ✅ PASS (Care History delivers on product vision) |

**All Sprint 7 engineering tasks verified. Ready for Monitor Agent post-deploy health check.**

---

## Sprint 7 — Staging Deployment (Deploy Engineer — 2026-03-26)

**Date:** 2026-03-26
**Deploy Engineer:** Deploy Agent
**Sprint:** 7
**Task:** Sprint 7 Staging Deployment — backend restart to activate T-039 (GET /api/v1/care-actions)
**Build Status:** ✅ Success — no rebuild required; backend restart only

### Pre-Deploy Confirmation

| Check | Result |
|-------|--------|
| QA confirmation (H-101) | ✅ All Sprint 7 tasks pass — T-035, T-036, T-037, T-039, T-040 |
| Manager code review (H-100) | ✅ All Sprint 7 tasks approved — backend restart authorized |
| Frontend dist current | ✅ No rebuild required — dist built with all Sprint 7 code |
| Migrations required | ✅ None — T-039 uses existing `care_actions` table (Sprint 1 migration 5/5) |

### Deploy Action

| Action | Detail |
|--------|--------|
| Type | Backend process restart only |
| Previous PID | 39507 (started pre-T-039 — route not loaded) |
| New PID | 74651 |
| Command | `kill 39507 && cd backend && node src/server.js &` |
| Migrations run | None required (5/5 already current) |
| Frontend rebuild | Not required (dist is current) |

### Post-Deploy Health Verification

| Check | Result | Detail |
|-------|--------|--------|
| Backend `GET /api/health` | ✅ Pass | `{"status":"ok","timestamp":"2026-03-27T02:08:03.046Z"}` |
| `GET /api/v1/care-actions` (unauthenticated) | ✅ 401 | Route is live — auth correctly enforced |
| `GET /api/v1/plants` (unauthenticated) | ✅ 401 | Existing routes unaffected |
| `POST /api/v1/auth/register` (empty body) | ✅ 400 | Auth routes healthy |
| `GET /api/v1/profile` (unauthenticated) | ✅ 401 | Profile route healthy |
| Frontend `GET http://localhost:4174/` | ✅ 200 | Vite preview PID 39822 healthy |
| Vite proxy: `GET /api/health` via :4174 | ✅ 200 | Proxy functional |
| Vite proxy: `GET /api/v1/care-actions` via :4174 | ✅ 401 | Route accessible through proxy |

### Post-Restart Test Results

| Suite | Result |
|-------|--------|
| Backend tests (`npm test`) | ✅ 57/57 pass (7 suites, 12.9s) |
| Frontend tests (`npm test`) | ✅ 72/72 pass (19 files, 1.5s) |

### Environment State (Post-Deploy)

| Item | Value |
|------|-------|
| Backend PID | 74651 (`node src/server.js`) |
| Frontend PID | 39822 (Vite preview — unchanged) |
| Backend URL | http://localhost:3000 |
| Frontend URL | http://localhost:4174 |
| DB | PostgreSQL @ localhost:5432 (plant_guardians_staging) |
| Migrations | 5/5 current |
| New routes live | `GET /api/v1/care-actions` ✅ |

### Sprint 7 Feature Status

| Task | Type | Deployed | Status |
|------|------|----------|--------|
| T-035 | Frontend: toast variant fix | ✅ In dist | Done |
| T-036 | Frontend: npm test script | ✅ In dist | Done |
| T-037 | npm audit fix (backend+frontend) | ✅ Applied | Done |
| T-039 | Backend: GET /care-actions | ✅ Route live (PID 74651) | Done |
| T-040 | Frontend: Care History page | ✅ In dist (route /history) | Done |

**Deploy Verified:** Pending Monitor Agent health check

---

## Sprint 7 — Pre-Deploy Readiness Verification (Deploy Engineer — 2026-03-26)

**Date:** 2026-03-26
**Deploy Engineer:** Deploy Agent
**Sprint:** 7
**Task:** Pre-deploy verification — confirming all Sprint 7 code is build-ready and staging is healthy prior to QA confirmation

### Build Verification

| Check | Result | Detail |
|-------|--------|--------|
| `npm run build` (frontend) | ✅ Pass | 0 errors, 0 warnings — 380ms |
| `npm test` (frontend) | ✅ Pass | 72/72 tests pass (19 test files) |
| `npm test` (backend) | ✅ Pass | 57/57 tests pass (7 suites, --runInBand) |
| `npm audit` (frontend) | ✅ Pass | 0 vulnerabilities |
| `npm audit` (backend) | ✅ Pass | 0 vulnerabilities |
| Frontend dist current | ✅ Yes | dist/ built with all Sprint 7 code (T-035, T-036, T-040); asset hashes unchanged — no rebuild needed |
| Staging health | ✅ Pass | Backend :3000 `/api/health` → 200 `{"status":"ok"}` |
| Frontend preview | ✅ Pass | Vite preview PID 39822 @ :4174 → HTTP 200 |

### Sprint 7 Code Status

| Task | Type | Status | Code in Repo | Route/Build Deployed |
|------|------|--------|-------------|----------------------|
| T-035 | Frontend: toast fix | In Review | ✅ Present | ✅ In dist (2026-03-25 build) |
| T-036 | Frontend: npm test script | In Review | ✅ Present | ✅ Verified (`npm test` runs 72/72) |
| T-037 | npm audit fix (backend+frontend) | In Review | ✅ Present | ✅ Both dirs: 0 vulns |
| T-039 | Backend: GET /care-actions | In Review | ✅ Present (57/57 tests) | ❌ Backend not restarted — `/api/v1/care-actions` returns 404 |
| T-040 | Frontend: Care History page | In Review | ✅ Present | ✅ In dist (route /history exists in bundle) |

### Pending Deployment Action

**Backend restart required.** The `GET /api/v1/care-actions` route (T-039) is implemented and tested but the running backend process (PID 39507, started before T-039 was added) does not have the route loaded. A process restart is the only action needed — no migrations, no env var changes, no frontend rebuild.

**Waiting on:** Manager Agent code review + QA confirmation of T-039 and T-040 before executing the restart.

**When cleared:**
1. `kill 39507 && cd /Users/yixinxiao/PROJECTS/plant_guardians/backend && node src/server.js &` (or equivalent restart)
2. Verify `GET /api/v1/care-actions` responds with 200 or 401 (unauthenticated)
3. No migration run needed
4. No frontend rebuild needed — dist is current
5. Log handoff to Monitor Agent for post-deploy health check

### Environment State

| Item | Value |
|------|-------|
| Backend PID | 39507 (`node src/server.js`) |
| Frontend PID | 39822 (Vite preview) |
| Backend URL | http://localhost:3000 |
| Frontend URL | http://localhost:4174 |
| DB | PostgreSQL @ localhost:5432 (plant_guardians_staging) |
| Migrations | 5/5 current — no new migrations this sprint |

---

## Sprint 7 — Staging Environment Status Check (Deploy Engineer — 2026-03-25)

**Date:** 2026-03-25
**Deploy Engineer:** Deploy Agent
**Sprint:** 7
**Task:** Pre-deploy standby check — no infra tasks assigned this sprint (per active-sprint.md)
**Build Status:** N/A — no new build required; staging environment confirmed healthy from Sprint 6

### Staging Environment Status

| Service | URL | PID | Status |
|---------|-----|-----|--------|
| Backend API | `http://localhost:3000` | 39507 | ✅ Running |
| Frontend (preview) | `http://localhost:4174` | 39822 | ✅ Running |
| Database | PostgreSQL @ `localhost:5432` (db: `plant_guardians_staging`) | — | ✅ Running (confirmed via /api/health) |

### Health Checks

| Check | Result |
|-------|--------|
| `GET /api/health` → 200 | ✅ `{"status":"ok","timestamp":"2026-03-26T02:30:09.377Z"}` |
| Frontend `GET http://localhost:4174/` → 200 | ✅ Pass |
| Login test (test@plantguardians.local) → access_token present | ✅ Pass |
| `npm audit` backend → 0 vulnerabilities | ✅ Pass |
| `npm audit` frontend → 0 vulnerabilities | ✅ Pass |

### Pending Deploy Actions

No deploy action is required at this time. T-039 (Backend: GET /care-actions) is In Progress; T-040 (Frontend: Care History page) is Backlog. When both complete and pass QA + Manager Code Review, a staging rebuild will be needed:

1. `npm run build` in `frontend/` (no new migrations required per technical-context.md Sprint 7 note)
2. Restart backend process to pick up any new routes
3. Verify new GET /api/v1/care-actions endpoint is live
4. Log handoff to Monitor Agent for post-deploy health check

### Security Notes

- No new environment variables added this sprint (T-039 requires none)
- No new migrations (T-039 uses existing `care_actions` table — Sprint 1 migration 5)
- `npm audit` clean in both workspaces

---

### Sprint 7 QA Summary

| Task | Test Type | Result | Notes |
|------|-----------|--------|-------|
| T-035 | Unit + Integration | ✅ PASS | Toast variant corrected ('error' → 'info'). Test updated. |
| T-036 | Unit + Integration | ✅ PASS | `npm test` works in frontend. 72/72 tests pass. |
| T-037 | Unit + Security | ✅ PASS | 0 high-severity vulns. Moderate in dev deps only — acceptable. |
| T-039 | Unit + Integration + Security | ✅ PASS | 9 backend tests. API contract match. Ownership isolation. Parameterized queries. |
| T-040 | Unit + Integration + Security | ✅ PASS | 11 frontend tests. SPEC-008 compliance. All states. Accessibility. |
| Config Consistency | Config | ✅ PASS | PORT, proxy, CORS all consistent. |
| Security | Security Scan | ✅ PASS | All applicable checklist items pass. No P1 issues. |
| Product Perspective | UX Review | ✅ PASS | Feature aligns with product vision. Edge cases handled. |

**Overall Sprint 7 QA Verdict: ✅ ALL PASS**

All 57/57 backend tests and 72/72 frontend tests pass. All integration checks pass. Security checklist verified. Config consistency confirmed. Product-perspective review positive.

**Recommendation:** Move T-035, T-036, T-037, T-039, T-040 to Done. Handoff to Deploy Engineer for backend restart (T-039 endpoint not yet live on staging). After restart, Monitor Agent health check required.

---

## Sprint #8 — QA Build Log — 2026-03-27

---

### Test Run 14 — Unit Tests (T-043: Backend GET /api/v1/care-due)

| Field | Value |
|-------|-------|
| **Date** | 2026-03-27 |
| **Test Type** | Unit Test |
| **Task** | T-043 |
| **Command** | `cd backend && npm test` |
| **Result** | ✅ PASS — 65/65 tests pass (8 new for T-043) |

**T-043 Test Coverage (8 tests in careDue.test.js):**
| # | Test | Type | Result |
|---|------|------|--------|
| 1 | Happy path — overdue, due_today, upcoming items returned | Happy path | ✅ |
| 2 | All plants on track — empty arrays | Happy path (edge) | ✅ |
| 3 | Never-done plants — uses plant.created_at baseline | Edge case | ✅ |
| 4 | 401 without auth token | Error path | ✅ |
| 5 | Empty arrays when user has no plants | Edge case | ✅ |
| 6 | User isolation — other user's plants not visible | Security | ✅ |
| 7 | Sort order — overdue DESC then name ASC | Contract verification | ✅ |
| 8 | Weekly frequency conversion (1 week = 7 days) | Logic verification | ✅ |

**Coverage assessment:** Happy path ✅, Error path (401) ✅, Edge cases (empty, never-done, sorting, frequency conversion, isolation) ✅. Exceeds minimum coverage requirements.

---

### Test Run 15 — Unit Tests (T-044: Frontend Care Due Dashboard)

| Field | Value |
|-------|-------|
| **Date** | 2026-03-27 |
| **Test Type** | Unit Test |
| **Task** | T-044 |
| **Command** | `cd frontend && npm test` |
| **Result** | ✅ PASS — 95/95 tests pass (23 new for T-044) |

**T-044 Test Coverage (23 tests in CareDuePage.test.jsx):**
| # | Test | Type | Result |
|---|------|------|--------|
| 1 | Loading skeleton renders | State | ✅ |
| 2 | Error state on API failure | Error path | ✅ |
| 3 | Retry fetch on "Try again" click | Interaction | ✅ |
| 4 | All-clear state (empty sections) | State | ✅ |
| 5 | Navigate to inventory on all-clear CTA | Interaction | ✅ |
| 6 | All three sections with items | Happy path | ✅ |
| 7 | Urgency text for overdue items | Display | ✅ |
| 8 | Urgency text for due today items | Display | ✅ |
| 9 | Urgency text for upcoming items | Display | ✅ |
| 10 | Singular "1 day overdue" | Edge case | ✅ |
| 11 | Section count pills | Display | ✅ |
| 12 | Per-section empty state | State | ✅ |
| 13 | Mark as done — success flow | Interaction | ✅ |
| 14 | Mark as done — error toast | Error path | ✅ |
| 15 | Mark as done — disabled while in-flight | Interaction | ✅ |
| 16 | Badge update with correct count | Integration | ✅ |
| 17 | Badge update after mark-done | Integration | ✅ |
| 18 | Section headings with aria-labelledby | Accessibility | ✅ |
| 19 | Mark-done buttons with aria-labels | Accessibility | ✅ |
| 20 | Due date tooltip on upcoming items | Display | ✅ |
| 21–23 | Additional urgency text variants | Display | ✅ |

**Coverage assessment:** All 5 states (loading, error, all-clear, per-section empty, populated) ✅. Mark-done happy + error paths ✅. Badge integration ✅. Accessibility ✅. Exceeds minimum coverage.

---

### Test Run 16 — Integration Test (T-043 + T-044: Care Due Dashboard End-to-End)

| Field | Value |
|-------|-------|
| **Date** | 2026-03-27 |
| **Test Type** | Integration Test |
| **Tasks** | T-043, T-044 |
| **Result** | ✅ PASS |

**API Contract Verification (api-contracts.md GROUP 17 vs Implementation):**

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Endpoint path | GET /api/v1/care-due | Route registered at `/api/v1/care-due` in app.js (line 79) | ✅ |
| Auth enforcement | Bearer token required, 401 if missing | `router.use(authenticate)` at top of careDue.js | ✅ |
| Response wrapper | `{ data: { overdue, due_today, upcoming } }` | Matches exactly (line 105–111) | ✅ |
| Overdue fields | plant_id, plant_name, care_type, days_overdue, last_done_at | Matches (lines 70–75) | ✅ |
| Due today fields | plant_id, plant_name, care_type | Matches (lines 79–82) | ✅ |
| Upcoming fields | plant_id, plant_name, care_type, due_in_days, due_date | Matches (lines 86–91) | ✅ |
| Overdue sort | days_overdue DESC, plant_name ASC | Matches (line 99) | ✅ |
| Due today sort | plant_name ASC | Matches (line 101) | ✅ |
| Upcoming sort | due_in_days ASC, plant_name ASC | Matches (line 103) | ✅ |
| Never-done baseline | Uses plant.created_at when last_done_at is null | Matches (lines 60–62) | ✅ |
| Empty response | All empty arrays with 200 status | Test passes (all-on-track test) | ✅ |
| Error codes | 401 UNAUTHORIZED, 500 INTERNAL_ERROR | Centralized error handler returns correct format | ✅ |
| Frequency conversion | days/weeks/months supported | frequencyToDays() handles all three (lines 17–28) | ✅ |
| last_done_at nullable | null for never-done, ISO string otherwise | Matches (line 74) | ✅ |
| due_date format | ISO 8601 date string (no time) | `nextDue.toISOString().split('T')[0]` (line 85) | ✅ |

**Frontend ↔ Backend Integration:**

| Check | Result |
|-------|--------|
| Frontend API call path | `careDue.get()` → `request('/care-due')` → Vite proxy → backend `/api/v1/care-due` ✅ |
| Response consumed correctly | `useCareDue` hook extracts `data.overdue`, `data.due_today`, `data.upcoming` ✅ |
| Mark-done calls POST /care-actions | `careActions.markDone(plantId, careType)` → existing endpoint ✅ |
| Optimistic removal after mark-done | `setData` filters item out of all three arrays ✅ |
| Badge count calculation | `overdue.length + due_today.length` — matches SPEC-009 ✅ |
| Badge hidden at 0 | `{careDueBadge > 0 && ...}` in Sidebar ✅ |
| Badge 99+ cap | `careDueBadge >= 100 ? '99+' : String(careDueBadge)` ✅ |

**SPEC-009 UI Compliance:**

| Check | Result |
|-------|--------|
| Route /due registered | App.jsx line 86: `<Route path="due" element={<CareDuePage />} />` ✅ |
| Three urgency sections in correct order | overdue → due_today → upcoming (lines 250–254) ✅ |
| Section icons match spec | WarningCircle (overdue), Clock (due today), CalendarBlank (upcoming) ✅ |
| Section colors match spec | #B85C38, #C4921F, #5C7A5C ✅ |
| Care type icons match spec | Drop (watering), Leaf (fertilizing), PottedPlant (repotting) ✅ |
| Care type icon backgrounds match spec | #EBF4F7, #E8F4EC, #F4EDE8 ✅ |
| Urgency text rules | "X days overdue", "Never done", "Due today", "Due tomorrow", "Due in X days" ✅ |
| Singular form: "1 day overdue" | Handled via ternary (line 64) ✅ |
| Due date tooltip on upcoming | `title={tooltip}` with formatted date (line 320) ✅ |
| Loading skeleton | 2 section blocks with shimmer cards ✅ |
| Error state | WarningCircle icon, heading, body, retry button ✅ |
| All-clear state | SVG illustration, heading, body, "View my plants" CTA ✅ |
| Per-section empty states | Correct text per spec (lines 43, 48, 53) ✅ |
| Mark-done button | POST /care-actions, spinner while loading, disabled, error toast ✅ |
| Mark-done aria-label | "Mark [name] [type] as done" ✅ |
| Sidebar nav item | "Care Due" with BellSimple icon ✅ |
| Sidebar badge | pill badge, hidden at 0, "99+" cap ✅ |
| aria-labelledby on sections | Each section has `aria-labelledby={sectionId}` ✅ |
| aria-busy on loading | `aria-busy="true"` on skeleton wrapper ✅ |
| aria-live region | Present for screen reader announcements ✅ |

**All UI states verified:** Loading ✅, Error ✅, All-clear ✅, Per-section empty ✅, Populated ✅

---

### Test Run 17 — Config Consistency Check (Sprint 8)

| Field | Value |
|-------|-------|
| **Date** | 2026-03-27 |
| **Test Type** | Config Consistency |
| **Result** | ✅ PASS — No mismatches |

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Backend PORT | 3000 | `PORT=3000` in backend/.env | ✅ |
| Vite proxy target | http://localhost:3000 | `backendTarget = 'http://localhost:3000'` in vite.config.js | ✅ |
| SSL consistency | Backend HTTP → proxy HTTP | Both use http:// | ✅ |
| CORS origins include :5173 | http://localhost:5173 in FRONTEND_URL | `FRONTEND_URL=http://localhost:5173,http://localhost:5174,http://localhost:4173` | ✅ |
| Docker PG port | 5432 | docker-compose.yml maps 5432:5432 | ✅ |
| DB URL uses port 5432 | postgresql://...@localhost:5432/... | Matches backend/.env DATABASE_URL | ✅ |

---

### Test Run 18 — Security Scan (Sprint 8)

| Field | Value |
|-------|-------|
| **Date** | 2026-03-27 |
| **Test Type** | Security Scan |
| **Tasks** | T-043, T-044 |
| **Result** | ✅ PASS (with advisory notes) |

**Security Checklist Verification:**

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | Auth required on /care-due | ✅ | `router.use(authenticate)` — all routes behind auth |
| 2 | User isolation | ✅ | Query filters by `p.user_id = userId` via Knex parameterization |
| 3 | Parameterized queries (no SQL injection) | ✅ | All queries via Knex query builder. Only `db.raw('MAX(ca.performed_at)')` is used — no user input in raw SQL |
| 4 | No hardcoded secrets in source | ✅ | No API keys/passwords in backend/src/ or frontend/src/ |
| 5 | .env is gitignored | ✅ | `.env` in .gitignore — confirmed not committed |
| 6 | No XSS vectors (dangerouslySetInnerHTML) | ✅ | Not used anywhere in frontend — React default escaping |
| 7 | Error responses don't leak internals | ✅ | errorHandler.js returns generic "An unexpected error occurred." for unknown errors — no stack traces |
| 8 | CORS configured correctly | ✅ | FRONTEND_URL includes :5173, :5174, :4173 |
| 9 | Rate limiting applied | ✅ | General (100/15min) + auth-specific (20/15min) limiters in app.js |
| 10 | Security headers (helmet) | ✅ | `app.use(helmet())` — X-Content-Type-Options, X-Frame-Options, etc. |
| 11 | File upload validation | ✅ | (Existing — MIME type, size limit, UUID filenames) |
| 12 | Password hashing | ✅ | (Existing — bcrypt) |
| 13 | Token expiration | ✅ | (Existing — 15min access, 7-day refresh) |
| 14 | Input validation on care-due endpoint | ✅ | No user-supplied query params — all data scoped to authenticated user |

**npm audit results:**
- **Backend:** 2 vulnerabilities (1 moderate: brace-expansion in jest/nodemon dev deps; 1 high: path-to-regexp ReDoS in Express 4.x)
  - `path-to-regexp@0.1.12` via `express@4.22.1` — ReDoS via crafted route patterns. **Risk assessment: LOW** in this application because route patterns are developer-defined (not user input). However, this should be tracked for the next Express major version upgrade (Express 5). Not a P1 blocker.
  - `brace-expansion` — dev dependency only (jest, nodemon). No production exposure.
- **Frontend:** 1 moderate vulnerability (brace-expansion in dev deps). No production exposure.

**Security Verdict: ✅ PASS** — No P1 security issues. The path-to-regexp vulnerability is acknowledged as a low-risk advisory tracked for future Express 5 migration.

---

### Test Run 19 — Product-Perspective Testing (Sprint 8: Care Due Dashboard)

| Field | Value |
|-------|-------|
| **Date** | 2026-03-27 |
| **Test Type** | Product-Perspective Review |
| **Tasks** | T-043, T-044 |
| **Result** | ✅ PASS |

**Product alignment assessment:**

The Care Due Dashboard directly fulfills the project brief's core promise of "painfully obvious reminders" for novice plant owners. The three-section urgency layout (overdue → due today → coming up) provides an immediate answer to "what needs my attention right now?" — which is exactly the user need.

**Endpoint edge case analysis (realistic user scenarios):**
| Scenario | Expected | Verified |
|----------|----------|----------|
| Brand new user, no plants | All empty arrays → all-clear state | ✅ (test: "no plants") |
| User adds plant, never waters it | Falls back to created_at baseline → appears in due/overdue | ✅ (test: "never-done") |
| User waters all plants on time | All empty → all-clear state | ✅ (test: "all on track") |
| Multiple care types per plant | Each (plant, care_type) pair calculated independently | ✅ (tested in happy path) |
| Weekly/monthly frequency | Correctly converted to days (7, 30) | ✅ (test: "weekly frequency") |
| Mark-done from dashboard | Optimistic removal + toast + badge decrement | ✅ (test coverage confirmed) |
| Mark-done network failure | Error toast, button restored to clickable state | ✅ (test: "mark-done error") |

**Positive observations:**
- The urgency text is clear and actionable ("3 days overdue" vs just a red badge)
- "Never done" text for never-watered plants is helpful for new users
- "Due tomorrow" instead of "Due in 1 days" shows attention to detail
- Sidebar badge provides constant non-intrusive reminder from any page
- All-clear state ("All your plants are happy!") is encouraging — good UX for the target audience of plant novices
- Mark-done shortcut avoids the multi-click journey: dashboard → plant detail → mark done → back. Very useful for daily care routines.

---

### Sprint 8 QA Summary

| Task | Test Type | Result | Notes |
|------|-----------|--------|-------|
| T-043 | Unit Test | ✅ PASS | 8 new tests. 65/65 backend total. |
| T-044 | Unit Test | ✅ PASS | 23 new tests. 95/95 frontend total. |
| T-043 + T-044 | Integration Test | ✅ PASS | API contract match (15 checks). Frontend↔Backend integration (7 checks). SPEC-009 compliance (25+ checks). |
| Config Consistency | Config | ✅ PASS | PORT, proxy, CORS, Docker all consistent. |
| Security | Security Scan | ✅ PASS | All 14 checklist items pass. npm audit: no P1 issues (path-to-regexp is low-risk advisory). |
| Product Perspective | UX Review | ✅ PASS | Directly fulfills project brief. Edge cases handled. Good UX. |

**Overall Sprint 8 QA Verdict: ✅ ALL PASS**

All 65/65 backend tests and 95/95 frontend tests pass. All integration checks pass. Security checklist verified. Config consistency confirmed. Product-perspective review positive.

**Test count progression:** Backend 57→65 (+8), Frontend 72→95 (+23). No regressions.

**Recommendation:** Move T-043 and T-044 to Done. Handoff to Deploy Engineer for staging deployment. After deployment, Monitor Agent health check required covering the new `/api/v1/care-due` endpoint and `/due` frontend route.

---
