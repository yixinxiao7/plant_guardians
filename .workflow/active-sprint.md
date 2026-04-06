# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #23 — 2026-05-03 to 2026-05-09

**Sprint Goal:** Close the email notification loop with the **Unsubscribe landing page** (SPEC-017 Surface 3), give users full control over their data with an **Account Deletion** feature, and fix the pre-existing timezone-dependent test flakiness in `careActionsStreak.test.js`.

**Context:** Sprint #22 delivered the full email notification infrastructure — preferences API, Nodemailer integration, daily cron job, and the RemindersSection UI — ninth consecutive clean sprint. Backend is at 166/166 tests (with a known pre-existing flakiness in 5 streak tests at certain UTC hours), frontend at 239/239. Two small items remain open from Sprint 22: (1) The unsubscribe landing page (SPEC-017 Surface 3 was designed but not built — email footer links point to an unbuilt page), and (2) the `api.js` unsubscribe helper is missing the `uid` param. Sprint 23 closes both of these, adds account deletion (a natural next step for user data control), and eliminates the streak test flakiness before it causes CI pain.

---

## In Scope

### P2 — Close Email Notification Loop

- [ ] **T-103** — Frontend Engineer: Unsubscribe landing page (SPEC-017 Surface 3) + fix api.js unsubscribe uid param **(P2)**
  - **Description:** Two deliverables: (1) **Fix `api.js`** — update `notificationPreferences.unsubscribe(token, uid)` to pass both `token` and `uid` as query params to `GET /api/v1/unsubscribe?token=<token>&uid=<uid>` (fixes FB-100). (2) **Unsubscribe landing page** — create a new page at `/unsubscribe` (React route, no auth required). The page reads `token` and `uid` from the URL query string and calls `notificationPreferences.unsubscribe(token, uid)` on mount. States: (a) Loading — spinner with "Processing your request…"; (b) Success — green confirmation "You've been unsubscribed. You won't receive any more care reminder emails." with a "Back to Plant Guardians" link; (c) Error — "This unsubscribe link is invalid or has already been used." with a "Go to Profile Settings" link. Dark mode via CSS custom properties. No auth required (page must work from an email link). Add the route to `App.jsx`. Add `notificationPreferences.unsubscribe()` calls to api.js.
  - **Acceptance Criteria:**
    - `notificationPreferences.unsubscribe(token, uid)` in `api.js` sends both `token` and `uid` query params
    - `/unsubscribe` route exists in `App.jsx` (no auth required)
    - Page reads `token` + `uid` from URL query string and calls the unsubscribe API on mount
    - Loading, success, and error states all implemented
    - Dark mode: all new elements use CSS custom properties; no hardcoded colors
    - Unit tests: loading state, success state (API resolves), error state (API rejects — 400), missing token/uid in URL → error state; minimum 4 new tests
    - All 239/239 frontend tests still pass; add minimum 4 new tests
  - **Blocked By:** None — start immediately.
  - **Fix locations:** `frontend/src/utils/api.js` (fix unsubscribe uid param), `frontend/src/pages/UnsubscribePage.jsx` (new), `frontend/src/pages/UnsubscribePage.css` (new), `frontend/src/App.jsx` (add `/unsubscribe` route)

---

### P3 — Fix Pre-Existing Test Flakiness

- [ ] **T-104** — Backend Engineer: Fix careActionsStreak.test.js timezone-dependent flakiness (FB-101) **(P3)**
  - **Description:** Fix the `daysAgo(0)` helper in `backend/tests/careActionsStreak.test.js`. Currently it sets the timestamp to noon UTC today (`d.setUTCHours(12, 0, 0, 0)`), which the backend's `performed_at` validation rejects as a future time when tests run between midnight and noon UTC. Fix: change `daysAgo(0)` to use a time that is always in the past regardless of when the test runs — e.g., `d.setUTCHours(0, 0, 0, 0)` (start of today UTC, always in the past by the time a human runs the test) or simply `new Date(Date.now() - 5 * 60 * 1000)` (5 minutes ago). All 5 affected tests should then pass regardless of time of day. Verify by running the suite at least once and confirming 166/166 pass.
  - **Acceptance Criteria:**
    - `daysAgo(0)` no longer produces a future UTC timestamp
    - All 5 previously flaky streak tests pass regardless of current UTC hour
    - All 166/166 backend tests pass; no regressions
  - **Blocked By:** None — start immediately.
  - **Fix locations:** `backend/tests/careActionsStreak.test.js`

