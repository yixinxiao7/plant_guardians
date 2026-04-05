# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #21 — 2026-04-19 to 2026-04-25

**Sprint Goal:** Let users capture observations alongside care actions by adding an optional **Care Note** to the mark-done flow (on both the Care Due Dashboard and Plant Detail page), and polish the Care History UI by resolving the three minor SPEC-015 cosmetic deviations noted in FB-093. Notes already exist as a column in the `care_actions` table and are returned by `GET /plants/:id/care-history` — Sprint 21 wires up the write path and surfaces notes in both the mark-done UI and the history view.

**Context:** Sprint #20 delivered the Care History feature and resolved the lodash vulnerability — seventh consecutive clean sprint. Backend is at 142/142 tests, frontend at 205/205. Deploy Verified: Yes at SHA 90a362d. Sprint #21 completes the Care Notes write path (the column and read path already exist) and fixes three tracked cosmetic regressions from FB-093, giving the Care History section a production-quality finish.

---

## In Scope

### P3 — SPEC-015 Cosmetic Cleanup (start immediately, no dependencies)

- [ ] **T-099** — Frontend Engineer: Fix three FB-093 SPEC-015 cosmetic deviations **(P3)**
  - **Description:** Three minor deviations from SPEC-015 were identified in FB-093 and approved for Sprint 21 backlog. Fix all three: (1) **Missing `role="tabpanel"`** — add `role="tabpanel"` to the history panel `<div>` in `PlantDetailPage.jsx`; the Overview panel already has it correctly; (2) **Notes expansion animation** — replace the CSS class toggle with `transition: max-height 0.25s ease; overflow: hidden;` on the notes expansion element in `CareHistorySection.jsx`; (3) **Dark mode icon background colors** — the `CARE_CONFIG` object defines icon background colors but the CSS never applies them; add the corresponding CSS custom property rules to the `.care-history-item__icon` variants in `CareHistorySection.css` (or equivalent) so the icon circle backgrounds render correctly in both light and dark mode.
  - **Acceptance Criteria:**
    - History panel `<div>` in `PlantDetailPage.jsx` has `role="tabpanel"`
    - Notes expansion uses CSS `max-height` transition (0.25s ease) instead of class toggle; animation visible in browser
    - Care type icon circle backgrounds render correctly in dark mode (using CSS custom properties from `CARE_CONFIG` or `design-tokens.css`)
    - All 205/205 frontend tests still pass; update or add tests covering the `role="tabpanel"` attribute and notes animation state
    - No regressions to any other component
  - **Dependencies:** None — start immediately.
  - **Fix locations:** `frontend/src/pages/PlantDetailPage.jsx` (role attribute), `frontend/src/components/CareHistorySection.jsx` (animation), `frontend/src/components/CareHistorySection.css` (dark mode icon backgrounds)

---

### P1 — Care Notes Write Path

- [ ] **T-096** — Design Agent: Write SPEC-016 — Care Notes UX spec **(P1)**
  - **Description:** Design the Care Notes feature — an optional freeform text input that users can fill in when marking a care action done. Cover: (1) **Entry points** — mark-done flow on the Care Due Dashboard (currently a single checkbox/button per plant-care-type card) and mark-done on the Plant Detail page care schedule section; (2) **Note input UI** — where and how the input appears (inline expansion below the mark-done button, or a small modal); character limit recommendation (280 chars); placeholder text; (3) **Submission flow** — note is optional; tapping mark-done without a note works the same as today; (4) **Notes in Care History** — how notes appear in the `CareHistorySection` list item (truncated at 2 lines with expand toggle, or shown inline); (5) **Accessibility** — `aria-label` on note input, association with the care action it belongs to; (6) **Dark mode** — note input and display use CSS custom properties; (7) **Empty note handling** — null notes show no note UI in the history (do not show "No note" placeholder).
  - **Acceptance Criteria:**
    - SPEC-016 written to `.workflow/ui-spec.md` (appended as a new section)
    - Covers both entry points (Care Due Dashboard + Plant Detail mark-done)
    - Covers note input UI and character limit
    - Covers submission flow (note is always optional)
    - Covers note display in Care History list item (truncation + expand toggle)
    - Covers empty note handling in history (null → no UI)
    - Dark mode and accessibility notes included
  - **Dependencies:** None — start immediately.
  - **Fix locations:** `.workflow/ui-spec.md`

