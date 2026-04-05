# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #20 — 2026-04-12 to 2026-04-18

**Sprint Goal:** Give users visibility into their past care actions by delivering a **Care History** feature — a chronological, per-plant log of all care events — and resolve the lodash transitive security vulnerability. Care History closes the feedback loop for novice plant owners: they can confirm they cared for a plant last week, see patterns, and build confidence in their routine.

**Context:** Sprint #19 delivered the Care Streak tracker and closed two debt items (auth.test fix, CSS token migration) in the sixth consecutive clean sprint. Backend is at 130/130 tests, frontend at 195/195. Deploy Verified: Yes at SHA 99104bc. Sprint #20 adds Care History, which pairs naturally with the Streak feature by letting users drill into *which* actions drove their streak, and fixes the lodash audit advisory queued from Sprint #19.

---

## In Scope

### P2 — Security Housekeeping (start immediately, no dependencies)

- [ ] **T-095** — Backend Engineer: Run `npm audit fix` and resolve lodash vulnerability **(P2)**
  - **Description:** `npm audit` reports 1 high-severity vulnerability in lodash (≤4.17.23) — prototype pollution via `_.unset`/`_.omit` and code injection via `_.template`. These are transitive dependencies and the vulnerable functions are not directly called in application code. Run `npm audit fix` in the backend directory; if lodash cannot be auto-fixed (pinned by a direct dep), either upgrade the direct parent dependency or add an npm `overrides` entry for lodash to `>=4.17.24`. Also run `npm audit fix` in the frontend directory and resolve any fixable vulnerabilities. After fix, verify `npm audit` reports 0 high/critical advisories. Run the full test suite to confirm no regressions.
  - **Acceptance Criteria:**
    - `npm audit` in `backend/` reports 0 high or critical severity vulnerabilities
    - `npm audit` in `frontend/` reports 0 high or critical severity vulnerabilities (or documents any that cannot be auto-fixed with rationale)
    - All 130/130 backend tests still pass after dependency changes
    - All 195/195 frontend tests still pass after dependency changes
    - No new `npm audit` advisories introduced
  - **Dependencies:** None — start immediately.
  - **Fix locations:** `backend/package.json`, `frontend/package.json` (+ lockfiles)

---

### P1 — Care History Feature

- [ ] **T-092** — Design Agent: Write SPEC-015 — Care History UX spec **(P1)**
  - **Description:** Design the Care History feature — a per-plant chronological log of all logged care events. Cover: (1) **Entry point** — a "History" tab or section on the Plant Detail page (existing plant detail view), accessible alongside the current care schedule status; (2) **List view** — entries show care type (watering, fertilizing, repotting), date performed (relative: "3 days ago", absolute on hover/tooltip), and any notes if present; (3) **Pagination or infinite scroll** — how to handle plants with long history (suggest paginated with "Load more" or 20-item pages); (4) **Empty state** — first-time user who has not yet logged any care; (5) **Filtering** — optional filter by care type (All / Watering / Fertilizing / Repotting); (6) **Date grouping** — consider grouping by month for readability; (7) **Dark mode** and accessibility.
  - **Acceptance Criteria:**
    - SPEC-015 written to `.workflow/ui-spec.md` (appended as a new section)
    - Covers entry point (Plant Detail page tab/section)
    - Covers list item layout: care type, date (relative + absolute), care type icon
    - Covers pagination strategy (Load More or page-based)
    - Covers empty state (no actions logged yet)
    - Covers care type filter (All / Watering / Fertilizing / Repotting)
    - Dark mode and accessibility notes included (aria-label, no color-only info)
  - **Dependencies:** None — start immediately.
  - **Fix locations:** `.workflow/ui-spec.md`

---

