# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #19 — 2026-04-07 to 2026-04-13

**Sprint Goal:** Resolve pre-existing technical debt (auth.test Secure cookie fix, PlantSearchFilter/CareDuePage CSS token migration), then add the next high-value user-facing feature: a **Care Streak tracker** that rewards users for consecutive days of care actions — helping novice plant owners build the habit of consistent plant care.

**Context:** Sprint #18 delivered inventory search/filter, ProfilePage token migration, and Care Due focus management in a fifth consecutive clean sprint. Backend is at 120/121 tests (1 pre-existing auth.test Secure cookie false-fail), frontend at 177/177. Deploy Verified: Yes at SHA 04963bd8. Sprint #19 closes two known debt items, then adds Care Streaks — a gamification feature that directly serves the product's core mission: helping plant-killers build care habits through positive reinforcement.

---

## In Scope

### P2 — Technical Debt & Polish (start immediately, no dependencies)

- [ ] **T-087** — Backend Engineer: Fix `auth.test.js` Secure cookie assertion **(P2)**
  - **Description:** The `auth.test.js` test "should register a new user, return access_token in body and refresh_token in cookie" has been asserting the `Secure` flag on the refresh_token cookie. In NODE_ENV=test (non-HTTPS), the cookie correctly omits `Secure`. Choose one of: (a) update the auth route `server.js`/`app.js` to set `secure: process.env.NODE_ENV === 'production'` on the cookie, or (b) update the test assertion to only check `Secure` when NODE_ENV=production. Option (a) is preferred — it ensures production deployments do set the flag correctly while tests remain valid.
  - **Acceptance Criteria:**
    - `auth.test.js` passes in full suite: all 121/121 backend tests pass (no failing suites)
    - Refresh token cookie uses `secure: process.env.NODE_ENV === 'production'` in the auth route
    - No regression to existing auth behaviour — login, register, refresh, logout all still pass
    - Code review confirms no secrets or env vars leaked in test assertions
  - **Dependencies:** None — start immediately.
  - **Fix locations:** `backend/src/routes/auth.js` (cookie options), `backend/tests/auth.test.js` (if assertion approach chosen)

---

- [ ] **T-088** — Frontend Engineer: Migrate status-tab hardcoded colors to CSS custom properties **(P2)**
  - **Description:** Two files define status/urgency colors as hardcoded hex values instead of CSS custom properties: (1) `PlantSearchFilter.jsx` — `ACTIVE_STYLES` constant at lines 18–34 defines `background`, `color`, and `borderColor` for Overdue, Due Today, On Track tabs as raw hex. (2) `CareDuePage.jsx` — `SECTION_CONFIG` and `CARE_TYPE_CONFIG` define urgency-section background, border, and text colors as raw hex. These are semantically consistent with each other but bypass the design system. Add new CSS custom properties for each semantic status color (overdue, due-today, on-track) to `design-tokens.css` in both light and dark token sets, then replace all hardcoded hex values in both components with the new tokens.
  - **Acceptance Criteria:**
    - `design-tokens.css` adds semantic status tokens: `--color-status-overdue-bg`, `--color-status-overdue-text`, `--color-status-overdue-border`, `--color-status-due-today-bg`, `--color-status-due-today-text`, `--color-status-due-today-border`, `--color-status-on-track-bg`, `--color-status-on-track-text`, `--color-status-on-track-border` — defined for both `[data-theme="light"]` and `[data-theme="dark"]`
    - `PlantSearchFilter.jsx` `ACTIVE_STYLES` uses only CSS variable references (no raw hex)
    - `CareDuePage.jsx` `SECTION_CONFIG` and `CARE_TYPE_CONFIG` use only CSS variable references (no raw hex)
    - No hardcoded hex color values remain in either component file
    - Visual appearance unchanged in light mode; dark mode renders correctly with token values
    - 177/177 frontend tests still pass; no new tests expected (visual-only change; verify no snapshot breakage)
  - **Dependencies:** None — start immediately, parallel to T-087.
  - **Fix locations:** `frontend/src/styles/design-tokens.css`, `frontend/src/components/PlantSearchFilter.jsx`, `frontend/src/pages/CareDuePage.jsx`

---

### P1 — Care Streak Feature

