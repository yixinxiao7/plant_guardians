# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #12 — 2026-03-30 to 2026-04-03

**Sprint Goal:** Close out the MVP once and for all. Fix the intermittent auth 500 (T-056, P0), complete the persistent login frontend half (T-053-frontend, P1), and execute full end-to-end user testing to formally declare MVP complete (T-020, P0 — absolute hard gate). No new features until MVP is declared.

**Context:** Sprint #11 delivered four engineering tasks (T-055, T-052, T-054, T-051 — all Done) and the T-053 backend half. Two critical items remain open: (1) T-053 frontend half was never completed by the Frontend Engineer despite three explicit handoffs (H-130, H-131, H-136); (2) Monitor Agent returned Deploy Verified: No due to intermittent HTTP 500 on POST /api/v1/auth/login (FB-044 — suspected Knex pool cold-start), which blocks T-020. Sprint #12 starts with T-056 as the immediate P0 action, T-053-frontend as parallel P1 work, and T-020 as the absolute hard gate — the sprint will not close until MVP is declared.

---

## In Scope

### P0 — Auth 500 Fix (Must Complete Before T-020 Can Begin)

- [ ] **T-056** — Backend Engineer: Fix intermittent auth 500 on POST /api/v1/auth/login (FB-044) **(P0, start immediately)**
  - **Acceptance Criteria:**
    - Root cause identified (error log evidence: stack trace or DB pool exhaustion message)
    - If DB pool cold-start: `knex` pool `min` configured to `1` in `backend/src/db.js` or knexfile so at least one connection is kept alive
    - If cookie-parser race: registration order in `app.js` verified and corrected if needed
    - Cold-start regression test added (restart backend → immediately run POST /auth/login → expect 200 consistently)
    - Backend tested: restart backend → immediately call POST /auth/login 5 times in rapid succession → 5/5 return 200 (no 500s)
    - All 72/72 backend tests still pass after fix
  - **Dependencies:** None — start immediately.
  - **Fix locations:** `backend/src/db.js` or `backend/knexfile.js` (pool config), possibly `backend/src/app.js` (middleware order)

---

### P1 — Persistent Login Frontend (Begin Immediately, Parallel to T-056)

- [ ] **T-053-frontend** — Frontend Engineer: Complete api.js cookie migration for HttpOnly refresh token auth (carry-over from Sprint 11) **(P1)**
  - **Acceptance Criteria:**
    - `frontend/src/utils/api.js`: all fetch calls that send auth tokens include `credentials: 'include'`
    - `refreshToken` memory variable removed; `setTokens()` / `clearTokens()` no longer manage refresh token in memory
    - `refreshAccessToken()` calls `POST /api/v1/auth/refresh` with no body (token read from cookie by backend); reads new `access_token` from response body only
    - `auth.logout()` calls `POST /api/v1/auth/logout` with no body (cookie sent automatically)
    - Silent re-auth on app init: on startup, call `POST /api/v1/auth/refresh` before rendering protected routes; on success, set access token in memory and render app; on failure, redirect to `/login`
    - After a hard page refresh, user remains logged in without seeing login screen (if session still valid — refresh token cookie present)
    - Unit tests added covering: silent refresh on init (success and failure paths), logout clears access token, 401 on expired access token triggers refresh
    - All 117/117 frontend tests still pass
  - **Dependencies:** None — can start immediately. T-053 backend is already live.
  - **Files:** `frontend/src/utils/api.js`, `frontend/src/hooks/useAuth.jsx`
  - **See:** H-130, H-131, H-136 for complete change requirements

---

### P0 — MVP Completion Gate (Absolute Priority — Sprint Cannot Close Without This)

