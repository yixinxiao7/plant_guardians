# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #5 — 2026-03-24 to 2026-03-28

**Sprint Goal:** Complete MVP validation — run user testing across all 3 flows now that staging is verified, configure the real Gemini API key so the AI advice feature works end-to-end, update SPEC-004 to match the shipping behavior, and fix the flaky backend test to ensure CI reliability. Sprint #5 closes the Plant Guardians MVP.

**Context:** Sprint #4 delivered Deploy Verified: Yes (T-024), the AI Modal 502 fix (T-026), and the Vite proxy (T-028). All infrastructure, backend, and frontend code is complete and staging-verified. The only remaining work is: (1) user testing across all 3 project-brief flows — the final MVP validation gate — (2) wiring up the Gemini API key so the AI flow can be fully exercised, (3) a documentation cleanup (SPEC-004), and (4) a minor CI stability fix. Once T-020 completes with passing flows, the Plant Guardians MVP can be declared done.

---

## In Scope

### P0 — Final MVP Validation

- [ ] **T-020** — User Agent: User testing — all 3 MVP flows (P0)
  - **Acceptance Criteria:** All three flows from project-brief.md tested end-to-end in browser. Flow 1 (Novice: register → add plant → view inventory → mark care done → confetti animation). Flow 2 (AI advice with photo → accept → inventory populated). Flow 3 (Inventory management: edit schedule → delete plant). Feedback logged to feedback-log.md for each flow. No blocking errors encountered.
  - **Dependencies:** None — T-024 returned Deploy Verified: Yes in Sprint #4. T-020 is fully unblocked.
  - **Note:** This task has been deferred since Sprint #1. It is the final MVP validation gate. No further carry-over permitted.

### P1 — AI Advice Happy Path

- [ ] **T-025** — Backend Engineer: Configure real Gemini API key + verify AI advice happy path (P1)
  - **Acceptance Criteria:** `GEMINI_API_KEY` set to a valid key in `backend/.env`. `POST /api/v1/ai/advice` returns 200 with a valid JSON body (plantType, careAdvice, wateringFrequencyDays, fertilizingFrequencyDays, repottingFrequencyDays, lightingNeeds, humidityLevel, additionalTips) for both photo and plant-type inputs. Test results documented in qa-build-log.md. All 40/40 backend unit tests still pass.
  - **Dependencies:** None — T-024 complete; this is fully unblocked.
  - **Note:** If no Gemini API key is available from the project owner, document the gap in qa-build-log.md and qa-build-log: reduce T-025 scope to "verified as blocked — key not provisioned." T-020 must still proceed and test what is testable (Flow 1 and Flow 3 do not require AI).

### P3 — Spec Cleanup & Technical Debt

- [ ] **T-027** — Design Agent: Update SPEC-004 to document redirect-to-detail behavior post-save (FB-005) (P3)
  - **Acceptance Criteria:** SPEC-004 in `ui-spec.md` updated to reflect: after saving Edit Plant, app redirects to `/plants/:id`. Rationale note added: "Redirecting to the plant detail page lets the user immediately confirm their changes." Spec marked Approved with current date.
  - **Dependencies:** None.

- [ ] **T-029** — Backend Engineer: Fix flaky backend test — intermittent "socket hang up" in POST /plants (FB-010) (P3)
  - **Acceptance Criteria:** `cd backend && npm test` runs 40/40 tests reliably across at least 3 consecutive full-suite runs with no "socket hang up" failures. Either `--runInBand` added to Jest config, supertest teardown improved, or root cause identified and fixed. All 40/40 tests still pass.
  - **Dependencies:** None.

---

## Out of Scope

- Social auth (Google OAuth) — B-001
- Push notifications — B-002
- Plant sharing / public profiles — B-003
- Care history analytics — B-004
- Dark mode — B-005
- Delete account — B-006
- HTTPS / production deployment (staging only)
- Database-level encryption (production phase)
- Any new screens or API endpoints beyond the approved 7 specs and 14 endpoints
- New features of any kind — Sprint 5 is exclusively MVP validation and closeout

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| User Agent | End-to-end user testing — all 3 MVP flows | T-020 |
| Backend Engineer | Gemini API key + AI happy path; flaky test fix | T-025, T-029 |
| Design Agent | SPEC-004 documentation update | T-027 |
| Manager | Sprint coordination, code review | Ongoing |
| QA Engineer | Verify T-025 AI happy path output; product-perspective review of T-020 flows | On-demand |

---

## Dependency Chain (Critical Path)

```
T-020 (User testing — all 3 MVP flows)  ← START HERE — P0, fully unblocked
T-025 (Backend: Real Gemini key + AI happy path)  ← P1, fully unblocked; run in parallel with T-020
T-027 (Design: SPEC-004 update)  ← P3, standalone, no dependencies
T-029 (Backend: Flaky test fix)  ← P3, standalone, no dependencies
```

T-020 and T-025 are the critical path. T-027 and T-029 can run in parallel at any time.

---

## Definition of Done

Sprint #5 is complete when:

- [ ] T-020: User Agent has tested all 3 MVP flows in-browser and logged feedback to feedback-log.md
- [ ] T-025: Real Gemini API key configured (or gap documented); POST /ai/advice returns 200 with valid care advice (if key available)
- [ ] T-027: SPEC-004 updated and marked Approved in ui-spec.md
- [ ] T-029: Backend test suite runs 40/40 reliably without "socket hang up" flakiness
- [ ] No regressions: 40/40 backend + 50/50 frontend tests continue to pass
- [ ] feedback-log.md has zero entries with Status: New after sprint triage
- [ ] MVP declared complete (all 3 user flows validated, staging verified, tests passing)

---

## Success Criteria

- A user (User Agent) can complete all three flows from project-brief.md in the browser without errors or confusion
- The AI advice feature returns meaningful plant care recommendations, not a 502 (requires Gemini key)
- The Plant Guardians MVP is declared complete and ready for production deployment consideration
- Test suite is reliable (no flaky tests) — CI-ready

---

## Blockers

- **Gemini API key** — T-025 requires a real key. If the project owner has not provisioned one, Backend Engineer must document the gap and T-020 proceeds without Flow 2 AI being fully testable. Flow 1 and Flow 3 remain fully testable regardless.
- No other blockers. T-020 is unblocked. Staging is verified. All code is deployed.

---

*Sprint #5 plan written by Manager Agent on 2026-03-24.*