- [ ] **T-089** — Design Agent: Write SPEC-014 — Care Streak UX spec **(P1)**
  - **Description:** Design the Care Streak feature — a motivational tracker showing users their current streak of consecutive days with at least one care action completed. Cover: (1) streak display location — visible on the Profile page prominently and as a compact indicator in the inventory sidebar or header; (2) streak definition — consecutive calendar days (user's local timezone) with ≥1 care action logged; (3) streak states — no streak yet (0 days), active streak (1+), streak broken (yesterday missed); (4) visual treatment — streak count, flame or leaf icon, congratulatory messages for milestones (7, 30, 100 days); (5) milestone celebration — confetti or animation on milestone days; (6) streak freeze concept — optional suggestion for a "grace period" approach; (7) empty state (new user, no actions yet); (8) dark mode and accessibility.
  - **Acceptance Criteria:**
    - SPEC-014 written to `.workflow/ui-spec.md` (appended as a new section)
    - Covers streak display on Profile page and compact indicator location
    - Covers all streak states: no streak, active, broken
    - Covers milestone days (7, 30, 100) with visual celebration
    - Covers empty state (new user, zero care actions)
    - Dark mode and accessibility notes included (aria-label for streak count, no color-only information)
  - **Dependencies:** None — start immediately.
  - **Fix locations:** `.workflow/ui-spec.md`

---

- [ ] **T-090** — Backend Engineer: Care streak calculation endpoint `GET /api/v1/care-actions/streak` **(P1)**
  - **Description:** Add a new authenticated endpoint that computes the current user's care streak — the count of consecutive calendar days (in the user's local timezone) on which at least one care action was recorded. Accept optional `utcOffset` query parameter (same range as care-due: -840 to +840 minutes) to apply timezone offset to UTC timestamps. Streak is 0 if no care actions exist or if yesterday (in local time) had no care action. Streak counts today even if it's the first action today (i.e., today's action is streak day 1 if yesterday was also a day). Return the streak count and longest-ever streak for historical context.
  - **Acceptance Criteria:**
    - `GET /api/v1/care-actions/streak` — authenticated, 401 if not authed
    - Optional `utcOffset` param (integer, -840 to +840); defaults to 0 if omitted; 400 VALIDATION_ERROR if out of range
    - Response: `{ "data": { "currentStreak": N, "longestStreak": N, "lastActionDate": "YYYY-MM-DD" | null } }`
    - currentStreak = 0 if no care actions ever recorded
    - currentStreak = N if each of the last N consecutive days (including today if action today) had ≥1 care action
    - longestStreak = highest consecutive-day count ever achieved by this user
    - lastActionDate = local-timezone date of the most recent care action
    - Unit tests: no actions (streak=0), single action today (streak=1), 3-day streak, streak broken by gap, today+yesterday (streak=2), utcOffset applied correctly, 401 no auth, utcOffset out of range (400)
    - All 121/121 backend tests pass; add minimum 8 new tests
    - API contract published to `.workflow/api-contracts.md` before T-091 begins
  - **Blocked By:** None — start immediately. Publish API contract before T-091 begins.
  - **Fix locations:** `backend/src/routes/careActions.js` (new GET /streak handler), `backend/src/models/CareAction.js` (streak calculation method)

---

- [ ] **T-091** — Frontend Engineer: Care streak display — Profile page + sidebar indicator **(P1)**
  - **Description:** Surface the care streak data (from `GET /api/v1/care-actions/streak`) in two places: (1) **Profile page** — a prominent streak stat tile showing current streak with leaf/flame icon, congratulatory message for milestone days (7, 30, 100), and longest streak as a secondary stat; (2) **Sidebar** — a compact streak indicator (icon + count) above or below the nav links, visible when streak ≥ 1. On milestone days, show a brief confetti or sparkle animation on the Profile page (respecting `prefers-reduced-motion`). Per SPEC-014.
  - **Acceptance Criteria:**
    - Profile page renders streak stat tile with current streak count and longest streak
    - Milestone messages shown for streaks of 7, 30, 100+ days
    - Milestone celebration animation (confetti/sparkle) on Profile page for milestone days; `prefers-reduced-motion` skips animation
    - Sidebar shows compact streak indicator (icon + number) when currentStreak ≥ 1; hidden when streak = 0
    - Empty/new-user state: friendly "Start your streak today!" message when streak = 0
    - Dark mode: all new elements use CSS custom properties
    - Accessibility: streak count has descriptive `aria-label`; no color-only information
    - Unit tests: renders streak tile with count, renders milestone message at 7/30/100, hides sidebar badge at 0 streak, shows sidebar badge at 1+ streak, empty state renders, loading skeleton shown during fetch
    - All 177/177 frontend tests still pass; add minimum 6 new tests
  - **Blocked By:** T-089 (SPEC-014 must exist), T-090 (API contract must be published)
  - **Fix locations:** `frontend/src/pages/ProfilePage.jsx`, `frontend/src/components/AppShell.jsx` or sidebar component, new streak API method in `frontend/src/api.js`

---

## Out of Scope

