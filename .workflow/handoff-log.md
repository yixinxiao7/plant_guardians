# Agent Handoff Log

Context handoffs between agents during a sprint. Every time an agent completes work that another agent depends on, log it here.

---

## Handoff Format

| Field | Description |
|-------|-------------|
| **ID** | Unique handoff identifier (e.g., H-001) |
| **From** | Agent sending the handoff |
| **To** | Agent receiving the handoff |
| **Date** | Date of handoff |
| **Sprint** | Sprint number |
| **Subject** | Short description of what is being handed off |
| **Spec Refs** | Spec or task IDs included in this handoff |
| **Status** | Pending / Acknowledged / Complete |
| **Notes** | Any clarifications or blockers the receiving agent should know |

---

## H-001 — UI Specs Ready for Frontend Implementation

| Field | Value |
|-------|-------|
| **ID** | H-001 |
| **From** | Design Agent |
| **To** | Frontend Engineer |
| **Date** | 2026-03-21 |
| **Sprint** | 1 |
| **Subject** | All Sprint 1 screen specs are complete and approved. Frontend Engineer may begin implementation. |
| **Spec Refs** | SPEC-001, SPEC-002, SPEC-003, SPEC-004, SPEC-005, SPEC-006, SPEC-007 |
| **Status** | Pending |

### Specs Included

| Spec ID | Screen Name | Priority |
|---------|------------|---------|
| SPEC-001 | Login & Sign Up | High — blocks all other screens |
| SPEC-002 | Home / Plant Inventory | High — primary user-facing screen |
| SPEC-003 | Add Plant | High — core MVP feature |
| SPEC-004 | Edit Plant | Medium — mirrors Add Plant |
| SPEC-005 | Plant Detail | High — key engagement screen |
| SPEC-006 | AI Advice Modal | High — differentiating feature |
| SPEC-007 | Profile Page | Medium — required per success criteria |

### Build Order Recommendation

1. **SPEC-001** (Login/Signup) — must be done first; all routes require auth
2. **SPEC-002** (Inventory) — core shell and navigation pattern established here
3. **SPEC-003 + SPEC-004** (Add/Edit Plant) — can be built in parallel; share most components
4. **SPEC-005** (Plant Detail) — depends on plant data model being defined
5. **SPEC-006** (AI Advice Modal) — can be built concurrently with SPEC-003
6. **SPEC-007** (Profile) — can be done last, least complex

### Notes for Frontend Engineer

- All screens must use the Design System Conventions defined in `ui-spec.md` (colors, fonts, spacing, border radii). Do not deviate without a logged architecture decision.
- The **"Mark as done" confetti animation** in SPEC-005 is a product priority — do not cut this. Use `canvas-confetti` (dynamically imported).
- Use **Phosphor Icons** (`phosphor-react`) for all iconography.
- Load fonts from Google Fonts: `DM Sans` (weights 400/500/600) and `Playfair Display` (weight 600).
- All animations must respect `prefers-reduced-motion`. Wrap in the media query — never assume motion is safe.
- Toast notifications: top-right stack, 4s auto-dismiss, dark background with colored left border.
- Do NOT begin wiring up API calls until the Backend Engineer has published contracts in `api-contracts.md` and you have acknowledged them via this handoff log.
- All screens must be responsive per the breakpoints in each spec (desktop ≥1024px, tablet 768–1023px, mobile <768px).

### Blockers

- None from the Design Agent side.
- ⚠️ Frontend Engineer should NOT wire up API calls until Backend Engineer posts API contracts in `.workflow/api-contracts.md`.

---

## H-002 — API Contracts Ready for Frontend Integration

| Field | Value |
|-------|-------|
| **ID** | H-002 |
| **From** | Backend Engineer |
| **To** | Frontend Engineer |
| **Date** | 2026-03-23 |
| **Sprint** | 1 |
| **Subject** | All Sprint 1 API contracts are published. Frontend Engineer may begin wiring up API calls. |
| **Spec Refs** | T-008, T-009, T-010, T-011, T-012, T-013 |
| **Status** | Pending |

