# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #15 — 2026-04-01 to 2026-04-05

**Sprint Goal:** Deliver the Care History Analytics feature (B-004) — the most impactful post-MVP user-facing addition — while hardening the pool startup warm-up edge case (T-066), verifying the HttpOnly cookie flow end-to-end in a browser, and polishing confetti for dark mode (B-007). The result: users gain actionable care trend insights, and the platform moves meaningfully toward production readiness.

**Context:** Sprint #14 delivered all six planned tasks with zero carry-over — the first clean sprint in the post-MVP phase. All P1 bugs (pool idle, broken photos, timezone mismatch) are resolved. Dark mode shipped. The test suite stands at 83 backend + 135 frontend tests (all passing), npm audit reports 0 vulnerabilities, and staging is healthy (Deploy Verified: Yes, H-171). The next priority is adding user-facing value through analytics while cleaning up remaining minor technical debt.

---

## In Scope

### P1 — Post-MVP Feature: Care History Analytics

- [ ] **T-064** — Backend Engineer: Implement `GET /api/v1/care-actions/stats` endpoint **(P1)**
  - **Description:** Provide aggregated care action statistics per plant and per care type to power frontend charts.
  - **Acceptance Criteria:**
    - Endpoint: `GET /api/v1/care-actions/stats` (authenticated)
    - Response shape:
      ```json
      {
        "data": {
          "total_care_actions": 42,
          "by_plant": [
            { "plant_id": "uuid", "plant_name": "Monstera", "count": 15, "last_action_at": "ISO8601" }
          ],
          "by_care_type": [
            { "care_type": "watering", "count": 30 },
            { "care_type": "fertilizing", "count": 8 },
            { "care_type": "repotting", "count": 4 }
          ],
          "recent_activity": [
            { "plant_name": "Monstera", "care_type": "watering", "performed_at": "ISO8601" }
          ]
        }
      }
      ```
    - `recent_activity` returns the 10 most recent care actions across all plants, sorted by `performed_at` DESC
    - User isolation enforced — only the authenticated user's data
    - Auth required — 401 if missing/invalid token
    - Unit tests: happy path (with data), empty state (no care actions yet), 401, user isolation
    - All 83/83 backend tests still pass after addition
  - **API contract:** Add to `.workflow/api-contracts.md` before Frontend Engineer begins
  - **Dependencies:** None — start immediately.
  - **Fix locations:** `backend/src/routes/careActions.js` or new route file, `backend/src/models/CareAction.js`

---

- [ ] **T-065** — Design Agent + Frontend Engineer: Implement Care History Analytics page **(P1)**
  - **Design Agent must deliver first:** Add SPEC-011 to `.workflow/ui-spec.md` covering the analytics view. The spec must define:
    - Page layout: summary stats bar (total actions, most-cared-for plant, streak) + care breakdown chart + recent activity feed
    - Chart type: bar chart or donut chart showing care actions by type (watering / fertilizing / repotting)
    - Per-plant care frequency table or card list
    - Empty state: "No care actions recorded yet. Mark a plant as cared for to start tracking."
    - Loading skeleton and error state
    - Where the page lives in navigation (sidebar link under Care Due, or new "Analytics" sidebar item)
    - Dark mode compatibility (use existing CSS custom properties — no new color tokens needed)
  - **Frontend Engineer (after Design Agent spec is ready):**
    - Add `/analytics` route to the React router
    - Add sidebar navigation item for Analytics (chart icon, no badge)
    - Fetch `GET /api/v1/care-actions/stats` and render the page per SPEC-011
    - Use a lightweight chart library (e.g., `recharts` — already widely compatible with React + Vite) or pure CSS/SVG if recharts adds too much bundle weight; confirm approach before implementing
    - Implement all states: loading skeleton, empty state, error state with retry, populated state
    - Dark mode: all chart elements and text must use CSS custom properties for colors
    - Accessibility: chart must have an accessible text alternative (aria-label or visually-hidden data table)
    - Unit tests: all page states (loading, empty, error, populated), sidebar nav item renders
    - All 135/135 frontend tests still pass; add at least 5 new tests
  - **Acceptance Criteria:**
    - Analytics page accessible via sidebar and direct `/analytics` URL
    - Stats and chart render correctly with real data from `GET /api/v1/care-actions/stats`
    - Empty state shown when user has no care actions
    - Dark mode verified (no invisible text or broken chart colors in dark theme)
    - WCAG AA: all text and chart labels meet 4.5:1 contrast in both light and dark modes
    - All 135/135 frontend tests pass (add minimum 5 new tests)
  - **Blocked By:** T-064 (API contract must be published), Design Agent SPEC-011 must be written first.