- Social auth (Google OAuth) — B-001 — post-sprint
- Push/email notifications for care reminders — B-002 — post-sprint
- Plant sharing / public profiles — B-003 — post-sprint
- Reference photo in AI advice results (FB-081) — botanical image API, post-MVP
- Production deployment execution — blocked on project owner providing SSL certs
- Express 5 migration — advisory backlog; no breaking-change-safe path confirmed
- Soft delete / grace period for account deletion (FB-077) — backlog
- `/ai/identify` 502 message specificity improvement — backlog
- Endpoint-specific rate limiting on `/care-actions/stats` (FB-073) — backlog
- Care history pagination / infinite scroll — backlog

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Design Agent | Care Streak UX spec | T-089 (P1, start immediately) |
| Backend Engineer | Fix auth.test Secure cookie + Streak endpoint | T-087 (P2, start immediately), T-090 (P1, start immediately, publish API contract before T-091) |
| Frontend Engineer | CSS token migration + Care Streak UI | T-088 (P2, start immediately), T-091 (P1, after T-089 spec + T-090 contract) |
| QA Engineer | Full QA of T-087–T-091, security checklist | After all tasks complete |
| Deploy Engineer | Staging re-deploy after QA sign-off | After all tasks QA-verified |
| Monitor Agent | Post-deploy health check — verify `/care-actions/streak` endpoint on staging | After Deploy Engineer re-deploy |
| Manager | Sprint coordination, API contract review, code review | Ongoing |

---

## Dependency Chain (Critical Path)

```
T-087 (auth.test fix — Backend, START IMMEDIATELY)
T-088 (CSS token migration — Frontend, START IMMEDIATELY — parallel)
  ↓
QA verifies T-087 + T-088

T-089 (SPEC-014 — Design Agent, START IMMEDIATELY)
  ↓ (spec complete)

T-090 (streak endpoint — Backend, START IMMEDIATELY — publish contract before T-091)
  ↓ (publish API contract to api-contracts.md)
T-091 (streak UI — Frontend, after T-089 spec + T-090 contract)
  ↓
QA verifies T-089 + T-090 + T-091 end-to-end

[After all tasks QA-verified]
Deploy Engineer re-deploys to staging
  ↓
Monitor Agent health check — verify GET /care-actions/streak on staging
```

**Critical path:** T-089 + T-090 (parallel start) → T-091 → QA → Deploy → Monitor → staging verified.
**Parallel path:** T-087 + T-088 can proceed immediately and independently.

---

## Definition of Done

Sprint #19 is complete when:

- [ ] T-087: `auth.test.js` passes; all 121/121 backend tests pass; refresh token cookie uses `secure: NODE_ENV === 'production'`
- [ ] T-088: `design-tokens.css` has 9 new semantic status tokens; no hardcoded hex in `PlantSearchFilter.jsx` or `CareDuePage.jsx`; 177/177 frontend tests pass
- [ ] T-089: SPEC-014 written covering streak states, milestone celebrations, Profile placement, sidebar indicator, empty state, dark mode, and accessibility
- [ ] T-090: `GET /api/v1/care-actions/streak` implemented; API contract published; 8+ new tests; all 121/121 backend tests pass
- [ ] T-091: Streak tile on Profile page functional; sidebar indicator visible when streak ≥ 1; milestone messages at 7/30/100 days; 6+ new tests; all 177/177 frontend tests pass
- [ ] Deploy Verified: Yes from Monitor Agent post-deploy health check
- [ ] No regressions: backend ≥ 121/121, frontend ≥ 177/177

---

## Success Criteria

- **Auth tests clean** — `npm test` in backend returns 121/121 pass; no pre-existing failures
- **Design system complete** — No hardcoded status-color hex values remain in `PlantSearchFilter.jsx` or `CareDuePage.jsx`; all status colors driven by CSS custom properties
- **Streak visible** — User visits Profile page and sees their current care streak count with appropriate motivational copy
- **Sidebar streak badge** — Users with an active streak see the streak count in the sidebar without navigating to the Profile page
- **Milestones celebrated** — A user with a 7-day streak sees a congratulatory message and celebration animation on the Profile page
- **Test suite grows** — Backend adds minimum 8 new tests; frontend adds minimum 6 new tests; no regressions

---

## Blockers

- T-091 (streak UI) is blocked until: (1) Design Agent publishes SPEC-014; (2) Backend Engineer publishes `GET /care-actions/streak` API contract
- T-087, T-088, T-089, T-090 have no blockers — all can start immediately in parallel
- Production deployment remains blocked on project owner providing SSL certificates

---

*Sprint #19 plan written by Manager Agent on 2026-04-05.*
