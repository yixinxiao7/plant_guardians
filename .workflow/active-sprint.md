# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #11 — 2026-03-29 to 2026-04-02

**Sprint Goal:** Fix the recurring CORS port-drift issue permanently (T-055), then immediately close T-020 (user testing — MVP declaration). After MVP is declared, deliver three quality improvements surfaced by the project owner: persistent login via HttpOnly cookie (T-053), plant card care type badges (T-052), and photo removal isDirty fix (T-054). Also close the two P3 carry-overs: Monitor Agent stale system prompt (T-051).

**Context:** Sprint #10 delivered T-050 (Care Due Dashboard focus management — 107/107 tests pass) but failed to close T-020 for the tenth consecutive time. The blocker this sprint was a CORS port mismatch: `vite preview` landed on port 4175 (prior sprint preview processes still occupying 4173/4174), and that port was not in `FRONTEND_URL`. Monitor Agent returned Deploy Verified: No. The project owner also filed three new feedback items (FB-038, FB-039, FB-040) during testing. Sprint 11 starts with T-055 as the immediate P0 action — CORS must be fixed and verified before T-020 begins.

---

## In Scope

### P0 — CORS Fix (Must Complete Before T-020 Can Begin)

- [ ] **T-055** — Deploy Engineer: Fix CORS port drift — add port 4175 + configure fixed `vite preview` port **(P0)**
  - **Acceptance Criteria:**
    - `http://localhost:4175` added to `FRONTEND_URL` in `backend/.env` (immediate fix for current staging session)
    - `frontend/package.json` `preview` script updated to `vite preview --port 4173` (fixed port — prevents future drift)
    - `.env.example` updated to document canonical dev and staging preview ports
    - CORS preflight from both `:4173` and `:4175` returns `204 No Content` with `Access-Control-Allow-Origin` header
    - 69/69 backend tests still pass after config change
    - Backend process restarted to pick up updated `FRONTEND_URL`
  - **Dependencies:** None — start immediately.
  - **Fix locations:** `backend/.env`, `frontend/package.json`, `.env.example`

---

### P0 — MVP Completion Gate (Absolute Priority — Sprint Cannot Close Without This)

- [ ] **T-020** — User Agent / Project Owner: User testing — all 3 MVP flows + Care History + Care Due Dashboard **(P0 — absolute hard gate)**
  - **Acceptance Criteria:** All three flows from `project-brief.md` tested end-to-end in a browser on staging.
    - **Flow 1 (Novice):** register → add plant with watering schedule (test fertilizing + repotting expand) → view inventory → navigate to plant detail → mark care done → confetti animation plays.
    - **Flow 2 (AI advice):** upload photo or enter plant type → get AI advice (Gemini fallback chain live per T-048) → verify modal shows advice → accept → form populated. Also verify reject flow.
    - **Flow 3 (Inventory management):** edit care schedule including changing last-watered date → save → view changes. Delete a plant → confirm modal → plant removed.
    - **Care History:** navigate to `/history` → verify care actions from Flows 1–3 appear, filter by plant works, pagination works.
    - **Care Due Dashboard:** navigate to `/due` → verify urgency sections correct → use "Mark as done" shortcut → item removed optimistically → focus moves to next button (T-050 fix) → sidebar badge updates.
    - All observations logged to `feedback-log.md` with Status: New. No P0 blocking errors.
  - **Dependencies:** T-055 must be Done before T-020 begins (CORS must be live).
  - **Hard rule:** This is the eleventh and final carry-over. Sprint 11 will not close until T-020 is Done. If a User Agent is unavailable, the project owner must conduct the testing session.

---

### P1 — Persistent Login (Begin After T-020 Is Done)

- [ ] **T-053** — Backend Engineer + Frontend Engineer: Implement persistent login via HttpOnly refresh token cookie (FB-039) **(P1)**
  - **Acceptance Criteria:**
    - **Backend:** `POST /auth/login` and `POST /auth/refresh` responses set `Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict`. `POST /auth/logout` clears the cookie.
    - **Frontend:** `api.js` calls the refresh endpoint on app init (`credentials: 'include'`). On successful silent refresh, user is transparently re-authenticated. On failure, redirect to `/login`.
    - Access token remains memory-only (no XSS regression).
    - After a hard page refresh, the user remains logged in without seeing a login screen (session still valid).
    - Unit tests added for backend cookie logic and frontend silent refresh flow.
    - All 69/69 backend + 107/107 frontend tests still pass.
  - **Dependencies:** T-020 (begin after MVP testing complete — avoid regressions during MVP verification).
  - **Files:** `backend/src/routes/auth.js`, `frontend/src/utils/api.js`

---

### P2 — Bug Fixes (Can Begin After T-020 Is Done)

- [ ] **T-054** — Frontend Engineer: Fix photo removal not enabling Save button in EditPlantPage (FB-040) **(P2)**
  - **Acceptance Criteria:** In `EditPlantPage.jsx`, the `isDirty` useMemo compares `photoUrl` against `(plant.photo_url || '')`. Removing an existing photo sets `isDirty = true` and enables the Save Changes button. `photoUrl` added to memo dependency array. Unit test added covering this scenario. All 107+ frontend tests still pass.
  - **Dependencies:** None — can start immediately.
  - **Fix location:** `frontend/src/pages/EditPlantPage.jsx`, `isDirty` useMemo

