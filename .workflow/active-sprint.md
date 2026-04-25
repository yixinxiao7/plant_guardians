# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #30 — 2026-04-27 to 2026-05-03

**Sprint Goal:** Fix the `uuid` moderate vulnerability housekeeping item (FB-129 → T-140) and ship plant list search, sort, and status filter — so "plant killer" users can instantly find plants that need attention without scrolling through their entire inventory.

**Context:** Sprint #29 delivered a complete, polished sharing system and closed the batch mark-done correctness bug. The app's core MVP feature set is now complete. Sprint #30 has two tracks: (1) a minor housekeeping fix (`uuid` bump, T-140, XS) that was identified during Sprint #29 QA; and (2) a meaningful UX improvement — search, sort, and status filter on the plant list — that directly serves the "plant killer" persona who may have a large inventory and needs to quickly triage which plants need action. The filter-by-status capability (show only "overdue", "due today", or "on_track" plants) is the most-requested implicit usability gap now that the core care status logic is solid.

---

## In Scope

### P2 — Backend: Fix `uuid` Moderate Vulnerability (T-140)

- [ ] **T-140** — Backend Engineer: Bump `uuid` to `>=14.0.0` in `backend/package.json` to resolve GHSA-w5hq-g745-h8pq **(P2)**
  - **Description:** Per FB-129: `cd backend && npm audit` reports 1 moderate vulnerability — `uuid <14.0.0` (missing buffer bounds check in `v3/v5/v6` when `buf` is provided, GHSA-w5hq-g745-h8pq). The only consumer is `backend/src/middleware/upload.js` which calls only `uuid.v4()` with no `buf` argument — not exploitable in our codebase, but the advisory should be cleared.
    - Run `npm install uuid@latest` (or `npm audit fix --force`) in `backend/`. Verify the installed version is `>=14.0.0`.
    - Verify `backend/src/middleware/upload.js` — confirm the `uuid.v4()` import and call pattern is still valid after the major-version bump. `uuid@14` changed the import path from named import `{ v4 as uuidv4 }` to default or namespace import — check the `uuid@14` changelog and update `upload.js` import if required.
    - After any import update, run `npm test` — all 226/226 existing backend tests must pass.
    - Run `npm audit` — must report 0 moderate and 0 high/critical vulnerabilities.
    - No new migrations. No API changes.
  - **Acceptance Criteria:**
    - `cd backend && npm audit` reports 0 vulnerabilities (0 moderate, 0 high, 0 critical)
    - `uuid` package version `>=14.0.0` installed and reflected in `package-lock.json`
    - `backend/src/middleware/upload.js` import updated if required by uuid@14 API change
    - All 226/226 existing backend tests pass after bump
    - No other dependency changes
  - **Blocked By:** None — start immediately.

---

### P2 — Design: Plant List Search, Sort, and Filter UX Spec (T-141)

- [ ] **T-141** — Design Agent: Write SPEC-024 — Plant list search, sort, and status filter **(P2)**
  - **Description:** Specify the search, sort, and filter affordances on the My Plants page (`/`):
    1. **Search bar:** A text input (placeholder "Search plants…") above the plant grid. As the user types, the plant list filters to show only plants whose `name` or `species` contains the search string (case-insensitive). Debounced at ~300 ms to avoid excessive API calls. Show a "No plants match your search." empty state when 0 results. Clear button (×) appears when input is non-empty. The search bar is always visible (not hidden behind a filter button).
    2. **Status filter:** A segmented control or tab-style toggle with four options: "All" (default), "Overdue", "Due today", and "On track". Selecting a filter scopes the list to plants matching that care status. Filter persists while the user navigates within the session (restored on back-navigation from PlantDetailPage). "All" always shows the full count badge; other tabs show the count of matching plants.
    3. **Sort dropdown:** A compact dropdown (default "Name A–Z") with options: "Name A–Z", "Name Z–A", "Most overdue first" (plants with largest `days_overdue` at top), "Next due soonest" (plants with smallest `next_due_days` at top). Default sort is "Name A–Z".
    4. **Combined state:** Search, filter, and sort can all be active simultaneously (e.g., search "fern" + filter "Overdue" + sort "Most overdue first"). Combined empty state: "No overdue plants match your search." (combines filter label + search term). Reset link: "Clear filters" appears when any non-default selection is active and resets all three to defaults.
    5. **Loading and skeleton states:** While initial plant list is loading, show the search bar and filter controls in a disabled/skeleton state so the layout doesn't shift when data arrives.
    6. **Accessibility:** Search input has `aria-label="Search plants"`; filter toggle uses `role="group"` with `aria-label="Filter by status"`; sort dropdown has `aria-label="Sort plants"`; live region (`aria-live="polite"`) announces count changes.
  - **Acceptance Criteria:**
    - SPEC-024 written to `ui-spec.md` and marked Approved
    - All 6 surfaces documented: search bar, status filter tabs, sort dropdown, combined state, empty states, loading/skeleton
    - Accessibility requirements explicit (ARIA roles, live region, keyboard navigation)
    - Gates T-142 and T-143
  - **Blocked By:** None — start immediately.

