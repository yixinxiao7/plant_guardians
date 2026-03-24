# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #3 — 2026-03-24 to 2026-03-28

**Sprint Goal:** Implement all 7 Plant Guardians frontend screens, wire them up to the live backend API, pass all unit and integration tests, and deliver a fully browser-testable staging environment — completing the MVP that was scoped in Sprint #1 and carried over through Sprint #2.

**Context:** Backend API is 100% complete and staging-verified (40/40 backend tests pass; all 14 endpoints contract-verified). All 7 UI specs are approved. Frontend scaffolding exists with the API client already wired. Sprint #3 is entirely about frontend implementation, bug fixes, QA integration, and user validation. This is the third attempt at this goal — it must complete this sprint.

**Priority escalation:** All frontend tasks (T-001 through T-007) are now **P0**. The MVP cannot ship without them.

---

## In Scope

### Frontend Implementation (carried over from Sprints #1 and #2)

- [ ] **T-001** — Frontend Engineer: Implement Login & Sign Up UI (SPEC-001)
  - **Acceptance Criteria:** User can register a new account and log in. Form validates inline. Errors display per spec. Successful login redirects to inventory. JWT stored in memory (not localStorage). Refresh token handled.
  - **Dependencies:** T-D01 ✅ (spec approved), T-008 ✅ (backend auth complete)
  - **Note:** This is the critical path root — all other screens are blocked until T-001 is done.

- [ ] **T-002** — Frontend Engineer: Implement Plant Inventory (Home) screen (SPEC-002)
  - **Acceptance Criteria:** Plants displayed in card grid with correct status badges (green/yellow/red). Empty state shown when no plants. Delete confirmation modal works. Client-side search/filter works.
  - **Dependencies:** T-D02 ✅, T-001, T-009 ✅

- [ ] **T-003** — Frontend Engineer: Implement Add Plant screen (SPEC-003)
  - **Acceptance Criteria:** Plant creation form submits correctly. Photo upload triggers `POST /plants/:id/photo`. AI advice button opens modal (T-006). On success, redirects to inventory.
  - **Dependencies:** T-D03 ✅, T-001, T-009 ✅, T-010 ✅

- [ ] **T-004** — Frontend Engineer: Implement Edit Plant screen (SPEC-004)
  - **Acceptance Criteria:** Form pre-populated with existing plant data. Save button disabled until a change is made. Changes saved via `PUT /plants/:id`. Redirects to inventory on success.
  - **Dependencies:** T-D04 ✅, T-003, T-009 ✅

- [ ] **T-005** — Frontend Engineer: Implement Plant Detail screen (SPEC-005)
  - **Acceptance Criteria:** Care schedule status badges render correctly (green/yellow/red). "Mark as done" triggers confetti animation (canvas-confetti) and updates state from response. Undo window works within 10s.
  - **Dependencies:** T-D05 ✅, T-002, T-009 ✅, T-012 ✅

- [ ] **T-006** — Frontend Engineer: Implement AI Advice Modal (SPEC-006)
  - **Acceptance Criteria:** Modal opens from Add Plant screen. Accepts photo upload or manual plant type text. Loading state shown during 2–8s AI response. AI results displayed clearly. "Accept" fills form fields. "Reject" closes modal with no changes.
  - **Dependencies:** T-D06 ✅, T-003, T-011 ✅

- [ ] **T-007** — Frontend Engineer: Implement Profile page (SPEC-007)
  - **Acceptance Criteria:** Shows user name, email, member since date, plant count, total care actions. Logout clears auth state and redirects to login.
  - **Dependencies:** T-D07 ✅, T-001, T-013 ✅

### Bug Fixes & Technical Debt

- [ ] **T-021** — Frontend Engineer: Fix LoginPage.test.jsx test selector failures (P2)
  - **Acceptance Criteria:** All 48/48 frontend unit tests pass. Fix `getByText` to use `getAllByText` or specific selectors; fix `getByLabelText('Email')` for label-with-required-asterisk pattern.
  - **Dependencies:** T-001

- [ ] **T-022** — Backend Engineer: Run `npm audit fix` to resolve `tar` vulnerability (P3)
  - **Acceptance Criteria:** `npm audit` shows 0 high-severity vulnerabilities in backend. No test regressions (40/40 still pass).
  - **Dependencies:** None

### QA Integration Tests

- [ ] **T-015** — QA Engineer: Integration test pass — Auth flows end-to-end (P0)
  - **Acceptance Criteria:** Register, login, token refresh, logout all tested in browser. Auth guards tested (redirect to login when unauthenticated). Security checklist items for auth verified.
  - **Dependencies:** T-001 ✅ (once done), T-008 ✅

- [ ] **T-016** — QA Engineer: Integration test pass — Plant CRUD flows end-to-end (P0)
  - **Acceptance Criteria:** Create/read/update/delete plants tested in browser. Photo upload tested. Status badge rendering verified. Delete confirmation modal tested. Edit pre-population verified.
  - **Dependencies:** T-002, T-003, T-004, T-005, T-009 ✅

