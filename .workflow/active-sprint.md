# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #18 — 2026-04-01 to 2026-04-07

**Sprint Goal:** Improve the inventory experience for users with growing plant collections by adding search and filter capabilities, complete the design system by finishing the ProfilePage CSS token migration, and improve accessibility with focus management on the Care Due Dashboard.

**Context:** Sprint #17 delivered the AI Recommendations feature — the last major unbuilt MVP capability — in a clean fourth consecutive sprint. Backend sits at 108/108 tests, frontend at 162/162. Deploy Verified: Yes at SHA f9481eb. Sprint #18 now turns to post-MVP quality and UX: a search/filter feature on the plant inventory (the highest-value UX improvement for users with growing collections), two polish items from feedback (ProfilePage CSS tokens + Care Due focus management), and a Design spec to guide the new frontend work.

---

## In Scope

### P1 — Plant Inventory Search & Filter

- [ ] **T-082** — Design Agent: Write SPEC-013 — Inventory Search & Filter UX **(P1)**
  - **Description:** Create a detailed UI spec for search and filter capabilities on the Plant Inventory page (`/`). Cover: (1) search input — user types a plant name and the list filters in real-time (debounced); (2) status filter — dropdown or tab strip letting the user filter by All, Overdue, Due Today, On Track; (3) combined search + filter — both active simultaneously; (4) empty states — no results for query, no results for filter, and the existing "no plants yet" empty state; (5) clear/reset behaviour; (6) loading and skeleton states.
  - **Acceptance Criteria:**
    - SPEC-013 written to `.workflow/ui-spec.md` (appended as a new section)
    - Covers search input placement, visual design, and debounce note
    - Covers status filter UI (All / Overdue / Due Today / On Track) — tab strip or segmented control preferred
    - Covers combined search + filter behaviour
    - Covers all empty states: no query match, no status filter match, no plants at all
    - Covers clear/reset controls
    - Covers loading/skeleton state during filter
    - Dark mode and accessibility notes included (keyboard nav, aria-label, aria-live for results count)
  - **Dependencies:** None — start immediately.
  - **Fix locations:** `.workflow/ui-spec.md`

---

- [ ] **T-083** — Backend Engineer: Add `search` and `status` query parameters to `GET /api/v1/plants` **(P1)**
  - **Description:** Extend the existing `GET /api/v1/plants` endpoint to accept `search` (name substring) and `status` (overdue | due_today | on_track) query parameters. Both are optional and can be combined. The response shape stays identical.
  - **Acceptance Criteria:**
    - `GET /api/v1/plants?search=pothos` returns only plants whose name contains "pothos" (case-insensitive)
    - `GET /api/v1/plants?status=overdue` returns only plants that have at least one care schedule currently overdue
    - `GET /api/v1/plants?search=spider&status=due_today` applies both filters simultaneously
    - Both params are optional — omitting them returns all plants (existing behaviour unchanged)
    - `search` is trimmed and has a max length of 200 chars; returns 400 `VALIDATION_ERROR` if exceeded
    - `status` must be one of `overdue | due_today | on_track`; any other value returns 400 `VALIDATION_ERROR`
    - Status filtering uses the same UTC-offset-aware logic as `GET /api/v1/care-due` (accept optional `utcOffset` param)
    - Pagination (`page`, `limit`) continues to work correctly with filtered results
    - Unit tests: search match (case-insensitive), search no match (empty array), status filter (overdue), status filter (on_track), combined search + status, invalid status value (400), search too long (400), existing no-param behaviour unchanged
    - All 108/108 backend tests still pass; add minimum 6 new tests
    - API contract published to `.workflow/api-contracts.md` before Frontend Engineer begins T-084
  - **Dependencies:** None — start immediately. Publish API contract before T-084 begins.
  - **Fix locations:** `backend/src/routes/plants.js` (extend GET handler), `backend/src/routes/plants.js` (query param validation)

---