---

### P1 — Backend: Plant List Search, Sort, and Filter Query Params (T-142)

- [ ] **T-142** — Backend Engineer: Extend `GET /api/v1/plants` with `search`, `status`, and `sort` query params **(P1)**
  - **Description:** Extend the existing `GET /api/v1/plants` endpoint to accept three optional query parameters:
    1. **`search` (string, optional):** Case-insensitive substring match against `name` OR `species`. Use `ILIKE '%<term>%'` (PostgreSQL) via Knex's `.whereRaw()` or `.where(db.raw(...))`. Sanitize input — strip leading/trailing whitespace; if empty string after trim, treat as no filter. Maximum 200 characters (return 400 if exceeded with `INVALID_SEARCH_TERM` code).
    2. **`status` (enum, optional):** One of `"overdue"`, `"due_today"`, `"on_track"`. Filter the plants returned by their computed care status. The status is already computed per-plant in the existing `GET /api/v1/plants` response (`status` field on each care schedule). Filter plants where ANY of their care schedules matches the requested status. If `"overdue"` is requested, return plants that have at least one overdue schedule; `"due_today"` — at least one due-today schedule; `"on_track"` — all schedules on track (no overdue or due-today). Return 400 for invalid `status` values with `INVALID_STATUS_FILTER` code.
    3. **`sort` (enum, optional, default `"name_asc"`):** One of `"name_asc"`, `"name_desc"`, `"most_overdue"`, `"next_due_soonest"`. `"name_asc"` / `"name_desc"` order by `plants.name` ASC/DESC. `"most_overdue"` orders by the maximum `days_overdue` across schedules DESC (plants with the most overdue days first; 0 for on-track plants). `"next_due_soonest"` orders by the minimum `next_due_days` across schedules ASC (plants due soonest first). Return 400 for invalid sort values with `INVALID_SORT_OPTION` code.
    4. **Pagination:** All existing pagination params (`page`, `limit`) continue to work and apply AFTER search/filter/sort. The `pagination.total` in the response reflects the filtered count (not the total plant count).
    5. **No schema changes required** — all filtering and sorting happens in the query layer.
    6. **Tests:** ≥ 8 new tests: search happy path (name match), search happy path (species match), search case-insensitive, search no match → empty array, status filter overdue, status filter on_track, sort name_desc, sort most_overdue; plus input validation tests (search too long → 400, invalid status → 400, invalid sort → 400). All 226/226 existing backend tests pass.
    7. **Publish updated API contract** to `api-contracts.md` documenting all three new query params, their validation rules, error codes, and example responses.
  - **Acceptance Criteria:**
    - `GET /api/v1/plants?search=<term>` filters by name/species case-insensitively
    - `GET /api/v1/plants?status=overdue|due_today|on_track` filters by care status
    - `GET /api/v1/plants?sort=name_asc|name_desc|most_overdue|next_due_soonest` sorts correctly
    - All three params combinable simultaneously; pagination `total` reflects filtered count
    - Input validation: 400 for search > 200 chars, unknown status values, unknown sort values
    - All 226/226 existing backend tests pass; ≥ 8 new tests added
    - API contract published
  - **Blocked By:** T-141

---

### P1 — Frontend: Plant List Search, Sort, and Filter UI (T-143)

