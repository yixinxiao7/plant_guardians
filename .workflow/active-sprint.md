# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #7 — 2026-03-26 to 2026-03-30

**Sprint Goal:** Finally close the MVP validation gate (T-020 — sixth and final carry-over, zero tolerance for further deferral), clear the minor Sprint 6 feedback backlog (three quick-fix tasks), and deliver the first post-MVP feature: Care History — a log of all past care actions per plant, giving users visibility into their track record and reinforcing the habit loop central to the product vision.

**Context:** Sprint #6 delivered T-027 (SPEC-004 doc update), T-031 (profile test fix), T-032 (production deployment runbook + infra), T-033 (DELETE /account endpoint), and T-034 (Delete Account UI). Monitor Agent returned Deploy Verified: Yes (H-085). All Sprint 6 engineering work is complete. T-020 (user testing) remains the sole unclosed MVP gate and is the only P0 item for Sprint 7. The team pivots to Care History as the first post-MVP feature — a natural extension of the plant tracking product brief.

---

## In Scope

### P0 — Final MVP Validation (Absolute Last Carry-Over — No Exceptions)

- [ ] **T-020** — User Agent: User testing — all 3 MVP flows **(P0)**
  - **Acceptance Criteria:** All three flows from `project-brief.md` tested end-to-end in a browser on staging (http://localhost:4174). Flow 1 (Novice: register → add plant → view inventory → mark care done → confetti animation). Flow 2 (AI advice: upload photo → get AI advice → accept → inventory populated — if Gemini key available; otherwise verify 502 error state UX and document gap). Flow 3 (Inventory management: edit care schedule → delete plant). All feedback logged to `feedback-log.md` with Status: New for each observation. No P0 blocking errors.
  - **Dependencies:** None. Staging Deploy Verified: Yes (H-085). Fully unblocked.
  - **Hard rule:** This task has been deferred six consecutive sprints. Sprint 7 will not close, and Sprint 8 cannot begin, until T-020 is Done. If a blocking issue is discovered during testing, it must be escalated to Manager Agent immediately rather than silently deferred.

---

### P3 — Sprint 6 Feedback Cleanup (Quick Fixes — Clear in One Pass)

- [ ] **T-035** — Frontend Engineer: Fix delete account success toast variant (FB-020) **(P3)**
  - **Acceptance Criteria:** In `ProfilePage.jsx`, change `addToast('Your account has been deleted.', 'error')` to use `'info'` (or the closest neutral/confirmation variant available in the Toast system). All 61 existing frontend tests still pass. Add or update the relevant test to assert the correct toast variant.
  - **Dependencies:** None.

- [ ] **T-036** — Frontend Engineer: Add `"test"` script to `frontend/package.json` (FB-021) **(P3)**
  - **Acceptance Criteria:** `frontend/package.json` scripts section includes `"test": "vitest run"`. Running `npm test` from the `frontend/` directory executes all Vitest tests and passes (61/61). Consistent with backend `npm test` behavior.
  - **Dependencies:** None.

- [ ] **T-037** — Backend Engineer: `npm audit fix` — resolve picomatch vulnerability (FB-022) **(P3)**
  - **Acceptance Criteria:** Run `npm audit fix` in both `backend/` and `frontend/`. `npm audit` reports 0 high-severity vulnerabilities in both directories. All 48/48 backend tests and 61/61 frontend tests still pass after dependency updates.
  - **Dependencies:** None.

---

### P2 — Care History Feature (First Post-MVP Enhancement)

- [ ] **T-038** — Design Agent: Write UI spec for Care History page — SPEC-008 **(P2)**
  - **Acceptance Criteria:** `SPEC-008` added to `ui-spec.md` covering the Care History page (`/history`). Spec must include: purpose and user goal, layout description (header, filter, list view), care action list item anatomy (plant name, care type icon, relative date/time, "X days ago" format), filter by plant dropdown (all plants + individual), loading skeleton state, empty state ("No care actions yet. Start by marking a plant as watered!"), error state with retry. Navigation entry point specified (Profile page or dedicated nav item). Marked Approved with current date.
  - **Dependencies:** None — this spec gates T-039 and T-040.

- [ ] **T-039** — Backend Engineer: Implement care history API endpoint **(P2)**
  - **Acceptance Criteria:** `GET /api/v1/care-actions` endpoint (authenticated). Returns paginated list of all care actions for the authenticated user, sorted by `performed_at` DESC. Optional query param `plant_id` filters to a specific plant. Response shape: `{ data: [{ id, plant_id, plant_name, care_type, performed_at }], pagination: { page, limit, total } }`. API contract added to `api-contracts.md` before Frontend Engineer begins T-040. Unit tests: happy path (multiple actions), no actions (empty array), plant_id filter, pagination, 401 unauthenticated. All 48+ existing backend tests still pass.
  - **Dependencies:** T-038 (spec must exist before backend implements and publishes contract).

- [ ] **T-040** — Frontend Engineer: Implement Care History page **(P2)**
  - **Acceptance Criteria:** `/history` route added. Page renders per SPEC-008: plant filter dropdown, sorted list of care actions with plant name + care type + relative timestamp. Loading skeleton, empty state, error state with retry all implemented. Navigation entry point added per spec. Unit tests added for the page and filter behavior. All 61+ existing frontend tests still pass.
  - **Dependencies:** T-038 (spec), T-039 (API contract published to `api-contracts.md`).

---

## Out of Scope

- Social auth (Google OAuth) — B-001
- Push notifications — B-002
- Plant sharing / public profiles — B-003
- Dark mode — B-005
- Any new screens beyond SPEC-001–007 + SPEC-008 (Care History)
- New API endpoints beyond approved 15 (14 + DELETE /account) + GET /care-actions
- Database-level encryption (production phase, after real infra is provisioned)
- Real Gemini API key provisioning — project owner action, not an engineering task
- Production deployment execution (runbook exists; execution awaits project owner SSL certs)

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| User Agent | End-to-end user testing — all 3 MVP flows | T-020 (P0) |
| Design Agent | Care History page UI spec | T-038 |
| Backend Engineer | npm audit fix + care history API | T-037, T-039 |
| Frontend Engineer | Toast fix + test script + care history page | T-035, T-036, T-040 |
| Deploy Engineer | No new infra tasks — staging remains healthy | — |
| Monitor Agent | Post-deploy health check after T-039/T-040 deployed | On-demand |
| Manager | Sprint coordination, code review | Ongoing |
| QA Engineer | Verify care history feature end-to-end; product-perspective review of T-020 | On-demand |

---

## Dependency Chain (Critical Path)

```
T-020 (User testing — all 3 MVP flows)           ← P0, START IMMEDIATELY — fully unblocked
T-035 (Frontend: toast variant fix)               ← P3, standalone — parallel with everything
T-036 (Frontend: npm test script)                 ← P3, standalone — parallel with everything
T-037 (Backend+Frontend: npm audit fix)           ← P3, standalone — parallel with everything
T-038 (Design: Care History spec — SPEC-008)      ← P2, START IMMEDIATELY — gates T-039 and T-040
T-039 (Backend: GET /care-actions endpoint)       ← Blocked By: T-038
T-040 (Frontend: Care History page)               ← Blocked By: T-038 AND T-039
```

**Critical path:** T-020 is the sole P0 critical path item. T-038 → T-039 → T-040 is the secondary sequential chain for the Care History feature. T-035, T-036, T-037 are fully parallel with everything.

---

## Definition of Done

Sprint #7 is complete when:

- [ ] T-020: User Agent has tested all 3 MVP flows in-browser and logged feedback — **MVP officially declared complete (no further deferral under any circumstances)**
- [ ] T-035: Delete account success toast uses correct non-error variant; frontend tests pass
- [ ] T-036: `npm test` works in frontend/; 61/61 tests pass via `npm test`
- [ ] T-037: `npm audit` reports 0 high-severity vulnerabilities in backend and frontend
- [ ] T-038: SPEC-008 (Care History) written and marked Approved in `ui-spec.md`
- [ ] T-039: `GET /api/v1/care-actions` implemented, tested, API contract in `api-contracts.md`
- [ ] T-040: `/history` page implemented, unit tested, accessible via navigation
- [ ] No regressions: all backend + frontend tests continue to pass at or above Sprint 6 counts
- [ ] QA has verified the Care History feature end-to-end (T-039 + T-040)
- [ ] Monitor Agent has run a post-deploy health check after care history features deployed

---

## Success Criteria

- **MVP is formally declared complete** — User Agent has tested all 3 user flows end-to-end and logged observations
- **Care History is live** — Users can view a log of their past care actions, filtered by plant
- **CI is clean** — 0 npm audit vulnerabilities; `npm test` works in both backend and frontend
- **Minor UX polish applied** — delete account success toast no longer shows alarming red styling

---

## Blockers

- **Gemini API key** — T-020 Flow 2 AI testing requires a real key. If not provisioned by project owner, User Agent tests the 502 error UX (correctly handled per T-026) and documents the gap. This does NOT block T-020 completion — Flow 1 and Flow 3 remain fully testable.
- **No other blockers.** All P0 and P2 tasks are unblocked at sprint start (T-039 and T-040 are blocked by T-038, which has no dependencies).

---

*Sprint #7 plan written by Manager Agent on 2026-03-25.*
