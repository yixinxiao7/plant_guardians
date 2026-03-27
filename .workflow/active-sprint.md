# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #8 — 2026-03-26 to 2026-03-30

**Sprint Goal:** Finally close the MVP validation gate (T-020 — seventh and absolutely final carry-over; no further exceptions), complete the pending Monitor Agent Sprint 7 health check, and deliver the second post-MVP feature: Care Due Dashboard — a proactive view of which plants need care today, are overdue, or are coming due within the next 7 days. This directly fulfills the core product brief promise of "painfully obvious reminders" for novice plant owners.

**Context:** Sprint #7 delivered T-035 (toast fix), T-036 (npm test script), T-037 (npm audit fix), T-038 (SPEC-008), T-039 (GET /care-actions), and T-040 (Care History page). All 57/57 backend and 72/72 frontend tests pass. The Care History feature is deployed. The Monitor Agent Sprint 7 health check was not completed before sprint close (Deploy Verified: Pending — process gap, not a failure). T-020 (user testing) remains the sole unclosed MVP gate and is the only P0 item entering Sprint 8.

---

## In Scope

### P0 — Final MVP Validation (Seventh and Absolutely Last Carry-Over — Hard Gate)

- [ ] **T-020** — User Agent: User testing — all 3 MVP flows **(P0)**
  - **Acceptance Criteria:** All three flows from `project-brief.md` tested end-to-end in a browser on staging. Flow 1 (Novice: register → add plant → view inventory → mark care done → confetti animation). Flow 2 (AI advice: upload photo → get AI advice → accept → inventory populated — if Gemini key available; otherwise verify 502 error state UX per T-026 and document gap). Flow 3 (Inventory management: edit care schedule → delete plant). All feedback logged to `feedback-log.md` with Status: New for each observation. No P0 blocking errors.
  - **Dependencies:** None. Staging is deployed. T-039 endpoint live. T-040 Care History page live. Fully unblocked.
  - **Hard rule:** This task has been deferred SEVEN consecutive sprints. Sprint 8 will not close, and Sprint 9 cannot begin, until T-020 is Done. If a blocking issue is discovered during testing, it must be escalated to Manager Agent immediately and fixed as a hotfix — not deferred again. The Care History page at /history should also be tested as part of this pass.

---

### P1 — Monitor Agent Sprint 7 Health Check Completion (Overdue — Must Close Immediately)

- [ ] **T-041** — Monitor Agent: Complete Sprint 7 post-deploy health check **(P1)**
  - **Acceptance Criteria:** Full staging health check run covering all 16 API endpoints (14 original + DELETE /account + GET /care-actions). Specific checks: `GET /api/v1/care-actions` (unauthenticated) → 401; authenticated with plant_id filter → 200 with data array; frontend `/history` route loads; Vite proxy routes `/api/v1/care-actions` correctly. Result logged in `qa-build-log.md` as Deploy Verified: Yes (or No with issues listed). `dev-cycle-tracker.md` updated.
  - **Dependencies:** None. Backend PID 74651 running on :3000. Frontend on :5173 (or :4174 per earlier deploy). Fully unblocked.
  - **Note:** This closes the Sprint 7 process gap. Should be the first task executed in Sprint 8.

---

### P2 — Care Due Dashboard (Second Post-MVP Enhancement)

The current app surfaces care status via colored badges on each plant card and the plant detail page. Sprint 8 adds a proactive **Care Due Dashboard** at `/due` — a single-page view sorted by urgency showing which plants need care today, which are overdue, and which are coming due in the next 7 days. This fulfills the project brief's core promise of "painfully obvious reminders."

- [ ] **T-042** — Design Agent: Write UI spec for Care Due Dashboard — SPEC-009 **(P2)**
  - **Acceptance Criteria:** `SPEC-009` added to `ui-spec.md` covering the Care Due Dashboard page (`/due`). Spec must include: purpose and user goal, three sections (Overdue, Due Today, Coming Up — next 7 days), plant card anatomy within each section (plant name, care type, days overdue/due date), empty state per section (e.g., "Nothing overdue!"), global empty state when all plants are on track ("All your plants are happy!"), loading skeleton, error state with retry, quick-action CTA on each item ("Mark as done" shortcut). Navigation entry point: sidebar item with badge showing count of overdue + due-today items. Marked Approved with current date.
  - **Dependencies:** None — this spec gates T-043 and T-044.

- [ ] **T-043** — Backend Engineer: Implement care due API endpoint **(P2)**
  - **Acceptance Criteria:** `GET /api/v1/care-due` endpoint (authenticated). Calculates and returns all overdue + due-today + upcoming (next 7 days) care events for the authenticated user's plants. Response shape: `{ overdue: [{ plant_id, plant_name, care_type, days_overdue, last_done_at }], due_today: [{ plant_id, plant_name, care_type }], upcoming: [{ plant_id, plant_name, care_type, due_in_days, due_date }] }`. Logic: For each plant + care_schedule pair, calculate `next_due = last_done_at + frequency_days` (or `created_at + frequency_days` if never done). Categorize into overdue/due_today/upcoming accordingly. API contract added to `api-contracts.md` before Frontend Engineer begins T-044. Unit tests: happy path (mixed statuses), all plants on track (empty sections), never-done plant, 401 unauthenticated, no plants. All 57+ existing backend tests still pass.
  - **Dependencies:** T-042 (spec must exist before backend implements and publishes contract).

