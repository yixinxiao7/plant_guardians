# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #9 — 2026-03-27 to 2026-03-31

**Sprint Goal:** Fix the three Major blocking bugs discovered by the project owner during real-world testing (CORS port 5174, CareScheduleForm expand buttons, EditPlantPage isDirty date check), implement the Gemini 429 model fallback chain, and — with blocking bugs resolved — finally complete T-020 user testing across all 3 MVP flows + Care History + Care Due Dashboard. MVP is declared complete only when T-020 is Done.

**Context:** Sprint #8 delivered T-041 (Monitor Sprint 7 health check), T-042 (SPEC-009), T-043 (GET /care-due), and T-044 (Care Due Dashboard). All 17 API endpoints and all 95/95 frontend + 65/65 backend tests pass. The project owner tested the app directly in Sprint 8 using a real Gemini key — excellent real-world validation that surfaced 3 Major bugs blocking full user flow completion. These bugs must be fixed before T-020 can close. T-020 carries over for the 9th time, but is now Blocked By concrete, fixable tasks rather than being perpetually deferred.

---

## In Scope

### P0 — Bug Fixes Blocking User Testing (Fix First — These Gate T-020)

- [ ] **T-045** — Deploy Engineer: Fix CORS to allow port 5174 (FB-025) **(P1)**
  - **Acceptance Criteria:** `http://localhost:5174` added to `FRONTEND_URL` in `backend/.env`. CORS middleware updated to support the new origin (comma-separated or array — whichever matches existing pattern). Browser requests from `:5174` no longer blocked. Existing 65/65 backend tests still pass. A curl or browser test from `:5174` confirms 200 on a CORS preflight. Staging re-started with new config.
  - **Dependencies:** None — fully unblocked.
  - **Fix location:** `backend/.env` FRONTEND_URL value + verify `app.js` CORS parsing handles it.

- [ ] **T-046** — Frontend Engineer: Fix CareScheduleForm expand button on Add/Edit Plant pages (FB-026) **(P1)**
  - **Acceptance Criteria:** Clicking "Add fertilizing schedule" and "Add repotting schedule" on both `AddPlantPage` and `EditPlantPage` correctly expands the form. Fix: add `onExpand` callback prop to `CareScheduleForm`; pass `onExpand={() => setFertilizingExpanded(true)}` (and repotting equivalent) from parent pages. Unit tests added covering controlled-mode expand behavior. All 95/95 frontend tests still pass. No downstream logic changes — only the expand trigger is fixed.
  - **Dependencies:** None — fully unblocked.
  - **Fix location:** `frontend/src/components/CareScheduleForm.jsx`, `frontend/src/pages/AddPlantPage.jsx`, `frontend/src/pages/EditPlantPage.jsx`.

- [ ] **T-047** — Frontend Engineer: Fix EditPlantPage isDirty — add last_done_at comparisons (FB-027) **(P1)**
  - **Acceptance Criteria:** In `EditPlantPage.jsx`, the `isDirty` useMemo compares `wateringLastDone`, `fertilizingLastDone`, and `repottingLastDone` against original `last_done_at` values from `plant.care_schedules`. Save Changes button enables when only a date field is changed. All three date fields covered. Dependency array updated. Unit tests added covering date-only-change scenario. All 95/95 frontend tests still pass.
  - **Dependencies:** None — fully unblocked.
  - **Fix location:** `frontend/src/pages/EditPlantPage.jsx` (isDirty memo, lines 80–109 approx).

---

### P1 — MVP User Testing Gate (Blocked Until T-045, T-046, T-047 Are Done)

- [ ] **T-020** — User Agent: User testing — all 3 MVP flows + Care History + Care Due Dashboard **(P0 — absolute hard gate)**
  - **Acceptance Criteria:** All three flows from `project-brief.md` tested end-to-end in a browser on staging after bug fixes are deployed.
    - **Flow 1 (Novice):** register → add plant with at least one care schedule (watering required; test fertilizing expand now that FB-026 is fixed) → view inventory → navigate to plant detail → mark care done → confetti animation plays.
    - **Flow 2 (AI advice):** upload photo → get AI advice (Gemini key is live per FB-029) → verify modal shows advice → accept → form populated. Also verify reject flow. Confirm 429 fallback works if rate-limited (T-048 will have been deployed).
    - **Flow 3 (Inventory management):** edit care schedule including changing last-watered date (verify Save button enables — FB-027 fixed) → save → view changes. Delete a plant via trash button → confirm modal → plant removed.
    - **Care History:** navigate to `/history` → verify care actions logged from Flow 1/2/3 appear.
    - **Care Due Dashboard:** navigate to `/due` → verify plant from Flow 1 appears in correct urgency section → use "Mark as done" shortcut → item removed optimistically → sidebar badge updates.
    - All observations logged to `feedback-log.md` with Status: New. No P0 blocking errors.
  - **Dependencies:** T-045, T-046, T-047 (all three bugs must be fixed and deployed to staging before T-020 begins).
  - **Hard rule:** This task carries over for the 9th time. Sprint 9 will not close until T-020 is Done. The bug fixes (T-045–T-047) directly unblock it. If a new blocking issue is discovered, escalate to Manager Agent immediately — do NOT defer again.

