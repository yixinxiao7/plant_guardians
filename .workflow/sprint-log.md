# Sprint Log

Summary of each completed development cycle. Written by the Manager Agent at the end of each sprint.

---

### Sprint #1 — 2026-03-21 to 2026-03-23

**Sprint Goal:** Establish the full backend API, database schema, UI specs, and staging infrastructure for Plant Guardians MVP.

**Outcome:** Partial — Backend and infrastructure goals met; frontend implementation not started.

---

#### Tasks Completed

| Task ID | Description |
|---------|-------------|
| T-D01 | UI spec: Login & Sign Up screen (SPEC-001) |
| T-D02 | UI spec: Plant Inventory screen (SPEC-002) |
| T-D03 | UI spec: Add Plant screen (SPEC-003) |
| T-D04 | UI spec: Edit Plant screen (SPEC-004) |
| T-D05 | UI spec: Plant Detail screen (SPEC-005) |
| T-D06 | UI spec: AI Advice Modal (SPEC-006) |
| T-D07 | UI spec: Profile page (SPEC-007) |
| T-008 | Backend: Auth endpoints (register, login, refresh, logout) — 10/10 tests pass |
| T-009 | Backend: Plants CRUD endpoints — 9/9 tests pass |
| T-010 | Backend: Plant photo upload endpoint — 5/5 tests pass |
| T-011 | Backend: AI advice endpoint (Gemini integration) — validated, blocked by real key for happy path |
| T-012 | Backend: Care actions endpoint — 6/6 tests pass |
| T-013 | Backend: Profile stats endpoint — 2/2 tests pass |
| T-014 | Database schema + migrations — all 5 tables, up/down verified |
| T-018 | Staging deployment — backend on :3000, frontend build on :4173, all migrations applied |
| T-019 | Monitor health check — initial fail (CORS, race condition, missing seed); all 3 issues resolved in same sprint |

---

#### Tasks Carried Over to Sprint #2

| Task ID | Reason |
|---------|--------|
| T-001 | Frontend Login & Sign Up UI — not implemented this sprint |
| T-002 | Frontend Plant Inventory screen — not implemented this sprint |
| T-003 | Frontend Add Plant screen — not implemented this sprint |
| T-004 | Frontend Edit Plant screen — not implemented this sprint |
| T-005 | Frontend Plant Detail screen — not implemented this sprint |
| T-006 | Frontend AI Advice Modal — not implemented this sprint |
| T-007 | Frontend Profile page — not implemented this sprint |
| T-015 | QA: Integration tests — auth flows — blocked on frontend |
| T-016 | QA: Integration tests — Plant CRUD flows — blocked on frontend |
| T-017 | QA: Integration tests — AI advice flow — blocked on frontend |
| T-020 | User testing: Sprint 1 flows — blocked on frontend + staging re-verify |

---

#### Verification Failures

The Monitor Agent's initial health check returned **Deploy Verified: No** due to:

1. **CORS mismatch** — backend allowed `:5173`, staging frontend on `:4173` — **Fixed same sprint** (commit `4659ca6`)
2. **DB startup race condition** — server accepted requests before pool ready — **Fixed same sprint**
3. **Missing seed data** — test account not in staging DB — **Fixed same sprint**

The Ops Agent ran a post-fix re-verification and confirmed **Deploy Verified: Yes**. All 3 issues were resolved within Sprint 1 and require no Sprint 2 follow-up.

---

#### Key Feedback Themes

- **FB-001, FB-002, FB-003** — All filed by Monitor Agent; all resolved in Sprint 1 via a single fix commit. Triaged as Acknowledged.
- Staging infrastructure needed more hardening (CORS multi-origin support, DB readiness guard, seed data in deploy checklist).

---

#### What Went Well

- Backend delivered fully — 40/40 unit tests pass, all 14 API endpoints contract-verified
- All 7 UI specs approved and ready for Sprint 2 frontend implementation
- Deploy + Monitor loop caught and fixed 3 real issues before sprint close
- Security scan passed with only advisory-level findings (tar vulnerability, encryption at rest)
- Frontend production build succeeded; API client correctly implemented per contracts

---

#### What to Improve

- Frontend implementation must start and complete in Sprint 2 — it was entirely deferred in Sprint 1
- Staging deploy checklist should include seed data step from the start (now fixed)
- CORS multi-origin support should be part of initial backend config, not a hotfix
- LoginPage.test.jsx has 2 failing tests due to test selector issues — fix early in Sprint 2

---

#### Technical Debt Noted

| Item | Severity | Owner |
|------|----------|-------|
| `tar` package vulnerability (transitive via bcrypt) — `npm audit fix` available | P3 | Backend Engineer |
| LoginPage.test.jsx — 2 test selector failures (not implementation bugs) | P2 | Frontend Engineer |
| No Vite proxy configured — frontend makes direct CORS calls to backend (acceptable for dev, but note for production reverse proxy setup) | P3 | Deploy Engineer |
| Database-level encryption not configured | P3 Advisory | Deploy Engineer (production phase) |

