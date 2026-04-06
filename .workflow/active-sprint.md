# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #24 — 2026-05-10 to 2026-05-16

**Sprint Goal:** Empower "plant killer" users to clear multiple overdue care items in a single action by delivering **Batch Mark-Done on the Care Due Dashboard**. Simultaneously harden the API with **rate limiting on high-frequency endpoints** to prepare for production readiness. These two workstreams run in parallel and combine into a clean staging deploy.

**Context:** Sprint #23 closed the email notification loop (unsubscribe page) and added account deletion — tenth consecutive clean sprint. The Care Due Dashboard is the most-visited page for users with neglected plants, but currently requires tapping each plant's care item individually. For a "plant killer" persona with 5+ overdue items across multiple plants, batch mark-done dramatically reduces friction. Rate limiting (FB-073) has been deferred three sprints and is a quick backend task with outsized security/stability value.

---

## In Scope

### P2 — Batch Mark-Done on Care Due Dashboard

- [ ] **T-108** — Design Agent: Write SPEC-019 — Batch mark-done UX spec **(P2)**
  - **Description:** Design the batch mark-done flow on the Care Due Dashboard end-to-end. Cover: (1) **Selection mode** — a "Select" toggle button in the dashboard header enters selection mode; in selection mode, each care item card shows a checkbox; a "Select all" checkbox in the header selects/deselects all visible items; (2) **Batch action bar** — when ≥1 item is selected, a sticky bottom action bar appears with count ("3 selected") and a "Mark done" button; (3) **Confirmation** — clicking "Mark done" shows a brief inline confirmation ("Mark 3 items as done?") with a confirm button and cancel; (4) **Loading state** — action bar shows spinner + "Marking done…" while request is in flight; (5) **Success state** — marked items are removed from the list with a smooth exit animation; if the list is now empty, the empty state appears; a toast notification "3 care actions marked done"; (6) **Partial failure state** — if the batch endpoint returns a partial success (some items failed), show an inline error: "2 of 3 marked done. 1 failed — tap to retry failed items"; (7) **Cancel** — a "Cancel" button in selection mode exits selection mode and deselects all; (8) **Dark mode** — all new elements use CSS custom properties; (9) **Accessibility** — checkboxes have `aria-label`, action bar has `role="toolbar"`, "Mark done" button is `aria-disabled` when 0 items selected, count is `aria-live="polite"`.
  - **Acceptance Criteria:**
    - SPEC-019 written to `.workflow/ui-spec.md` (appended as new section)
    - Covers selection mode toggle and per-item checkboxes
    - Covers "Select all" behavior
    - Covers sticky action bar with count and "Mark done" button
    - Covers confirmation, loading, success, partial-failure states
    - Covers cancel/exit selection mode
    - Dark mode and accessibility notes included
  - **Dependencies:** None — start immediately.
  - **Fix locations:** `.workflow/ui-spec.md`

---

- [ ] **T-109** — Backend Engineer: Batch care actions endpoint **(P2)**
  - **Description:** Implement `POST /api/v1/care-actions/batch` (auth required). The endpoint accepts a JSON body `{ "actions": [{ "plant_id": <int>, "care_type": <string>, "performed_at": <ISO8601> }] }`. Behavior: (1) Validates array is non-empty and each item has valid `plant_id`, `care_type`, `performed_at`; (2) Verifies the requesting user owns all plants in the batch (user ID from JWT) — rejects any plant_id not owned by caller with 403; (3) Inserts all valid care actions in a single transaction; (4) Returns `207 Multi-Status` with a results array: `{ "results": [{ "plant_id": <int>, "care_type": <string>, "status": "created" | "error", "error": <string|null> }] }` — each item reports its individual outcome; (5) Returns `400` if the array is empty or any required field is missing; (6) Returns `401` for unauthenticated requests. Maximum batch size: 50 items (return `400` if exceeded). Publish the updated API contract to `.workflow/api-contracts.md` before T-110 begins.
  - **Acceptance Criteria:**
    - `POST /api/v1/care-actions/batch` implemented and registered in `app.js`
    - Validates array length (1–50), required fields, and user plant ownership
    - Returns `207` with per-item status array on (full or partial) success
    - Returns `400` for empty array, missing fields, or batch > 50 items
    - Returns `401` for unauthenticated requests; `403` for unauthorized plant access
    - Single transaction for all valid inserts
    - Unit tests: happy path (all succeed → 207), partial failure (some plants not owned → 207 with mixed results), empty array → 400, too many items → 400, 401 (no auth), all-fail case; minimum 6 new tests
    - All 171/171 backend tests still pass; add minimum 6 new tests
    - Updated API contract published to `.workflow/api-contracts.md` before T-110 begins
  - **Blocked By:** None — start immediately. Publish updated contract before T-110 begins.
  - **Fix locations:** `backend/src/routes/careActions.js` (add POST /batch handler), `backend/src/models/CareAction.js` (add batchCreate method), `.workflow/api-contracts.md`