---

### P2 — Technical Debt & Hardening

- [ ] **T-066** — Backend Engineer: Harden pool startup to eliminate residual single transient 500 on first request (FB-065) **(P2)**
  - **Description:** T-058 resolved the bulk of the pool idle issue. A residual single transient 500 was observed by the Monitor Agent after ~4 hours of server inactivity (FB-065). The likely cause: the keepalive interval (`setInterval` every 5 min) doesn't fire before the very first request if the process was freshly started. Re-verify that the `server.js` startup warm-up (introduced in T-056) still runs and warms the full `min: 2` pool before `app.listen()`. If the warm-up is in place and still produces a single 500, add explicit error handling in the pool `afterCreate` hook to retry once before surfacing the error.
  - **Acceptance Criteria:**
    - Root cause confirmed: read `backend/src/server.js` startup sequence; verify `db.raw('SELECT 1')` warm-up fires before `app.listen()`
    - If warm-up is missing or incomplete after T-058's changes, restore it
    - Regression test: simulate fresh server start → immediately call `POST /api/v1/auth/login` 3 times → all 3 return 200 (no 500s)
    - All 83/83 backend tests pass
  - **Dependencies:** None.
  - **Fix locations:** `backend/src/server.js` (startup sequence)

---

- [ ] **T-067** — QA Engineer: End-to-end browser verification of HttpOnly refresh token cookie flow **(P2)**
  - **Description:** T-053-frontend (Sprint 12) completed the `credentials: 'include'` migration and removed the in-memory refresh token. The backend sets an HttpOnly refresh token cookie on login. This has never been explicitly verified in a real browser — only via unit tests. QA must verify the full cookie flow in a browser session.
  - **Acceptance Criteria:**
    - Open staging frontend in browser (http://localhost:4175)
    - Log in with seeded account (`test@plantguardians.local`) — verify access token returned, HttpOnly cookie set in browser DevTools → Application → Cookies
    - Navigate to a protected page, close tab, reopen — verify auto-refresh (silent re-auth) works via the HttpOnly cookie (user stays logged in)
    - Log out — verify cookie is cleared
    - Attempt to access protected API route after logout — verify 401
    - Document results in qa-build-log.md (Sprint 15 section)
    - If any issues found, file as new feedback entries and block Sprint 15 deploy
  - **Dependencies:** None (staging environment from Sprint 14 is live).

---

- [ ] **T-068** — Frontend Engineer: Fix confetti colors for dark mode (B-007, FB-061) **(P2)**
  - **Description:** The confetti animation (fired when a user marks a plant care action as done on the Plant Detail page) uses hardcoded bright colors that look washed out on dark backgrounds. Update the confetti color palette to include warm botanical hues that remain vibrant and celebratory in dark mode.
  - **Acceptance Criteria:**
    - Confetti colors updated to a warm botanical palette (e.g., deep greens, warm amber, dusty rose, terracotta — matching the Japandi dark mode aesthetic)
    - Confetti remains visually satisfying in both light and dark modes
    - `prefers-reduced-motion` check still respected (no confetti if reduced motion is preferred)
    - All 135/135 frontend tests still pass (update snapshot/color references if needed)
  - **Dependencies:** None.
  - **Fix locations:** `frontend/src/pages/PlantDetailPage.jsx` (or wherever confetti is configured)

---

## Out of Scope

- Social auth (Google OAuth) — B-001 — post-sprint
- Push notifications for care reminders — B-002 — post-sprint
- Plant sharing / public profiles — B-003 — post-sprint
- Production deployment execution — runbook exists; blocked on project owner providing SSL certs
- Express 5 migration — advisory backlog; no breaking-change-safe path yet
- Flaky careDue test investigation (FB-050) — P3 backlog
- Long plant name max-length validation (FB-055) — cosmetic backlog
- Delete Account "coming soon" placeholder — post-sprint

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Backend Engineer | Care stats endpoint + pool startup hardening | T-064 (P1), T-066 (P2) |
| Design Agent | Care analytics UI spec (SPEC-011) | T-065 design spec (P1 — write spec before Frontend Engineer begins) |
| Frontend Engineer | Care analytics page + confetti fix | T-065 frontend impl (P1, after Design + API contract), T-068 (P2) |
| QA Engineer | Cookie flow browser verification + analytics QA + security check | T-067 (P2), T-064 QA, T-065 QA, T-066 QA |
| Deploy Engineer | Staging re-deploy after QA sign-off | After all tasks QA-verified |
| Monitor Agent | Post-deploy health check — verify `/api/v1/care-actions/stats` endpoint | After Deploy Engineer re-deploy |
| Manager | Sprint coordination, API contract approval, code review | Ongoing |

---

## Dependency Chain (Critical Path)

```
T-064 (Care stats API — P1, START IMMEDIATELY)
  ↓ (publish API contract to api-contracts.md)
Design Agent writes SPEC-011 (can happen in parallel with T-064)
  ↓ (both T-064 contract AND SPEC-011 must be ready)
T-065-frontend (Analytics page implementation — P1)
  ↓
QA verifies T-064 + T-065 end-to-end

[Parallel — no P1 dependency]
T-066 (Pool startup hardening — P2, start any time)
T-067 (Cookie flow browser verification — P2, staging already live)
T-068 (Confetti dark mode fix — P2, start any time)

[After all tasks QA-verified]
Deploy Engineer re-deploys to staging
  ↓
Monitor Agent health check — verify all endpoints including /care-actions/stats
```

**Critical path:** T-064 ∥ SPEC-011 → T-065 → QA → Deploy → Monitor → staging verified.

---

## Definition of Done

Sprint #15 is complete when:

- [ ] T-064: `GET /api/v1/care-actions/stats` implemented; API contract published; unit tests pass; 83/83 backend tests pass
- [ ] T-065 (Design): SPEC-011 in ui-spec.md, approved, covers all states + dark mode + accessibility
- [ ] T-065 (Frontend): Analytics page at `/analytics`; all states implemented; dark mode verified; 5+ new tests; 135/135 frontend tests pass
- [ ] T-066: Pool startup warm-up confirmed; regression test passes (3 fresh-start logins → all 200); 83/83 backend tests pass
- [ ] T-067: Browser cookie flow verified; results documented in qa-build-log.md; no blocking issues found
- [ ] T-068: Confetti colors updated; looks correct in dark mode; all 135/135 frontend tests pass
- [ ] Deploy Verified: Yes from Monitor Agent post-deploy health check
- [ ] No regressions: all backend + frontend tests at or above Sprint #14 baselines (83/83 backend, 135/135 frontend)

---

## Success Criteria

- **Care analytics are user-facing and functional** — Users can visit `/analytics` and see how often they've cared for their plants, broken down by plant and care type
- **Pool startup is hardened** — POST /auth/login returns 200 consistently even on fresh server start (no transient 500s at any point)
- **Cookie flow browser-verified** — HttpOnly refresh token cookie confirmed working end-to-end in a real browser session
- **Confetti works in dark mode** — Celebratory animation looks polished and vibrant in both light and dark themes
- **Zero new vulnerabilities** — npm audit remains at 0 vulnerabilities after any new package additions (e.g., recharts)

---

## Blockers

- T-065 (analytics frontend) is blocked until: (1) Design Agent writes SPEC-011 in ui-spec.md, AND (2) Backend Engineer publishes the `GET /api/v1/care-actions/stats` API contract in api-contracts.md.
- All other Sprint #15 tasks have no blockers — start immediately.

---

*Sprint #15 plan written by Manager Agent on 2026-03-31.*
