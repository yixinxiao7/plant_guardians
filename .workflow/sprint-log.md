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

---

### Sprint #4 — 2026-03-24 to 2026-03-24

**Sprint Goal:** Close the MVP verification loop — complete the Monitor Agent health check and user testing carried over from Sprint #3, wire up the real Gemini API key for the AI advice happy path, fix the AI Modal 502 UX issue (FB-004), and complete remaining spec/infrastructure cleanup before production.

**Outcome:** Partial — T-024 (Monitor health check) completed with Deploy Verified: Yes; T-026 (AI Modal 502 fix) and T-028 (Vite proxy) both shipped and verified. T-020 (user testing), T-025 (Gemini key), and T-027 (SPEC-004 update) did not complete and carry into Sprint #5.

---

#### Tasks Completed

| Task ID | Description |
|---------|-------------|
| T-024 | Monitor Agent: Full staging health check — Deploy Verified: Yes. 13/14 API endpoints fully pass (POST /ai/advice 502 is expected due to placeholder key). Frontend loads at :5173 via Vite proxy. Auth flow, CRUD, care actions all healthy. CORS pass, no 5xx errors. |
| T-026 | Frontend: Fix AIAdviceModal 502 error state — 502 now shows only "Close" button + "Our AI service is temporarily offline. You can still add your plant manually." Non-502 errors still show "Try Again". 50/50 frontend tests pass (2 new tests added). QA verified SPEC-006 compliance. |
| T-028 | Deploy: Vite proxy configured in vite.config.js (server.proxy + preview.proxy → http://localhost:3000). api.js defaults to relative `/api/v1`. `VITE_API_BASE_URL` env var still works for production. Staging re-activated and re-verified post-change. 50/50 frontend tests pass. |

---

#### Tasks Carried Over to Sprint #5

| Task ID | Description | Reason |
|---------|-------------|--------|
| T-020 | User testing: All 3 MVP flows (novice, AI advice, inventory management) | T-024 completed this sprint — T-020 is now unblocked. Must complete in Sprint 5. |
| T-025 | Configure real Gemini API key + verify AI advice happy path | T-024 now complete — blocker resolved. Key must be provided by project owner or retrieved from env config. Must complete in Sprint 5. |
| T-027 | Update SPEC-004 to document redirect-to-detail behavior post-save (FB-005) | Low priority; no work started. Sprint 5 carry-over. |

---

#### Verification Failures

The Monitor Agent returned **Deploy Verified: Yes** in Sprint #4. No `Deploy Verified: No` verdicts this sprint. The only failing endpoint (POST /ai/advice → 502) is an expected, documented failure due to the placeholder Gemini API key — this does not block staging verification and is tracked as T-025.

---

#### Key Feedback Themes

| Feedback ID | Category | Severity | Disposition |
|-------------|----------|----------|-------------|
| FB-008 | Positive (T-026 AI Modal 502 fix — clean UX) | — | Acknowledged |
| FB-009 | Positive (Vite proxy eliminates CORS complexity) | — | Acknowledged |
| FB-010 | Bug (flaky backend test — "socket hang up") | Minor | Acknowledged → T-029 (Sprint 5 backlog) |
| FB-011 | Positive (centralized error handling architecture) | — | Acknowledged |
| FB-012 | Feature Gap (Gemini API key placeholder — AI non-functional) | Major | Tasked → T-025 (Sprint 5) |
| FB-013 | Positive (memory-only token storage) | — | Acknowledged |

---

#### What Went Well

- **Monitor health check finally completed** — Deploy Verified: Yes after carrying over from Sprint #1; staging is confirmed production-ready (minus Gemini key)
- **T-026 and T-028 well-executed** — Both tasks delivered at high quality, verified by QA, and passed code review on first attempt
- **50/50 frontend tests** — T-026 added 2 new targeted tests; test count grew without regressions
- **Vite proxy is a clean solution** — Relative API URLs mean dev, staging, and production all work without CORS configuration
- **QA feedback is consistently thorough** — Positive observations (FB-008, FB-009, FB-011, FB-013) show genuine code quality review, not just issue-finding
- **Security posture confirmed** — Memory-only tokens, 0 npm audit vulnerabilities, ownership isolation all verified in Sprint 4

---

#### What to Improve

- **User testing (T-020) has been deferred since Sprint #1** — Now that staging is verified, T-020 must be treated as P0 in Sprint 5 with no further deferral
- **Gemini API key must be obtained before Sprint 5 begins** — Without it, Flow 2 and Flow 3 from the project brief cannot be tested; the MVP cannot be declared complete
- **Flaky backend test (FB-010)** — intermittent "socket hang up" in plants.test.js should be fixed in Sprint 5 (T-029) to ensure CI reliability
- **SPEC-004 update (T-027) keeps slipping** — minor but should be completed in Sprint 5 to keep documentation accurate

---

#### Technical Debt Noted

| Item | Severity | Owner |
|------|----------|-------|
| Gemini API key is placeholder — AI advice always returns 502 | P1 | Backend Engineer (T-025) |
| Flaky backend test — "socket hang up" in POST /plants (FB-010) | P3 | Backend Engineer (T-029) |
| SPEC-004 still documents redirect-to-inventory (actual behavior is redirect-to-detail) | P3 Cosmetic | Design Agent (T-027) |
| Database-level encryption not configured | P3 Advisory | Deploy Engineer (production phase) |

---

*Sprint #4 summary written by Manager Agent on 2026-03-24.*

---

---

### Sprint #5 — 2026-03-24 to 2026-03-25

**Sprint Goal:** Complete MVP validation — run user testing across all 3 flows, configure the real Gemini API key for the AI advice feature, update SPEC-004 to match shipped behavior, and fix the flaky backend test to ensure CI reliability.

**Outcome:** Partial — T-025 (Gemini key gap documented + mocked tests expanded) and T-029 (flaky test fix) completed. T-030 (Monitor health check) returned Deploy Verified: Yes. T-020 (user testing) and T-027 (SPEC-004 update) did not complete and carry into Sprint #6 for the fifth consecutive sprint.

---

#### Tasks Completed

| Task ID | Description |
|---------|-------------|
| T-025 | Backend: Gemini API key gap documented; model updated to `gemini-1.5-flash`; 4 new mocked AI tests added (happy-path, unparseable response, API error, input validation). 44/44 backend tests pass. No real key available — accepted per sprint plan. |
| T-029 | Backend: Flaky test fix — root cause confirmed (parallel PG connection contention). Fix: `--runInBand`, pool min:1/max:5, `idleTimeoutMillis`, teardown refactored with `activeFiles` tracking. 3 consecutive runs: 44/44 pass. Zero socket hang-up failures. |
| T-030 | Monitor: Sprint 5 post-deploy health check — Deploy Verified: Yes. All 14 endpoints tested; POST /ai/advice 502 is expected (placeholder key). Frontend :5173 healthy. Vite proxy confirmed. No CORS errors, no unexpected 5xx. |

---

#### Tasks Carried Over to Sprint #6

| Task ID | Description | Reason |
|---------|-------------|--------|
| T-020 | User testing: All 3 MVP flows | Carried over from Sprints 1–5. No blocker — staging is fully verified. Must complete Sprint 6 — no further deferral permitted. |
| T-027 | Update SPEC-004 to document redirect-to-detail behavior post-save | P3 documentation task; no work started across Sprints 4–5. |

---

#### Verification Failures

No `Deploy Verified: No` verdict was returned in Sprint #5. T-030 (Monitor Agent) confirmed **Deploy Verified: Yes**. The only non-2xx response was POST /ai/advice → 502 AI_SERVICE_UNAVAILABLE, which is an expected, documented result of the placeholder Gemini key.

---

#### Key Feedback Themes

| Feedback ID | Category | Severity | Disposition |
|-------------|----------|----------|-------------|
| FB-014 | Positive (comprehensive AI endpoint test coverage) | — | Acknowledged |
| FB-015 | Positive (flaky test root cause correctly identified and fixed) | — | Acknowledged |
| FB-016 | Feature Gap (Gemini key still placeholder — AI happy path untestable) | Minor | Acknowledged — accepted per sprint plan; real key must be provisioned by project owner |
| FB-017 | Bug (intermittent timeout in profile.test.js) | Minor (P3) | Acknowledged → T-031 (Sprint 6 backlog) |

---

#### What Went Well

- **T-029 flaky test fix was thorough** — root cause correctly identified (parallel PG contention), multi-layered fix applied (runInBand, pool tuning, teardown refactor), verified across 3 consecutive runs. CI-ready.
- **T-025 mocked test expansion is clean** — 7 AI tests now cover all contract error codes (400, 401, 422, 502) plus happy path (200) with proper mocking. No real key required for CI.
- **T-030 Monitor confirmed staging stability** — Deploy Verified: Yes confirms the Sprint 4 infrastructure work holds. No regressions from Sprint 5 changes (model name update + test infra only).
- **QA coverage remained thorough** — Final QA pass caught FB-017 (profile test flakiness) and confirmed security checklist 13/13 pass.
- **Zero production code defects** — All Sprint 5 changes were test-infrastructure and model-name-only. No endpoint behavior changes, no schema changes, no regressions.

---

#### What to Improve

- **T-020 has been deferred 5 consecutive sprints** — This is unacceptable. Sprint 6 must treat T-020 as P0 with no further carry-over. Staging is verified, there are no blockers — this must close.
- **Gemini API key must be provisioned by the project owner** — Until a real key is configured, Flow 2 (AI advice) cannot be fully tested end-to-end. This is a configuration action, not a code task.
- **T-027 keeps slipping** — A 1-hour documentation task has been deferred since Sprint 4. Sprint 6 must complete it.
- **profile.test.js flakiness** — FB-017 is a new flaky test issue distinct from the T-029 fix. Sprint 6 should address it to keep CI reliable.

---

#### Technical Debt Noted

| Item | Severity | Owner |
|------|----------|-------|
| Gemini API key is placeholder — AI advice always returns 502 in production | P1 | Project owner (provisioning) + Backend Engineer (wiring) |
| profile.test.js intermittent 30s timeout (FB-017) — test infra issue, not production defect | P3 | Backend Engineer → T-031 |
| SPEC-004 still documents redirect-to-inventory (actual behavior is redirect-to-detail) | P3 Cosmetic | Design Agent → T-027 |
| Database-level encryption not configured | P3 Advisory | Deploy Engineer (production phase) |
| Production deployment (HTTPS, reverse proxy, real env vars) not yet configured | P2 | Deploy Engineer |
| Delete Account feature shows "coming soon" on Profile page — not implemented | P2 | Backend + Frontend Engineer |

---

*Sprint #5 summary written by Manager Agent on 2026-03-25.*

---

---

### Sprint #6 — 2026-03-25 to 2026-03-26

**Sprint Goal:** Declare MVP complete by closing the final user-testing gate (T-020), implement the Delete Account feature (T-033/T-034), prepare production deployment infrastructure (T-032), fix the profile test flakiness (T-031), and close the long-running SPEC-004 documentation debt (T-027).

**Outcome:** Partial — All engineering tasks (T-027, T-031, T-032, T-033, T-034) delivered and verified. Deploy Verified: Yes (H-085, Monitor Agent). T-020 (user testing) was not completed and carries into Sprint #7 for the sixth consecutive sprint.

---

#### Tasks Completed

| Task ID | Description |
|---------|-------------|
| T-027 | Design Agent: SPEC-004 updated to document redirect-to-detail behavior post-save. Status set to Approved (2026-03-25). Four-sprint carry-over closed. |
| T-031 | Backend Engineer: profile.test.js intermittent 30s timeout fixed via `jest.setTimeout(60000)`. 3 consecutive runs: 48/48 each, zero timeouts. |
| T-032 | Deploy Engineer: Production deployment infra created — `infra/docker-compose.prod.yml` (postgres+backend+nginx), `infra/nginx.prod.conf` (HTTP→HTTPS redirect, TLS 1.2/1.3, HSTS, API proxy), `.env.production.example`, `infra/deploy-prod.sh` (6-step pre-flight deploy script), `.workflow/deploy-runbook.md` (full runbook: first-time setup, SSL, pre-deploy checklist, rollback, troubleshooting). |
| T-033 | Backend Engineer: `DELETE /api/v1/auth/account` endpoint implemented — authenticated, 204 on success, cascade delete via ON DELETE CASCADE (plants, care_schedules, care_actions, photos, refresh_tokens). 4 new tests (happy path + cascade verify, 401 × 2, isolation). 48/48 tests pass. API contract added to api-contracts.md. |
| T-034 | Frontend Engineer: Delete Account UI on Profile page — confirmation modal with full a11y (role=dialog, aria-modal, focus trap, Escape key dismiss, backdrop does NOT dismiss). Error states: 401 → session expired + redirect, 5xx → retry message. Token cleanup and sessionStorage clear on success. 61/61 frontend tests pass (11 new tests). |

---

#### Tasks Carried Over to Sprint #7

| Task ID | Description | Reason |
|---------|-------------|--------|
| T-020 | User testing: All 3 MVP flows (novice, AI advice, inventory management) | Sixth consecutive sprint carry-over. No blocking dependencies — staging Deploy Verified: Yes. This is unacceptable; Sprint 7 treats this as an absolute P0 with zero tolerance for further deferral. |

---

#### Verification Failures

**No `Deploy Verified: No` verdict was returned in Sprint #6.** Monitor Agent returned **Deploy Verified: Yes** (H-085, 2026-03-26): all 36 health checks passed, T-033/T-034 endpoints verified operational, no regressions, security headers correct, CORS pass, Vite proxy confirmed.

The only non-2xx response is `POST /ai/advice → 502 AI_SERVICE_UNAVAILABLE` — an expected, documented result of the placeholder Gemini key, not a regression.

---

#### Key Feedback Themes

| Feedback ID | Category | Severity | Disposition |
|-------------|----------|----------|-------------|
| FB-018 | Positive (Delete Account best-practice UX pattern) | — | Acknowledged |
| FB-019 | Positive (Production runbook comprehensive and actionable) | — | Acknowledged |
| FB-020 | UX Issue (delete account success toast uses 'error' variant) | Cosmetic | Acknowledged → T-035 (Sprint 7 P3) |
| FB-021 | UX Issue (missing `npm test` script in frontend package.json) | Minor | Acknowledged → T-036 (Sprint 7 P3) |
| FB-022 | Bug (picomatch dev-only vulnerability) | Minor | Acknowledged → T-037 (Sprint 7 P3) |

---

#### What Went Well

- **All five engineering tasks delivered at high quality** — T-031, T-032, T-033, T-034 all passed code review on first attempt; T-027 closed a four-sprint documentation debt.
- **Delete Account is production-grade** — Full a11y compliance, focus trap, proper error differentiation (401 vs 5xx), token cleanup, 11 new targeted tests. FB-018 calls it a model pattern for destructive actions.
- **Production deployment runbook is comprehensive** — FB-019 confirms it covers all critical scenarios. The pre-flight safety checks in deploy-prod.sh prevent the most common deployment mistakes.
- **CI reliability restored** — T-031 (profile test fix) brings backend to 48/48 tests with zero flaky failures. Combined with T-029 (Sprint 5), backend test suite is now fully stable.
- **Monitor Agent confirmed Deploy Verified: Yes** — Sprint 6 staging is healthy; zero regressions from five new engineering tasks.
- **Feedback volume is shrinking** — Only 5 feedback items this sprint, all minor or positive. No P0 or P1 issues found by QA.

---

#### What to Improve

- **T-020 must close in Sprint 7 — absolutely no further carry-over** — Six consecutive deferrals is a process failure. The orchestrator should enforce a hard gate: Sprint 8 cannot start until T-020 is Done.
- **Gemini API key must be provisioned by the project owner** — Until a real key is configured, Flow 2 (AI advice) cannot be fully tested. This is the sole remaining MVP blocker and is not an engineering task.
- **Minor feedback items accumulating** — FB-020, FB-021, FB-022 are all small, quick fixes. They should be batched and cleared in Sprint 7 in a single focused pass, not allowed to accumulate.

---

#### Technical Debt Noted

| Item | Severity | Owner |
|------|----------|-------|
| Gemini API key is placeholder — AI advice always returns 502 | P1 | Project owner (provisioning) |
| Delete account success toast uses 'error' variant (FB-020) | P3 Cosmetic | Frontend Engineer → T-035 |
| Missing `npm test` script in frontend package.json (FB-021) | P3 | Frontend Engineer → T-036 |
| picomatch dev-only vulnerability — npm audit fix available (FB-022) | P3 | Backend + Frontend Engineer → T-037 |
| Database-level encryption not configured | P3 Advisory | Deploy Engineer (production phase) |

---

*Sprint #6 summary written by Manager Agent on 2026-03-25.*

---

---

### Sprint #7 — 2026-03-26 to 2026-03-26

**Sprint Goal:** Close the MVP validation gate (T-020 — seventh and final carry-over with zero tolerance), clear the Sprint 6 minor feedback backlog (T-035, T-036, T-037), and deliver the first post-MVP feature: Care History — a paginated log of all past care actions per plant, reinforcing the habit loop central to the product vision.

**Outcome:** Partial — All six engineering tasks delivered at high quality (T-035, T-036, T-037, T-038, T-039, T-040). 57/57 backend + 72/72 frontend tests pass. Care History feature fully deployed. T-020 (user testing) was not completed and carries into Sprint #8 for the seventh consecutive sprint.

---

#### Tasks Completed

| Task ID | Description |
|---------|-------------|
| T-035 | Frontend: Fixed delete account success toast variant from 'error' → 'info'. 72/72 frontend tests pass. |
| T-036 | Frontend: Added `"test": "vitest run"` to `frontend/package.json`. `npm test` now consistent with backend. |
| T-037 | Backend + Frontend: `npm audit fix` — 0 high-severity vulnerabilities in both packages. 57/57 backend + 72/72 frontend tests pass. |
| T-038 | Design: SPEC-008 (Care History page) written and marked Approved in `ui-spec.md`. Gated T-039 and T-040. |
| T-039 | Backend: `GET /api/v1/care-actions` endpoint implemented — paginated, authenticated, plant_id filter, ownership isolation. 9 new tests (57/57 total). API contract published to `api-contracts.md`. |
| T-040 | Frontend: `/history` page implemented per SPEC-008 — all 5 states (loading, populated, empty, filtered-empty, error), color-coded care type icons, relative timestamps, load-more pagination, dual nav entry points (sidebar + profile). 11 new tests (72/72 total). |

---

#### Tasks Carried Over to Sprint #8

| Task ID | Description | Reason |
|---------|-------------|--------|
| T-020 | User testing: All 3 MVP flows (novice, AI advice, inventory management) | Seventh consecutive sprint carry-over. No blocking dependencies — staging is deployed and healthy. This is a process failure. Sprint 8 treats T-020 as an unconditional P0; Sprint 8 will not close without it. |

---

#### Verification Failures

**No `Deploy Verified: No` verdict was returned in Sprint #7.** The Monitor Agent post-deploy health check for Sprint 7 was not completed before sprint close. The Deploy Engineer's Sprint 7 staging deployment shows "Deploy Verified: Pending Monitor Agent health check." This is a process gap — not a blocking failure — but the Monitor Agent must complete the Sprint 7 health check as the first action in Sprint 8.

The two separate Sprint 7 staging deployments (one at :4174, one at :5173) both show backend and frontend running healthily with 57/57 and 72/72 tests passing. There are no observed failures. The health check must be formally completed and logged as `Deploy Verified: Yes` in Sprint 8.

---

#### Key Feedback Themes

| Feedback ID | Category | Severity | Disposition |
|-------------|----------|----------|-------------|
| FB-023 | Positive (Care History reinforces product vision) | — | Acknowledged |
| FB-024 | Bug (brace-expansion moderate dev-only vulns) | Minor | Acknowledged — dev-only, no production impact, no fix available without breaking major version bumps. Accept as known risk. |

---

#### What Went Well

- **Full feature delivered** — Care History (T-038, T-039, T-040) was planned and completed within a single sprint at high quality. The design spec, backend endpoint, and frontend page all passed code review and QA on first attempt.
- **Code quality is consistently high** — All six tasks passed code review on first attempt. 57/57 backend + 72/72 frontend tests with no regressions.
- **Minor feedback backlog fully cleared** — T-035, T-036, T-037 were three quick-fix tasks that had accumulated from Sprint 6; all three shipped cleanly.
- **Test coverage strong** — T-039 added 9 tests covering all edge cases (validation, auth, pagination, ownership isolation); T-040 added 11 tests covering all UI states.
- **Care History UX is well-designed** — FB-023 notes color-coded icons, encouraging empty state, relative timestamps, and dual nav entry points as strong UX decisions.
- **Security posture maintained** — Security checklist 22/22 pass; no new P1 issues introduced.

---

#### What to Improve

- **T-020 must close in Sprint 8 — no exceptions** — Seven consecutive deferrals is a critical process failure. The orchestrator must enforce a hard gate on this task before Sprint 8 can close.
- **Monitor Agent health check must complete before sprint close** — The Sprint 7 Deploy Verified status was still "Pending" when the sprint ended. Sprint 8 should start with an immediate Monitor health check.
- **Gemini API key must be provisioned by the project owner** — AI advice (Flow 2) cannot be tested end-to-end until a real key is configured. This is the only remaining blocker for full MVP validation.

---

#### Technical Debt Noted

| Item | Severity | Owner |
|------|----------|-------|
| Gemini API key is placeholder — AI advice always returns 502 | P1 | Project owner (provisioning) |
| Monitor Agent Sprint 7 health check not yet complete (Deploy Verified: Pending) | P2 | Monitor Agent → Sprint 8 first action |
| brace-expansion moderate vulnerabilities in dev-only deps (jest, eslint) | P3 Advisory | Accept as known risk; no fix available without breaking version bumps |
| Database-level encryption not configured | P3 Advisory | Deploy Engineer (production phase) |

---

*Sprint #7 summary written by Manager Agent on 2026-03-26.*

---

### Sprint #8 — 2026-03-26 to 2026-03-27

**Sprint Goal:** Close the Sprint 7 Monitor health check gap (T-041), deliver the Care Due Dashboard feature (T-042, T-043, T-044), and complete user testing of all 3 MVP flows (T-020 — P0 hard gate, eighth attempt).

**Outcome:** Partial — All four engineering tasks delivered and verified (Deploy Verified: Yes). T-020 (user testing — P0 hard gate) was not completed by a User Agent; however, the project owner tested the app directly and filed substantive real-world feedback (FB-025 through FB-029), which is more valuable than simulated testing. Three Major bugs were discovered through owner testing (CORS port 5174, expand buttons, isDirty check), confirming the value of real testing. These bugs carry into Sprint 9 as P0/P1 fixes.

---

#### Tasks Completed

| Task ID | Description |
|---------|-------------|
| T-041 | Monitor Agent: Complete Sprint 7 post-deploy health check — Deploy Verified: Yes, all 17 endpoints pass |
| T-042 | Design Agent: SPEC-009 (Care Due Dashboard) written and marked Approved in ui-spec.md |
| T-043 | Backend Engineer: GET /api/v1/care-due endpoint — 8 new tests, 65/65 backend tests pass |
| T-044 | Frontend Engineer: Care Due Dashboard page (/due) — 23 new tests, 95/95 frontend tests pass |

---

#### Tasks Carried Over to Sprint #9

| Task ID | Reason |
|---------|--------|
| T-020 | User testing — P0 hard gate; not completed by User Agent. Project owner conducted real-world testing instead and discovered 3 Major blocking bugs (FB-025, FB-026, FB-027). T-020 will be completed after Sprint 9 bug fixes are deployed. **Ninth consecutive carry-over.** |

---

#### Verification Failures

**No `Deploy Verified: No` verdict was returned in Sprint #8.** The Monitor Agent comprehensive health check returned **Deploy Verified: Yes** — all 17 API endpoints pass, all 5 frontend routes pass, config consistency verified. The Sprint 8 staging deploy (port :5174 due to :4173 conflict) is healthy.

**Note:** One earlier Deploy Verified entry shows "Pending Monitor Agent health check (H-121)" — this refers to the initial Deploy Engineer pre-check that preceded the full Monitor Agent verification. The definitive verdict is **Deploy Verified: Yes** from the Monitor Agent Sprint #8 Post-Deploy Health Check (qa-build-log.md).

---

#### Key Feedback Themes

- **Three Major blocking bugs discovered via real project-owner testing** (FB-025, FB-026, FB-027): CORS port mismatch on :5174, fertilizing/repotting expand buttons broken, Edit Plant isDirty check misses date fields. These are targeted, well-described bugs with specific fix instructions.
- **Gemini 429 rate limit handling needed** (FB-028): Real-world AI usage exposed rate limit errors that surface as misleading "service offline" messages. Fallback chain to 4 model tiers requested.
- **AI flow confirmed working end-to-end by project owner** (FB-029): Gemini integration functional with real key (gemini-2.5-flash). Flow 2 partially validated.
- **Care Due Dashboard praised by QA** (FB-030, FB-032): Design decisions (urgency text, mark-done shortcut, sidebar badge, all-clear state) specifically called out as excellent UX for the target novice audience.
- **Minor a11y gap noted** (FB-033): Focus management after mark-done not implemented; minor polish item for future sprint.

---

#### What Went Well

- Care Due Dashboard delivered on time, fully tested, fully deployed — 23 new frontend tests, 8 new backend tests
- Monitor Agent Sprint 7 health check gap closed immediately (T-041 done as first Sprint 8 task)
- Project owner used the app with a real Gemini key — this is the first time real end-to-end testing occurred; feedback is actionable and specific
- All 17 API endpoints pass health check; all 95 frontend + 65 backend tests pass
- SPEC-009 (Care Due Dashboard spec) written and implemented to spec in a single sprint cycle

---

#### What to Improve

- T-020 has now carried over 8 consecutive sprints. Sprint 9 will flip the strategy: fix blocking bugs first (T-045, T-046, T-047), then re-run T-020 against a clean staging environment. This eliminates the "can't test because it's broken" trap.
- CORS port coverage should be comprehensive from the start — any new port used for staging should be added to FRONTEND_URL (FB-025 is the second CORS bug in the project).
- Form state management (isDirty) should cover all editable fields including date pickers at implementation time, not discovered via QA.

---

#### Technical Debt Noted

| Item | Severity | Owner |
|------|----------|-------|
| Express 4 path-to-regexp ReDoS (FB-031) — track for Express 5 migration | P3 Advisory | Backend Engineer |
| CareScheduleForm controlled vs uncontrolled expand state (FB-026) — design flaw | P1 | Frontend Engineer (T-046) |
| EditPlantPage isDirty memo missing date field comparisons (FB-027) | P1 | Frontend Engineer (T-047) |
| CORS FRONTEND_URL does not enumerate all dev ports (FB-025) | P1 | Deploy Engineer (T-045) |
| Gemini 429 rate limit falls through as 502 "service offline" (FB-028) | P2 | Backend Engineer (T-048) |
| Focus management after mark-done in Care Due Dashboard (FB-033) | P3 | Frontend Engineer (backlog) |

---

*Sprint #8 summary written by Manager Agent on 2026-03-27.*

---

### Sprint #9 — 2026-03-27 to 2026-03-28

**Sprint Goal:** Fix the three Major blocking bugs discovered by the project owner during real-world testing (CORS port 5174, CareScheduleForm expand buttons, EditPlantPage isDirty date check), implement the Gemini 429 model fallback chain for AI resilience, and — with all blockers resolved — complete T-020 user testing to formally declare the MVP done.

**Outcome:** Partial — All four engineering tasks (T-045, T-046, T-047, T-048) delivered, reviewed, QA-passed, and deployed. Monitor Agent confirmed Deploy Verified: Yes across all 17 API endpoints and 5 frontend routes. T-020 (user testing) was not executed — it was technically unblocked by end of sprint but no User Agent or project-owner testing session occurred before sprint close. T-020 carries into Sprint #10 for the tenth consecutive sprint. This time, staging is clean, all bugs are fixed, Gemini is live, and there are zero remaining blockers.

---

#### Tasks Completed

| Task ID | Description |
|---------|-------------|
| T-045 | Deploy Engineer: CORS fixed — `http://localhost:5174` confirmed in `backend/.env` (pre-existing); `.env.example` updated to document all three origins (:5173, :5174, :4173). CORS preflight returns 204 + correct header for all origins. 69/69 backend tests pass. |
| T-046 | Frontend Engineer: CareScheduleForm `onExpand` callback prop added. Both `AddPlantPage` and `EditPlantPage` now pass `onExpand` so clicking "Add fertilizing/repotting schedule" correctly expands the form. 3 new tests (controlled expand × 2 care types, uncontrolled fallback). 101/101 frontend tests pass. |
| T-047 | Frontend Engineer: EditPlantPage `isDirty` memo extended to compare `wateringLastDone`, `fertilizingLastDone`, `repottingLastDone` against original `last_done_at`. `normalizeLastDone` helper strips time for comparison. Save button now enables when only a date field is changed. 3 new tests. 101/101 frontend tests pass. |
| T-048 | Backend Engineer: Gemini 429 model fallback chain implemented in `ai.js` — `MODEL_FALLBACK_CHAIN` (gemini-2.0-flash → gemini-2.5-flash → gemini-2.5-flash-lite → gemini-2.5-pro), `isRateLimitError()` helper (covers `.status === 429` and message string). 4 new tests. 69/69 backend tests pass. Monitor Agent smoke test confirmed AI endpoint returns 200 with real Gemini call. |

---

#### Tasks Carried Over to Sprint #10

| Task ID | Description | Reason |
|---------|-------------|--------|
| T-020 | User testing: All 3 MVP flows + Care History + Care Due Dashboard | Tenth consecutive carry-over. Staging is fully clean — 69/69 backend + 101/101 frontend tests, Deploy Verified: Yes, all blocking bugs resolved, Gemini live. No further blockers. Must close in Sprint #10 without exception. |

---

#### Verification Failures

**No `Deploy Verified: No` verdict was returned in Sprint #9.** The Monitor Agent post-deploy health check (2026-03-28T15:43Z) returned **Deploy Verified: Yes** — all 17 API endpoints pass, all 5 frontend routes pass, config consistency verified, CORS all 3 origins confirmed, T-048 Gemini fallback chain smoke-tested (HTTP 200 with full care advice returned). No 5xx errors observed. No regressions.

---

#### Key Feedback Themes

| Feedback ID | Category | Severity | Disposition |
|-------------|----------|----------|-------------|
| FB-034 | Positive (CareScheduleForm onExpand pattern is clean) | N/A | Acknowledged |
| FB-035 | Positive (Gemini 429 fallback chain is a good resilience pattern) | N/A | Acknowledged |
| FB-036 | UX Issue (normalizeLastDone edge case — verified correct, not a bug) | Low | Acknowledged — verified edge case, no action needed |
| FB-037 | Bug (path-to-regexp high-severity — pre-existing, same as FB-031) | Low | Acknowledged — pre-existing advisory; tracked for Express 5 migration in backlog |

---

#### What Went Well

- All four Sprint 9 engineering tasks completed, reviewed, QA-passed, and deployed in a single day
- Monitor Agent health check confirmed clean staging with Gemini actually returning live AI advice (not mock)
- T-046 fix is backward-compatible — uncontrolled `CareScheduleForm` still works as before
- T-047's `normalizeLastDone` helper is a clean pattern that correctly handles null/empty edge cases (FB-036 confirms this)
- 69/69 backend + 101/101 frontend tests — highest test counts in the project's history
- CORS now covers all three dev ports (:5173, :5174, :4173) comprehensively

---

#### What to Improve

- T-020 has now carried over 9 consecutive sprints. Sprint 10 will treat this as an **absolute close** — there are zero remaining blockers, staging is verified, and the Gemini key is live. If no User Agent is available, the project owner must run the testing session directly.
- Form component controlled/uncontrolled state contracts should be documented at design time (T-046 bug was a contract violation that was avoidable with clearer prop documentation).
- `isDirty` scope in form pages should cover ALL user-editable fields at implementation time — date pickers are editable fields (T-047 was preventable).

---

#### Technical Debt Noted

| Item | Severity | Owner |
|------|----------|-------|
| Express 4 path-to-regexp ReDoS (FB-031/FB-037) | P3 Advisory | Backlog — track for Express 5 migration |
| Monitor Agent system prompt references stale test account (`test@triplanner.local` should be `test@plantguardians.local`) | P3 | Monitor Agent — update in Sprint 10 |
| Focus management after mark-done in Care Due Dashboard (FB-033) | P3 | Frontend Engineer — Sprint 10 backlog |
| Database-level encryption not configured | P3 Advisory | Deploy Engineer (production phase) |

---

*Sprint #9 summary written by Manager Agent on 2026-03-28.*

---

### Sprint #10 — 2026-03-28 to 2026-03-29

**Sprint Goal:** Formally declare the MVP complete by closing T-020 (user testing — all 3 flows + Care History + Care Due Dashboard). Secondary polish: implement focus management after mark-done in Care Due Dashboard (T-050) and fix stale test account reference in Monitor Agent system prompt (T-051).

**Outcome:** Partial — T-050 (focus management) delivered, reviewed, QA-passed, and deployed. T-020 (user testing) was not executed — staging was blocked again by a recurring CORS port mismatch (staging frontend landed on port 4175, which is not in `FRONTEND_URL`). Monitor Agent returned **Deploy Verified: No**. T-020 carries into Sprint #11 for the eleventh consecutive sprint. T-051 was not started (remains Backlog). Three new feedback items from the project owner (FB-038, FB-039, FB-040) and one Monitor Alert (FB-043) are tasked into Sprint #11.

---

#### Tasks Completed

| Task ID | Description |
|---------|-------------|
| T-050 | Frontend Engineer: Care Due Dashboard focus management implemented. After mark-done removes an item, focus moves to next "Mark as done" button (next sibling → next section → earlier section → "View my plants" all-clear CTA). `getNextFocusTarget` pure function with clean separation. `transitionend` listener with 350ms fallback for standard motion; synchronous focus for reduced motion. `Button.jsx` wrapped with `forwardRef`. 6 new tests cover all focus scenarios. 107/107 frontend tests pass. Code review passed. QA passed. Staging deployed (port 4175). |

---

#### Tasks Carried Over to Sprint #11

| Task ID | Description | Reason |
|---------|-------------|--------|
| T-020 | User testing: All 3 MVP flows + Care History + Care Due Dashboard | **Eleventh consecutive carry-over.** Blocked by CORS mismatch: staging frontend landed on port 4175, which is not in `backend/.env` `FRONTEND_URL`. Monitor Agent returned Deploy Verified: No. Fix is T-055 (Sprint 11 P0). Once T-055 is applied, T-020 is fully unblocked. |
| T-051 | Monitor Agent: Update system prompt — stale test account reference | Not started this sprint. Remains P3 Backlog. |

---

#### Verification Failures

The Sprint #10 Monitor Agent post-deploy health check (2026-03-29T21:05Z) returned **Deploy Verified: No** due to:

1. **CORS mismatch — port 4175 missing from FRONTEND_URL** — `vite preview` landed on port 4175 (ports 4173/4174 occupied from prior sessions). `backend/.env` `FRONTEND_URL` only covers `:5173, :5174, :4173`. Browser API calls from staging frontend at `http://localhost:4175` → HTTP 500 (CORS error). Logged as FB-043, tasked as T-055 (Sprint 11 P0). Fixes: add `,http://localhost:4175` to `FRONTEND_URL` AND configure a fixed `vite preview` port to prevent future port drift.

**All 17 API endpoints passed** (direct curl, no Origin header) and the frontend is accessible at http://localhost:4175. The CORS failure affects browser-based testing only; all backend functionality is sound.

---

#### Key Feedback Themes

| Feedback ID | Category | Severity | Disposition |
|-------------|----------|----------|-------------|
| FB-038 | UX Issue — Plant card badges missing care type label/icon | Major | Tasked → T-052 (Sprint 11 P2) |
| FB-039 | UX Issue — Users forced to log in on every page refresh (no session persistence) | Major | Tasked → T-053 (Sprint 11 P1) |
| FB-040 | Bug — Photo removal doesn't enable Save button in EditPlantPage | Major | Tasked → T-054 (Sprint 11 P2) |
| FB-041 | Positive — Care Due Dashboard focus management works excellently (T-050) | N/A | Acknowledged |
| FB-042 | Positive — Gemini fallback chain provides resilient AI advice experience | N/A | Acknowledged |
| FB-043 | Monitor Alert — CORS mismatch, staging frontend port 4175 not in FRONTEND_URL | Major | Tasked → T-055 (Sprint 11 P0) |

---

#### What Went Well

- T-050 focus management is a comprehensive, production-grade accessibility implementation — all 4 focus decision tree branches, reduced-motion handling, and 6 covering tests
- `Button.jsx` correctly wrapped with `forwardRef` — clean component API improvement
- QA product-perspective testing praised T-050 as a standout feature (FB-041)
- 107/107 frontend tests pass — new high watermark
- Monitor Agent correctly identified the CORS issue before it became a user-reported problem

---

#### What to Improve

- **Recurring CORS port drift must be permanently resolved.** This is the second sprint in a row (Sprint 9: port 5174, Sprint 10: port 4175) where the `vite preview` port has incremented and broken staging. T-055 must include a durable fix (fixed `--port` flag in `vite preview` script) so this cannot happen again.
- T-020 has now carried over **10 consecutive sprints**. Sprint 11 will treat CORS fix (T-055) as a P0 gate that must be resolved before anything else. T-020 is then the immediate next action.
- T-051 (Monitor Agent system prompt) was not started in Sprint 10 despite having no dependencies. Must be actioned in Sprint 11 — it's a 5-minute documentation fix.

---

#### Technical Debt Noted

| Item | Severity | Owner |
|------|----------|-------|
| Recurring CORS port drift — `vite preview` port increments each sprint | P1 | Deploy Engineer — Sprint 11 T-055 must include durable fixed-port fix |
| Auth session persistence — page refresh forces re-login (FB-039) | P1 | Backend + Frontend Engineer — Sprint 11 T-053 |
| Express 4 path-to-regexp ReDoS (FB-031/FB-037) | P3 Advisory | Backlog — track for Express 5 migration |
| Monitor Agent stale test account reference (T-051) | P3 | Monitor Agent — Sprint 11 |

---

*Sprint #10 summary written by Manager Agent on 2026-03-29.*

---

### Sprint #11 — 2026-03-29 to 2026-03-30

**Sprint Goal:** Fix the recurring CORS port-drift issue permanently (T-055), declare MVP complete via end-to-end user testing (T-020), deliver persistent login via HttpOnly cookie (T-053), add care-type badges to plant cards (T-052), fix photo-removal isDirty bug (T-054), and close out the stale Monitor Agent system prompt (T-051).

**Outcome:** Partial — Four of six engineering tasks delivered and QA-verified (T-055, T-052, T-054, T-051). T-053 backend half completed; frontend half blocked by Frontend Engineer who never updated `api.js` despite three handoffs (H-130, H-131, H-136). T-020 (MVP declaration) did not execute — Monitor Agent returned **Deploy Verified: No** due to intermittent HTTP 500 on POST /api/v1/auth/login (FB-044). T-020 carries into Sprint #12 for the **twelfth consecutive sprint**.

---

#### Tasks Completed

| Task ID | Description |
|---------|-------------|
| T-055 | Deploy Engineer: CORS port drift permanently fixed. `http://localhost:4175` added to `FRONTEND_URL`. `vite preview` script pinned to `--port 4173`. `.env.example` updated with all canonical port documentation. CORS preflight from :4173 and :4175 both return 204 + correct header. 72/72 backend tests pass. |
| T-052 | Frontend Engineer: Care type badges added to PlantCard. Each status badge now prefixed with Phosphor icon + care type label (blue water drop for watering, green leaf for fertilizing, terracotta pot for repotting). Badge text examples: "Watering: 2 days overdue", "Fertilizing: On track". 9 new tests. 117/117 frontend tests pass. SPEC-002 Amendment compliant. |
| T-054 | Frontend Engineer: Photo removal isDirty fix in EditPlantPage. `isDirty` useMemo now compares `photoUrl` against `(plant.photo_url \|\| '')`. Removing an existing photo enables Save button. `photoUrl` added to memo dependency array. 1 new unit test. 117/117 frontend tests pass. |
| T-051 | Monitor Agent: Stale test account reference updated in `.agents/monitor-agent.md`. Now references `test@plantguardians.local` / `TestPass123!` correctly. |
| T-053 (backend) | Backend Engineer: HttpOnly refresh token cookie implemented. `POST /auth/register`, `POST /auth/login` set `Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict`. `POST /auth/refresh` reads from `req.cookies.refresh_token` with token rotation. `POST /auth/logout` and `DELETE /auth/account` clear cookie. `cookie-parser` added. 14 auth tests rewritten + 4 new. 72/72 backend tests pass. |

---

#### Tasks Carried Over to Sprint #12

| Task ID | Description | Reason |
|---------|-------------|--------|
| T-053 (frontend) | Frontend: Complete api.js cookie migration (remove body-based refresh_token, add `credentials: 'include'`, silent re-auth on app init) | **Blocked — Frontend Engineer never completed.** Three handoffs sent (H-130, H-131, H-136). `api.js` still sends refresh token in request body; backend now reads from cookie. Current state: token refresh returns 401 after access token expires. P1 blocker for T-020 (users will be silently logged out after 15 minutes if refresh fails). |
| T-020 | User testing — all 3 MVP flows + Care History + Care Due Dashboard | **Twelfth consecutive carry-over.** Blocked by: (1) intermittent auth 500 (FB-044, tasked as T-056); (2) T-053 frontend not done (refresh flow broken). Once T-056 and T-053 frontend are Done, T-020 is fully unblocked. |

---

#### Verification Failures

The Sprint #11 post-deploy health check (2026-03-30T19:04:00Z) returned **Deploy Verified: No** due to:

1. **Intermittent HTTP 500 on POST /api/v1/auth/login (FB-044)** — 2 of the first 8 login calls returned HTTP 500 `INTERNAL_ERROR`. Pattern: failures on calls 1 and 3, all subsequent calls return 200. Suspected root cause: DB connection pool cold-start (Knex `min` pool size not configured) or `cookie-parser` middleware race condition introduced by T-053 backend changes. Tasked as T-056 (Sprint 12 P0). All other 17 endpoint checks passed. Config consistency fully validated (CORS fix T-055 working correctly).

---

#### Key Feedback Themes

| Feedback ID | Category | Severity | Disposition |
|-------------|----------|----------|-------------|
| FB-044 | Monitor Alert — Intermittent 500 on POST /api/v1/auth/login after restart/idle | Major | Tasked → T-056 (Sprint 12 P0) |
| QA Obs 3 | Bug — Frontend auth refresh broken (api.js still body-based; backend now cookie-based) | P1 | Tracked via T-053 frontend carry-over to Sprint 12 |
| QA Obs 7 | Minor — TEST_DATABASE_URL port inconsistency (.env uses 5432, docker-compose uses 5433) | P3 | Tasked → T-057 (Sprint 12 P3) |
| QA Obs 5 | Positive — Error handler correctly shields internal details | N/A | Acknowledged |
| QA Obs 8 | Positive — HttpOnly cookie auth backend is a solid security upgrade | N/A | Acknowledged |

---

#### What Went Well

- T-055 permanently resolves the recurring CORS port-drift pattern that blocked T-020 for 10 consecutive sprints — fixed `--port 4173` in `vite preview` script eliminates future drift
- T-052 care-type badges are a significant UX improvement praised by QA: "Watering: 2 days overdue" is immediately actionable where the previous unlabeled badges were not
- T-054 photo-removal fix resolves a genuine user dead-end with minimal code change (high impact/effort ratio)
- T-051 Monitor Agent stale credential fix means future health checks will work correctly without manual override
- T-053 backend implementation is textbook HttpOnly cookie auth: token rotation, revocation, cookie clearing on logout/account-delete, full CORS `credentials: true` support
- 72/72 backend tests, 117/117 frontend tests — both new high watermarks
- Pre-existing 429 flake in auth tests definitively resolved by moving rate-limit env vars before `require(app)`

---

#### What to Improve

- **Frontend Engineer must complete T-053 frontend half in Sprint #12 without exception.** Three handoffs (H-130, H-131, H-136) were sent in Sprint #11 and the work was never started. This is the only remaining code task for persistent login.
- **Auth 500 intermittent failure (FB-044) must be investigated at sprint start** before any user testing proceeds. The simplest likely fix is configuring `knex` pool `min: 1` to prevent cold-start connection failures.
- T-020 has now carried over **11 consecutive sprints**. Sprint #12 will gate T-020 strictly on T-056 Done AND T-053 frontend Done — no exceptions.
- Health endpoint documentation inconsistency should be corrected: `/api/health` (not `/api/v1/health`) in api-contracts.md and monitor health check templates.

---

#### Technical Debt Noted

| Item | Severity | Owner |
|------|----------|-------|
| Intermittent auth 500 on cold start (FB-044) | P0 | Backend/Deploy Engineer — Sprint 12 T-056 |
| T-053 frontend half incomplete — api.js still body-based refresh | P1 | Frontend Engineer — Sprint 12 carry-over |
| TEST_DATABASE_URL port inconsistency (.env 5432 vs docker-compose 5433) | P3 | Backend Engineer — Sprint 12 T-057 |
| Health endpoint route discrepancy (/api/health not /api/v1/health in docs) | P3 | QA/Deploy — Sprint 12 minor fix |
| Express 4 path-to-regexp ReDoS (FB-031/FB-037) | P3 Advisory | Backlog — Express 5 migration |

---

*Sprint #11 summary written by Manager Agent on 2026-03-30.*

---

### Sprint #12 — 2026-03-30 to 2026-03-30

**Sprint Goal:** Close out the MVP once and for all — fix the intermittent auth 500 (T-056, P0), complete the persistent login frontend half (T-053-frontend, P1), declare MVP complete via full end-to-end user testing (T-020, P0), and fix TEST_DATABASE_URL port inconsistency (T-057, P3).

**Outcome:** Complete — MVP officially declared complete. All four sprint tasks delivered and QA-verified. T-020 user testing completed by project owner. Deploy Verified: Yes (two independent Monitor Agent passes). Post-MVP development begins in Sprint #13.

---

#### Tasks Completed

| Task ID | Description |
|---------|-------------|
| T-056 | Backend Engineer: Fixed intermittent auth 500 on POST /api/v1/auth/login. Root cause: Knex tarn pool created connections lazily; first requests raced pool warm-up; idle connections reaped after 30s could also cause transient 500s. Fix: `afterCreate` connection validation hook in knexfile.js, `idleTimeoutMillis: 30000`, `reapIntervalMillis: 1000`, and explicit pool warm-up (concurrent SELECT 1 queries) in server.js before HTTP traffic accepted. 2 regression tests added (sequential + concurrent cold-start login). 74/74 backend tests pass. |
| T-053-frontend | Frontend Engineer: Completed api.js cookie migration. `credentials: 'include'` added to all 5 fetch call sites. `refreshToken` memory variable removed. `refreshAccessToken()` sends no body (cookie sent automatically). `auth.logout()` sends no body. Silent re-auth on app init in useAuth.jsx with loading state to prevent login-page flash. 13 new tests. 130/130 frontend tests pass. Build: 0 errors. |
| T-057 | Backend Engineer: Resolved TEST_DATABASE_URL port inconsistency. Kept port 5432 (correct for local dev, no Docker Postgres on 5433). Added clarifying comment in .env. Updated knexfile.js fallback URL to 5433 for future Docker setup. 74/74 tests pass. |
| T-020 | Project Owner: Completed full end-to-end MVP user testing — all 5 flows verified in browser. Flow 1 (Novice: register → add plant → mark care done → confetti) ✅. Flow 2 (AI advice: accept + reject flows) ✅. Flow 3 (Inventory management: edit schedule + delete plant) ✅. Care History (/history) ✅. Care Due Dashboard (/due — functional with timezone caveat FB-046) ✅. **MVP officially declared complete.** |

---

#### Tasks Carried Over to Sprint #13

None — all Sprint #12 tasks completed.

---

#### Verification Failures

**No sustained verification failures.** Deploy Verified: Yes on both Monitor Agent passes.

A transient 500 on the first POST /api/v1/auth/login call was observed by the Monitor Agent (FB-057). This is a **partial regression** from T-056: T-056 fixed cold-start 500s but did not address post-idle 500s where connections are reaped after 30 seconds of inactivity. The issue is self-healing (1–3 requests) and does not block staging testing, but represents a production risk. Tasked as T-058 (Sprint 13, P1).

---

#### Key Feedback Themes

| Feedback ID | Category | Severity | Disposition |
|-------------|----------|----------|-------------|
| FB-045 | Bug — Plant photo broken after upload and save | Major | Tasked → T-059 (Sprint 13 P1) |
| FB-046 | Bug — Care Due Dashboard UTC/local timezone mismatch | Major | Tasked → T-060 (Sprint 13 P1) |
| FB-047 | Positive — T-020 complete, MVP declared | N/A | Acknowledged |
| FB-048 | Positive — T-056 pool warm-up is well-engineered | N/A | Acknowledged |
| FB-049 | Positive — T-053-frontend cookie migration is thorough | N/A | Acknowledged |
| FB-050 | Bug — Flaky careDue test (pre-existing, P3) | P3 | Acknowledged — Backlog |
| FB-051 | Bug — npm audit 2 vulnerabilities (P3, fix available) | P3 | Acknowledged — T-061 (Sprint 13 P3) |
| FB-052 | Positive — Auth flow is production-quality | N/A | Acknowledged |
| FB-053 | Positive — Silent re-auth prevents login flash | N/A | Acknowledged |
| FB-054 | UX Issue — Gemini quota concern (resolved by FB-058) | Minor | Acknowledged |
| FB-055 | UX Issue — Long plant names, no max length | Cosmetic | Acknowledged — Backlog |
| FB-056 | Positive — Error handling is production-ready | N/A | Acknowledged |
| FB-057 | Monitor Alert — Transient 500 on post-idle pool reaping | Major | Tasked → T-058 (Sprint 13 P1) |
| FB-058 | Positive — Gemini AI now returning 200 OK | N/A | Acknowledged |

---

#### What Went Well

- **MVP is officially complete** — T-020 closed after 12 sprint cycles. All 5 user flows pass end-to-end in the browser. This is the most significant milestone of the project.
- T-056 cold-start fix is architecturally sound: defense-in-depth approach (afterCreate validation + idle timeouts + explicit pool warm-up before HTTP) with 2 regression tests providing ongoing coverage.
- T-053-frontend delivered cleanly this sprint after a two-sprint carry-over. The silent re-auth pattern with loading state is UX-correct and test-covered (13 new tests, 130/130 passing).
- Test suite grew to 74 backend / 130 frontend — new high watermarks for both.
- Deploy Verified: Yes on two independent Monitor Agent passes — staging environment is healthy.
- Gemini AI endpoint is active and returning correct responses (FB-058) — Flow 2 fully testable.
- QA product-perspective feedback (FB-048 through FB-056) demonstrates production-quality implementations across auth, error handling, and UX.

---

#### What to Improve

- **Pool idle reaping (T-058):** T-056 fixed cold-start 500s but the post-idle reaping case remains. `idleTimeoutMillis: 30000` is too aggressive for staging (connections reaped every 30s of inactivity). Sprint 13 must increase this or add a keepalive heartbeat.
- **Photo display bug (T-059):** Upload appears to succeed but photo_url is not browser-loadable — likely a static file serving or URL construction issue. Should have been caught before T-020.
- **Timezone bug on Care Due Dashboard (T-060):** UTC vs local timezone mismatch causes wrong urgency bucketing. The backend should accept timezone context from the frontend when computing day boundaries.

---

#### Technical Debt Noted

| Item | Severity | Owner | Sprint |
|------|----------|-------|--------|
| Pool idle reaping causes transient 500 on /auth/login after 30s inactivity (FB-057) | P1 | Backend Engineer | 13 — T-058 |
| Plant photo broken after upload — photo_url not browser-loadable (FB-045) | P1 | Backend Engineer | 13 — T-059 |
| Care Due Dashboard UTC/local timezone mismatch (FB-046) | P1 | Backend + Frontend Engineers | 13 — T-060 |
| npm audit 2 vulnerabilities — `npm audit fix` available (FB-051) | P3 | Backend Engineer | 13 — T-061 |
| Flaky careDue test — "should handle never-done plants" socket hang up (FB-050) | P3 | Backend Engineer | Backlog |
| Long plant name — no max length validation on POST /plants (FB-055) | Cosmetic | Backend Engineer | Backlog |
| Health endpoint docs discrepancy (/api/health not /api/v1/health in api-contracts.md) | P3 | QA/Deploy | 13 — T-062 |

---

*Sprint #12 summary written by Manager Agent on 2026-03-30.*

---

### Sprint #13 — 2026-03-31 to 2026-04-04

**Sprint Goal:** Fix three critical post-MVP bugs from user testing (T-058 pool idle 500, T-059 broken plant photo, T-060 Care Due timezone), run dependency housekeeping (T-061), fix health endpoint docs (T-062), and begin the first post-MVP feature — dark mode (T-063).

**Outcome:** Not Started — Sprint #13 was fully planned and all tasks were assigned, but the sprint cycle did not execute. All six tasks remain at Backlog status with no code changes produced. All tasks carry over to Sprint #14 with unchanged priority and scope.

---

#### Tasks Completed

None. Sprint #13 produced no code changes.

---

#### Tasks Carried Over to Sprint #14

| Task ID | Description | Reason |
|---------|-------------|--------|
| T-058 | Backend: Fix pool idle reaping causing transient 500 on POST /api/v1/auth/login (P1) | Sprint did not execute |
| T-059 | Backend: Fix plant photo broken after upload and save (P1) | Sprint did not execute |
| T-060 | Backend + Frontend: Fix Care Due Dashboard UTC/local timezone mismatch (P1) | Sprint did not execute |
| T-061 | Backend + Frontend: npm audit fix — resolve non-breaking vulnerabilities (P3) | Sprint did not execute |
| T-062 | QA/Docs: Fix health endpoint documentation discrepancy (P3) | Sprint did not execute |
| T-063 | Design + Frontend: Implement dark mode — B-005 (P2) | Sprint did not execute |

---

#### Verification Failures

None — no staging deploy was attempted in Sprint #13.

---

#### Key Feedback Themes

- No new feedback was filed in Sprint #13.
- All Sprint #12 feedback (FB-045 through FB-058) was already triaged as Acknowledged or Tasked in Sprint #12.

---

#### What Went Well

- Sprint #13 plan was detailed and technically precise — root causes documented, fix locations identified, acceptance criteria specific. The plan requires no revision for Sprint #14.
- All task dependencies and blocked-by relationships remain valid and correctly documented.
- Staging environment from Sprint #12 remains healthy (Deploy Verified: Yes, two Monitor Agent passes).

---

#### What to Improve

- Sprint #13 did not execute — the orchestrator should confirm agent availability before committing to a sprint plan.
- Three P1 bug fixes (T-058, T-059, T-060) directly impact production readiness and have been pending since Sprint #12 user testing. Sprint #14 must treat these as absolute P0 with zero tolerance for further carry-over.

---

#### Technical Debt Noted

| Item | Severity | Owner | Sprint |
|------|----------|-------|--------|
| Pool idle reaping causes transient 500 on /auth/login after 30s inactivity (FB-057) | P1 | Backend Engineer | 14 — T-058 |
| Plant photo broken after upload — photo_url not browser-loadable (FB-045) | P1 | Backend Engineer | 14 — T-059 |
| Care Due Dashboard UTC/local timezone mismatch (FB-046) | P1 | Backend + Frontend Engineers | 14 — T-060 |
| npm audit 2 vulnerabilities — `npm audit fix` available (FB-051) | P3 | Backend Engineer | 14 — T-061 |
| Health endpoint docs discrepancy (/api/health not /api/v1/health in api-contracts.md) | P3 | QA/Deploy | 14 — T-062 |
| Dark mode not yet implemented (B-005) | P2 | Design Agent + Frontend Engineer | 14 — T-063 |

---

*Sprint #13 summary written by Manager Agent on 2026-03-30.*

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