- [ ] **T-143** — Frontend Engineer: Add search bar, status filter tabs, and sort dropdown to MyPlantsPage **(P1)**
  - **Description:** Per SPEC-024:
    1. **Search bar:** Controlled text input with debounce (~300 ms, use `setTimeout`/`clearTimeout` in a `useEffect`). "Search plants…" placeholder. Clear button (×) visible when non-empty. Passes `search` query param to the existing `plants.getAll()` API call (extend the function signature to accept `{ search, status, sort }` options).
    2. **Status filter tabs:** Segmented control with "All" / "Overdue" / "Due today" / "On track" options. Each tab shows a count badge (fetched from the same API response). Selecting a tab passes `status` query param. Persist selection in component state (restored on re-mount within session via `useRef` or React context — do not persist to `localStorage`).
    3. **Sort dropdown:** `<select>` or custom dropdown with options "Name A–Z" (`name_asc`), "Name Z–A" (`name_desc`), "Most overdue first" (`most_overdue`), "Next due soonest" (`next_due_soonest`). Default `name_asc`. Passes `sort` query param.
    4. **Combined state handling:** When search + filter + sort all active, construct the query with all three params. Empty state message: "No [filter label] plants match your search." with a "Clear filters" link that resets all three to defaults. If no filter active but search returns empty: "No plants match your search." "Clear filters" shows when search is non-empty OR status is not "All" OR sort is not "name_asc".
    5. **Loading state:** While fetching (on initial load or when any param changes), show the search bar + filter controls in their current state (not skeleton) and show the existing plant grid skeleton. Do not reset the controls on refetch.
    6. **Extend `plants.getAll(options)`** in `frontend/src/utils/api.js` to accept `{ search, status, sort, page, limit }` and build the query string accordingly. Strip empty/undefined params.
    7. **Tests:** ≥ 8 new tests: search input renders + debounce fires API call; clear button resets search; status tab change triggers re-fetch; sort dropdown change triggers re-fetch; combined params all pass to API; empty state renders for no results; "Clear filters" resets all; accessibility (aria-label on search input, aria-label on filter group, live region update). All 312/312 existing frontend tests pass.
  - **Acceptance Criteria:**
    - Search input debounced at ~300 ms; clears with × button
    - Status filter tabs change API call with correct `status` param
    - Sort dropdown changes API call with correct `sort` param
    - All three combinable; "Clear filters" resets to defaults
    - Empty state message reflects active filter + search
    - All 312/312 existing frontend tests pass; ≥ 8 new tests
    - T-141 (SPEC-024 Approved) and T-142 API contract must be complete before this task begins
  - **Blocked By:** T-141, T-142 (for API contract and response shape)

---

### P2 — QA: Sprint #30 Verification (T-144)

- [ ] **T-144** — QA Engineer: Verify T-140, T-142, T-143 and confirm no regressions **(P2)**
  - **Description:** After T-142 and T-143 are In Review/Done, run the full test suite and perform product-perspective testing:
    - Backend: all tests pass (≥ 234/226 baseline); T-142 new tests cover search/filter/sort happy paths, combined params, and input validation (400 cases)
    - Frontend: all tests pass (≥ 320/312 baseline); T-143 tests cover debounce, clear, tab change, sort change, combined params, empty states, accessibility
    - T-140 housekeeping: `npm audit` in `backend/` reports 0 vulnerabilities (0 moderate, 0 high); uuid@14 import verified in `upload.js`; 226/226 tests pass
    - SPEC-024 compliance: search bar, status filter tabs, sort dropdown, combined state, empty states, loading/skeleton per spec
    - Security checklist: no new endpoints that bypass auth; existing `GET /api/v1/plants` auth still enforced; search param sanitization (no SQL injection via ILIKE); no PII leaked via search
    - API contract for T-142 verified against implementation
  - **Acceptance Criteria:**
    - Backend ≥ 234/226 tests pass; frontend ≥ 320/312 tests pass
    - T-140: `npm audit` → 0 vulnerabilities; uuid@14 import correct; tests still pass
    - Full SPEC-024 compliance verified
    - Security checklist pass (auth enforced, search sanitized, no PII leak)
    - QA sign-off logged in `qa-build-log.md`
  - **Blocked By:** T-140, T-142, T-143

---

### P2 — Deploy: Staging Re-Deploy (T-145)

- [ ] **T-145** — Deploy Engineer: Staging re-deploy after QA sign-off **(P2)**
  - **Description:** After QA sign-off (T-144), run the standard staging deploy checklist. No new migrations this sprint (T-142 adds query params only — no schema changes; T-140 is a dependency bump only). Restart backend process to pick up updated `uuid` dependency. Rebuild frontend dist. Verify `/api/health` → 200 and spot-check new endpoint params.
  - **Acceptance Criteria:**
    - No new migrations (confirm `knex migrate:latest` returns "Already up to date")
    - Backend process restarted and healthy on port 3000 (picks up uuid@14 bump)
    - `GET /api/health` → 200
    - `GET /api/v1/plants?search=<term>` (authenticated) → 200 + filtered results (verifies search is live)
    - `GET /api/v1/plants?status=overdue` (authenticated) → 200 + filtered results
    - Staging deploy logged in `qa-build-log.md`
  - **Blocked By:** T-144

---

### P2 — Monitor: Post-Deploy Health Check (T-146)

- [ ] **T-146** — Monitor Agent: Post-deploy health check for Sprint #30 **(P2)**
  - **Description:** Run the standard post-deploy health check after T-145 deploy. Verify all existing endpoints remain healthy. For new functionality: verify `GET /api/v1/plants?search=<term>` (authenticated) returns 200 + filtered results; verify `GET /api/v1/plants?status=overdue` returns 200 + matching plants; verify `GET /api/v1/plants?sort=most_overdue` returns 200 + results. Verify T-140: `cd backend && npm audit` → 0 vulnerabilities. Log **Deploy Verified: Yes/No** in `qa-build-log.md`.
  - **Acceptance Criteria:**
    - `GET /api/health` → 200
    - All existing core endpoints → expected status codes (no regressions)
    - `GET /api/v1/plants?search=<term>` (authenticated) → 200 + filtered array
    - `GET /api/v1/plants?status=overdue` (authenticated) → 200 + matching plants
    - `cd backend && npm audit` → 0 vulnerabilities (T-140 verified)
    - Deploy Verified: Yes logged in `qa-build-log.md`
    - If backend process is not running, restart before health check
  - **Blocked By:** T-145

