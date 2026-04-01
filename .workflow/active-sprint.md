# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #16 — 2026-04-01 to 2026-04-06

**Sprint Goal:** Complete the Delete Account feature (replacing the "coming soon" placeholder with a fully functional, safe account deletion flow), harden the stats endpoint for production with endpoint-specific rate limiting, and polish the Analytics page with CSS variable alignment and warmer empty state copy. The result: users have full control over their data, the backend is production-ready under load, and the UI matches the design system end-to-end.

**Context:** Sprint #15 delivered all five planned tasks with zero carry-over — the second clean sprint in a row. Care History Analytics shipped with full dark mode support, accessible charts, and a warm empty state. Deploy Verified: Yes. Test baseline: 88/88 backend, 142/142 frontend, 0 npm vulnerabilities. Sprint 16 turns its attention to completing the account management story (Delete Account), production-hardening the stats endpoint, and resolving three cosmetic feedback items from Sprint 15 (FB-073, FB-074, FB-069).

---

## In Scope

### P1 — Delete Account Feature

- [ ] **T-069** — Backend Engineer: Implement `DELETE /api/v1/account` endpoint **(P1)**
  - **Description:** Allow authenticated users to permanently delete their account. Deleting an account must cascade-delete all user data: plants, care schedules, care actions, refresh tokens. The user is then logged out.
  - **Acceptance Criteria:**
    - Endpoint: `DELETE /api/v1/account` (authenticated)
    - Request body: `{ "password": "string" }` — user must confirm their password to prevent accidental deletion
    - On success: deletes user row (cascades to all related rows via FK constraints or explicit DELETE), clears refresh token cookie, returns `204 No Content`
    - On wrong password: returns `400 INVALID_PASSWORD` with message "Password is incorrect."
    - On missing/invalid auth: returns `401 UNAUTHORIZED`
    - No orphaned rows — verify cascade behavior in the test
    - Unit tests: happy path (account + all data deleted), wrong password (400), missing auth (401), user isolation (only deletes requesting user's data)
    - All 88/88 backend tests still pass; add minimum 4 new tests
  - **API contract:** Add to `.workflow/api-contracts.md` before Frontend Engineer begins
  - **Dependencies:** None — start immediately.
  - **Fix locations:** New route handler in `backend/src/routes/account.js` (or add to existing), `backend/src/models/User.js`

---

- [ ] **T-070** — Frontend Engineer: Implement Delete Account flow — replace "coming soon" placeholder **(P1)**
  - **Description:** The Profile page currently shows a "Delete Account" button labelled "coming soon" or similar. Replace the placeholder with a functional confirmation modal that calls `DELETE /api/v1/account`, then redirects to the login page on success.
  - **Acceptance Criteria:**
    - "Delete Account" button on Profile page opens a confirmation modal
    - Modal copy: "This will permanently delete your account and all your plant data. This cannot be undone."
    - Modal has a password input field (required) and two buttons: "Delete my account" (danger/destructive style) and "Cancel"
    - On success (204): clear auth state, navigate to `/login`, show toast "Your account has been deleted."
    - On wrong password (400): show inline error "Password is incorrect." in the modal (do NOT close modal)
    - On other errors: show generic error toast, do NOT close modal
    - Loading state while request is in flight (disable button, show spinner)
    - Dark mode: modal uses CSS custom properties throughout — no hardcoded colors
    - Accessibility: focus trap in modal, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`
    - Unit tests: modal opens on click, cancel closes without deleting, wrong password shows inline error, success clears state + navigates, loading state disables button
    - All 142/142 frontend tests still pass; add minimum 5 new tests
  - **Blocked By:** T-069 (API contract must be published first)
  - **Fix locations:** `frontend/src/pages/ProfilePage.jsx`, new `DeleteAccountModal.jsx` component

---

### P2 — Production Hardening

- [ ] **T-071** — Backend Engineer: Add endpoint-specific rate limiting to `GET /api/v1/care-actions/stats` (FB-073) **(P2)**
  - **Description:** The stats endpoint performs multiple JOIN + aggregation queries and is currently only covered by the general rate limiter (100 req/15min). Add an endpoint-specific stricter limiter (e.g., 30 req/15min per IP) to prevent abuse of this resource-intensive endpoint.
  - **Acceptance Criteria:**
    - New rate limiter middleware applied specifically to `GET /care-actions/stats`: max 30 requests per 15-minute window per IP
    - On rate limit exceeded: returns `429 TOO_MANY_REQUESTS` with structured error body `{ "error": { "message": "Too many requests.", "code": "RATE_LIMIT_EXCEEDED" } }`
    - General rate limiter (100 req/15min) still applies to all other endpoints
    - Unit test: verify 429 is returned after threshold exceeded on the stats endpoint
    - All 88/88 backend tests still pass
  - **Dependencies:** None.
  - **Fix locations:** `backend/src/routes/careActionsStats.js` (or wherever the stats route is registered)

---

### P3 — UX Polish (Sprint 15 Cosmetic Feedback)

- [ ] **T-072** — Frontend Engineer: Update StatTile icon colors to use CSS custom properties (FB-074) **(P3)**
  - **Description:** `AnalyticsPage.jsx` passes hardcoded hex colors (`#5C7A5C`, `#C4921F`) as `iconColor` props to StatTile components. Replace with CSS custom properties (e.g., `var(--color-accent-primary)`, `var(--color-accent-secondary)`) to align with the theming system.
  - **Acceptance Criteria:**
    - No hardcoded hex color values passed as `iconColor` props in `AnalyticsPage.jsx`
    - StatTile icon colors use CSS custom property values
    - Visual appearance equivalent in both light and dark modes
    - All 142/142 frontend tests still pass (update snapshot references if needed)
  - **Dependencies:** None.
  - **Fix locations:** `frontend/src/pages/AnalyticsPage.jsx`

---

- [ ] **T-073** — Frontend Engineer: Improve analytics empty state copy (FB-069) **(P3)**
  - **Description:** The current empty state text "No care actions recorded yet. Mark a plant as cared for to start tracking." is accurate but clinical. Update to warmer, more encouraging copy that fits the Japandi botanical brand voice.
  - **Acceptance Criteria:**
    - Empty state heading updated to something warmer, e.g.: "Your care journey starts here"
    - Empty state subtext updated, e.g.: "Water, fertilize, or repot a plant and watch your progress grow here."
    - CTA button ("Go to my plants") retained
    - Dark mode: copy color uses CSS custom properties
    - All 142/142 frontend tests still pass (update any snapshot/copy references)
  - **Dependencies:** None.
  - **Fix locations:** `frontend/src/pages/AnalyticsPage.jsx`

---

### P3 — Technical Debt

- [ ] **T-074** — QA Engineer + Backend Engineer: Investigate and fix flaky careDue test (FB-050) **(P3)**
  - **Description:** A flaky intermittent test failure has been noted on the careDue test suite. Investigate the root cause — likely a timing or ordering issue in the test setup — and apply a fix.
  - **Acceptance Criteria:**
    - Root cause identified and documented in the task notes
    - Fix applied (test setup, teardown, or isolation change — no endpoint behavior changes)
    - 3 consecutive test runs pass with 0 flaky failures in careDue suite
    - All 88/88 backend tests pass
  - **Dependencies:** None.
  - **Fix locations:** `backend/src/tests/careDue.test.js` (or setup/teardown)

---

- [ ] **T-075** — Backend Engineer: Add max-length validation for plant name field (FB-055) **(P3)**
  - **Description:** Long plant names are not currently validated for length, which can cause UI overflow issues. Add server-side max-length validation (e.g., 100 characters) to `POST /plants` and `PUT /plants/:id`.
  - **Acceptance Criteria:**
    - `POST /plants` and `PUT /plants/:id`: name field validated with max 100 characters
    - On violation: returns `400 VALIDATION_ERROR` with message "name must be 100 characters or fewer."
    - Unit test added: name > 100 chars → 400
    - All 88/88 backend tests pass
  - **Dependencies:** None.
  - **Fix locations:** `backend/src/middleware/validation.js` or route handlers for plants

---

## Out of Scope

- Social auth (Google OAuth) — B-001 — post-sprint
- Push notifications for care reminders — B-002 — post-sprint
- Plant sharing / public profiles — B-003 — post-sprint
- Production deployment execution — blocked on project owner providing SSL certs
- Express 5 migration — advisory backlog; no breaking-change-safe path yet
- Care streak / gamification features — post-sprint
- T-020 user testing session — pending project owner action (unblocked since Sprint 11; encourage project owner to run a browser session when available)

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Backend Engineer | Delete Account endpoint + rate limiting + plant name validation | T-069 (P1), T-071 (P2), T-075 (P3) |
| Frontend Engineer | Delete Account modal + analytics polish | T-070 (P1, after API contract), T-072 (P3), T-073 (P3) |
| QA Engineer | Delete Account end-to-end QA + flaky test investigation + security check | T-070 QA, T-069 QA, T-071 QA, T-074 (P3) |
| Deploy Engineer | Staging re-deploy after QA sign-off | After all tasks QA-verified |
| Monitor Agent | Post-deploy health check — verify DELETE /account + stats rate limiter | After Deploy Engineer re-deploy |
| Design Agent | No new specs required this sprint — all tasks use existing patterns | — |
| Manager | Sprint coordination, API contract approval, code review | Ongoing |

---

## Dependency Chain (Critical Path)

```
T-069 (DELETE /account API — P1, START IMMEDIATELY)
  ↓ (publish API contract to api-contracts.md)
T-070 (Delete Account modal — P1, after T-069 contract)
  ↓
QA verifies T-069 + T-070 end-to-end

[Parallel — no P1 dependency]
T-071 (Stats rate limiting — P2, start any time)
T-072 (StatTile CSS vars — P3, start any time)
T-073 (Empty state copy — P3, start any time)
T-074 (Flaky careDue test — P3, start any time)
T-075 (Plant name max-length — P3, start any time)

[After all tasks QA-verified]
Deploy Engineer re-deploys to staging
  ↓
Monitor Agent health check — verify DELETE /account endpoint + stats rate limiting
```

**Critical path:** T-069 → T-070 → QA → Deploy → Monitor → staging verified.

---

## Definition of Done

Sprint #16 is complete when:

- [ ] T-069: `DELETE /api/v1/account` implemented; API contract published; 4+ new tests; all 88/88 backend tests pass
- [ ] T-070: Delete Account modal functional; wrong password shows inline error; success navigates to login; dark mode verified; 5+ new tests; all 142/142 frontend tests pass
- [ ] T-071: Endpoint-specific rate limiter on stats route (30 req/15min); 429 on threshold; all 88/88 backend tests pass
- [ ] T-072: StatTile icon colors use CSS custom properties; no hardcoded hex values; all 142/142 tests pass
- [ ] T-073: Warmer analytics empty state copy; all 142/142 tests pass
- [ ] T-074: Flaky careDue test root cause identified and fixed; 3 consecutive runs pass
- [ ] T-075: Plant name max-length (100 chars) validated on POST + PUT /plants; 400 on violation; all 88/88 tests pass
- [ ] Deploy Verified: Yes from Monitor Agent post-deploy health check
- [ ] No regressions: all backend + frontend tests at or above Sprint #15 baselines (88/88 backend, 142/142 frontend)

---

## Success Criteria

- **Delete Account is fully functional** — Users can permanently delete their account with password confirmation; all data is removed; they are redirected to login
- **Stats endpoint is production-hardened** — GET /care-actions/stats returns 429 after 30 req/15min, protecting against query abuse
- **Analytics page is design-system compliant** — No hardcoded hex colors in StatTile props; theming is fully CSS-variable-driven
- **Empty state is warm and on-brand** — Copy reflects the encouraging, botanical Japandi voice of Plant Guardians
- **Test suite grows** — Backend adds minimum 5 new tests; frontend adds minimum 5 new tests; no regressions
- **Zero new vulnerabilities** — npm audit remains at 0 vulnerabilities

---

## Blockers

- T-070 (Delete Account modal) is blocked until Backend Engineer publishes the `DELETE /api/v1/account` API contract in `api-contracts.md`
- All other Sprint #16 tasks have no blockers — start immediately

---

*Sprint #16 plan written by Manager Agent on 2026-04-01.*
