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
| T-001 | Implement Login & Sign Up UI | Feature | Frontend Engineer | Backlog | P0 | M | 1 | T-D01 | User can create account and log in; form validates; errors shown inline; redirects to inventory on success |
| T-002 | Implement Plant Inventory (Home) screen | Feature | Frontend Engineer | Backlog | P0 | L | 1 | T-D02, T-001 | Plants displayed in grid; status badges correct; empty state shown; delete modal works; search filters client-side |
| T-003 | Implement Add Plant screen | Feature | Frontend Engineer | Backlog | P0 | L | 1 | T-D03, T-001 | Plant created via form; photo upload works; AI advice button triggers modal; success redirects to inventory |
| T-004 | Implement Edit Plant screen | Feature | Frontend Engineer | Backlog | P1 | M | 1 | T-D04, T-003 | Form pre-populated; changes save correctly; dirty-state detection disables Save until change made |
| T-005 | Implement Plant Detail screen | Feature | Frontend Engineer | Backlog | P0 | L | 1 | T-D05, T-002 | Care schedule status badges render correctly; "Mark as done" triggers confetti animation and updates state |
| T-006 | Implement AI Advice Modal | Feature | Frontend Engineer | Backlog | P0 | L | 1 | T-D06, T-003 | Modal opens; accepts photo or text; loading states shown; AI results display; Accept fills form fields |
| T-007 | Implement Profile page | Feature | Frontend Engineer | Backlog | P1 | M | 1 | T-D07, T-001 | Profile shows user name, email, member since date, plant count, care actions count; logout works |
| T-008 | Backend: Auth endpoints (register, login, refresh, logout) | Feature | Backend Engineer | Done | P0 | M | 1 | — | Register creates user; login returns JWT; refresh rotates token; logout invalidates refresh token. **QA Passed (2026-03-23):** 10 unit tests pass. API contract verified. Security checklist pass. |
| T-009 | Backend: Plants CRUD endpoints | Feature | Backend Engineer | Done | P0 | L | 1 | T-008 | GET /plants, POST /plants, GET /plants/:id, PUT /plants/:id, DELETE /plants/:id all functional with auth. **QA Passed (2026-03-23):** 9 unit tests pass. Ownership isolation verified. API contract verified. |
| T-010 | Backend: Plant photo upload endpoint | Feature | Backend Engineer | Done | P1 | M | 1 | T-009 | **QA Passed (2026-03-23):** 5 unit tests pass. Error codes match contract (MISSING_FILE, INVALID_FILE_TYPE, FILE_TOO_LARGE). MIME validation, size limits, UUID filenames all verified. |
| T-011 | Backend: AI advice endpoint (Gemini integration) | Feature | Backend Engineer | Done | P0 | L | 1 | T-009 | **QA Passed (2026-03-23):** 3 unit tests pass (validation, auth, unconfigured key). API contract verified. Cannot test happy path without real Gemini key — acceptable for Sprint 1. |
| T-012 | Backend: Care actions endpoint (mark as done) | Feature | Backend Engineer | Done | P0 | M | 1 | T-009 | **QA Passed (2026-03-23):** 6 unit tests pass. Schedule last_done_at update and revert verified. API contract verified. |
| T-013 | Backend: Profile stats endpoint | Feature | Backend Engineer | Done | P1 | S | 1 | T-008, T-009 | **QA Passed (2026-03-23):** 2 unit tests pass. Aggregated stats verified. API contract verified. |
| T-014 | Database schema + migrations | Infrastructure | Backend Engineer | Done | P0 | M | 1 | — | **QA Passed (2026-03-23):** Migrations run up cleanly. 5 tables created. All tests use migration-managed schema. Reversible down() functions present. |
| T-015 | QA: Integration test pass — Auth flows | Feature | QA Engineer | Backlog | P0 | M | 1 | T-001, T-008 | All auth flows tested end-to-end; security checklist items for auth verified |
| T-016 | QA: Integration test pass — Plant CRUD flows | Feature | QA Engineer | Backlog | P0 | L | 1 | T-002, T-003, T-004, T-005, T-009 | Plant create/read/update/delete tested end-to-end |
| T-017 | QA: Integration test pass — AI Advice flow | Feature | QA Engineer | Backlog | P1 | M | 1 | T-006, T-011 | AI advice flow tested with photo and text input; accept/reject behavior verified |
| T-018 | Deploy: Staging deployment | Infrastructure | Deploy Engineer | Backlog | P0 | M | 1 | T-015, T-016 | App deployed to staging; both frontend and backend accessible |
| T-019 | Monitor: Staging health check | Infrastructure | Monitor Agent | Backlog | P0 | S | 1 | T-018 | All endpoints return expected responses; no errors in logs |
| T-020 | User testing: Sprint 1 flows | Spike | User Agent | Backlog | P0 | M | 1 | T-019 | All three user flows from project brief tested; feedback logged to feedback-log.md |

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