---

### P2 — Account Deletion

- [ ] **T-105** — Design Agent: Write SPEC-018 — Account Deletion UX spec **(P2)**
  - **Description:** Design the account deletion flow end-to-end. Cover: (1) **Danger zone on Profile page** — a collapsible "Danger Zone" section at the very bottom of the Profile page, visually separated (subtle red/muted warning border), collapsed by default; contains a "Delete my account" button; (2) **Confirmation modal** — opened by the "Delete my account" button; modal title "Delete your account?"; body copy explaining what will be permanently deleted (account, plants, care history, notes, reminders); a text input requiring the user to type "DELETE" (all caps) to confirm — the confirm button is disabled until the input matches exactly; a "Cancel" button; (3) **Loading state** — confirm button shows spinner, inputs disabled while request is in flight; (4) **Success state** — account deleted, auth tokens cleared, user redirected to `/login` with a query param `?deleted=true`; on the login page, if `?deleted=true` is present, show a dismissible banner: "Your account has been permanently deleted."; (5) **Error state** — if deletion fails, show inline error in modal "Could not delete your account. Please try again." with retry; (6) **Dark mode** — all new elements use CSS custom properties; (7) **Accessibility** — confirm input has `aria-label`, confirm button `aria-disabled` when input doesn't match, modal uses `role="dialog"` and `aria-labelledby`.
  - **Acceptance Criteria:**
    - SPEC-018 written to `.workflow/ui-spec.md` (appended as new section)
    - Covers Danger Zone section on Profile page (collapsed by default)
    - Covers confirmation modal (text input "DELETE", disabled confirm button until match)
    - Covers loading, success (redirect + login banner), and error states
    - Dark mode and accessibility notes included
  - **Dependencies:** None — start immediately.
  - **Fix locations:** `.workflow/ui-spec.md`

---

- [ ] **T-106** — Backend Engineer: Account deletion endpoint **(P2)**
  - **Description:** Implement `DELETE /api/v1/profile` (auth required). The endpoint: (1) Verifies the requesting user owns the account being deleted (user ID from JWT); (2) Deletes the user's data in dependency order — care_actions, notification_preferences, care_schedules, plants, refresh_tokens, then the users row itself (all within a transaction); (3) Returns `204 No Content` on success; (4) Returns `401` for unauthenticated requests; (5) Returns `404` if user not found (edge case for already-deleted accounts). All cascade deletes should be explicit in the transaction (do not rely solely on DB-level cascade) to ensure data hygiene across all tables. Publish the updated API contract to `.workflow/api-contracts.md` before T-107 begins.
  - **Acceptance Criteria:**
    - `DELETE /api/v1/profile` endpoint implemented and registered in `app.js`
    - Deletes all user data (care_actions, notification_preferences, care_schedules, plants, refresh_tokens, users row) within a single transaction
    - Returns 204 on success; 401 for unauthenticated; 404 if user not found
    - Unit tests: successful deletion (verifies all related rows gone), 401 (no auth), 404 (user not found), transaction rollback on failure; minimum 4 new tests
    - All 166/166 backend tests still pass (after T-104 fix); add minimum 4 new tests
    - Updated API contract published to `.workflow/api-contracts.md` before T-107 begins
  - **Blocked By:** None — start immediately. Publish updated contract before T-107 begins.
  - **Fix locations:** `backend/src/routes/profile.js` (add DELETE handler), `backend/src/models/User.js` (add deleteWithAllData method), `.workflow/api-contracts.md`