- [ ] **T-093** — Backend Engineer: Care history endpoint `GET /api/v1/plants/:id/care-history` **(P1)**
  - **Description:** Add a new authenticated, plant-scoped endpoint that returns a paginated list of care actions for the requesting user's plant. The plant must belong to the authenticated user (403 if not). Support filtering by `careType` (watering, fertilizing, repotting) and pagination via `page` and `limit` query params (default limit 20, max 100). Return entries in reverse-chronological order (most recent first). Publish API contract to `.workflow/api-contracts.md` before T-094 begins.
  - **Acceptance Criteria:**
    - `GET /api/v1/plants/:id/care-history` — authenticated, 401 if no token
    - 403 if plant `:id` does not belong to the authenticated user
    - 404 if plant `:id` does not exist
    - Optional `careType` filter: `watering` | `fertilizing` | `repotting`; 400 VALIDATION_ERROR if invalid value
    - Pagination: `page` (integer ≥ 1, default 1), `limit` (integer 1–100, default 20); 400 on out-of-range
    - Response: `{ "data": { "items": [...], "total": N, "page": N, "limit": N, "totalPages": N } }`
    - Each item: `{ "id": N, "careType": "watering", "performedAt": "ISO-8601", "notes": string | null }`
    - Items ordered by `performed_at DESC`
    - Unit tests: empty plant (0 items), 3-item list, filter by careType, pagination (page 2), plant not owned (403), plant not found (404), invalid careType (400), pagination out of range (400), 401 no auth
    - All 130/130 backend tests pass; add minimum 9 new tests
    - API contract published to `.workflow/api-contracts.md` before T-094 begins
  - **Blocked By:** None — start immediately. Publish API contract before T-094 begins.
  - **Fix locations:** `backend/src/routes/plants.js` (new GET /:id/care-history handler), `backend/src/models/CareAction.js` (paginated history query)

---

