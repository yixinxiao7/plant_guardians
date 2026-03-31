# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #14 — 2026-04-05 to 2026-04-09

**Sprint Goal:** Execute the full Sprint #13 scope — fix the three critical post-MVP bugs (T-058 pool idle 500, T-059 broken plant photo, T-060 Care Due timezone), run dependency housekeeping (T-061), fix health endpoint docs (T-062), and implement the first post-MVP feature: dark mode (T-063). These tasks have been queued for two sprint cycles; all must complete this sprint.

**Context:** Sprint #12 delivered the MVP (all user flows verified). Sprint #13 was planned but did not execute — all six tasks remain untouched at Backlog. Three P1 bugs discovered during Sprint #12 user testing (FB-057, FB-045, FB-046) pose active production risk and UX failures. The dark mode feature (B-005) was the first post-MVP feature planned and must begin this sprint. Staging environment from Sprint #12 remains healthy (Deploy Verified: Yes, PID 72167 backend / PID 72179 frontend on http://localhost:4175).

---

## In Scope

### P1 — Bug Fixes (Must Complete This Sprint)

- [ ] **T-058** — Backend Engineer: Fix pool idle reaping causing transient 500 on POST /api/v1/auth/login (FB-057) **(P1)**
  - **Context:** T-056 fixed cold-start 500s by warming the pool at server startup. However, `knexfile.js` sets `idleTimeoutMillis: 30000` — connections are reaped after 30 seconds of inactivity. When any request arrives after a 30-second idle period, tarn races to refill `min: 2` connections, and the `afterCreate` validation hook adds latency causing a brief window where requests fail with 500. The issue is self-healing (1–3 requests) but poses a serious UX and production risk.
  - **Acceptance Criteria:**
    - Root cause confirmed: idle reaping is the trigger (not cold-start, which T-056 already fixed)
    - Fix implemented: increase `idleTimeoutMillis` from `30000` to `600000` (10 minutes) in `knexfile.js` production/staging config; OR add a periodic keepalive query (e.g., `setInterval(() => db.raw('SELECT 1'), 25000)`) in `server.js`; OR disable `idleTimeoutMillis` entirely and rely on PostgreSQL's server-side keepalives
    - Regression test added: idle server for >30 seconds (or simulate with short timeout), then immediately call POST /auth/login 5 times → 5/5 return 200 (no 500s)
    - All 74/74 backend tests still pass after fix
  - **Dependencies:** None — start immediately.
  - **Fix locations:** `backend/knexfile.js` (idleTimeoutMillis), possibly `backend/src/server.js` (keepalive interval)

---

- [ ] **T-059** — Backend Engineer: Fix plant photo broken after upload and save (FB-045) **(P1)**
  - **Context:** Uploading a photo to a plant appears to succeed (no error shown), but the resulting photo URL is not resolvable in the browser — the image appears broken. Likely root cause: the backend does not serve the `./uploads/` directory as static files, or `photo_url` is stored as a server-local path rather than a publicly accessible URL.
  - **Acceptance Criteria:**
    - Root cause identified: check `backend/src/app.js` for `express.static('./uploads')` or equivalent; check the URL returned by `POST /plants/:id/photo` for whether it is browser-accessible
    - Fix implemented: backend serves the uploads directory at `/uploads/` (or `/api/v1/uploads/` — must be consistent with what is stored in `photo_url`); photo URL returned by upload endpoint is a relative or absolute URL that the browser can load (e.g., `/uploads/<filename>` or `http://localhost:3000/uploads/<filename>`)
    - End-to-end test: upload a photo via `POST /plants/:id/photo` → retrieve the plant via `GET /plants/:id` → `photo_url` in response is a URL that returns HTTP 200 when fetched
    - Unit test added covering photo URL construction
    - All 74/74 backend tests still pass after fix
  - **Dependencies:** None — start immediately.
  - **Fix locations:** `backend/src/app.js` (express.static), `backend/src/routes/plants.js` or equivalent photo upload route (URL construction in response body)

---