---

- [ ] **T-107** — Frontend Engineer: Account deletion UI on Profile page **(P2)**
  - **Description:** Implement the account deletion flow per SPEC-018. (1) Add a "Danger Zone" collapsible section at the bottom of `ProfilePage.jsx` — collapsed by default, toggled by a chevron button; visually separated with a muted warning border; (2) Inside: a "Delete my account" button that opens a confirmation modal; (3) **Confirmation modal** — text input where user must type "DELETE" exactly (case-sensitive); confirm button disabled and `aria-disabled` until input matches; loading spinner on confirm while API call is in-flight; (4) On `DELETE /api/v1/profile` success: clear auth tokens (call `logout()` / clear token state), redirect to `/login?deleted=true`; (5) On `/login` page: if `?deleted=true` is in the query string, show a dismissible one-time banner "Your account has been permanently deleted."; (6) On API failure: inline error "Could not delete your account. Please try again." in the modal; (7) Dark mode via CSS custom properties; (8) Accessibility: modal `role="dialog"` + `aria-labelledby`, confirm input `aria-label="Type DELETE to confirm"`, confirm button `aria-disabled` when disabled.
  - **Acceptance Criteria:**
    - Danger Zone section on Profile page, collapsed by default
    - Confirmation modal with "DELETE" text-match gate (confirm button disabled until match)
    - API success → auth cleared → redirect to `/login?deleted=true` → dismissible deletion banner on login page
    - API error → inline error in modal with retry
    - Dark mode: new elements use CSS custom properties
    - Accessibility: `role="dialog"`, `aria-labelledby`, `aria-disabled`, `aria-label` on input
    - Unit tests: Danger Zone renders collapsed, toggle opens, modal opens on button click, confirm disabled until "DELETE" typed, API success → redirect, API error → error shown, login page banner renders with `?deleted=true`, banner dismissed on click; minimum 6 new tests
    - All frontend tests still pass; add minimum 6 new tests
  - **Blocked By:** T-105 (SPEC-018 must exist), T-106 (updated API contract must be published)
  - **Fix locations:** `frontend/src/pages/ProfilePage.jsx`, `frontend/src/pages/ProfilePage.css`, `frontend/src/pages/LoginPage.jsx` (deletion banner), `frontend/src/api.js` (add `profile.delete()`), `frontend/src/components/DeleteAccountModal.jsx` (new)

---

## Out of Scope

- Push notifications (browser or mobile) — requires service worker / APNs infrastructure — post-sprint
- Social auth (Google OAuth) — B-001 — post-sprint
- Plant sharing / public profiles — B-003 — post-sprint
- Email template HTML rendering framework (MJML etc.) — keep templates as simple inline HTML
- Production deployment execution — blocked on project owner providing SSL certs
- Batch mark-done on Care Due Dashboard — backlog
- Express 5 migration — advisory backlog
- Endpoint-specific rate limiting on `/care-actions/stats` (FB-073) — backlog
- Reference photo in AI advice results (FB-081) — post-MVP
- Soft-delete / grace period for account deletion — post-MVP (hard delete is sufficient for MVP)

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Design Agent | Account deletion UX spec | T-105 (P2, start immediately) |
| Backend Engineer | Fix streak test flakiness + account deletion endpoint | T-104 (P3, start immediately), T-106 (P2, start immediately, publish contract before T-107) |
| Frontend Engineer | Unsubscribe landing page + account deletion UI | T-103 (P2, start immediately), T-107 (P2, after T-105 + T-106) |
| QA Engineer | Full QA of T-103–T-107, security checklist (account deletion) | After all tasks complete |
| Deploy Engineer | Staging re-deploy after QA sign-off | After all tasks QA-verified |
| Monitor Agent | Post-deploy health check — verify unsubscribe page + deletion endpoint on staging | After Deploy Engineer re-deploy |
| Manager | Sprint coordination, API contract review, code review | Ongoing |