- [ ] **T-017** — QA Engineer: Integration test pass — AI Advice flow (P1)
  - **Acceptance Criteria:** AI advice modal tested with photo and text input paths. Accept/reject behavior verified. Form pre-fill verified. PLANT_NOT_IDENTIFIABLE error state tested.
  - **Dependencies:** T-006, T-011 ✅

### Deployment & Verification

- [ ] **T-023** — Deploy Engineer: Re-deploy to staging with frontend (P0)
  - **Acceptance Criteria:** Frontend build includes all 7 screen implementations. Backend running with fix from T-022. Staging accessible at :3000 (backend) and :4173 (frontend). Deployment checklist complete (seed data included).
  - **Dependencies:** T-001 through T-007, T-015, T-016, T-022

- [ ] **T-024** — Monitor Agent: Full staging health check with browser-based verification (P0)
  - **Acceptance Criteria:** All 14 API endpoints pass. Frontend loads in browser. Auth flow completes in browser. No CORS errors. No console errors on page load. Deploy Verified: Yes.
  - **Dependencies:** T-023

- [ ] **T-020** — User Agent: User testing — all 3 MVP flows (P0)
  - **Acceptance Criteria:** All flows from project-brief.md tested end-to-end. Feedback logged to feedback-log.md. Novice flow, intermediate AI flow, and inventory management flow all verified.
  - **Dependencies:** T-024

---

## Out of Scope

- Social auth (Google OAuth) — B-001
- Push notifications — B-002
- Plant sharing / public profiles — B-003
- Care history analytics — B-004
- Dark mode — B-005
- Delete account — B-006
- HTTPS / production deployment (staging only this sprint)
- Database-level encryption (production phase)
- Any new features beyond what is in the approved UI specs (SPEC-001 through SPEC-007)

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Frontend Engineer | Implement all 7 screens + fix test selectors | T-001, T-002, T-003, T-004, T-005, T-006, T-007, T-021 |
| Backend Engineer | npm audit fix | T-022 |
| QA Engineer | Integration tests once frontend complete | T-015, T-016, T-017 |
| Deploy Engineer | Re-stage with full frontend build | T-023 |
| Monitor Agent | Full health check with browser verification | T-024 |
| User Agent | End-to-end user testing | T-020 |
| Manager | Code review, sprint coordination | Ongoing |
| Design Agent | On-call for spec clarifications only | — |

---

## Dependency Chain (Critical Path)

```
T-001 (Login/Signup UI)  ← START HERE — highest priority
  └─→ T-002 (Inventory Screen)
        └─→ T-005 (Plant Detail)
  └─→ T-003 (Add Plant)
        └─→ T-006 (AI Advice Modal)
        └─→ T-004 (Edit Plant)
  └─→ T-007 (Profile Page)
  └─→ T-021 (Fix LoginPage tests)

T-022 (npm audit fix) — can run in parallel, no dependencies

[All T-001 through T-007 done]
  └─→ T-015 (QA: Auth flows)
  └─→ T-016 (QA: Plant CRUD flows)
  └─→ T-017 (QA: AI Advice flow)

[T-015, T-016, T-017, T-022 done]
  └─→ T-023 (Deploy staging)
        └─→ T-024 (Monitor health check)
              └─→ T-020 (User testing)
```

---

## Definition of Done

Sprint #3 is complete when:

- [ ] All 7 frontend screens are implemented per their UI specs (SPEC-001 through SPEC-007)
- [ ] All 48/48 frontend unit tests pass (including LoginPage.test.jsx fix)
- [ ] All 40/40 backend unit tests continue to pass
- [ ] `npm audit` shows 0 high-severity vulnerabilities in backend
- [ ] Integration tests pass for Auth (T-015), Plant CRUD (T-016), and AI Advice (T-017) flows
- [ ] Staging deployed with full frontend; Monitor health check returns Deploy Verified: Yes
- [ ] No CORS errors in browser console on staging
- [ ] User Agent completes all 3 MVP user flows and logs feedback
- [ ] Security checklist passed for frontend (XSS, token storage, auth guards)

---

## Success Criteria

- User can register, log in, manage a plant inventory, get AI advice, and mark care actions as done — entirely through the browser
- The confetti animation on "Mark as done" is satisfying and functional
- AI advice acceptance correctly pre-fills the Add Plant form
- Status badges correctly reflect overdue/due-today/healthy states
- Japandi botanical aesthetic is maintained across all screens per UI specs

---

## Blockers

- None at sprint start. Frontend Engineer may begin immediately — all specs approved, all backend endpoints live, all API contracts published (H-001, H-002).
- ⚠️ **Escalation note:** This goal has been carried over from Sprint #1 and Sprint #2 without execution. Sprint #3 must complete this work. If the Frontend Engineer cannot begin by the first day of the sprint, escalate to the human project owner immediately.

---

*Sprint #3 plan written by Manager Agent on 2026-03-23.*