---

- [ ] **T-110** — Frontend Engineer: Batch mark-done UI on Care Due Dashboard **(P2)**
  - **Description:** Implement the batch mark-done flow on the Care Due Dashboard per SPEC-019. (1) Add a "Select" toggle button to the dashboard header — clicking it enters selection mode; (2) In selection mode, each care item card shows a checkbox (`<input type="checkbox">`); (3) "Select all" checkbox in header selects/deselects all visible items; (4) Sticky bottom action bar (fixed position) — visible when ≥1 item is selected — shows count ("3 selected") with `aria-live="polite"` and a "Mark done" button (`aria-disabled` when 0 selected); (5) On "Mark done" click: show confirmation inline ("Mark 3 items as done?"), on confirm call `POST /api/v1/care-actions/batch`, show loading spinner; (6) On success (207 all created): remove marked items from list with exit animation, show toast "3 care actions marked done", exit selection mode; (7) On partial failure (207 with some errors): show inline message in action bar "2 of 3 marked done. 1 failed — tap to retry"; retry sends only the failed items; (8) "Cancel" button exits selection mode and clears all selections; (9) Dark mode via CSS custom properties; (10) Accessibility: checkboxes have `aria-label="Mark [plant name] [care type] as done"`, action bar `role="toolbar"`, confirm button has descriptive `aria-label`.
  - **Acceptance Criteria:**
    - "Select" toggle enters/exits selection mode; item checkboxes visible in selection mode
    - "Select all" selects/deselects all visible items
    - Sticky action bar shows count and "Mark done" button; hidden when 0 items selected
    - API call uses `POST /api/v1/care-actions/batch` with correct request shape
    - Success: items removed from list with animation, toast shown, selection mode exited
    - Partial failure: inline retry message shown; retry sends only failed items
    - Cancel clears selections and exits selection mode
    - Dark mode: new elements use CSS custom properties
    - Accessibility: `aria-label` on checkboxes, `role="toolbar"`, `aria-live="polite"` on count
    - Unit tests: selection mode toggle, checkbox select/deselect, select all, action bar shows on selection, confirm and API call on mark-done, success removes items + shows toast, partial failure shows retry, cancel clears selection, empty state after all items marked; minimum 8 new tests
    - All frontend tests still pass; add minimum 8 new tests
  - **Blocked By:** T-108 (SPEC-019 must exist), T-109 (updated API contract must be published)
  - **Fix locations:** `frontend/src/pages/CareDuePage.jsx`, `frontend/src/pages/CareDuePage.css`, `frontend/src/components/BatchActionBar.jsx` (new), `frontend/src/utils/api.js` (add `careActions.batch()`)

---

### P3 — Rate Limiting on High-Frequency Endpoints

- [ ] **T-111** — Backend Engineer: Endpoint-specific rate limiting (FB-073) **(P3)**
  - **Description:** Add `express-rate-limit` (or equivalent) rate limiting to high-frequency and sensitive endpoints. Implement as Express middleware, configured per route group: (1) **Auth endpoints** (`POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `POST /api/v1/auth/refresh`) — stricter limit: 10 requests per 15 minutes per IP, returns `429 Too Many Requests` with `{ "error": { "message": "Too many requests. Please try again later.", "code": "RATE_LIMIT_EXCEEDED" } }`; (2) **Stats/read-heavy endpoints** (`GET /api/v1/care-actions/stats`, `GET /api/v1/care-actions/streak`) — moderate limit: 60 requests per minute per IP; (3) **All other API routes** — permissive global fallback: 200 requests per 15 minutes per IP. Rate limit headers (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`) should be included in all responses. Configuration via environment variables (`RATE_LIMIT_AUTH_MAX`, `RATE_LIMIT_WINDOW_MS`) with sensible defaults so existing tests are unaffected. Must not break existing tests — use `skip` option in test environment (`NODE_ENV === 'test'`).
  - **Acceptance Criteria:**
    - `express-rate-limit` (or equivalent) installed and configured
    - Auth endpoints limited to 10 req/15 min per IP
    - Stats/streak endpoints limited to 60 req/min per IP
    - Global fallback: 200 req/15 min per IP
    - 429 response uses structured `{ error: { message, code } }` format matching existing error shape
    - Rate limiter skipped in `test` environment (no test regressions)
    - Unit tests: at minimum, verify 429 is returned after threshold exceeded for auth endpoint; 2+ new tests
    - All 177/177 (estimated) backend tests still pass; no regressions
  - **Blocked By:** None — start immediately. Can be done in parallel with T-109.
  - **Fix locations:** `backend/src/app.js` (add rate limiter middleware), `backend/src/middleware/rateLimiter.js` (new)

---

## Out of Scope

