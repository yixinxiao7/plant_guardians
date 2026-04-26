# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #31 — 2026-04-28 to 2026-05-04

**Sprint Goal:** Fix the LIKE wildcard escape bug in plant search (T-147) and ship a per-plant care history chart on the Plant Detail page — giving "plant killer" users a visual feedback loop to see their care consistency over time and know if they're improving.

**Context:** Sprint #30 delivered plant list search, sort, and filter plus the uuid advisory fix. The app's core plant list UX is now polished. Sprint #31 has two tracks: (1) a minor housekeeping fix (LIKE wildcard escape, T-147, XS) identified during Sprint #30 QA product-perspective testing (FB-131); and (2) a meaningful new feature — a per-plant care history chart — that closes the feedback loop for the "plant killer" persona. Users can now quickly find plants needing attention (Sprint #30); in Sprint #31 they will be able to see whether their care habits are improving over time. The chart will appear on the Plant Detail page's existing History tab alongside the existing care action timeline, showing weekly/monthly care counts per care type for the past 12 weeks or 6 months.

---

## In Scope

### P3 — Backend: Fix LIKE Wildcard Escape in Plant Search (T-147)

- [ ] **T-147** — Backend Engineer: Fix LIKE wildcard metacharacters not escaped in `Plant.findByUserId` search **(P3)**
  - **Description:** Per FB-131: when a user searches for `%` or `_`, those characters are passed as Postgres LIKE metacharacters, causing `%` to return all plants instead of plants whose name/species literally contains `%`. The search is parameterized (no SQL injection), but the result is incorrect. Fix:
    - In `backend/src/models/Plant.js` (~line 38), escape `%`, `_`, and `\` before the ILIKE clause: e.g. `term = term.replace(/[\\%_]/g, '\\$&');`
    - Add `ESCAPE '\\'` to the LIKE clause in the `whereRaw` call
    - Add ≥ 1 new test: `?search=%` → 0 results; `?search=_` → 0 results; normal search (`?search=fern`) still returns expected results
    - All 241/241 existing backend tests continue to pass
    - No API contract change (behavior correction only)
  - **Acceptance Criteria:**
    - `?search=%` → 200, 0 results (literal `%` not treated as wildcard)
    - `?search=_` → 200, 0 results (literal `_` not treated as wildcard)
    - `?search=fern` still returns correct results (normal searches unaffected)
    - All 241/241 existing backend tests pass; ≥ 1 new wildcard test added
  - **Blocked By:** None — start immediately.

---

### P2 — Design: Plant Care History Chart UX Spec (T-148)

- [ ] **T-148** — Design Agent: Write SPEC-025 — Per-plant care history chart **(P2)**
  - **Description:** Specify a care history chart displayed on the Plant Detail page's History tab, below the existing care action timeline. The chart provides a weekly/monthly visual summary of care events per care type:
    1. **Chart layout:** A grouped bar chart with time periods on the x-axis and care event count on the y-axis. Each bar group represents one time period; bars are color-coded per care type (watering: blue, fertilizing: green, repotting: terracotta) consistent with existing CARE_CONFIG colors. X-axis labels: abbreviated ISO week dates for 12w view; abbreviated month names for 6m view.
    2. **On-time percentage badges:** Above the chart, a summary badge per active care type showing the percentage of care events performed on or before the scheduled due date (e.g., "Watering: 80% on time"). Null/unavailable = "—". Badge uses the same green/yellow/red status color system as care schedule status.
    3. **Time range toggle:** A segmented control ("12 weeks" / "6 months") that switches the chart data. Default: "12 weeks". "6 months" shows monthly bar groups.
    4. **Empty state:** If the plant has no care events in the selected range, show a simple message: "No care history yet. Mark your first care done to start tracking your habits."
    5. **Loading skeleton:** A rectangular placeholder while chart data loads (consistent with existing skeleton patterns in the app).
    6. **Accessibility:** Chart container has `role="img"` with `aria-label` describing the data (e.g., "Care history for [Plant Name] over the past 12 weeks"). Each bar has `title` or `aria-describedby` showing exact count. Time range toggle uses `role="group"` with `aria-label="Chart time range"`.
    7. **Placement:** Below the existing `<CareHistorySection>` on the History tab. The existing care action list is not removed — the chart is additive.
    8. **Responsive:** On narrow screens, the chart scrolls horizontally rather than compressing bars.
  - **Acceptance Criteria:**
    - SPEC-025 written to `ui-spec.md` and marked Approved
    - All 8 surfaces documented: chart layout, on-time badge, time range toggle, empty state, loading skeleton, accessibility, placement, responsive
    - Gates T-149 and T-150
  - **Blocked By:** None — start immediately.

---

### P2 — Backend: Care History Chart Data Endpoint (T-149)

- [ ] **T-149** — Backend Engineer: Implement `GET /api/v1/plants/:id/care-history/chart` **(P2)**
  - **Description:** New authenticated endpoint returning aggregated care event data for chart display:
    1. **Query param:** `range` (enum, optional, default `"12w"`): `"12w"` (past 12 weeks, Monday-anchored) or `"6m"` (past 6 calendar months). Return 400 `INVALID_RANGE` for unknown values.
    2. **Response shape for `12w`:**
       ```json
       {
         "data": {
           "range": "12w",
           "periods": [
             { "period_start": "2026-02-09", "watering": 2, "fertilizing": 0, "repotting": 0 },
             ...
           ],
           "on_time_pct": {
             "watering": 80,
             "fertilizing": null,
             "repotting": null
           }
         }
       }
       ```
       `periods` always contains exactly 12 entries (12w) or 6 entries (6m), even if some have all-zero counts. `on_time_pct` is null when the plant has no schedule for that care type or 0 events in the range; otherwise `round((on_time_count / total_count) * 100)`. "On time" = `performed_at <= next_due_at` for that action (use existing `computeNextDueAt` from `backend/src/utils/careStatus.js` for consistency).
    3. **Auth:** 401 unauthenticated, 403 plant not owned by caller, 404 plant not found, 400 invalid UUID or invalid range. Standard `{ error: { message, code } }` shape.
    4. **Tests:** ≥ 6 new tests: happy path 12w with data, happy path 6m, empty range (all zeros), on_time_pct calculation, 401 unauthenticated, 403 wrong owner, 400 invalid range. All 241/241+ existing tests pass.
    5. **Publish API contract** to `api-contracts.md`.
    6. **No schema changes** — query-only against existing `care_actions` and `care_schedules` tables.
  - **Acceptance Criteria:**
    - `GET /api/v1/plants/:id/care-history/chart?range=12w` → 200 + 12-period array + on_time_pct
    - `GET /api/v1/plants/:id/care-history/chart?range=6m` → 200 + 6-period array + on_time_pct
    - Empty periods always present (all-zero counts for weeks with no events)
    - Auth enforced: 401/403/404/400 per contract
    - Invalid range → 400 `INVALID_RANGE`
    - ≥ 6 new tests; all existing backend tests pass
    - API contract published
  - **Blocked By:** T-148

---

### P2 — Frontend: Care History Chart on Plant Detail (T-150)

- [ ] **T-150** — Frontend Engineer: Add CareHistoryChart component to Plant Detail History tab **(P2)**
  - **Description:** Per SPEC-025:
    1. **CareHistoryChart.jsx:** Renders a grouped bar chart using pure CSS (no third-party charting library — use CSS flexbox/grid + `height` percentages for bars). Bars color-coded per CARE_CONFIG colors. X-axis labels per `period_start`. Y-axis implied by relative bar heights (normalize to tallest bar in view).
    2. **useCareHistoryChart.js hook:** Fetches `GET /api/v1/plants/:id/care-history/chart?range=<range>` via `careHistory.getChart(plantId, range)` added to `api.js`. Manages loading/error/data state. Re-fetches on range change.
    3. **On-time percentage badges:** One small badge pill per care type that has a non-null `on_time_pct`. Show "—" for null values.
    4. **Time range toggle:** `role="group"` + `aria-label="Chart time range"`, two options "12 weeks" / "6 months". Default `12w`. Passes selected range to hook.
    5. **Empty state:** Render empty-state message when all periods have zero counts across all care types.
    6. **Loading skeleton:** Rectangular `aria-busy="true"` placeholder during fetch.
    7. **Placement:** Render `<CareHistoryChart plantId={plant.id} />` below `<CareHistorySection>` inside the History tab panel in `PlantDetailPage.jsx`.
    8. **Extend `careHistory` in `api.js`:** Add `getChart(plantId, range)` → `GET /api/v1/plants/:id/care-history/chart?range=<range>`.
    9. **Tests:** ≥ 8 new tests: chart renders bars with correct relative heights; on-time badges render correct percentages; null on_time_pct renders "—"; time range toggle fires re-fetch with correct param; empty state renders when all zeros; loading skeleton shows while fetching; error state does not crash page; chart container has `role="img"` with `aria-label`. All 360/360 existing frontend tests pass.
  - **Acceptance Criteria:**
    - CareHistoryChart renders weekly/monthly grouped bars with per-care-type color coding
    - On-time percentage badges rendered per active care type; null renders "—"
    - Time range toggle switches between `12w` and `6m` data
    - Empty state when all periods are zero; loading skeleton during fetch
    - Chart is accessible (`role="img"`, `aria-label`, time range `role="group"`)
    - All 360/360 existing frontend tests pass; ≥ 8 new tests
    - T-148 (SPEC-025 Approved) and T-149 API contract must be complete before this task begins
  - **Blocked By:** T-148, T-149

---

### P2 — QA: Sprint #31 Verification (T-151)

- [ ] **T-151** — QA Engineer: Verify T-147, T-149, T-150 and confirm no regressions **(P2)**
  - **Description:** After T-147, T-149, and T-150 are In Review/Done, run the full test suite and perform product-perspective testing:
    - Backend: all tests pass (≥ 242+ from T-147 fix + T-149 new tests)
    - Frontend: all tests pass (≥ 368+ from T-150 new tests)
    - T-147 wildcard fix: `?search=%` → 0 results; `?search=_` → 0 results; `?search=fern` still returns expected plants
    - T-149 live integration: `?range=12w` → 200 + 12 periods; `?range=6m` → 200 + 6 periods; empty plant → all-zero periods; `?range=unknown` → 400 `INVALID_RANGE`; auth enforcement (401, 403)
    - SPEC-025 compliance: chart renders bars, on-time badges, time range toggle, empty state, loading skeleton, placement on History tab, accessibility attributes
    - Security checklist: T-149 auth enforced; no new unprotected routes; chart data respects plant ownership; no PII leak; no SQL injection in chart query
    - API contract for T-149 verified against implementation
  - **Acceptance Criteria:**
    - Backend ≥ 242+ tests pass; frontend ≥ 368+ tests pass
    - T-147: wildcard inputs return 0 results; normal searches unaffected
    - Full SPEC-025 compliance verified
    - Security checklist PASS
    - QA sign-off logged in `qa-build-log.md`
  - **Blocked By:** T-147, T-149, T-150

---

### P2 — Deploy: Staging Re-Deploy (T-152)

- [ ] **T-152** — Deploy Engineer: Staging re-deploy after QA sign-off **(P2)**
  - **Description:** After QA sign-off (T-151), run the standard staging deploy checklist. No new migrations this sprint (T-147 is a query fix, T-149 adds a new route only — no schema changes). Restart backend. Rebuild frontend dist. Verify `/api/health` → 200 and spot-check the new chart endpoint.
  - **Acceptance Criteria:**
    - No new migrations (`knex migrate:latest` → "Already up to date")
    - Backend process restarted and healthy on port 3000
    - `GET /api/health` → 200
    - `GET /api/v1/plants/:id/care-history/chart?range=12w` (authenticated) → 200 + data
    - Staging deploy logged in `qa-build-log.md`
  - **Blocked By:** T-151

---

### P2 — Monitor: Post-Deploy Health Check (T-153)

- [ ] **T-153** — Monitor Agent: Post-deploy health check for Sprint #31 **(P2)**
  - **Description:** Run the standard post-deploy health check after T-152. Verify all existing endpoints remain healthy. For new functionality: verify `GET /api/v1/plants/:id/care-history/chart?range=12w` (authenticated) → 200 + 12-period data; verify T-147: `GET /api/v1/plants?search=%25` (URL-encoded `%`, authenticated) → 200, 0 results. Log **Deploy Verified: Yes/No** in `qa-build-log.md`.
  - **Acceptance Criteria:**
    - `GET /api/health` → 200
    - All existing core endpoints → expected status codes (no regressions)
    - `GET /api/v1/plants/:id/care-history/chart?range=12w` (authenticated) → 200 + data
    - `GET /api/v1/plants?search=%25` (authenticated) → 200, 0 results (T-147 verified live)
    - Deploy Verified: Yes logged in `qa-build-log.md`
    - If backend process is not running, restart before health check
  - **Blocked By:** T-152

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
- Care schedule bulk edit — backlog
- Share button "already shared" state polish (FB-123) — already addressed by Sprint #29 ShareStatusArea; backlog for further polish if needed
- Plant care calendar heatmap view — future sprint (requires more design work than a simple bar chart)

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Backend Engineer | Wildcard fix + chart API endpoint | T-147 (P3, start immediately), T-149 (P2, after T-148) |
| Design Agent | Care history chart UX spec | T-148 (P2, start immediately — gates T-149 and T-150) |
| Frontend Engineer | Care history chart component | T-150 (P2, after T-148 + T-149 API contract) |
| QA Engineer | Full regression + new feature verification | T-151 (P2, after T-147 + T-149 + T-150) |
| Deploy Engineer | Staging re-deploy | T-152 (P2, after T-151) |
| Monitor Agent | Post-deploy health check | T-153 (P2, after T-152) |
| Manager | Sprint coordination + code review | Ongoing |

---

## Dependency Chain

```
T-147 (LIKE wildcard fix — Backend, START IMMEDIATELY, independent)
T-148 (SPEC-025 — Design Agent, START IMMEDIATELY)
  ↓
