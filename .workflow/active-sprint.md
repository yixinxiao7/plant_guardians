# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #4 — 2026-03-24 to 2026-03-28

**Sprint Goal:** Close the MVP verification loop — complete the Monitor Agent health check and user testing that carried over from Sprint #3, wire up the real Gemini API key so the AI advice happy path works end-to-end, fix the AI Modal 502 UX issue (FB-004), and complete the remaining spec/infrastructure cleanup before production.

**Context:** The full Plant Guardians backend and frontend are implemented and deployed to staging. All 48/48 frontend tests and 40/40 backend tests pass. The only remaining gaps are: (1) T-024 Monitor health check not yet completed, (2) T-020 user testing still blocked on T-024, (3) the Gemini API key is a placeholder meaning the AI advice feature has never been fully exercised, and (4) two minor cleanup items (FB-004 and FB-005). Sprint #4 finishes what Sprint #3 started.

---

## In Scope

### Carry-Over: Verification Loop

- [ ] **T-024** — Monitor Agent: Complete full staging health check with browser verification (P0)
  - **Acceptance Criteria:** All 14 API endpoints return expected status codes. Frontend loads at http://localhost:5173. Auth flow completes in browser (login → inventory → plant detail → mark done). No CORS errors in browser console. No console errors on page load. `Deploy Verified: Yes` written to qa-build-log.md.
  - **Dependencies:** None — staging was verified by Deploy Engineer (H-034). Resume immediately.
  - **Note:** This task was triggered in Sprint #3 but did not complete before sprint close. Begin here.

- [ ] **T-020** — User Agent: User testing — all 3 MVP flows (P0)
  - **Acceptance Criteria:** All three flows from project-brief.md tested end-to-end in browser. Flow 1 (Novice: register → add plant → mark care done). Flow 2 (AI advice with photo → accept → inventory). Flow 3 (Inventory management: edit schedule → delete plant). Feedback logged to feedback-log.md.
  - **Dependencies:** T-024 (must return Deploy Verified: Yes first)
  - **Note:** This task has been blocked since Sprint #1. It must complete in Sprint #4 — the MVP cannot be considered verified without it.

### AI Advice Happy Path

- [ ] **T-025** — Backend Engineer: Configure real Gemini API key + verify AI advice happy path (P1)
  - **Acceptance Criteria:** `GEMINI_API_KEY` set to a valid key in `backend/.env`. `POST /api/v1/ai/advice` returns a 200 with a valid JSON body (plantType, careAdvice, wateringFrequencyDays, etc.) for both photo and plant-type inputs. Test results documented in qa-build-log.md. All 40/40 backend unit tests still pass.
  - **Dependencies:** T-024 (staging must be verified before reconfiguring the live backend)
  - **Note:** Without a real Gemini key the AI advice feature is non-functional. This is the final blocker for full MVP validation.

### Bug Fixes

- [ ] **T-026** — Frontend Engineer: Fix AIAdviceModal 502 error state — show only "Close" button + correct message (FB-004) (P2)
  - **Acceptance Criteria:** When `POST /ai/advice` returns 502 (AI_SERVICE_UNAVAILABLE), the modal renders: (1) only the "Close" button — no "Try Again"; (2) error message text reads exactly "Our AI service is temporarily offline. You can still add your plant manually." All 48/48 frontend unit tests still pass after fix. Matches SPEC-006 and H-020 clarification 2.
  - **Dependencies:** None — standalone frontend fix.

### Spec Cleanup

- [ ] **T-027** — Design Agent: Update SPEC-004 to document redirect-to-detail behavior post-save (FB-005) (P3)
  - **Acceptance Criteria:** SPEC-004 in `ui-spec.md` is updated to reflect: after saving edits on the Edit Plant page, the app redirects to `/plants/:id` (plant detail page), not `/` (inventory). Add rationale note: "Redirecting to the plant detail page lets the user immediately confirm their changes." The spec must be marked Approved with today's date.
  - **Dependencies:** None.

### Technical Debt / Pre-Production

- [ ] **T-028** — Deploy Engineer: Configure Vite proxy for API routing (P3)
  - **Acceptance Criteria:** `frontend/vite.config.js` has a proxy entry routing `/api` to `http://localhost:3000`. Frontend no longer makes direct cross-origin calls to the backend in dev/staging mode. `npm run dev` and `npm run preview` both work with the proxy active. Frontend production build still succeeds (0 errors). Staging re-verified post-change.
  - **Dependencies:** T-024 (staging must be verified; don't alter infra while verification is pending).

---

## Out of Scope

- Social auth (Google OAuth) — B-001
- Push notifications — B-002
- Plant sharing / public profiles — B-003
- Care history analytics — B-004
- Dark mode — B-005
- Delete account — B-006 (profile page already shows "coming soon"; full implementation deferred)
- HTTPS / production deployment (staging only this sprint)
- Database-level encryption (production phase)
- Any new screens or API endpoints beyond the approved 7 specs and 14 endpoints

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Monitor Agent | Complete staging health check | T-024 |
| User Agent | End-to-end user testing | T-020 |
| Backend Engineer | Real Gemini API key + AI happy path | T-025 |
| Frontend Engineer | AI Modal 502 fix | T-026 |
| Design Agent | SPEC-004 spec update | T-027 |
| Deploy Engineer | Vite proxy configuration | T-028 |
| Manager | Code review, sprint coordination | Ongoing |

---

## Dependency Chain (Critical Path)

```
T-024 (Monitor: Complete health check)  ← START HERE — highest priority
  └─→ T-020 (User testing — all 3 flows)
  └─→ T-025 (Backend: Real Gemini key + AI happy path)
  └─→ T-028 (Deploy: Vite proxy)

T-026 (Frontend: AI Modal 502 fix) — can run in parallel, no dependencies
T-027 (Design: SPEC-004 update)    — can run in parallel, no dependencies
```

---

## Definition of Done

Sprint #4 is complete when:

- [ ] T-024 returns `Deploy Verified: Yes` in qa-build-log.md
- [ ] T-020 (User testing) logs feedback for all 3 MVP flows in feedback-log.md
- [ ] T-025: Real Gemini API key configured; `POST /ai/advice` returns 200 with valid care advice
- [ ] T-026: AI Modal 502 shows only "Close" + correct message; 48/48 frontend tests still pass
- [ ] T-027: SPEC-004 updated and marked Approved in ui-spec.md
- [ ] T-028: Vite proxy configured; staging re-verified after change
- [ ] No regressions: 40/40 backend + 48/48 frontend tests continue to pass
- [ ] feedback-log.md has zero entries with Status: New

---

## Success Criteria

- A real user (User Agent) can complete all three flows from project-brief.md entirely in the browser without errors
- The AI advice feature returns meaningful plant care recommendations (not a 502 placeholder)
- The AI Modal 502 error state matches the approved SPEC-006 exactly
- Staging is fully verified by the Monitor Agent (Deploy Verified: Yes)
- The MVP can be considered complete and production-ready

---

## Blockers

- None at sprint start. Monitor Agent may begin T-024 immediately — staging was verified by Deploy Engineer at 2026-03-24T14:44:00Z (H-034). Backend on :3000, frontend on :5173.
- Gemini API key must be provided by the project owner or retrieved from environment config. If no valid key is available, T-025 scope is reduced to documenting the gap and T-020 must proceed without the AI flow being fully testable.

---

*Sprint #4 plan written by Manager Agent on 2026-03-24.*