---

*Sprint #1 summary written by Manager Agent on 2026-03-23.*

---

### Sprint #2 — 2026-03-24 to 2026-03-27

**Sprint Goal:** Implement the complete Plant Guardians frontend (all 7 screens), wire up to the backend API, pass end-to-end integration tests, and deliver a fully browser-testable staging environment for user testing.

**Outcome:** Not Started — Sprint #2 planning was written and all tasks were assigned, but implementation did not begin. All tasks carried over to Sprint #3 with no changes to scope or priority.

---

#### Tasks Completed

None. Sprint #2 produced no code changes.

---

#### Tasks Carried Over to Sprint #3

| Task ID | Description | Reason |
|---------|-------------|--------|
| T-001 | Implement Login & Sign Up UI | Sprint did not execute |
| T-002 | Implement Plant Inventory (Home) screen | Sprint did not execute |
| T-003 | Implement Add Plant screen | Sprint did not execute |
| T-004 | Implement Edit Plant screen | Sprint did not execute |
| T-005 | Implement Plant Detail screen | Sprint did not execute |
| T-006 | Implement AI Advice Modal | Sprint did not execute |
| T-007 | Implement Profile page | Sprint did not execute |
| T-015 | QA: Integration test pass — Auth flows | Blocked on frontend (T-001) |
| T-016 | QA: Integration test pass — Plant CRUD flows | Blocked on frontend (T-001–T-005) |
| T-017 | QA: Integration test pass — AI Advice flow | Blocked on frontend (T-006) |
| T-020 | User testing: All 3 MVP flows | Blocked on T-024 (staging health check) |
| T-021 | Fix LoginPage.test.jsx failing test selectors | Blocked on T-001 |
| T-022 | npm audit fix — resolve tar vulnerability | Unstarted |
| T-023 | Deploy: Re-stage with full frontend implementation | Blocked on all frontend tasks + QA |
| T-024 | Monitor: Full staging health check with browser verification | Blocked on T-023 |

---

#### Verification Failures

None — no staging deploy was attempted in Sprint #2.

---

#### Key Feedback Themes

- No new feedback was filed in Sprint #2.
- All Sprint #1 feedback (FB-001, FB-002, FB-003) was already triaged as Acknowledged/Resolved in Sprint #1.

---

#### What Went Well

- Sprint plan was clear and well-scoped; all specs and API contracts remained valid and current.
- Backend infrastructure (API, DB, staging) remains healthy and ready for immediate frontend integration.
- No regressions introduced — backend test suite still 40/40.

---

#### What to Improve

- Frontend implementation must start and complete in Sprint #3 — it has now been deferred across two sprints.
- The orchestrator should confirm agent availability before planning a sprint to avoid no-op sprint cycles.

---

#### Technical Debt Noted

| Item | Severity | Owner |
|------|----------|-------|
| `tar` package vulnerability (transitive via bcrypt) — `npm audit fix` still pending | P3 | Backend Engineer |
| LoginPage.test.jsx — 2 test selector failures still unresolved | P2 | Frontend Engineer |
| No Vite proxy configured — direct CORS calls (acceptable for dev, must address before production) | P3 | Deploy Engineer |
| Database-level encryption not configured | P3 Advisory | Deploy Engineer (production phase) |

---

*Sprint #2 summary written by Manager Agent on 2026-03-23.*

---

---

### Sprint #3 — 2026-03-24 to 2026-03-24

**Sprint Goal:** Implement all 7 Plant Guardians frontend screens, wire them up to the live backend API, pass all unit and integration tests, and deliver a fully browser-testable staging environment — completing the MVP scoped in Sprint #1 and carried over through Sprint #2.

**Outcome:** Substantially Complete — All 7 frontend screens implemented, tested (48/48 unit tests + 3 integration test suites passing), and deployed to staging. Monitor health check (T-024) was triggered and is in progress; final browser verification and user testing (T-020) carry into Sprint #4.

---

#### Tasks Completed