---

## Out of Scope

- Email care reminders / notification delivery — blocked on project owner providing SMTP credentials
- Push notifications — post-MVP (B-002)
- Share analytics (view count per share token) — future
- Open Graph image generation (dynamic social cards) — future sprint polish
- Production deployment execution — blocked on project owner providing SSL certs
- Express 5 migration — advisory backlog, no urgency
- Soft-delete / grace period for account deletion — post-MVP
- Dark mode confetti palette (B-007) — cosmetic, low priority backlog
- Real Google OAuth credentials for full end-to-end OAuth staging test — blocked on project owner
- Plant care history calendar view / visualization charts — future sprint (post search/filter foundation)
- Care schedule bulk edit (change all watering frequencies at once) — backlog

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Backend Engineer | uuid fix + search/filter/sort endpoint | T-140 (P2, start immediately), T-142 (P1, after T-141) |
| Design Agent | Search, sort, filter UX spec | T-141 (P2, start immediately — gates T-142 and T-143) |
| Frontend Engineer | Search/filter/sort UI | T-143 (P1, after T-141 + T-142 API contract) |
| QA Engineer | Full regression + new feature verification | T-144 (P2, after T-140 + T-142 + T-143) |
| Deploy Engineer | Staging re-deploy | T-145 (P2, after T-144) |
| Monitor Agent | Post-deploy health check | T-146 (P2, after T-145) |
| Manager | Sprint coordination + code review | Ongoing |

---

## Dependency Chain

```
T-140 (uuid fix — Backend, START IMMEDIATELY, independent)
T-141 (SPEC-024 — Design Agent, START IMMEDIATELY)
  ↓
T-142 (Search/filter/sort API — Backend, after T-141)
T-143 (Search/filter/sort UI — Frontend, after T-141 + T-142 API contract)
  ↓
T-144 (QA — after T-140 + T-142 + T-143)
  ↓
T-145 (Deploy — after T-144)
  ↓
T-146 (Monitor health check)
```

**Note:** T-140 and T-141 can start immediately in parallel. Backend Engineer: prioritize T-140 first (XS, independent), then T-142 after T-141 is approved. Frontend Engineer: begin T-143 after T-141 is approved AND T-142's API contract is published.

---

## Definition of Done

Sprint #30 is complete when:

- [ ] T-140: `cd backend && npm audit` → 0 vulnerabilities; `uuid@>=14.0.0` installed; `upload.js` import updated if required; all 226/226 existing tests pass
- [ ] T-141: SPEC-024 written and marked Approved in `ui-spec.md`; covers search bar, status filter tabs, sort dropdown, combined state, empty states, loading/skeleton, accessibility
- [ ] T-142: `GET /api/v1/plants` accepts `search`, `status`, `sort` params; ≥ 8 new tests; all 226/226 existing tests pass; API contract published
- [ ] T-143: Search bar (debounced), status filter tabs, sort dropdown on MyPlantsPage; combined state and empty state messages; all 312/312 existing frontend tests pass; ≥ 8 new tests
- [ ] T-144: QA sign-off — all backend and frontend tests pass; T-140 housekeeping verified; SPEC-024 compliance; security checklist pass
- [ ] T-145: Backend restarted, frontend rebuilt; search/filter params live on staging
- [ ] T-146: Deploy Verified: Yes from Monitor Agent

---

## Success Criteria

- `cd backend && npm audit` reports 0 vulnerabilities (T-140 housekeeping closes FB-129)
- Users can search their plant inventory by name or species in real time (debounced)
- Users can filter their plant list to "Overdue", "Due today", or "On track" plants with a single tap
- Users can sort plants by name (A–Z / Z–A), most overdue, or next due soonest
- Search, filter, and sort all work in combination; combined empty state message is clear
- All existing backend and frontend tests continue to pass (no regressions)
- Deploy Verified: Yes

---

## Blockers

- T-142 and T-143 are both blocked on T-141 (SPEC-024) — Design Agent must complete the spec before engineers start
- T-144 is blocked on T-140, T-142, and T-143 all being complete
- Production deployment remains blocked on project owner providing SSL certificates
- Production email delivery blocked on project owner providing SMTP credentials
- **Infrastructure note:** Local staging backend process may terminate between Deploy and Monitor phases — Monitor Agent must restart it if connection refused before running health checks