---

- [ ] **T-097** — Backend Engineer: Extend POST /api/v1/care-actions to accept optional `notes` field **(P1)**
  - **Description:** The `care_actions` table already has a `notes` column (nullable text), and `GET /plants/:id/care-history` already returns it. The write path is missing: `POST /api/v1/care-actions` currently does not accept a `notes` field. Add `notes` (optional string, max 280 characters) to the POST body validation and persist it. Validate: if present, must be a string ≤ 280 characters; strip leading/trailing whitespace; empty string after trim → store as `null`. Publish the updated API contract to `.workflow/api-contracts.md` before T-098 begins.
  - **Acceptance Criteria:**
    - `POST /api/v1/care-actions` accepts optional `notes` field
    - `notes` is validated: string, max 280 chars; 400 VALIDATION_ERROR if >280 chars
    - Empty string or whitespace-only `notes` stored as `null`
    - `notes` is persisted in `care_actions.notes` column
    - Existing calls without `notes` field continue to work (backward compatible — `notes` defaults to `null`)
    - Response shape unchanged (still returns the care action object; add `notes` to response)
    - Unit tests: happy path with note, happy path without note, note too long (400), whitespace-only note stored as null, existing tests unaffected
    - All 142/142 backend tests still pass; add minimum 4 new tests
    - Updated API contract published to `.workflow/api-contracts.md` before T-098 begins
  - **Blocked By:** None — start immediately. Publish updated contract before T-098 begins.
  - **Fix locations:** `backend/src/routes/careActions.js` (or equivalent), `backend/src/models/CareAction.js`

---

- [ ] **T-098** — Frontend Engineer: Add notes input to mark-done flow; display notes in Care History **(P1)**
  - **Description:** Two UI changes per SPEC-016: (1) **Mark-done note input** — on the Care Due Dashboard (`CareDuePage.jsx`) and on Plant Detail (`PlantDetailPage.jsx`), add an optional textarea or text input that appears when the user indicates they want to add a note (e.g., a small "Add note" link that expands the input inline). The note is included in the `POST /api/v1/care-actions` body. Character counter visible at 200+ chars, hard limit at 280. (2) **Notes in Care History** — `CareHistorySection.jsx` already receives `notes` from the API. If `notes` is non-null, show the note text below the date in the list item — truncate at 2 lines with an "Show more" expand toggle; if null, show nothing. Dark mode via CSS custom properties throughout. Accessibility: note input has `aria-label`, `maxLength=280`.
  - **Acceptance Criteria:**
    - Care Due Dashboard: "Add note" toggle expands an optional note input; note is sent with POST /care-actions
    - Plant Detail mark-done: same optional note input per SPEC-016
    - Character counter appears at ≥ 200 characters; input is hard-limited to 280 chars
    - Note text appears in Care History list item when non-null; truncated at 2 lines with "Show more" toggle
    - Null notes: no note UI shown in history (clean, no placeholder text)
    - Note input has `aria-label`; `maxLength=280` enforced
    - Dark mode: all new elements use CSS custom properties
    - Unit tests: mark-done with note sends notes field, mark-done without note sends null, note appears in history, note truncation + expand, null note shows no UI, character counter at 200+
    - All 205/205 frontend tests still pass; add minimum 6 new tests
  - **Blocked By:** T-096 (SPEC-016 must exist), T-097 (updated API contract must be published)
  - **Fix locations:** `frontend/src/pages/CareDuePage.jsx`, `frontend/src/pages/PlantDetailPage.jsx`, `frontend/src/components/CareHistorySection.jsx`, `frontend/src/api.js` (update careActions.create to accept notes)

---

## Out of Scope