- [ ] **T-060** — Backend Engineer + Frontend Engineer: Fix Care Due Dashboard UTC/local timezone mismatch (FB-046) **(P1)**
  - **Context:** `backend/src/routes/careDue.js` computes "today" using UTC midnight. If the user's local timezone is behind UTC (e.g., US Eastern = UTC-5), the backend's UTC "today" is already tomorrow from the user's perspective. This shifts all urgency bucketing by one day — plants appear one bucket too urgent.
  - **Acceptance Criteria:**
    - Backend: `GET /api/v1/care-due` accepts an optional `utcOffset` query parameter (integer, minutes from UTC, e.g. `-300` for UTC-5). If provided, backend computes local midnight using the offset. If omitted, falls back to UTC (preserves existing behavior for API consumers that don't send the param).
    - Frontend: `CareDuePage.jsx` (or its data-fetching logic) sends `?utcOffset=<value>` where value is `new Date().getTimezoneOffset() * -1` (converting JS's inverted offset to minutes-from-UTC). Example: US Eastern Standard Time → JS returns `300` → send `?utcOffset=-300`.
    - End-to-end test: verify a plant due "today" in the user's local timezone appears in the "Due Today" section, not "Overdue".
    - All 74/74 backend tests and 130/130 frontend tests still pass after fix.
  - **Dependencies:** Backend half can start immediately. Frontend half can start in parallel. Both must be Done before QA can verify end-to-end.
  - **Fix locations:** `backend/src/routes/careDue.js` (accept `utcOffset` param, adjust today boundary), `frontend/src/pages/CareDuePage.jsx` or `frontend/src/utils/api.js` (send utcOffset in request)
  - **Note:** If the current codebase uses a helper function for UTC day calculation, it may need to be updated or a new local-timezone variant added.

---

### P3 — Technical Debt (Begin After P1 Tasks In Progress)

- [ ] **T-061** — Backend Engineer: Run `npm audit fix` in backend and frontend (FB-051) **(P3)**
  - **Acceptance Criteria:**
    - `npm audit fix` run in `backend/` — resolve available non-breaking vulnerabilities
    - `npm audit fix` run in `frontend/` — resolve available non-breaking vulnerabilities
    - `npm audit` output reviewed; remaining vulnerabilities (if any) documented and compared against FB-031, FB-037, FB-051 — no new high-severity prod vulnerabilities introduced
    - All 74/74 backend tests still pass; all 130/130 frontend tests still pass
  - **Dependencies:** None.
  - **Note:** Do NOT run `npm audit fix --force` — only safe, non-breaking fixes.

---

- [ ] **T-062** — QA Engineer: Fix health endpoint documentation discrepancy (P3)
  - **Context:** The backend health endpoint is `/api/health` (not `/api/v1/health`), but `api-contracts.md` may reference `/api/v1/health`. This is a documentation inconsistency that could confuse future contributors.
  - **Acceptance Criteria:**
    - Check `.workflow/api-contracts.md` — if it references `/api/v1/health`, update to `/api/health`
    - Check `.agents/monitor-agent.md` — if it references `/api/v1/health`, update to `/api/health`
    - Verify `GET /api/health` returns 200 on staging (already confirmed — no code change needed, docs only)
    - No test changes required (docs-only fix)
  - **Dependencies:** None.

---

### P2 — Post-MVP Feature (Begin After P1 Bug Fixes Are In Review)

- [ ] **T-063** — Design Agent + Frontend Engineer: Implement dark mode (B-005) **(P2)**
  - **Context:** The app's Japandi design aesthetic (warm, minimal, botanical) is well-suited to a high-quality dark mode. This is the first post-MVP feature. The app currently has no dark mode support.
  - **Design Agent must deliver first:** A dark mode color spec in `.workflow/ui-spec.md` (new section: "Dark Mode — Color Tokens"). The spec must define:
    - Background colors (deep off-black / dark earthy tones, not pure #000000)
    - Surface colors (cards, modals, sidebar)
    - Text colors (primary, secondary, muted)
    - Accent/interactive colors (buttons, links, badges — warm botanical palette must hold in dark context)
    - Status colors (red/overdue, amber/due, green/on-track — ensure sufficient contrast in dark context)
    - Border colors
    - How the mode is toggled (system preference via `prefers-color-scheme` media query AND a manual toggle in the Profile page)
  - **Frontend Engineer (after Design Agent spec is ready):**
    - Implement CSS custom properties / Tailwind dark class for all color tokens
    - Add `prefers-color-scheme` detection and honor it as the default
    - Add a manual dark/light toggle in `ProfilePage.jsx` (persist preference in `localStorage`)
    - All 7 screens verified in dark mode: Login, Inventory, Add Plant, Edit Plant, Plant Detail, Care History, Care Due Dashboard, AI Advice Modal, Profile
    - Ensure confetti animation and loading skeletons look correct in dark mode
    - All 130/130 frontend tests still pass (add at least 3 new tests for toggle logic)
  - **Acceptance Criteria:**
    - `prefers-color-scheme: dark` automatically activates dark mode on first visit
    - Manual toggle in Profile persists across page refreshes (localStorage)
    - All text in dark mode meets WCAG AA contrast (4.5:1 minimum)
    - All 7 screens render correctly in dark mode (no invisible text, no white-on-white)
    - No regressions: 130/130 frontend tests pass
  - **Blocked By:** Design Agent must write dark mode spec before Frontend Engineer begins implementation.

---

## Out of Scope

- Social auth (Google OAuth) — B-001 — post-sprint
- Push notifications for care reminders — B-002 — post-sprint
- Plant sharing / public profiles — B-003 — post-sprint
- Care history chart / analytics — B-004 — post-sprint
- Flaky careDue test investigation (FB-050) — P3 backlog
- Long plant name max-length validation (FB-055) — cosmetic backlog
- Express 5 migration — advisory backlog; no breaking-change-safe path yet
- Production deployment execution (runbook exists; awaits project owner SSL certs)

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Backend Engineer | Pool idle fix + photo URL fix + timezone fix + npm audit | T-058 (P1), T-059 (P1), T-060 backend half (P1), T-061 (P3) |
| Frontend Engineer | Timezone fix frontend half + dark mode implementation | T-060 frontend half (P1), T-063 frontend impl (P2, after Design Agent spec) |
| Design Agent | Dark mode color spec | T-063 design spec (P2 — write spec in ui-spec.md before frontend begins) |
| QA Engineer | Verify all bug fixes + dark mode + docs fix | T-058, T-059, T-060, T-063 QA; T-062 (P3) |
| Deploy Engineer | Staging re-deploy after P1 bug fixes QA-pass | After T-058 + T-059 + T-060 QA |
| Monitor Agent | Post-deploy health check — confirm pool idle 500 resolved | After Deploy Engineer re-deploy |
| Manager | Sprint coordination, code review | Ongoing |

---

## Dependency Chain (Critical Path)

```
T-058 (Pool idle fix — P1, START IMMEDIATELY)
T-059 (Photo URL fix — P1, START IMMEDIATELY, parallel)
T-060-backend (Timezone fix backend — P1, START IMMEDIATELY, parallel)
T-060-frontend (Timezone fix frontend — P1, begin parallel; requires T-060-backend API contract)
  ↓ (all three P1 tasks Done)
QA verifies T-058, T-059, T-060
  ↓
Deploy Engineer re-deploys to staging
  ↓
Monitor Agent health check — confirm pool idle 500 resolved

[Parallel — no P1 dependency]
T-061 (npm audit fix — P3, start any time)
T-062 (Health endpoint docs — P3, start any time)

[Post-MVP Feature — after P1 tasks In Review]
Design Agent writes dark mode spec (T-063 design)
  ↓
Frontend Engineer implements dark mode (T-063 frontend)
  ↓
QA verifies dark mode
```

**Critical path:** T-058 ∥ T-059 ∥ T-060 → QA → Deploy → Monitor → staging verified clean.

---

## Definition of Done

Sprint #14 is complete when:

- [ ] T-058: Pool idle reaping fix deployed; idle-then-login regression test passes; 74/74 backend tests pass; Monitor Agent confirms no 500s on login after idle period
- [ ] T-059: Plant photo displays correctly after upload and save; photo URL is browser-accessible; 74/74 backend tests pass
- [ ] T-060: Care Due Dashboard shows correct urgency sections for user's local timezone; utcOffset param accepted by backend and sent by frontend; 74/74 backend + 130/130 frontend tests pass
- [ ] T-061: `npm audit fix` run in both backend and frontend; no new high-severity prod vulnerabilities; all tests pass
- [ ] T-062: Health endpoint docs corrected in api-contracts.md and monitor-agent.md
- [ ] T-063 (stretch): Dark mode implemented; all 7 screens render correctly; WCAG AA contrast; toggle persists; 130/130 frontend tests pass
- [ ] Deploy Verified: Yes from Monitor Agent post-deploy health check
- [ ] No regressions: all backend + frontend tests at or above Sprint #12 baselines (74/74 backend, 130/130 frontend)

---

## Success Criteria

- **Auth reliability confirmed post-idle** — POST /auth/login returns 200 consistently even after 30+ seconds of server inactivity (pool idle reaping no longer causes transient 500s)
- **Photo upload works end-to-end** — plant photos display correctly after upload and save; no broken image icons
- **Care Due Dashboard is timezone-accurate** — urgency sections reflect the user's local day, not UTC
- **Dependencies up to date** — npm audit reports no new high-severity vulnerabilities in production code
- **Dark mode (stretch)** — app renders correctly in dark mode; preference persists; WCAG AA contrast

---

## Blockers

- T-063 (dark mode frontend) is blocked until Design Agent writes the dark mode color spec in ui-spec.md.
- All other Sprint #14 tasks have no blockers — start immediately.

---

*Sprint #14 plan written by Manager Agent on 2026-03-30.*