---

## Dependency Chain (Critical Path)

```
T-103 (Unsubscribe page — Frontend Engineer, START IMMEDIATELY — no blockers)
T-104 (Streak test fix — Backend Engineer, START IMMEDIATELY — no blockers)

T-105 (SPEC-018 — Design Agent, START IMMEDIATELY)
  ↓ (spec complete)

T-106 (Account deletion endpoint — Backend Engineer, START IMMEDIATELY — publish contract before T-107)
  ↓ (publish updated API contract)

T-107 (Account deletion UI — Frontend Engineer, after T-105 spec + T-106 contract)
  ↓
QA verifies T-103 + T-104 + T-105 + T-106 + T-107 end-to-end

[After all tasks QA-verified]
Deploy Engineer re-deploys to staging
  ↓
Monitor Agent health check — verify GET /unsubscribe + DELETE /profile on staging
```

**Critical path:** T-105 + T-106 (parallel start) → T-107 → QA → Deploy → Monitor → staging verified.
**Note:** T-103 and T-104 have no blockers and can run in parallel with T-105/T-106.

---

## Definition of Done

Sprint #23 is complete when:

- [ ] T-103: `/unsubscribe` page exists at React route; reads `token`+`uid` from query string; calls `GET /api/v1/unsubscribe`; loading/success/error states implemented; `api.js` unsubscribe() includes `uid` param; 4+ new tests; all 239/239 frontend tests pass
- [ ] T-104: `daysAgo(0)` no longer produces a future UTC timestamp; all 5 previously-flaky streak tests pass regardless of UTC hour; 166/166 backend tests pass
- [ ] T-105: SPEC-018 written covering Danger Zone section on Profile page, confirmation modal with "DELETE" text gate, loading/success/error states, redirect flow, login page deletion banner, dark mode, accessibility
- [ ] T-106: `DELETE /api/v1/profile` endpoint deletes all user data in a transaction; 4+ new tests; all backend tests pass; API contract published
- [ ] T-107: Danger Zone section on Profile page (collapsed by default); confirmation modal with "DELETE" text-match gate; success → auth cleared + redirect + login deletion banner; error → inline modal error; 6+ new tests; all frontend tests pass
- [ ] Deploy Verified: Yes from Monitor Agent post-deploy health check
- [ ] No regressions: backend ≥ 170/170 (estimated), frontend ≥ 249/249 (estimated)

---

## Success Criteria

- **Unsubscribe page works end-to-end** — A user clicking an email footer unsubscribe link is taken to `/unsubscribe?token=<t>&uid=<u>`, sees a confirmation, and is opted out
- **Streak tests always pass** — Running `npm test` in backend at any UTC hour returns 166/166 (after T-104 fix)
- **Account deletion works** — A user can delete their account from the Profile page; all their data is removed; they are redirected to login with a deletion confirmation banner
- **Deletion is hard-gated** — The confirm button is disabled until the user types "DELETE" exactly; no accidental deletions
- **Auth cleared on deletion** — After account deletion, the user cannot use stale tokens to access API endpoints
- **Test suite grows** — Backend adds minimum 4 new tests (T-106); frontend adds minimum 10 new tests (T-103 4+, T-107 6+); no regressions

---

## Blockers

- T-107 is blocked until: (1) Design Agent publishes SPEC-018; (2) Backend Engineer publishes updated API contract for `DELETE /api/v1/profile`
- T-103 and T-104 have no blockers — both can start immediately
- T-105 and T-106 have no blockers — both can start immediately
- Production deployment remains blocked on project owner providing SSL certificates
- Production email delivery blocked on project owner providing SMTP credentials

---

*Sprint #23 plan written by Manager Agent on 2026-04-05.*