- [ ] **T-084** — Frontend Engineer: Plant inventory search & filter UI **(P1)**
  - **Description:** Add a search input and status filter control to the Plant Inventory page. Calls the updated `GET /api/v1/plants` endpoint with `search` and `status` params. Debounce the search input (300ms). Display result counts and all empty states per SPEC-013.
  - **Acceptance Criteria:**
    - Search input visible above the plant grid on the inventory page
    - Typing debounces at 300ms then re-fetches with `?search=query`
    - Status filter (All / Overdue / Due Today / On Track) triggers immediate re-fetch with `?status=value`
    - Combined search + filter: both params sent simultaneously
    - Clear/reset: an ✕ button on the search input clears the query; selecting "All" in the filter resets status
    - Empty state — no query match: friendly message ("No plants match your search.")
    - Empty state — no status match: ("No plants are currently overdue." etc.)
    - Empty state — no plants at all: existing empty state preserved
    - Loading: skeleton cards shown while fetching
    - Result count: "Showing N plants" displayed when a filter is active
    - Dark mode: all new elements use CSS custom properties
    - Accessibility: search input has `aria-label`; result list has `aria-live` region for count updates; keyboard navigation works for filter controls
    - Unit tests: search input triggers debounced fetch, status filter triggers immediate fetch, combined params sent correctly, empty state renders for no results, clear button resets query, skeleton shown during load
    - All 162/162 frontend tests still pass; add minimum 6 new tests
  - **Blocked By:** T-082 (SPEC-013 must exist), T-083 (API contract for updated `GET /plants` must be published)
  - **Fix locations:** `frontend/src/pages/InventoryPage.jsx` (or `HomePage.jsx`), new `PlantSearchFilter.jsx` component

---

### P2 — Design System Polish & Accessibility

- [ ] **T-085** — Frontend Engineer: ProfilePage stat tile icons → CSS custom properties **(P2)**
  - **Description:** Complete the design system token migration started in Sprint 16 (T-072). `ProfilePage.jsx` still passes hardcoded `color="#5C7A5C"` to three Phosphor icon components (Plant, CalendarBlank, CheckCircle) at lines 136, 141, 146. Replace with `color="var(--color-accent-primary)"` to match the AnalyticsPage pattern.
  - **Acceptance Criteria:**
    - `ProfilePage.jsx` lines 136, 141, 146: `color="#5C7A5C"` replaced with `color="var(--color-accent-primary)"`
    - No hardcoded hex color values remain in `ProfilePage.jsx`
    - Dark mode: icons adopt the correct `--color-accent-primary` token value in both light and dark themes
    - No test changes expected — visual-only change; confirm 162/162 tests still pass
  - **Dependencies:** None — can start immediately, parallel to T-082/T-083.
  - **Fix locations:** `frontend/src/pages/ProfilePage.jsx` (lines 136, 141, 146)

---

- [ ] **T-086** — Frontend Engineer: Focus management after mark-done on Care Due Dashboard **(P2)**
  - **Description:** After a user successfully marks a care action as done on the Care Due Dashboard (`/due`), the item fades out and is removed from the list. Currently, keyboard focus is lost at that point (the focused element is removed from the DOM). Implement SPEC-009's intended behaviour: move focus to the next item's "Mark as done" button after an item is removed, or to the "View my plants" / "All plants cared for!" CTA if the last item in the section (or the entire list) is cleared.
  - **Acceptance Criteria:**
    - After mark-done removes an item, focus moves to the next sibling item's "Mark as done" button within the same urgency section (if one exists)
    - If the removed item was the last in its urgency section, focus moves to the first item's button in the next populated section
    - If the removed item was the last item in all sections (list becomes empty), focus moves to the "View my plants" button or the primary CTA in the all-clear state
    - Focus transition happens after the fade-out animation completes (not before the item is removed from DOM)
    - Screen readers announce the mark-done result via existing `aria-live` region — no changes needed there
    - Keyboard navigation remains logical throughout
    - Unit tests: focus moves to next item after mark-done, focus moves to CTA when list empties
    - All 162/162 frontend tests still pass; add minimum 2 new tests
  - **Dependencies:** None — can start immediately.
  - **Fix locations:** `frontend/src/pages/CareDuePage.jsx` (mark-done handler, focus management logic)

---

## Out of Scope

