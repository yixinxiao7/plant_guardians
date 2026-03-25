# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #6 — 2026-03-25 to 2026-03-29

**Sprint Goal:** Declare MVP complete by closing the long-deferred user testing gate (T-020), then begin post-MVP hardening with production deployment preparation, the Delete Account feature, and minor CI/documentation cleanup.

**Context:** Sprint #5 delivered T-029 (flaky test fix), T-025 (AI endpoint mocked tests), and T-030 (Deploy Verified: Yes). Staging is healthy. The MVP is code-complete but cannot be formally declared done until T-020 (user testing across all 3 flows) is finished. This has been deferred five consecutive sprints — it is the sole P0 for Sprint #6. After T-020 closes, the team pivots to production readiness and the first post-MVP feature (Delete Account).

---

## In Scope

### P0 — Final MVP Validation Gate (No Further Deferral)

- [ ] **T-020** — User Agent: User testing — all 3 MVP flows (P0)
  - **Acceptance Criteria:** All three flows from `project-brief.md` tested end-to-end in a browser. Flow 1 (Novice: register → add plant → view inventory → mark care done → confetti animation). Flow 2 (AI advice: upload photo → get AI advice → accept → inventory populated — if Gemini key available; otherwise test 502 error state UX and document gap). Flow 3 (Inventory management: edit schedule → delete plant). Feedback logged to `feedback-log.md` for each flow. No P0 blocking errors encountered.
  - **Dependencies:** None — staging is Deploy Verified: Yes (T-030). Fully unblocked.
  - **Hard rule:** This task carries into Sprint #6 for the fifth time. No further carry-over is permitted. If a blocking issue is discovered, it must be escalated immediately rather than silently deferred.

### P2 — Production Deployment Preparation

- [ ] **T-032** — Deploy Engineer: Production deployment preparation (P2)
  - **Acceptance Criteria:** Create `infra/docker-compose.prod.yml` (or equivalent) with HTTPS termination via nginx reverse proxy. Document production environment variables in `.env.production.example` (never commit secrets). Write a production deployment runbook in `.workflow/deploy-runbook.md` covering: pre-deploy checklist, startup sequence, rollback steps. Staging environment must remain unaffected.
  - **Dependencies:** T-020 (Gemini key provisioning context useful, but not a hard dependency).

### P2 — Delete Account Feature

- [ ] **T-033** — Backend Engineer: Implement DELETE /api/v1/auth/account endpoint (P2)
  - **Acceptance Criteria:** `DELETE /api/v1/auth/account` endpoint (authenticated) — deletes the user's account and all associated data (plants, care_schedules, care_actions, photos, refresh tokens) via cascade. Returns 204 on success. Returns 401 if unauthenticated. Unit tests: happy path, unauthorized, confirm cascade delete. All 44 existing backend tests still pass. API contract added to `api-contracts.md`.
  - **Dependencies:** None.

- [ ] **T-034** — Frontend Engineer: Implement Delete Account UI on Profile page (P2)
  - **Acceptance Criteria:** Profile page "Delete Account" button replaced from "coming soon" to a functional button. Clicking opens a confirmation modal ("This will permanently delete your account and all your plants. This cannot be undone. Are you sure?"). On confirm: calls DELETE /api/v1/auth/account, clears tokens, redirects to `/login`. On cancel: modal closes, no action. Unit tests added for the modal and flow. All 50 existing frontend tests still pass.
  - **Dependencies:** T-033 (backend endpoint must exist for integration).

### P3 — CI Reliability & Documentation Cleanup

- [ ] **T-027** — Design Agent: Update SPEC-004 to document redirect-to-detail behavior post-save (P3)
  - **Acceptance Criteria:** SPEC-004 in `ui-spec.md` updated to reflect: after saving Edit Plant, app redirects to `/plants/:id`. Rationale note added: "Redirecting to the plant detail page lets the user immediately confirm their changes." Spec marked Approved with current date.
  - **Dependencies:** None.
  - **Note:** Carried over from Sprint 4. This is a 1-hour task. Must complete this sprint.

- [ ] **T-031** — Backend Engineer: Fix profile.test.js intermittent 30s timeout (FB-017) (P3)
  - **Acceptance Criteria:** `cd backend && npm test` runs cleanly across at least 3 consecutive full-suite runs with no timeout on the "should return user profile with stats" test. Fix may include: increasing the per-test timeout (e.g., `}, 60000`), optimizing the profile stats aggregation query, or improving test data isolation. All 44/44 tests still pass on every run.
  - **Dependencies:** None.

---

## Out of Scope

- Social auth (Google OAuth) — B-001
- Push notifications — B-002
- Plant sharing / public profiles — B-003
- Care history analytics — B-004
- Dark mode — B-005
- Any new screens beyond the 7 approved specs (except Delete Account confirmation modal)
- New API endpoints beyond approved 14 + DELETE /account
- Database-level encryption (production phase, after real infra is provisioned)
- Real Gemini API key provisioning — this is a project owner action, not an engineering task

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| User Agent | End-to-end user testing — all 3 MVP flows | T-020 |
| Deploy Engineer | Production deployment preparation | T-032 |
| Backend Engineer | Delete Account endpoint + profile test fix | T-033, T-031 |
| Frontend Engineer | Delete Account UI | T-034 |
| Design Agent | SPEC-004 documentation update | T-027 |
| Manager | Sprint coordination, code review | Ongoing |
| QA Engineer | Verify T-033/T-034 delete account flow; product-perspective review of T-020 | On-demand |

---

## Dependency Chain (Critical Path)

```
T-020 (User testing — all 3 MVP flows)         ← P0, START HERE — fully unblocked
T-033 (Backend: DELETE /account endpoint)       ← P2, no dependencies — parallel with T-020
T-027 (Design: SPEC-004 update)                 ← P3, standalone — parallel with all
T-031 (Backend: profile.test.js timeout fix)    ← P3, standalone — parallel with all
T-032 (Deploy: Production deployment prep)      ← P2, standalone — parallel with all
T-034 (Frontend: Delete Account UI)             ← Blocked By: T-033
```

T-020 is the sole critical path item. T-033 and T-034 form a secondary chain. All other tasks are parallel and independent.

---

## Definition of Done

Sprint #6 is complete when:

- [ ] T-020: User Agent has tested all 3 MVP flows in-browser and logged feedback — **MVP officially declared complete**
- [ ] T-031: profile.test.js runs cleanly across 3 consecutive full-suite runs (44/44 each)
- [ ] T-027: SPEC-004 updated and marked Approved in `ui-spec.md`
- [ ] T-032: Production deployment runbook written; prod docker-compose/nginx config drafted
- [ ] T-033: DELETE /account endpoint implemented, tested (44+ backend tests pass), and API contract updated
- [ ] T-034: Delete Account UI implemented (50+ frontend tests pass)
- [ ] No regressions: all backend + frontend tests continue to pass
- [ ] feedback-log.md has zero entries with Status: New after sprint triage

---

## Success Criteria

- MVP is formally declared complete (all 3 user flows validated end-to-end)
- Users can delete their account from the Profile page (functional, not "coming soon")
- Production deployment path is documented and ready for the project owner to execute
- CI is fully reliable — no flaky tests

---

## Blockers

- **Gemini API key** — T-020 Flow 2 AI testing requires a real key. If not provisioned by project owner, User Agent tests the 502 error UX (which is correctly handled per T-026) and documents the gap. This does NOT block T-020 completion — Flow 1 and Flow 3 remain fully testable.
- No other blockers. All P0 and P2 tasks are fully unblocked.

---

*Sprint #6 plan written by Manager Agent on 2026-03-25.*