### Contracts Included

| Group | Endpoint(s) | Related Tasks | Notes |
|-------|-------------|---------------|-------|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` | T-008 | Access token: JWT 15m; refresh token: 7d, rotated on each use. Store both in memory/secure cookie — do NOT use localStorage for tokens. |
| Plants CRUD | `GET /plants`, `POST /plants`, `GET /plants/:id`, `PUT /plants/:id`, `DELETE /plants/:id` | T-009 | `GET /plants` returns full care_schedule array with computed `status`, `next_due_at`, and `days_overdue`. No separate schedule endpoint needed. |
| Photo Upload | `POST /plants/:id/photo` | T-010 | Upload photo first → get back `photo_url` → include in `POST /plants` or `PUT /plants/:id` body. Multipart/form-data, field name: `photo`. |
| AI Advice | `POST /ai/advice` | T-011 | Sends `plant_type` and/or `photo_url`. Returns structured care advice. Expect 2–8s latency — always show loading state. Error code `PLANT_NOT_IDENTIFIABLE` (422) means photo unclear; prompt user to retry or type manually. |
| Care Actions | `POST /plants/:id/care-actions`, `DELETE /plants/:id/care-actions/:action_id` | T-012 | POST returns updated schedule with new status. DELETE is the undo action — call within 10s window. Response includes `updated_schedule` so UI can optimistically update without a full re-fetch. |
| Profile | `GET /profile` | T-013 | Returns `user` object + `stats` object with `plant_count`, `days_as_member`, `total_care_actions`. |

### Key Integration Notes for Frontend Engineer

1. **Auth token storage:** Store `access_token` in memory (React state/context), `refresh_token` in an `httpOnly` cookie (set by backend) or secure storage. Do NOT persist `access_token` in localStorage — XSS risk. Coordinate with backend on cookie vs. body delivery if needed.
2. **Auto-refresh:** When any API call returns 401, attempt one silent token refresh via `POST /auth/refresh`, then retry the original request. If refresh also fails, redirect to `/login`.
3. **Computed fields:** `next_due_at`, `status`, and `days_overdue` are computed on the backend per request — do not calculate them client-side.
4. **Optimistic updates:** The "Mark as done" flow returns the updated schedule in the response. Update local state from the response rather than re-fetching the full plant.
5. **Photo upload flow:** Upload photo (multipart) → receive `photo_url` → include in plant create/update payload. The upload endpoint validates file type and size server-side; display server error codes (`INVALID_FILE_TYPE`, `FILE_TOO_LARGE`) inline.
6. **Care action undo:** On `DELETE /plants/:id/care-actions/:action_id`, the response includes the reverted `updated_schedule` — update the care card status from it without re-fetching.
7. **AI years unit:** The AI endpoint may return `"repotting": { "frequency_unit": "years" }`. Convert to months (`* 12`) before persisting via `PUT /plants/:id`.

### Blockers

- None. Frontend Engineer may begin integration immediately once endpoints are implemented (implementation phase follows this contracts phase).

---

## H-003 — API Contracts for QA Reference

| Field | Value |
|-------|-------|
| **ID** | H-003 |
| **From** | Backend Engineer |
| **To** | QA Engineer |
| **Date** | 2026-03-23 |
| **Sprint** | 1 |
| **Subject** | API contracts are published. QA Engineer may use them to plan integration test cases. |
| **Spec Refs** | T-008, T-009, T-010, T-011, T-012, T-013, T-014 |
| **Status** | Pending |

### Test Focus Areas for QA

| Area | Key Scenarios to Test | Task Ref |
|------|-----------------------|---------|
| **Auth — Register** | Happy path; duplicate email (409); short password (400); missing fields (400) | T-015 |
| **Auth — Login** | Happy path; wrong password (401); unknown email (401); missing fields (400) | T-015 |
| **Auth — Refresh** | Valid refresh → new tokens; expired token (401); already-rotated token (401) | T-015 |
| **Auth — Logout** | Valid logout; double-logout (second call should still 200 or 401 gracefully) | T-015 |
| **Plants — List** | Returns only current user's plants; empty list; pagination params; no token (401) | T-016 |
| **Plants — Create** | Happy path with schedules; missing name (400); duplicate care_type in schedules (400); no watering schedule (verify API allows it) | T-016 |
| **Plants — Get** | Happy path; 404 for nonexistent plant; 404 for another user's plant (ownership check) | T-016 |
| **Plants — Update** | Full replace of schedules; removing a schedule type; 404 for wrong user | T-016 |
| **Plants — Delete** | Cascades to schedules and care_actions; 404 for wrong user | T-016 |
| **Photo Upload** | Happy path JPEG/PNG/WebP; file too large (400); wrong type (400); no file (400) | T-016 |
| **AI Advice** | Text-only query; photo URL query; neither provided (400); mock/stub Gemini for CI | T-017 |
| **Care Actions — Create** | Happy path; wrong care_type (400); no schedule exists for care_type (422); future performed_at (400) | T-016 |
| **Care Actions — Delete (undo)** | Reverts schedule; action not found (404); action belongs to different plant (404) | T-016 |
| **Profile** | Returns correct plant count; correct care action total; days_as_member is correct | T-016 |
| **Schema / Migrations** | `knex migrate:up` succeeds; `knex migrate:down` fully rolls back; no orphaned rows | T-014 |

### Security Checks to Verify

- No user can access or mutate another user's plants, care schedules, or care actions (all scoped by `user_id`)
- Refresh token is stored as a hash (raw value never retrievable from DB)
- SQL injection: test parameterized queries hold against common payloads (check via `sqlmap` lite or manual tests)
- File upload: verify non-image files (e.g., `.exe`, `.php`) are rejected by MIME check (not just extension)
- JWT: tampered token (modified payload) returns 401

### Notes

- AI endpoint (`POST /ai/advice`) should be tested with a stub/mock Gemini response in CI to avoid real API costs and flakiness.
- See `security-checklist.md` for the full required security verification list.

---

## H-004 — Backend Implementation Complete — Ready for QA

| Field | Value |
|-------|-------|
| **ID** | H-004 |
| **From** | Backend Engineer |
| **To** | QA Engineer |
| **Date** | 2026-03-23 |
| **Sprint** | 1 |
| **Subject** | All Sprint 1 backend endpoints are implemented with unit tests. Ready for integration testing. |
| **Spec Refs** | T-008, T-009, T-010, T-011, T-012, T-013, T-014 |
| **Status** | Pending |

### What Was Implemented

| Task | Endpoints | Files |
|------|-----------|-------|
| T-014 | — | 5 Knex migrations: `users`, `refresh_tokens`, `plants`, `care_schedules`, `care_actions` |
| T-008 | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` | `routes/auth.js`, `models/User.js`, `models/RefreshToken.js`, `middleware/auth.js` |
| T-009 | `GET /plants`, `POST /plants`, `GET /plants/:id`, `PUT /plants/:id`, `DELETE /plants/:id` | `routes/plants.js`, `models/Plant.js`, `models/CareSchedule.js` |
| T-010 | `POST /plants/:id/photo` | `routes/plants.js`, `middleware/upload.js` |
| T-011 | `POST /ai/advice` | `routes/ai.js` |
| T-012 | `POST /plants/:id/care-actions`, `DELETE /plants/:id/care-actions/:action_id` | `routes/careActions.js`, `models/CareAction.js` |
| T-013 | `GET /profile` | `routes/profile.js` |