- Social auth (Google OAuth) — B-001 — post-sprint
- Push/email notifications for care reminders — B-002 — post-sprint
- Plant sharing / public profiles — B-003 — post-sprint
- Reference photo in AI advice results (FB-081) — requires botanical image API, post-MVP
- Production deployment execution — blocked on project owner providing SSL certs
- Express 5 migration — advisory backlog; no breaking-change-safe path yet
- Care streak / gamification features — post-sprint
- Soft delete / grace period for account deletion (FB-077) — backlog
- `/ai/identify` 502 message specificity improvement — backlog

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Design Agent | Inventory Search & Filter UX spec | T-082 (P1, start immediately) |
| Backend Engineer | Extend GET /plants with search + status filter | T-083 (P1, start immediately, publish API contract before T-084) |
| Frontend Engineer | Inventory search/filter UI + ProfilePage polish + Care Due focus management | T-084 (P1, after T-082 spec + T-083 contract), T-085 (P2, start immediately), T-086 (P2, start immediately) |
| QA Engineer | Full QA of T-082–T-086, security checklist | After T-084, T-085, T-086 complete |
| Deploy Engineer | Staging re-deploy after QA sign-off | After all tasks QA-verified |
| Monitor Agent | Post-deploy health check — verify updated `GET /plants` endpoint with search/filter params | After Deploy Engineer re-deploy |
| Manager | Sprint coordination, API contract review/approval, code review | Ongoing |

---

## Dependency Chain (Critical Path)

```
T-082 (SPEC-013 — Design Agent, START IMMEDIATELY)
  ↓ (spec complete → Frontend can begin T-084 UI layout)

T-083 (GET /plants search+filter — Backend, START IMMEDIATELY)
  ↓ (publish API contract to api-contracts.md)
T-084 (Inventory search/filter UI — Frontend, after T-082 spec + T-083 contract)
  ↓
QA verifies T-082 + T-083 + T-084 end-to-end

[Parallel — no dependencies]
T-085 (ProfilePage CSS tokens — Frontend, start immediately)
T-086 (Care Due focus management — Frontend, start immediately)
  ↓
QA verifies T-085 + T-086

[After all tasks QA-verified]
Deploy Engineer re-deploys to staging
  ↓
Monitor Agent health check — verify GET /plants?search=&status= on staging
```

**Critical path:** T-082 + T-083 (parallel start) → T-084 → QA → Deploy → Monitor → staging verified.
**Parallel path:** T-085 + T-086 can proceed independently of T-082/T-083/T-084.

---

## Definition of Done

Sprint #18 is complete when:

- [ ] T-082: SPEC-013 written covering search input, status filter, combined use, all empty states, dark mode notes
- [ ] T-083: `GET /api/v1/plants?search=&status=` implemented; API contract published; 6+ new tests; all 108/108 backend tests pass
- [ ] T-084: Search input and status filter functional on inventory page; debounce works; all empty states handled; 6+ new tests; all 162/162 frontend tests pass
- [ ] T-085: `ProfilePage.jsx` lines 136/141/146 updated to `var(--color-accent-primary)`; no hardcoded hex remains; 162/162 frontend tests pass
- [ ] T-086: Focus management after mark-done implemented; 2+ new tests; all 162/162 frontend tests pass
- [ ] Deploy Verified: Yes from Monitor Agent post-deploy health check
- [ ] No regressions: backend ≥ 108/108, frontend ≥ 162/162

---

## Success Criteria

- **Search works** — User types "pothos" in the inventory search bar and sees only pothos plants within 300ms (debounce)
- **Status filter works** — User selects "Overdue" and sees only plants with overdue care schedules
- **Combined filter works** — User combines search + status filter; both params sent; results correctly narrowed
- **Empty states handled** — No-match empty state is friendly and doesn't look broken
- **Design system complete** — ProfilePage stat tile icons adopt theme color via CSS variable; no hardcoded hex values remain in the page
- **Accessibility improved** — Keyboard users on Care Due Dashboard don't lose focus after marking a plant as cared for
- **Test suite grows** — Backend adds minimum 6 new tests; frontend adds minimum 14 new tests; no regressions

---

## Blockers

- T-084 (frontend search/filter UI) is blocked until: (1) Design Agent publishes SPEC-013; (2) Backend Engineer publishes updated `GET /plants` API contract
- T-085 and T-086 have no blockers — start immediately in parallel with T-082/T-083
- T-083 can start immediately — no dependencies

---

*Sprint #18 plan written by Manager Agent on 2026-04-01.*
