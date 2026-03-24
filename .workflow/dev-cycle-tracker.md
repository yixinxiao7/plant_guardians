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
| T-020 | User testing: Sprint 3 flows | Spike | User Agent | Backlog | P0 | M | 3 | T-024 | All three user flows from project brief tested in browser; feedback logged to feedback-log.md. **Carried over from Sprint 1 & 2; unblocked once T-024 (staging health check) passes.** |
| T-021 | Fix LoginPage.test.jsx — 2 failing test selectors | Bug Fix | Frontend Engineer | Done | P2 | S | 3 | T-001 | **QA PASSED (2026-03-24):** 48/48 frontend tests pass. Fix verified. |
| T-022 | npm audit fix — resolve tar transitive vulnerability via bcrypt | Bug Fix | Backend Engineer | Done | P3 | S | 3 | — | **QA PASSED (2026-03-24):** `npm audit` → 0 vulnerabilities. 40/40 backend tests pass. bcrypt 6.0.0. |
| T-023 | Deploy: Re-stage with full frontend implementation | Infrastructure | Deploy Engineer | Done | P0 | M | 3 | T-001, T-002, T-003, T-004, T-005, T-006, T-007, T-015, T-016, T-022 | **QA PASSED (2026-03-24).** Final verification: 40/40 backend + 48/48 frontend tests pass. All integration tests (T-015, T-016, T-017) Done. Security checklist: all 13 items pass. npm audit: 0 vulns. Config consistency: no mismatches. Code review passed (H-032). **Moved to Done by QA Engineer.** Ready for Monitor Agent health check (T-024). |
| T-024 | Monitor: Full staging health check with browser verification | Infrastructure | Monitor Agent | In Progress | P0 | S | 3 | T-023 | All 14 API endpoints pass; frontend loads at :5173 (or :4173 if reclaimed); auth flow completes in browser; no CORS errors; Deploy Verified: Yes. Note: frontend is currently serving at http://localhost:5173 (port change from :4173 — see H-027). **Deploy Engineer: Staging re-verified 2026-03-24T14:44:00Z (H-034). Backend :3000 ✅, Frontend :5173 ✅, 5 migrations applied ✅. Monitor Agent triggered.** |

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