- Social auth (Google OAuth) — B-001 — post-sprint
- Push/email notifications for care reminders — B-002 — post-sprint
- Plant sharing / public profiles — B-003 — post-sprint
- Reference photo in AI advice results (FB-081) — post-MVP
- Production deployment execution — blocked on project owner providing SSL certs
- Express 5 migration — advisory backlog
- Soft delete / grace period for account deletion (FB-077) — backlog
- Endpoint-specific rate limiting on `/care-actions/stats` (FB-073) — backlog
- Batch mark-done on Care Due Dashboard — backlog
- Plant notes migration (note: T-097/T-098 adds notes to care *actions*, not plants themselves)

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Design Agent | Care Notes UX spec | T-096 (P1, start immediately) |
| Backend Engineer | Extend POST /care-actions with notes field | T-097 (P1, start immediately, publish contract before T-098) |
| Frontend Engineer | Notes input in mark-done flow + notes in history; SPEC-015 cosmetic cleanup | T-099 (P3, start immediately), T-098 (P1, after T-096 + T-097) |
| QA Engineer | Full QA of T-096–T-099, security checklist | After all tasks complete |
| Deploy Engineer | Staging re-deploy after QA sign-off | After all tasks QA-verified |
| Monitor Agent | Post-deploy health check — verify POST /care-actions with notes on staging | After Deploy Engineer re-deploy |
| Manager | Sprint coordination, API contract review, code review | Ongoing |

---

## Dependency Chain (Critical Path)

```
T-099 (SPEC-015 cosmetic fixes — Frontend, START IMMEDIATELY — parallel to all)

T-096 (SPEC-016 — Design Agent, START IMMEDIATELY)
  ↓ (spec complete)

T-097 (extend POST /care-actions — Backend, START IMMEDIATELY — publish contract before T-098)
  ↓ (publish updated API contract to api-contracts.md)
T-098 (notes in mark-done + history — Frontend, after T-096 spec + T-097 contract)
  ↓
QA verifies T-096 + T-097 + T-098 + T-099 end-to-end

[After all tasks QA-verified]
Deploy Engineer re-deploys to staging
  ↓
Monitor Agent health check — verify POST /care-actions with notes on staging
```

**Critical path:** T-096 + T-097 (parallel start) → T-098 → QA → Deploy → Monitor → staging verified.
**Parallel path:** T-099 can proceed immediately and independently of the notes feature chain.

---

## Definition of Done

Sprint #21 is complete when:

- [ ] T-096: SPEC-016 written covering both mark-done entry points, note input UI, character limit, submission flow, notes in history, empty note handling, dark mode, and accessibility
- [ ] T-097: POST /care-actions accepts optional `notes` (≤280 chars, whitespace-trimmed, null if empty); updated API contract published; 4+ new tests; all 142/142 backend tests pass
- [ ] T-098: Notes input in mark-done flow on Care Due + Plant Detail; notes display in Care History with expand toggle; null notes show nothing; 6+ new tests; all 205/205 frontend tests pass
- [ ] T-099: `role="tabpanel"` added, notes expansion animated, dark mode icon backgrounds applied; all 205/205 frontend tests pass; no regressions
- [ ] Deploy Verified: Yes from Monitor Agent post-deploy health check
- [ ] No regressions: backend ≥ 142/142, frontend ≥ 205/205

---

## Success Criteria

- **Notes captured** — User can optionally type a note when marking a care action done from either the Care Due Dashboard or the Plant Detail page; note is persisted
- **Notes visible in history** — Non-null notes appear in the Care History list item; truncated at 2 lines with a "Show more" expand toggle
- **Null notes invisible** — Care history items with no note show no note UI; list stays clean
- **Backward compatible** — Existing mark-done calls without a notes field continue to work unchanged
- **SPEC-015 polished** — History panel has `role="tabpanel"`, notes expansion animates, dark mode icon backgrounds render correctly
- **Test suite grows** — Backend adds minimum 4 new tests; frontend adds minimum 6 new tests (plus T-099 updates); no regressions

---

## Blockers

- T-098 (notes UI) is blocked until: (1) Design Agent publishes SPEC-016; (2) Backend Engineer publishes updated `POST /care-actions` API contract
- T-096, T-097, T-099 have no blockers — all can start immediately
- Production deployment remains blocked on project owner providing SSL certificates

---

*Sprint #21 plan written by Manager Agent on 2026-04-05.*