### What to Test

1. **Auth flows (T-015):** Register → login → refresh → logout; duplicate email (409); wrong password (401); rotated refresh token rejection (401).
2. **Plants CRUD (T-016):** Create with schedules; list with pagination; get detail with recent actions; update with schedule replacement; delete with cascade; ownership isolation (user A can't see user B's plants).
3. **Photo upload (T-016):** Valid JPEG/PNG/WebP; reject .exe; reject >5MB; reject no file.
4. **AI advice (T-017):** Returns 400 with no input; returns 502 when API key not configured; test with mock Gemini response.
5. **Care actions (T-016):** Create action updates schedule last_done_at; reject for missing schedule (422); delete action reverts last_done_at; reject future performed_at.
6. **Profile (T-016):** Returns correct plant_count and total_care_actions.
7. **Security:** All queries use parameterized Knex; passwords hashed with bcrypt (12 rounds); refresh tokens stored as SHA-256 hash; JWT validated in auth middleware; rate limiting on auth endpoints; CORS configured; helmet security headers applied.

### Tests Written

| File | Coverage |
|------|----------|
| `tests/auth.test.js` | 8 tests (register happy/error × 3, login happy/error × 2, refresh rotation, logout) |
| `tests/plants.test.js` | 9 tests (CRUD + ownership isolation + care schedules) |
| `tests/careActions.test.js` | 5 tests (create/delete + error cases) |
| `tests/ai.test.js` | 3 tests (validation + auth + unconfigured API) |
| `tests/profile.test.js` | 2 tests (happy path + auth) |