- Push notifications (browser or mobile) — requires service worker / APNs infrastructure — post-sprint
- Social auth (Google OAuth) — B-001 — post-sprint
- Plant sharing / public profiles — B-003 — post-sprint
- Production deployment execution — blocked on project owner providing SSL certs
- Unsubscribe error CTA contextual differentiation (FB-104) — cosmetic, backlog
- Express 5 migration — advisory backlog
- Soft-delete / grace period for account deletion — post-MVP
- Plant photo gallery / multiple photo management — post-MVP
- Individual care item notes in batch context — batch is mark-done only, no notes in this sprint

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Design Agent | Batch mark-done UX spec | T-108 (P2, start immediately) |
| Backend Engineer | Batch care actions endpoint + rate limiting | T-109 (P2, start immediately, publish contract before T-110), T-111 (P3, start immediately, parallel with T-109) |
| Frontend Engineer | Batch mark-done UI on Care Due Dashboard | T-110 (P2, after T-108 spec + T-109 contract) |
| QA Engineer | Full QA of T-108–T-111, security checklist (rate limiting) | After all tasks complete |
| Deploy Engineer | Staging re-deploy after QA sign-off | After all tasks QA-verified |
| Monitor Agent | Post-deploy health check — note: restart backend if process terminated before running checks | After Deploy Engineer re-deploy |
| Manager | Sprint coordination, API contract review, code review | Ongoing |

---

## Dependency Chain (Critical Path)

```
T-108 (SPEC-019 — Design Agent, START IMMEDIATELY)
  ↓ (spec complete)

T-109 (Batch endpoint — Backend Engineer, START IMMEDIATELY — publish contract before T-110)
  ↓ (publish updated API contract)

T-110 (Batch UI — Frontend Engineer, after T-108 spec + T-109 contract)
  ↓
T-111 (Rate limiting — Backend Engineer, START IMMEDIATELY — parallel with T-109)
  ↓
QA verifies T-108 + T-109 + T-110 + T-111 end-to-end

[After all tasks QA-verified]
Deploy Engineer re-deploys to staging
  ↓
Monitor Agent health check — verify POST /care-actions/batch + rate limiting 429 responses on staging
```

**Critical path:** T-108 + T-109 (parallel start) → T-110 → QA → Deploy → Monitor → staging verified.
**Note:** T-111 has no blockers and can run in parallel with T-108/T-109. Monitor Agent: if backend process is not running at health check time, restart it before checking endpoints (known local staging limitation from Sprint #23).

---

## Definition of Done

Sprint #24 is complete when:

- [ ] T-108: SPEC-019 written — covers selection mode, per-item checkboxes, select all, sticky action bar, confirmation, loading/success/partial-failure states, cancel/exit, dark mode, accessibility
- [ ] T-109: `POST /api/v1/care-actions/batch` endpoint returns 207 with per-item results; single transaction; ownership check; 6+ new tests; all backend tests pass; API contract published
- [ ] T-110: Selection mode, per-item checkboxes, select all, action bar, batch API call, success/partial-failure/cancel flows all implemented; 8+ new tests; all frontend tests pass
- [ ] T-111: Rate limiting applied to auth (10/15min), stats/streak (60/min), global fallback (200/15min); 429 uses structured error shape; skipped in test env; 2+ new tests; all backend tests pass
- [ ] Deploy Verified: Yes from Monitor Agent post-deploy health check (note: restart backend if process terminated)
- [ ] No regressions: backend ≥ 179/179 (estimated: 171 + 6 T-109 + 2 T-111), frontend ≥ 257/257 (estimated: 249 + 8 T-110)

---

## Success Criteria

- **Batch mark-done works end-to-end** — A user with 5 overdue care items can select all, tap "Mark done", and clear them in two taps instead of ten
- **Partial failure handled gracefully** — If 1 of 5 batch items fails (ownership issue or DB error), the user sees exactly which ones failed and can retry them
- **Rate limiting is invisible to normal users** — Regular usage never hits limits; only aggressive automated requests or brute-force attempts are throttled
- **Auth endpoints are brute-force protected** — 10 failed login attempts in 15 minutes triggers 429; subsequent attempts are blocked
- **Test suite grows** — Backend adds minimum 8 new tests (T-109 6+, T-111 2+); frontend adds minimum 8 new tests (T-110 8+); no regressions

---

## Blockers

- T-110 is blocked until: (1) Design Agent publishes SPEC-019; (2) Backend Engineer publishes updated API contract for `POST /api/v1/care-actions/batch`
- T-108, T-109, T-111 have no blockers — all can start immediately
- Production deployment remains blocked on project owner providing SSL certificates
- Production email delivery blocked on project owner providing SMTP credentials
- **Infrastructure note:** Local staging backend process may terminate between Deploy and Monitor phases — Monitor Agent must restart it if connection refused (not a code issue; local process-based staging limitation)

---

*Sprint #24 plan written by Manager Agent on 2026-04-05.*