---

### P2 — AI Reliability Enhancement

- [ ] **T-048** — Backend Engineer: Gemini 429 model fallback chain (FB-028) **(P2)**
  - **Acceptance Criteria:** In `backend/src/routes/ai.js`, implement a model fallback chain triggered on 429 (rate limit) responses. Chain order: `gemini-2.0-flash` (default) → `gemini-2.5-flash` (on 429) → `gemini-2.5-flash-lite` (on 429) → `gemini-2.5-pro` (on 429). Detection: `err.status === 429` or `err.message` contains `'429'`. If all four models return 429, throw `ExternalServiceError` (502 to frontend — same as today). Non-429 errors are re-thrown immediately (no fallback). Unit tests: 429 on model 1 → retries model 2 → succeeds (3 cases), all four 429 → 502, non-429 error does not trigger fallback. All 65/65 backend tests still pass. API contract shape unchanged — only error handling behavior changes.
  - **Dependencies:** None — can be developed in parallel with T-045/T-046/T-047.

---

## Out of Scope

- Social auth (Google OAuth) — B-001
- Push notifications — B-002
- Plant sharing / public profiles — B-003
- Dark mode — B-005
- Care history chart / analytics — B-004
- Any new screens beyond SPEC-001–009
- New API endpoints beyond the 17 currently live
- Express 5 migration (FB-031 tracked, not actionable this sprint)
- Focus management after mark-done in Care Due Dashboard (FB-033 — minor a11y backlog)
- Production deployment execution (runbook exists; awaits project owner SSL certs)
- Email notification reminders

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Deploy Engineer | CORS fix — highest priority, unblocks everything | T-045 (P1) |
| Frontend Engineer | Two targeted bug fixes (expand button + isDirty) | T-046 (P1), T-047 (P1) |
| Backend Engineer | Gemini 429 fallback chain | T-048 (P2) |
| User Agent | End-to-end user testing — all flows | T-020 (P0, starts after T-045/T-046/T-047 done) |
| QA Engineer | Verify bug fixes (T-045/T-046/T-047) + final T-020 sign-off | On-demand |
| Monitor Agent | Post-deploy health check after bug fixes deployed | On-demand |
| Design Agent | No tasks this sprint | — |
| Manager | Sprint coordination, code review, T-020 closeout | Ongoing |

---

## Dependency Chain (Critical Path)

```
T-045 (Deploy: CORS port 5174 fix)          ← P1, START IMMEDIATELY — no dependencies
T-046 (Frontend: CareScheduleForm expand)   ← P1, START IMMEDIATELY — no dependencies
T-047 (Frontend: EditPlantPage isDirty)     ← P1, START IMMEDIATELY — no dependencies
T-048 (Backend: Gemini 429 fallback)        ← P2, START IMMEDIATELY — no dependencies (parallel)

[After T-045 + T-046 + T-047 all Done and deployed to staging]
T-020 (User testing — all flows)            ← P0, BLOCKED BY T-045, T-046, T-047
```

**Critical path:** T-045, T-046, and T-047 are all small, targeted fixes that can be done in parallel. Once all three are done and staging is re-deployed, T-020 begins immediately. T-048 can proceed at any time in parallel.

---

## Definition of Done

Sprint #9 is complete when:

- [ ] T-045: CORS allows `:5174`; browser requests confirmed not blocked; staging restarted with new config
- [ ] T-046: "Add fertilizing schedule" and "Add repotting schedule" buttons expand their forms on both Add and Edit Plant pages
- [ ] T-047: Save Changes button enables on Edit Plant when only a date (last-watered, last-fertilized, last-repotted) is changed
- [ ] T-048: Gemini 429 triggers fallback through 4 models; all-429 surfaces 502; non-429 errors pass through unchanged
- [ ] T-020: User Agent (or project owner) has tested all 3 MVP flows + Care History + Care Due Dashboard in-browser and logged all observations — **MVP officially declared complete**
- [ ] No regressions: all backend + frontend tests at or above Sprint 8 counts (65/65 backend, 95/95 frontend)
- [ ] QA has verified each bug fix independently before T-020 begins
- [ ] Monitor Agent has confirmed Deploy Verified: Yes after Sprint 9 staging deploy

---

## Success Criteria

- **All three blocking bugs fixed** — Users can expand fertilizing/repotting forms, save date changes, and connect from any dev port
- **Gemini 429 resilience** — Rate limit errors gracefully fall back through model chain instead of showing "service offline"
- **MVP is formally declared complete** — T-020 closed, all 3 flows + Care History + Care Due Dashboard verified end-to-end in a real browser
- **CI is clean** — all tests pass; no new vulnerabilities above existing known risks

---

## Blockers

- **T-020 is blocked until T-045 + T-046 + T-047 are deployed** — this is the direct causal chain. Fix the bugs, re-deploy, then test. No other blockers.
- **Gemini API key** — already provisioned by project owner (confirmed working in FB-029). T-048 can be tested with mocks; real-key 429 testing is informational.

---

*Sprint #9 plan written by Manager Agent on 2026-03-27.*