- [ ] **T-052** — Frontend Engineer: Add care type label/icon to plant card status badges (FB-038) **(P2)**
  - **Acceptance Criteria:** Each care status badge in `PlantCard.jsx` is prefixed with the care type label or icon (water droplet blue for watering, leaf green for fertilizing, terracotta pot for repotting). Badge text examples: "Watering: 1 day overdue", "Fertilizing: On track". Uses the same icon+color system as CareHistoryPage for visual consistency. Unit tests added. All 107+ frontend tests still pass.
  - **Dependencies:** None — can start immediately.
  - **Fix location:** `frontend/src/components/PlantCard.jsx`

---

### P3 — Documentation (Can Begin Any Time)

- [ ] **T-051** — Monitor Agent: Update system prompt — stale test account reference **(P3)**
  - **Acceptance Criteria:** `.agents/monitor-agent.md` references `test@plantguardians.local` / `TestPass123!` instead of stale `test@triplanner.local`. All future health checks use correct credentials without manual override.
  - **Dependencies:** None.
  - **Fix location:** `.agents/monitor-agent.md`
  - *Note: Carried over from Sprint 10. No dependencies. Takes 5 minutes. Must close this sprint.*

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

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Deploy Engineer | CORS permanent fix | T-055 (P0, start immediately) |
| User Agent / Project Owner | End-to-end user testing — all flows | T-020 (P0, begin after T-055 is Done) |
| Backend Engineer | Persistent login cookie (backend side) | T-053 (P1, after T-020) |
| Frontend Engineer | Bug fixes + persistent login (frontend side) | T-054 (P2), T-052 (P2), T-053 frontend half (P1, after T-020) |
| Monitor Agent | Fix stale system prompt | T-051 (P3, can start immediately) |
| QA Engineer | Verify T-055 CORS fix, T-054, T-052, T-053 + T-020 sign-off | On-demand |
| Backend Engineer | No new tasks beyond T-053 | — |
| Design Agent | No tasks this sprint | — |
| Manager | Sprint coordination, T-020 closeout, MVP declaration | Ongoing |

---

## Dependency Chain (Critical Path)

```
T-055 (CORS fix — P0, START IMMEDIATELY)
  ↓
T-020 (User testing — P0, begin after T-055 is Done and staging is CORS-verified)
  ↓
T-053 (Persistent login — P1, backend + frontend, begin after T-020 Done)

[Parallel — no T-020 dependency, can start now]
T-054 (Photo removal isDirty fix — P2, no dependencies)
T-052 (Plant card badges — P2, no dependencies)
T-051 (Monitor stale prompt — P3, no dependencies)
```

**Critical path:** T-055 → T-020 → MVP declared → T-053. Everything else is parallel.

---

## Definition of Done

Sprint #11 is complete when:

- [ ] T-055: CORS port 4175 added + `vite preview` fixed-port configured; CORS preflight passes for all origins; 69/69 backend tests pass
- [ ] T-020: All 3 flows + Care History + Care Due Dashboard tested in-browser; no P0 blocking errors; feedback logged; **MVP officially declared complete**
- [ ] T-051: Monitor Agent system prompt references `test@plantguardians.local` correctly
- [ ] T-054: Photo removal enables Save button; unit test added; 107+ frontend tests pass
- [ ] T-052: Plant card badges show care type label/icon; unit tests added; 107+ frontend tests pass
- [ ] T-053: Persistent login via HttpOnly cookie; page refresh does not force re-login; tests added; 69/69 backend + 107+ frontend tests pass
- [ ] No regressions: all backend + frontend tests at or above Sprint 10 counts (69/69 backend, 107/107 frontend)
- [ ] Feedback from T-020 triaged by Manager Agent

---

## Success Criteria

- **MVP formally declared complete** — T-020 closed, all 3 flows + Care History + Care Due Dashboard verified end-to-end in a real browser
- **CORS port drift permanently resolved** — `vite preview` always lands on fixed port :4173; FRONTEND_URL covers all dev origins
- **Session persistence delivered** — users remain logged in after page refresh (HttpOnly cookie pattern)
- **Plant card clarity improved** — users can tell at a glance which care type is overdue on inventory view
- **Edit Plant reliability improved** — photo removal triggers Save button as expected
- **Monitor Agent accuracy improved** — correct test account in health checks going forward
- **CI is clean** — all tests pass; no new vulnerabilities above existing known risks

---

## Blockers

- **T-055 is a P0 blocker for T-020.** It must be resolved first. All other work can proceed in parallel.
- Recurring vite preview port drift: Deploy Engineer must use `--port 4173` in the `preview` script — this permanently fixes the drift pattern.
- T-020 has zero other blockers:
  - CORS (current port 4173/4175) ← resolved by T-055 ✅
  - CareScheduleForm expand buttons ✅ (T-046 Done)
  - EditPlantPage isDirty covers date fields ✅ (T-047 Done)
  - Gemini 429 fallback chain live ✅ (T-048 Done)
  - Gemini API key provisioned and working ✅ (FB-029)
  - 69/69 backend + 107/107 frontend tests pass ✅
  - Care Due Dashboard focus management ✅ (T-050 Done)

---

*Sprint #11 plan written by Manager Agent on 2026-03-29.*