- [ ] **T-044** — Frontend Engineer: Implement Care Due Dashboard page **(P2)**
  - **Acceptance Criteria:** `/due` route added. Page renders per SPEC-009: three urgency sections (Overdue, Due Today, Coming Up), plant+care items in each section, quick-action "Mark as done" shortcut (calls existing `POST /api/v1/care-actions`), loading skeleton, empty state per section, global all-clear empty state, error state with retry. Sidebar nav item updated with badge showing overdue + due-today count (badge disappears when count = 0). Unit tests added for page states, badge behavior, and mark-done shortcut. All 72+ existing frontend tests still pass.
  - **Dependencies:** T-042 (spec), T-043 (API contract published to `api-contracts.md`).

---

## Out of Scope

- Social auth (Google OAuth) — B-001
- Push notifications — B-002
- Plant sharing / public profiles — B-003
- Dark mode — B-005
- Care history chart / analytics — B-004 (dashboard is enough for Sprint 8; full analytics later)
- Any new screens beyond SPEC-001–008 + SPEC-009 (Care Due Dashboard)
- New API endpoints beyond approved 16 (14 + DELETE /account + GET /care-actions) + GET /care-due
- Database-level encryption (production phase, after real infra is provisioned)
- Real Gemini API key provisioning — project owner action, not an engineering task
- Production deployment execution (runbook exists; execution awaits project owner SSL certs)
- Email notification reminders (future sprint — infrastructure dependency)

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| User Agent | End-to-end user testing — all 3 MVP flows + Care History | T-020 (P0) |
| Monitor Agent | Complete Sprint 7 health check immediately + post-deploy for Sprint 8 | T-041 (P1), post-deploy after T-043/T-044 |
| Design Agent | Care Due Dashboard UI spec | T-042 |
| Backend Engineer | Care due API endpoint | T-043 |
| Frontend Engineer | Care Due Dashboard page | T-044 |
| Deploy Engineer | No new infra tasks — verify staging at sprint start | — |
| Manager | Sprint coordination, code review | Ongoing |
| QA Engineer | Verify Care Due Dashboard end-to-end; product-perspective review of T-020 | On-demand |

---

## Dependency Chain (Critical Path)

```
T-020 (User testing — all 3 MVP flows + Care History)  ← P0, START IMMEDIATELY — fully unblocked
T-041 (Monitor: Sprint 7 health check)                  ← P1, START IMMEDIATELY — no dependencies
T-042 (Design: Care Due Dashboard spec — SPEC-009)      ← P2, START IMMEDIATELY — gates T-043 and T-044
T-043 (Backend: GET /care-due endpoint)                 ← Blocked By: T-042
T-044 (Frontend: Care Due Dashboard page)               ← Blocked By: T-042 AND T-043
```

**Critical path:** T-020 is the sole P0. T-041 is parallel quick-win (expected: < 1 turn). T-042 → T-043 → T-044 is the secondary sequential chain for the Care Due Dashboard.

---

## Definition of Done

Sprint #8 is complete when:

- [ ] T-020: User Agent has tested all 3 MVP flows + Care History page in-browser and logged feedback — **MVP officially declared complete (absolutely no further deferral)**
- [ ] T-041: Monitor Agent has logged Deploy Verified: Yes (or filed issues) for Sprint 7 staging
- [ ] T-042: SPEC-009 (Care Due Dashboard) written and marked Approved in `ui-spec.md`
- [ ] T-043: `GET /api/v1/care-due` implemented, tested, API contract in `api-contracts.md`
- [ ] T-044: `/due` page implemented, unit tested, accessible via sidebar with overdue badge
- [ ] No regressions: all backend + frontend tests continue to pass at or above Sprint 7 counts (57/57 backend, 72/72 frontend)
- [ ] QA has verified the Care Due Dashboard end-to-end (T-043 + T-044)
- [ ] Monitor Agent has run a post-deploy health check after care-due features deployed

---

## Success Criteria

- **MVP is formally declared complete** — User Agent has tested all 3 user flows + Care History end-to-end and logged observations
- **Sprint 7 health check closed** — Deploy Verified: Yes confirmed for Sprint 7 staging
- **Care Due Dashboard is live** — Users see at-a-glance which plants need care now; overdue badge in sidebar provides constant, non-intrusive reminder
- **Mark as done shortcut** — Users can take action directly from the dashboard without navigating to each plant detail page
- **CI is clean** — all tests pass; no new vulnerabilities

---

## Blockers

- **Gemini API key** — T-020 Flow 2 AI testing requires a real key. If not provisioned by project owner, User Agent tests the 502 error UX (correctly handled per T-026) and documents the gap. This does NOT block T-020 completion — Flow 1 and Flow 3 remain fully testable.
- **No other blockers.** T-020 and T-041 are fully unblocked at sprint start. T-042 has no dependencies. T-043 and T-044 are blocked only by T-042, which has no external dependencies.

---

*Sprint #8 plan written by Manager Agent on 2026-03-26.*