- [ ] **T-094** — Frontend Engineer: Care History section on Plant Detail page **(P1)**
  - **Description:** Add a Care History tab or collapsible section to the Plant Detail page that displays the paginated care action log fetched from `GET /api/v1/plants/:id/care-history`. Per SPEC-015. Key requirements: (1) care type icon + label + relative date ("3 days ago") with absolute date on hover/title; (2) "Load More" button for pagination (append items, don't replace); (3) care type filter tabs (All / Watering / Fertilizing / Repotting) — changing filter resets to page 1; (4) empty state when no history exists; (5) loading skeleton during initial fetch; (6) error state (non-fatal, shows message without breaking the page); (7) dark mode via CSS custom properties; (8) accessibility: list uses `role="list"`, each item has descriptive `aria-label`.
  - **Acceptance Criteria:**
    - Plant Detail page renders Care History section/tab
    - Care action list shows care type icon, care type label, and relative date
    - "Load More" button loads next page and appends results
    - Filter tabs (All/Watering/Fertilizing/Repotting) filter the history list; changing filter resets pagination
    - Empty state: friendly message ("No care history yet. Mark your first care action done!") with CTA
    - Loading skeleton shown during initial fetch; `aria-busy` set appropriately
    - Error state renders gracefully without breaking the page
    - Dark mode: all new elements use CSS custom properties
    - Accessibility: `role="list"` on history list, descriptive `aria-label` per entry
    - Unit tests: renders history list, renders empty state, renders loading skeleton, filter tab changes careType, Load More appends items, error state renders, aria-label on entries
    - All 195/195 frontend tests still pass; add minimum 7 new tests
  - **Blocked By:** T-092 (SPEC-015 must exist), T-093 (API contract must be published)
  - **Fix locations:** `frontend/src/pages/PlantDetailPage.jsx` (or equivalent plant detail component), new `CareHistorySection.jsx` component, new `careHistory` API method in `frontend/src/api.js`

---

## Out of Scope

- Social auth (Google OAuth) — B-001 — post-sprint
- Push/email notifications for care reminders — B-002 — post-sprint
- Plant sharing / public profiles — B-003 — post-sprint
- Reference photo in AI advice results (FB-081) — post-MVP
- Production deployment execution — blocked on project owner providing SSL certs
- Express 5 migration — advisory backlog; no breaking-change-safe path confirmed
- Soft delete / grace period for account deletion (FB-077) — backlog
- `/ai/identify` 502 message specificity improvement — backlog
- Endpoint-specific rate limiting on `/care-actions/stats` (FB-073) — backlog
- Care notes / freeform plant journal — backlog
- Batch mark-done on Care Due Dashboard — backlog

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Design Agent | Care History UX spec | T-092 (P1, start immediately) |
| Backend Engineer | Lodash audit fix + Care history endpoint | T-095 (P2, start immediately), T-093 (P1, start immediately, publish API contract before T-094) |
| Frontend Engineer | Care history UI on Plant Detail page | T-094 (P1, after T-092 spec + T-093 contract) |
| QA Engineer | Full QA of T-092–T-095, security checklist | After all tasks complete |
| Deploy Engineer | Staging re-deploy after QA sign-off | After all tasks QA-verified |
| Monitor Agent | Post-deploy health check — verify `/plants/:id/care-history` on staging | After Deploy Engineer re-deploy |
| Manager | Sprint coordination, API contract review, code review | Ongoing |

---

## Dependency Chain (Critical Path)

```
T-095 (lodash audit fix — Backend, START IMMEDIATELY — parallel to all)

T-092 (SPEC-015 — Design Agent, START IMMEDIATELY)
  ↓ (spec complete)

T-093 (care-history endpoint — Backend, START IMMEDIATELY — publish contract before T-094)
  ↓ (publish API contract to api-contracts.md)
T-094 (care history UI — Frontend, after T-092 spec + T-093 contract)
  ↓
QA verifies T-092 + T-093 + T-094 + T-095 end-to-end

[After all tasks QA-verified]
Deploy Engineer re-deploys to staging
  ↓
Monitor Agent health check — verify GET /plants/:id/care-history on staging
```

**Critical path:** T-092 + T-093 (parallel start) → T-094 → QA → Deploy → Monitor → staging verified.
**Parallel path:** T-095 can proceed immediately and independently of the feature chain.

---

## Definition of Done

Sprint #20 is complete when:

- [ ] T-092: SPEC-015 written covering entry point, list item layout, pagination, empty state, care type filter, dark mode, and accessibility
- [ ] T-093: `GET /api/v1/plants/:id/care-history` implemented; API contract published; 9+ new tests; all 130/130 backend tests pass
- [ ] T-094: Care History section renders on Plant Detail page; Load More pagination works; filter tabs work; empty state present; 7+ new tests; all 195/195 frontend tests pass
- [ ] T-095: `npm audit` in both backend and frontend report 0 high/critical vulnerabilities; all 130/130 backend + 195/195 frontend tests pass
- [ ] Deploy Verified: Yes from Monitor Agent post-deploy health check
- [ ] No regressions: backend ≥ 130/130, frontend ≥ 195/195

---

## Success Criteria

- **Audit clean** — `npm audit` in both backend and frontend returns 0 high or critical advisories
- **History visible** — User visits a plant's detail page and sees a chronological log of every care action they've marked done for that plant
- **Filter works** — User can filter history by care type (watering / fertilizing / repotting); list updates correctly
- **Load More works** — Plants with many care actions paginate correctly; "Load More" appends without replacing existing items
- **Empty state friendly** — New users with no care history see a helpful, encouraging empty state rather than a blank panel
- **Test suite grows** — Backend adds minimum 9 new tests; frontend adds minimum 7 new tests; no regressions

---

## Blockers

- T-094 (care history UI) is blocked until: (1) Design Agent publishes SPEC-015; (2) Backend Engineer publishes `GET /plants/:id/care-history` API contract
- T-092, T-093, T-095 have no blockers — all can start immediately
- Production deployment remains blocked on project owner providing SSL certificates

---

*Sprint #20 plan written by Manager Agent on 2026-04-05.*