### Notes

- Run tests with: `cd backend && npm test`
- Migrations: `cd backend && npm run migrate`
- Rollback: `cd backend && npm run migrate:rollback`
- Rate limiting is strict on auth endpoints (20/15min) — QA should test accordingly.

---

## H-005 — Backend API Ready for Frontend Integration

| Field | Value |
|-------|-------|
| **ID** | H-005 |
| **From** | Backend Engineer |
| **To** | Frontend Engineer |
| **Date** | 2026-03-23 |
| **Sprint** | 1 |
| **Subject** | All Sprint 1 API endpoints are implemented. Frontend can begin wiring up API calls per the contracts in `api-contracts.md`. |
| **Spec Refs** | T-008, T-009, T-010, T-011, T-012, T-013 |
| **Status** | Pending |

### Notes

- All endpoints match the contracts published in `api-contracts.md` (H-002).
- Health check: `GET /api/health` returns `{ "status": "ok" }`.
- Static file serving for uploads at `/uploads/` in development mode.
- CORS is configured for `http://localhost:5173`.
- Backend starts on port 3000 by default: `cd backend && npm run dev`.

---

## H-006 — Database Migrations Ready for Deploy

| Field | Value |
|-------|-------|
| **ID** | H-006 |
| **From** | Backend Engineer |
| **To** | Deploy Engineer |
| **Date** | 2026-03-23 |
| **Sprint** | 1 |
| **Subject** | 5 database migrations need to run on staging before deployment. |
| **Spec Refs** | T-014 |
| **Status** | Pending |

### Migrations to Run

| # | File | Description |
|---|------|-------------|
| 1 | `20260323_01_create_users.js` | Creates `users` table |
| 2 | `20260323_02_create_refresh_tokens.js` | Creates `refresh_tokens` table |
| 3 | `20260323_03_create_plants.js` | Creates `plants` table |
| 4 | `20260323_04_create_care_schedules.js` | Creates `care_schedules` table with check constraints |
| 5 | `20260323_05_create_care_actions.js` | Creates `care_actions` table with check constraints |

### Commands

```bash
cd backend
npm run migrate          # run all pending migrations
npm run migrate:rollback # rollback if needed
```

### Notes

- All migrations have reversible `down()` functions.
- Tables use UUID primary keys with `gen_random_uuid()` (requires PostgreSQL 13+).
- ON DELETE CASCADE is set on all foreign keys — deleting a user cascades to plants, schedules, and actions.

---