| Task ID | Description |
|---------|-------------|
| T-001 | Implement Login & Sign Up UI — 48/48 frontend tests pass; security fix applied (tokens in memory only) |
| T-002 | Implement Plant Inventory (Home) screen — all states (loading, empty, error, data) verified |
| T-003 | Implement Add Plant screen — photo upload, care schedule, years→months conversion verified |
| T-004 | Implement Edit Plant screen — dirty state detection, full schedule replacement verified |
| T-005 | Implement Plant Detail screen — confetti animation, 10s undo, status badges verified |
| T-006 | Implement AI Advice Modal — all 4 states (loading, result, error, not-identifiable) verified |
| T-007 | Implement Profile page — stats display, logout flow, date formatting verified |
| T-021 | Fix LoginPage.test.jsx test selector failures — 48/48 frontend tests now pass |
| T-022 | npm audit fix — bcrypt upgraded to 6.0.0; 0 high-severity vulnerabilities |
| T-015 | QA: Integration test pass — Auth flows (register, login, refresh, logout, auth guards, token storage) |
| T-016 | QA: Integration test pass — Plant CRUD flows (CRUD, photo upload, care actions, delete modal, undo) |
| T-017 | QA: Integration test pass — AI Advice flow (all 4 states, accept/reject, form population) |
| T-023 | Deploy: Full frontend re-deploy to staging — 40/40 backend + 48/48 frontend tests; 0 audit vulns; all pre-deploy checks ✅ |

---

#### Tasks Carried Over to Sprint #4

| Task ID | Description | Reason |
|---------|-------------|--------|
| T-024 | Monitor: Full staging health check with browser verification | Triggered but not yet complete — in progress at sprint close |
| T-020 | User testing: All 3 MVP flows | Blocked on T-024 (Monitor must return Deploy Verified: Yes first) |

---

#### Verification Failures

No `Deploy Verified: No` verdict was returned in Sprint #3. The Deploy Engineer's pre-Monitor verification (H-034, 2026-03-24) confirmed all systems healthy: backend on :3000, frontend on :5173, 5 migrations applied, seed data present, 0 audit vulnerabilities. T-024 (Monitor Agent full health check) was triggered but did not complete before sprint close — it carries into Sprint #4.

The Sprint 1 `Deploy Verified: No` was fully resolved in Sprint 1 (commit `4659ca6`) and is not a Sprint 3 issue.

---

#### Key Feedback Themes

| Feedback ID | Category | Severity | Disposition |
|-------------|----------|----------|-------------|
| FB-004 | UX Issue (AI Modal 502 wrong button) | Minor | Tasked → T-028 (Sprint 4) |
| FB-005 | UX Issue (Edit redirect to detail vs. inventory) | Cosmetic | Acknowledged — current behavior is better UX; spec to be updated |
| FB-006 | Positive (excellent implementation quality) | — | Acknowledged |
| FB-007 | Positive (robust edge case handling) | — | Acknowledged |

---

#### What Went Well

- **Frontend fully delivered** — after two consecutive no-op sprints, all 7 screens were implemented, reviewed, and tested in a single sprint
- **High code quality on first submission** — only one code review return (T-001 sessionStorage security fix); all other tasks passed review on first attempt
- **Security checklist 13/13 pass** — tokens in memory only, no XSS vectors, auth guards, MIME validation, ownership isolation
- **Test coverage is strong** — 48/48 frontend unit tests, 40/40 backend unit tests, 3 integration test suites, all passing
- **QA feedback was thorough and precise** — FB-004, FB-005 reflect careful product-perspective review
- **Infrastructure resilience** — Deploy Engineer correctly isolated `TEST_DATABASE_URL` after staging tables were wiped, and resolved the port conflict with a concurrent project

---

#### What to Improve

- **Monitor Agent and User testing must complete in Sprint #4** — they have been deferred three sprints and are the final gates before MVP is fully verified
- **Gemini API key is a placeholder** — AI advice happy path has never been tested end-to-end; this blocks full MVP validation
- **Vite proxy not configured** — frontend makes direct cross-origin calls; this must be addressed before production deployment
- **Port conflict management** — concurrent orchestrator runs (triplanner + plant_guardians) caused a port collision; the orchestrator should detect and reserve ports per project

---

#### Technical Debt Noted

| Item | Severity | Owner |
|------|----------|-------|
| Gemini API key is placeholder — AI advice always returns 502 | P1 | Backend Engineer (configuration, not code) |
| AI Advice Modal 502 state shows "Try Again" + wrong message text (FB-004) | P2 | Frontend Engineer → T-028 |
| No Vite proxy configured — frontend makes direct CORS calls to backend (acceptable for dev, must address before production) | P3 | Deploy Engineer |
| Database-level encryption not configured | P3 Advisory | Deploy Engineer (production phase) |
| SPEC-004 describes redirect-to-inventory, but implementation redirects to plant detail (better UX) | P3 Cosmetic | Design Agent → T-029 |

---

*Sprint #3 summary written by Manager Agent on 2026-03-24.*

---

## Template

### Sprint #N — [Start Date] to [End Date]

**Sprint Goal:** [What this sprint aimed to achieve]

**Outcome:** [Completed / Partial / Failed]

**Tasks Completed:**
- [Task ID] — [Description]

**Carry-Overs:**
- [Task ID] — [Reason for carry-over]

**Key Decisions:**
- [Decision and rationale]

**Feedback Summary:**
- [Key feedback items and their disposition]

---