T-149 (Chart API — Backend, after T-148)
T-150 (Chart UI — Frontend, after T-148 + T-149 API contract)
  ↓
T-151 (QA — after T-147 + T-149 + T-150)
  ↓
T-152 (Deploy — after T-151)
  ↓
T-153 (Monitor health check)
```

**Note:** T-147 and T-148 can start immediately in parallel. Backend Engineer: prioritize T-147 first (XS, independent), then T-149 after T-148 is approved. Frontend Engineer: begin T-150 after T-148 is approved AND T-149's API contract is published.

---

## Definition of Done

Sprint #31 is complete when:

- [ ] T-147: `?search=%` → 0 results; `?search=_` → 0 results; normal searches unaffected; ≥ 1 new test; all 241/241+ existing backend tests pass
- [ ] T-148: SPEC-025 written and marked Approved in `ui-spec.md`; all 8 surfaces documented; gates T-149 and T-150
- [ ] T-149: `GET /api/v1/plants/:id/care-history/chart` returns 12-period (`12w`) and 6-period (`6m`) arrays with on_time_pct; empty periods always present; auth enforced; ≥ 6 new tests; all existing backend tests pass; API contract published
- [ ] T-150: CareHistoryChart component renders grouped bars, on-time badges, time range toggle, empty/loading states on Plant Detail History tab; all 360/360 existing frontend tests pass; ≥ 8 new tests
- [ ] T-151: QA sign-off — all backend and frontend tests pass; T-147 wildcard fix verified live; SPEC-025 compliance; security checklist PASS
- [ ] T-152: Backend restarted, frontend rebuilt; chart endpoint live on staging
- [ ] T-153: Deploy Verified: Yes from Monitor Agent

---

## Success Criteria

- `?search=%` and `?search=_` return 0 results (LIKE wildcard metacharacters correctly escaped)
- Users can view a weekly/monthly grouped bar chart of their care activity on the Plant Detail History tab
- On-time percentage badges show per-care-type care consistency (% of care done on or before due date)
- Time range toggle switches between 12-week and 6-month views
- Empty state shown when no care history exists for the selected range
- All existing backend and frontend tests continue to pass (no regressions)
- Deploy Verified: Yes

---

## Blockers

- T-149 and T-150 are both blocked on T-148 (SPEC-025) — Design Agent must complete the spec before engineers start
- T-151 is blocked on T-147, T-149, and T-150 all being complete
- Production deployment remains blocked on project owner providing SSL certificates
- Production email delivery blocked on project owner providing SMTP credentials
- **Infrastructure note:** Local staging backend process may terminate between Deploy and Monitor phases — Monitor Agent must restart it if connection refused before running health checks
