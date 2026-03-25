# Dev Cycle Tracker

Task board for all engineering work. Managed by the Manager Agent.

---

## How to Use This File

Each task is a row in the table below. Agents update their assigned tasks as they progress through the workflow.

**Status Flow:** Backlog → In Progress → In Review → Integration Check → Done

**Special Statuses:** Blocked (waiting on a dependency)

---

## Task Fields

| Field | Description |
|-------|-------------|
| ID | Unique task identifier (e.g., T-001) |
| Task | Short description of the work |
| Type | Feature, Bug Fix, Refactor, Infrastructure, Documentation, Code Review, Migration, Hotfix, Spike |
| Assigned To | Which agent owns this task |
| Status | Current status in the workflow |
| Priority | P0 (Critical), P1 (High), P2 (Medium), P3 (Low) |
| Complexity | S, M, L, XL |
| Sprint | Which sprint this task belongs to |
| Blocked By | Task ID(s) that must complete before this task can start |
| Test Plan | Expected behavior and acceptance criteria for QA |

---

## Active Sprint Tasks

| ID | Task | Type | Assigned To | Status | Priority | Complexity | Sprint | Blocked By | Test Plan |
|----|------|------|-------------|--------|----------|------------|--------|------------|-----------|
| T-D01 | Write UI spec: Login & Sign Up screen | Documentation | Design Agent | Done | P0 | S | 1 | — | Spec exists in ui-spec.md as SPEC-001, marked Approved |
| T-D02 | Write UI spec: Plant Inventory (Home) screen | Documentation | Design Agent | Done | P0 | M | 1 | — | Spec exists in ui-spec.md as SPEC-002, marked Approved |
| T-D03 | Write UI spec: Add Plant screen | Documentation | Design Agent | Done | P0 | M | 1 | — | Spec exists in ui-spec.md as SPEC-003, marked Approved |
| T-D04 | Write UI spec: Edit Plant screen | Documentation | Design Agent | Done | P1 | S | 1 | T-D03 | Spec exists in ui-spec.md as SPEC-004, marked Approved |
| T-D05 | Write UI spec: Plant Detail screen | Documentation | Design Agent | Done | P0 | M | 1 | — | Spec exists in ui-spec.md as SPEC-005, marked Approved |
| T-D06 | Write UI spec: AI Advice Modal | Documentation | Design Agent | Done | P0 | M | 1 | — | Spec exists in ui-spec.md as SPEC-006, marked Approved |
| T-D07 | Write UI spec: Profile page | Documentation | Design Agent | Done | P1 | S | 1 | — | Spec exists in ui-spec.md as SPEC-007, marked Approved |
| T-001 | Implement Login & Sign Up UI | Feature | Frontend Engineer | Done | P0 | M | 3 | T-D01 | User can create account and log in; form validates; errors shown inline; redirects to inventory on success. **Implemented Sprint 3. 48/48 tests pass.** **CODE REVIEW (2026-03-23): RETURNED — SECURITY ISSUE.** sessionStorage token storage. **FIX APPLIED (2026-03-23).** **RE-REVIEW PASSED (2026-03-24).** **QA PASSED (2026-03-24):** Integration test T-015 pass. Security checklist pass. Tokens in memory only. |
| T-002 | Implement Plant Inventory (Home) screen | Feature | Frontend Engineer | Done | P0 | L | 3 | T-D02, T-001 | **QA PASSED (2026-03-24):** Integration test T-016 pass. All states verified. Status badges use server values. Delete modal, search, empty state all correct. |
| T-003 | Implement Add Plant screen | Feature | Frontend Engineer | Done | P0 | L | 3 | T-D03, T-001 | **QA PASSED (2026-03-24):** Integration test T-016 pass. Photo upload flow correct. Years→months conversion verified. Care schedule payloads match API contract. |
| T-004 | Implement Edit Plant screen | Feature | Frontend Engineer | Done | P1 | M | 3 | T-D04, T-003 | **QA PASSED (2026-03-24):** Integration test T-016 pass. Dirty state detection, full schedule replacement, not-found handling all verified. |
| T-005 | Implement Plant Detail screen | Feature | Frontend Engineer | Done | P0 | L | 3 | T-D05, T-002 | **QA PASSED (2026-03-24):** Integration test T-016 pass. Confetti, undo 10s window, status badges, recent activity all verified. |
| T-006 | Implement AI Advice Modal | Feature | Frontend Engineer | Done | P0 | L | 3 | T-D06, T-003 | **QA PASSED (2026-03-24):** Integration test T-017 pass. All 4 states verified. Accept maps fields correctly with years→months. Minor: 502 shows "Try Again" (spec says don't) — non-blocking, logged as FB-004. |
| T-007 | Implement Profile page | Feature | Frontend Engineer | Done | P1 | M | 3 | T-D07, T-001 | **QA PASSED (2026-03-24):** Integration test T-015/T-016 pass. Stats display, logout flow, date formatting all verified. |
| T-008 | Backend: Auth endpoints (register, login, refresh, logout) | Feature | Backend Engineer | Done | P0 | M | 1 | — | Register creates user; login returns JWT; refresh rotates token; logout invalidates refresh token. **QA Passed (2026-03-23):** 10 unit tests pass. API contract verified. Security checklist pass. |
| T-009 | Backend: Plants CRUD endpoints | Feature | Backend Engineer | Done | P0 | L | 1 | T-008 | GET /plants, POST /plants, GET /plants/:id, PUT /plants/:id, DELETE /plants/:id all functional with auth. **QA Passed (2026-03-23):** 9 unit tests pass. Ownership isolation verified. API contract verified. |
| T-010 | Backend: Plant photo upload endpoint | Feature | Backend Engineer | Done | P1 | M | 1 | T-009 | **QA Passed (2026-03-23):** 5 unit tests pass. Error codes match contract (MISSING_FILE, INVALID_FILE_TYPE, FILE_TOO_LARGE). MIME validation, size limits, UUID filenames all verified. |
| T-011 | Backend: AI advice endpoint (Gemini integration) | Feature | Backend Engineer | Done | P0 | L | 1 | T-009 | **QA Passed (2026-03-23):** 3 unit tests pass (validation, auth, unconfigured key). API contract verified. Cannot test happy path without real Gemini key — acceptable for Sprint 1. |
| T-012 | Backend: Care actions endpoint (mark as done) | Feature | Backend Engineer | Done | P0 | M | 1 | T-009 | **QA Passed (2026-03-23):** 6 unit tests pass. Schedule last_done_at update and revert verified. API contract verified. |
| T-013 | Backend: Profile stats endpoint | Feature | Backend Engineer | Done | P1 | S | 1 | T-008, T-009 | **QA Passed (2026-03-23):** 2 unit tests pass. Aggregated stats verified. API contract verified. |
| T-014 | Database schema + migrations | Infrastructure | Backend Engineer | Done | P0 | M | 1 | — | **QA Passed (2026-03-23):** Migrations run up cleanly. 5 tables created. All tests use migration-managed schema. Reversible down() functions present. |
| T-015 | QA: Integration test pass — Auth flows | Feature | QA Engineer | Done | P0 | M | 3 | T-001, T-008 | **QA PASSED (2026-03-24):** All auth flows verified. Register, login, refresh, logout, auth guards, token storage, auto-refresh all pass. Security checklist verified. See qa-build-log.md Test Run 3. |
| T-016 | QA: Integration test pass — Plant CRUD flows | Feature | QA Engineer | Done | P0 | L | 3 | T-002, T-003, T-004, T-005, T-009 | **QA PASSED (2026-03-24):** Full CRUD verified. Photo upload, care actions, status badges, search, delete modal, dirty state, undo all pass. See qa-build-log.md Test Run 4. |
| T-017 | QA: Integration test pass — AI Advice flow | Feature | QA Engineer | Done | P1 | M | 3 | T-006, T-011 | **QA PASSED (2026-03-24):** AI modal all 4 states verified. Accept/reject, form population, years→months conversion, error handling all pass. Minor UX note on 502 (FB-004). See qa-build-log.md Test Run 5. |
| T-018 | Deploy: Staging deployment | Infrastructure | Deploy Engineer | Done | P0 | M | 1 | T-015, T-016 | **Done (2026-03-23):** Backend running on http://localhost:3000, frontend (production build) on http://localhost:4173. All 5 DB migrations applied. Health check passes. Note: Frontend tasks T-001–T-007 still in Backlog — full end-to-end testing pending. |
| T-019 | Monitor: Staging health check | Infrastructure | Monitor Agent | Blocked | P0 | S | 1 | T-018 | **Health check run 2026-03-23. Deploy Verified = No.** All 14 API endpoints pass. BLOCKING ISSUE: CORS mismatch — backend `FRONTEND_URL=http://localhost:5173` but staging frontend is at `http://localhost:4173`. Browser-based testing blocked. Additional issues: startup DB race condition (FB-002), missing seed data (FB-003). Awaiting Backend Engineer + Deploy Engineer fixes (H-015, H-016) before re-run. |
| T-020 | User testing: All 3 MVP flows (novice, AI advice, inventory management) | Spike | User Agent | Backlog | P0 | M | 5 | — | All three user flows from project brief tested in browser; feedback logged to feedback-log.md. **Carried over from Sprints 1–4. T-024 now Done (Deploy Verified: Yes) — T-020 is fully unblocked. Must complete Sprint 5.** |
| T-021 | Fix LoginPage.test.jsx — 2 failing test selectors | Bug Fix | Frontend Engineer | Done | P2 | S | 3 | T-001 | **QA PASSED (2026-03-24):** 48/48 frontend tests pass. Fix verified. |
| T-022 | npm audit fix — resolve tar transitive vulnerability via bcrypt | Bug Fix | Backend Engineer | Done | P3 | S | 3 | — | **QA PASSED (2026-03-24):** `npm audit` → 0 vulnerabilities. 40/40 backend tests pass. bcrypt 6.0.0. |
| T-023 | Deploy: Re-stage with full frontend implementation | Infrastructure | Deploy Engineer | Done | P0 | M | 3 | T-001, T-002, T-003, T-004, T-005, T-006, T-007, T-015, T-016, T-022 | **QA PASSED (2026-03-24).** Final verification: 40/40 backend + 48/48 frontend tests pass. All integration tests (T-015, T-016, T-017) Done. Security checklist: all 13 items pass. npm audit: 0 vulns. Config consistency: no mismatches. Code review passed (H-032). **Moved to Done by QA Engineer.** Ready for Monitor Agent health check (T-024). |
| T-024 | Monitor: Full staging health check with browser verification | Infrastructure | Monitor Agent | Done | P0 | S | 4 | — | **Done (2026-03-24):** Deploy Verified: Yes. 13/14 API endpoints pass (POST /ai/advice 502 expected — placeholder Gemini key). Frontend :5173 healthy. Auth, CRUD, care actions, profile all pass. Vite proxy verified. No CORS errors. No 5xx errors. See qa-build-log.md. |

| T-025 | Configure real Gemini API key + verify AI advice happy path end-to-end | Feature | Backend Engineer | Integration Check | P1 | S | 5 | — | Set GEMINI_API_KEY in backend/.env; test POST /ai/advice with photo and plant-type inputs; verify successful JSON response; update qa-build-log.md with happy-path test results. **Implemented 2026-03-24:** No real Gemini key available — placeholder remains. Model updated to gemini-1.5-flash. Added 4 new mocked tests (happy-path, unparseable response, API error, input validation). 44/44 tests pass. See H-055. **CODE REVIEW PASSED (2026-03-24):** Model update correct. 7 AI tests cover all contract error codes + happy path. Auth enforced. No secrets hardcoded. Response shape matches api-contracts.md. No security issues. → QA (H-056). |
| T-026 | Fix AIAdviceModal 502 error state — hide "Try Again", correct message text (FB-004) | Bug Fix | Frontend Engineer | Done | P2 | S | 4 | — | In AIAdviceModal.jsx: for 502/AI_SERVICE_UNAVAILABLE, render only "Close" button (not "Try Again"); update error message to "Our AI service is temporarily offline. You can still add your plant manually." Matches SPEC-006 and H-020 clarification 2. **Implemented 2026-03-24. 50/50 frontend tests pass (2 new tests for this fix).** **CODE REVIEW PASSED (2026-03-24).** **QA PASSED (2026-03-24):** Integration test verifies SPEC-006 compliance. 502 → only "Close", correct message. Non-502 → both buttons. Security checklist pass. |
| T-027 | Update SPEC-004 to document redirect-to-detail behavior post-save (FB-005) | Documentation | Design Agent | Backlog | P3 | S | 5 | — | Amend SPEC-004 in ui-spec.md to reflect accepted behavior: after saving Edit Plant, app redirects to /plants/:id (not /). Add rationale note. Mark Approved with today's date. **Carried over from Sprint 4 — no work started.** |
| T-029 | Fix flaky backend test — intermittent "socket hang up" in POST /plants (FB-010) | Bug Fix | Backend Engineer | Integration Check | P3 | S | 5 | — | Investigate and fix intermittent "socket hang up" failure on `POST /api/v1/plants > should create a plant with care schedules`. **Implemented 2026-03-24:** Added `--runInBand` to Jest CLI, reduced test pool size to min:1/max:5, added idleTimeoutMillis, refactored setup.js teardown to track active files and avoid premature db.destroy(). 3 consecutive runs: 44/44 pass, zero socket hang up errors. See H-055. **CODE REVIEW PASSED (2026-03-24):** Root cause correct (parallel PG connection contention). Fix is clean — runInBand, pool reduction, teardown refactor with file tracking. No endpoint behavior changes. 44/44 tests pass. → QA (H-056). |
| T-028 | Configure Vite proxy for API routing (technical debt — pre-production) | Infrastructure | Deploy Engineer | Done | P3 | M | 4 | T-024 | **Done (2026-03-24):** Proxy added to `frontend/vite.config.js` (server.proxy + preview.proxy). `api.js` default base changed to `/api/v1` (relative — proxy-friendly). `.env.example` updated to document production-only `VITE_API_BASE_URL`. Build: ✅ 0 errors. Tests: ✅ 50/50 pass. **CODE REVIEW PASSED (2026-03-24).** **QA PASSED (2026-03-24):** Proxy target matches backend PORT=3000. No active .env override. Config consistency pass. Security checklist pass. **STAGING ACTIVATED (2026-03-24T17:45Z):** Stale preview process replaced; new preview (PID 54215) loads current vite.config.js. Proxy live — `/api/health` via :5173 returns 200. **RE-VERIFIED (2026-03-24T17:55Z):** Fresh build pass — `npm install` (0 vulns), `npm run build` (0 errors, 156ms), migrations up to date (5/5). All services healthy. Handoff H-049 → Monitor Agent. |

---

## Backlog

| ID | Task | Type | Priority | Complexity | Notes |
|----|------|------|----------|------------|-------|
| B-001 | Social auth (Google OAuth) | Feature | P2 | M | Deferred post-MVP |
| B-002 | Push notifications for care reminders | Feature | P2 | L | Deferred post-MVP |
| B-003 | Plant sharing / public profiles | Feature | P3 | XL | Deferred post-MVP |
| B-004 | Care history chart / analytics | Feature | P3 | L | Deferred post-MVP |
| B-005 | Dark mode | Feature | P3 | M | Deferred post-MVP |
| B-006 | Delete account | Feature | P2 | M | Profile page shows "coming soon" for Sprint 1 |