- [ ] **T-020** — User Agent / Project Owner: User testing — all 3 MVP flows + Care History + Care Due Dashboard **(P0 — absolute hard gate)**
  - **Acceptance Criteria:** All three flows from `project-brief.md` tested end-to-end in a browser on staging (http://localhost:4175).
    - **Flow 1 (Novice):** register → add plant with watering schedule (test fertilizing + repotting expand) → view inventory → navigate to plant detail → mark care done → confetti animation plays. Verify care type badges on inventory card show correct labels (T-052).
    - **Flow 2 (AI advice):** upload photo or enter plant type → get AI advice (Gemini fallback chain live per T-048) → verify modal shows advice → accept → form populated. Also verify reject flow.
    - **Flow 3 (Inventory management):** edit care schedule including changing last-watered date → save → view changes. Delete a plant → confirm modal → plant removed.
    - **Care History:** navigate to `/history` → verify care actions from Flows 1–3 appear, filter by plant works, pagination works.
    - **Care Due Dashboard:** navigate to `/due` → verify urgency sections correct → use "Mark as done" shortcut → item removed optimistically → focus moves to next button (T-050 fix) → sidebar badge updates.
    - **Persistent login:** after completing any flow, do a hard page refresh → user remains logged in (T-053 end-to-end, requires T-053-frontend Done).
    - **Photo removal:** edit a plant, remove its photo, verify Save button enables (T-054 fix).
    - All observations logged to `feedback-log.md` with Status: New. No P0 blocking errors.
  - **Dependencies:** T-056 (auth 500 fix) AND T-053-frontend (api.js) must both be Done before T-020 begins.
  - **Hard rule:** This is the twelfth and final carry-over. Sprint 12 will not close until T-020 is Done.

---

### P3 — Minor Technical Debt (Can Begin Any Time)

- [ ] **T-057** — Backend Engineer: Fix TEST_DATABASE_URL port inconsistency in backend/.env **(P3)**
  - **Acceptance Criteria:** `backend/.env` `TEST_DATABASE_URL` updated to use port 5433 (matching `docker-compose.yml` test postgres service and `.env.example`). All 72/72 backend tests still pass after change.
  - **Dependencies:** None.
  - **Fix location:** `backend/.env` line containing TEST_DATABASE_URL

---

## Out of Scope

- Social auth (Google OAuth) — B-001 — post-MVP
- Push notifications for care reminders — B-002 — post-MVP
- Plant sharing / public profiles — B-003 — post-MVP
- Care history chart / analytics — B-004 — post-MVP
- Dark mode — B-005 — post-MVP
- Express 5 migration — advisory backlog; no fix available without breaking changes
- Production deployment execution (runbook exists; awaits project owner SSL certs)
- Email notification reminders
- Any new API endpoints or screens beyond current set
- Health endpoint docs cleanup (/api/health vs /api/v1/health) — deferred to Sprint 13

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Backend Engineer | Fix auth 500 + TEST_DATABASE_URL | T-056 (P0, start immediately), T-057 (P3) |
| Frontend Engineer | Complete T-053 frontend half | T-053-frontend (P1, start immediately) |
| User Agent / Project Owner | End-to-end MVP testing | T-020 (P0, begin after T-056 + T-053-frontend Done) |
| QA Engineer | Verify T-056 fix, T-053-frontend, T-020 sign-off | On-demand |
| Deploy Engineer | Re-deploy with T-053-frontend changes; post-deploy verification | After T-053-frontend QA-passes |
| Monitor Agent | Post-deploy health check; verify auth 500 resolved | After Deploy Engineer re-deploy |
| Design Agent | No tasks this sprint | — |
| Manager | Sprint coordination, T-020 closeout, MVP declaration | Ongoing |

---

## Dependency Chain (Critical Path)

```
T-056 (Auth 500 fix — P0, START IMMEDIATELY)
T-053-frontend (api.js cookie migration — P1, START IMMEDIATELY, parallel)
  ↓ (both must be Done)
T-020 (User testing — P0, begin after T-056 AND T-053-frontend Done)
  ↓
MVP declared complete

[Parallel — no T-020 dependency, can start now]
T-057 (TEST_DATABASE_URL fix — P3, no dependencies)
```

**Critical path:** T-056 ∥ T-053-frontend → T-020 → MVP declared.

---

## Definition of Done

Sprint #12 is complete when:

- [ ] T-056: Auth 500 root cause identified and fixed; backend restart → 5/5 immediate login calls return 200; 72/72 backend tests pass
- [ ] T-053-frontend: api.js updated for cookie-based refresh; silent re-auth on app init; page refresh does not force re-login; 117/117 frontend tests pass
- [ ] T-020: All 3 flows + Care History + Care Due Dashboard + persistent login tested in-browser; no P0 blocking errors; feedback logged; **MVP officially declared complete**
- [ ] T-057: TEST_DATABASE_URL uses port 5433; 72/72 backend tests pass
- [ ] No regressions: all backend + frontend tests at or above Sprint 11 counts (72/72 backend, 117/117 frontend)
- [ ] Deploy Verified: Yes from Monitor Agent post-deploy health check
- [ ] Feedback from T-020 triaged by Manager Agent

---

## Success Criteria

- **MVP formally declared complete** — T-020 closed, all 3 flows + Care History + Care Due Dashboard + persistent login verified end-to-end in a real browser
- **Auth reliability confirmed** — POST /auth/login returns 200 consistently even on cold start after backend restart
- **Session persistence end-to-end** — users remain logged in after hard page refresh (HttpOnly cookie pattern working from browser to backend)
- **Deploy Verified: Yes** — Monitor Agent health check passes with no 5xx errors
- **No regressions** — all tests at or above Sprint 11 baselines

---

## Blockers

- **T-056 is a P0 gate for T-020.** Intermittent auth 500 must be resolved first.
- **T-053-frontend is a P1 gate for T-020.** Broken refresh flow would log users out mid-test (access token expires in 15 min). Frontend Engineer must complete this sprint without exception — this is the third sprint where this work is expected.
- T-057 has no blockers.

---

*Sprint #12 plan written by Manager Agent on 2026-03-30.*
