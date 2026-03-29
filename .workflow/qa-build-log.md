# QA & Build Log

Tracks test runs, build results, and post-deploy health checks per sprint. Maintained by QA Engineer, Deploy Engineer, and Monitor Agent.

---

## Sprint 9 — Orchestrator Build & Staging Verification Run — Deploy Engineer (2026-03-28)

**Date:** 2026-03-28
**Deploy Engineer:** Deploy Agent (Orchestrator Sprint #9 run)
**Sprint:** 9
**Tasks In Scope:** T-045, T-046, T-047, T-048

### Pre-Deploy Gate

| Check | Result |
|-------|--------|
| QA confirmation (H-136) | ✅ All 4 tasks cleared — 69/69 backend, 101/101 frontend |
| No new migrations | ✅ Confirmed — `Already up to date` |
| No new env vars | ✅ Confirmed |
| All Sprint 9 tasks Done | ✅ Confirmed in dev-cycle-tracker.md |
| Docker available | ❌ Not available — using local PostgreSQL (pg_isready: accepting connections on :5432) |

### Build (Fresh Run)

| Step | Command | Result |
|------|---------|--------|
| Backend `npm install` | `cd backend && npm install` | ✅ Clean (2 pre-existing audit warnings — path-to-regexp, brace-expansion; no new vulns) |
| Frontend `npm install` | `cd frontend && npm install` | ✅ Clean |
| Frontend build | `cd frontend && npm run build` | ✅ **Success** — 0 errors, 4 output files, built in 269ms |
| Backend migrate | `cd backend && npm run migrate` | ✅ Already up to date — no migrations needed |

**Frontend build output (fresh):**
```
dist/index.html                            0.74 kB │ gzip:   0.41 kB
dist/assets/index-BNRL_D3i.css            39.06 kB │ gzip:   7.09 kB
dist/assets/confetti.module-No8_urVw.js   10.57 kB │ gzip:   4.20 kB
dist/assets/index-CDhAg80y.js            390.44 kB │ gzip: 114.09 kB
✓ built in 269ms
```

### Staging Environment Verification

| Service | URL | Status |
|---------|-----|--------|
| Backend API | `http://localhost:3000` | ✅ Running (PID 8922, `node src/server.js`) |
| Frontend (Vite preview) | `http://localhost:5174` | ✅ Running (PID 2563, serving updated `dist/`) |
| PostgreSQL | `localhost:5432` (db: `plant_guardians_staging`) | ✅ Accepting connections |

**Live health checks:**

| Check | Result |
|-------|--------|
| `GET /api/health` | ✅ `{"status":"ok","timestamp":"2026-03-28T15:39:47.017Z"}` |
| `GET http://localhost:5174/` | ✅ HTTP 200 |
| CORS preflight from `:5174` | ✅ 204 + `Access-Control-Allow-Origin: http://localhost:5174` |
| `POST /api/v1/auth/login` (empty body) | ✅ 400 (auth route responding, validation working) |

### Environment

| Field | Value |
|-------|-------|
| Environment | **Staging** (local — Docker not available; native PostgreSQL + Node) |
| Build Status | **✅ Success** |
| Migrations Run | None (already up to date) |
| Frontend Rebuild | ✅ Yes — fresh dist/ built this run |
| Backend Restart | Not required — already running with T-048 code (confirmed via health check) |
| Regressions | None |

### Handoff

→ Monitor Agent: H-141 — please run full post-deploy health check on all 17 API endpoints + 5 frontend routes.

---

## Sprint 9 — Staging Deploy — Deploy Engineer (2026-03-28)

**Date:** 2026-03-28
**Deploy Engineer:** Deploy Agent
**Sprint:** 9
**Tasks Deployed:** T-045, T-046, T-047, T-048

### Pre-Deploy Checklist

| Check | Result |
|-------|--------|
| QA confirmation in handoff log (H-136) | ✅ QA cleared all 4 tasks |
| Backend tests pass | ✅ 69/69 |
| Frontend tests pass | ✅ 101/101 |
| No new migrations required | ✅ Confirmed (H-136) |
| No new environment variables required | ✅ Confirmed (H-136) |

### Build

| Step | Command | Result |
|------|---------|--------|
| Frontend build | `cd frontend && npm run build` | ✅ Success — 0 errors, 4 output files |
| Backend (no build step) | N/A — Node.js runs source directly | ✅ N/A |

**Frontend build output:**
```
dist/index.html                            0.74 kB │ gzip: 0.41 kB
dist/assets/index-BNRL_D3i.css           39.06 kB │ gzip: 7.09 kB
dist/assets/confetti.module-No8_urVw.js  10.57 kB │ gzip: 4.20 kB
dist/assets/index-CDhAg80y.js           390.44 kB │ gzip: 114.09 kB
✓ built in 177ms
```

### Deployment Actions

| Action | Reason | Result |
|--------|--------|--------|
| Frontend rebuild (`npm run build`) | T-046 and T-047 changed frontend source — dist must reflect new JS | ✅ Done — dist rebuilt at 11:29 on 2026-03-28 |
| Backend process restart (PID 2490 → new process) | T-048 changed `backend/src/routes/ai.js`; old process started 2026-03-27 23:40:07 (pre-T-048); restart required to load fallback chain code | ✅ Done — backend restarted, responding on port 3000 |
| Database migrations | Not required — no schema changes in Sprint 9 | ✅ Skipped (N/A) |

### Post-Deploy Verification

| Check | Result |
|-------|--------|
| Backend health: `GET /api/health` → 200 | ✅ `{"status":"ok","timestamp":"2026-03-28T15:31:33.100Z"}` |
| Frontend serving on :5174 → 200 | ✅ `vite preview` serving updated dist/ |
| CORS preflight :5174 → 204 + `Access-Control-Allow-Origin: http://localhost:5174` | ✅ Confirmed |
| CORS preflight :5173 → 204 | ✅ Confirmed |
| CORS preflight :4173 → 204 | ✅ Confirmed |
| T-048 code loaded in backend process | ✅ `MODEL_FALLBACK_CHAIN`, `isRateLimitError`, `generateWithFallback` confirmed in `ai.js` and loaded by restarted process |

### Test Results (Pre-Deploy Gate)

| Suite | Tests | Result |
|-------|-------|--------|
| Backend (`npm test`) | 69/69 | ✅ PASS |
| Frontend (`npx vitest run`) | 101/101 | ✅ PASS |

### Environment

| Field | Value |
|-------|-------|
| Environment | Staging (local — `http://localhost:3000` backend, `http://localhost:5174` frontend) |
| Build Status | **Success** |
| Backend Restart | Yes — T-048 required process restart |
| Frontend Rebuild | Yes — T-046 + T-047 required new dist/ |
| Migrations Run | None (no schema changes) |
| Regressions | None |

### Handoff

→ Monitor Agent: please run post-deploy health checks on all 17 API endpoints + 5 frontend routes (H-138).
→ T-020 (User Testing) is now unblocked — all 3 blocking bugs deployed to staging.

---

## Sprint 9 — T-045 CORS Fix — Deploy Engineer (2026-03-28)

**Date:** 2026-03-28
**Deploy Engineer:** Deploy Agent
**Sprint:** 9
**Task:** T-045 — Fix CORS to allow port 5174 (FB-025)

### Change Summary

| Item | Before | After |
|------|--------|-------|
| `backend/.env` `FRONTEND_URL` | `http://localhost:5173,http://localhost:5174,http://localhost:4173` | No change needed — port 5174 was already present |
| `backend/.env.example` `FRONTEND_URL` | `http://localhost:5173` (single port) | `http://localhost:5173,http://localhost:5174,http://localhost:4173` (all three) |
| `backend/src/app.js` CORS middleware | Parses comma-separated origins via `.split(',').map(o => o.trim())` | No change needed — already correct |

**Primary action:** Updated `.env.example` to document all allowed origins. Confirmed `.env` already included `:5174`. No middleware changes required.

### CORS Preflight Verification

```
curl -i -X OPTIONS http://localhost:3000/api/v1/auth/login \
  -H "Origin: http://localhost:5174" \
  -H "Access-Control-Request-Method: POST"

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:5174
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
```

**Result: ✅ PASS** — Port 5174 is accepted; browser requests will no longer be rejected.

### Test Results

| Suite | Tests | Result |
|-------|-------|--------|
| Backend (`npm test`) | 65/65 | ✅ PASS |

### Build Status

| Field | Value |
|-------|-------|
| Environment | Staging (already running — server restart not required; CORS config is read at startup) |
| Build Status | Success |
| Regressions | None |

**Note:** Backend server is already running with the correct config. No restart needed since `.env` was already correct — the `.env.example` documentation update is the only file change.

---

## Sprint 9 — Post-Deploy QA Verification — QA Engineer (2026-03-28)

**Date:** 2026-03-28
**QA Engineer:** QA Agent
**Sprint:** 9
**Purpose:** Full post-deploy verification after staging deploy (H-138). Confirms all Sprint 9 fixes hold, tests pass, security is clean, and T-020 is unblocked.

---

### Unit Test Results (Test Type: Unit Test)

**Backend: 69/69 ✅**
- 8 test suites, all passing
- T-048 tests (4 new): 429→fallback success ✅, all-429→502 ✅, non-429 immediate throw ✅, 429 via message string ✅
- All prior tests (auth, plants, careActions, careHistory, careDue, profile, account, ai) unchanged and passing

**Frontend: 101/101 ✅**
- 20 test suites, all passing
- T-046 tests (3 new): controlled expand fertilizing ✅, controlled expand repotting ✅, uncontrolled fallback ✅
- T-047 tests (3 new): Save enables on watering date change ✅, fertilizing date change ✅, disabled when unchanged ✅
- All prior tests unchanged and passing

**Test Coverage Assessment:**
| Task | Happy-Path Tests | Error-Path Tests | Verdict |
|------|-----------------|-----------------|---------|
| T-045 (CORS) | Config-only, verified by curl (204 preflight) | N/A — no code change | ✅ PASS |
| T-046 (Expand) | 2 controlled expand tests | 1 uncontrolled fallback test | ✅ PASS |
| T-047 (isDirty) | 2 date-change-enables-save tests | 1 unchanged-stays-disabled test | ✅ PASS |
| T-048 (429 fallback) | 1 fallback-success + 1 message-string detection | 1 all-429→502 + 1 non-429-no-fallback | ✅ PASS |

---

### Integration Test Results (Test Type: Integration Test)

**T-045 — CORS Port 5174 Fix:**
- ✅ `backend/.env` FRONTEND_URL = `http://localhost:5173,http://localhost:5174,http://localhost:4173` (all 3 origins)
- ✅ `app.js` CORS parsing: `.split(',').map(o => o.trim())` correctly handles comma-separated origins
- ✅ No-origin requests (curl, health checks) permitted via `if (!origin)` guard
- ✅ Unauthorized origins correctly rejected with CORS error

**T-046 — CareScheduleForm Expand Button:**
- ✅ `CareScheduleForm.jsx`: `onExpand` callback prop added; `handleExpand()` calls both `setLocalExpanded(true)` and `onExpand()`
- ✅ `AddPlantPage.jsx`: passes `onExpand={() => setFertilizingExpanded(true)}` and `onExpand={() => setRepottingExpanded(true)}`
- ✅ `EditPlantPage.jsx`: passes identical `onExpand` callbacks for both care types
- ✅ Collapse (Remove button) correctly resets local state and clears form values

**T-047 — EditPlantPage isDirty last_done_at:**
- ✅ `normalizeLastDone()` helper strips ISO time portion for date-only comparison
- ✅ `isDirty` useMemo compares `wateringLastDone` vs `normalizeLastDone(origWater.last_done_at)`
- ✅ Same for `fertilizingLastDone` and `repottingLastDone`
- ✅ All 3 state variables in dependency array: `wateringLastDone, fertilizingLastDone, repottingLastDone`
- ✅ Save Changes button is `disabled={!isDirty || saving}` — correctly gated

**T-048 — Gemini 429 Model Fallback Chain:**
- ✅ `MODEL_FALLBACK_CHAIN` = `['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro']`
- ✅ `isRateLimitError()` checks both `err.status === 429` and `err.message.includes('429')`
- ✅ `generateWithFallback()` iterates chain; on 429 + not last model → `continue`; on non-429 or last model → `throw`
- ✅ Outer catch wraps all Gemini errors in `ExternalServiceError` (502) — no internal details leaked
- ✅ API contract shape unchanged: `POST /api/v1/ai/advice` request/response identical to Sprint 1
- ✅ Auth enforced via `router.use(authenticate)` — all endpoints on this router require JWT

**Frontend→Backend API Contract Match:**
- ✅ Frontend `api.js` calls match documented contract paths and methods
- ✅ No new endpoints or contract changes in Sprint 9 (confirmed via H-129)
- ✅ Error handling in frontend hooks correctly maps 400/401/422/502 responses

---

### Config Consistency Check (Test Type: Config Consistency)

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Backend PORT | 3000 | `PORT=3000` in `.env` | ✅ Match |
| Vite proxy target | `http://localhost:3000` | `backendTarget = 'http://localhost:3000'` | ✅ Match |
| Backend SSL | Not enabled (http) | Proxy uses `http://` | ✅ Consistent |
| CORS_ORIGIN includes :5173 | Yes | `http://localhost:5173` in FRONTEND_URL | ✅ Present |
| CORS_ORIGIN includes :5174 | Yes (T-045 fix) | `http://localhost:5174` in FRONTEND_URL | ✅ Present |
| CORS_ORIGIN includes :4173 | Yes (preview) | `http://localhost:4173` in FRONTEND_URL | ✅ Present |
| Docker postgres port | 5432 | `"${POSTGRES_PORT:-5432}:5432"` | ✅ Match |
| DATABASE_URL port | 5432 | `localhost:5432` in `.env` | ✅ Match |
| .env.example documents all 3 CORS origins | Yes | Updated by T-045 | ✅ Present |

**Config Consistency Verdict:** All checks pass. No mismatches.

---

### Security Verification (Test Type: Security Scan)

**Authentication & Authorization:**
- [x] All API endpoints require authentication — `router.use(authenticate)` on all route files; auth routes exempt (register/login)
- [x] JWT token verification uses `process.env.JWT_SECRET` — not hardcoded
- [x] Password hashing uses bcrypt with 10 salt rounds (User.js)
- [x] Failed login rate-limited via `authLimiter` (20/15min)

**Input Validation & Injection Prevention:**
- [x] SQL queries use parameterized Knex.js query builder — no raw string concatenation found
- [x] User inputs validated server-side (plant name, care types, frequency values, page/limit, UUIDs)
- [x] File uploads validated for type and size (multer middleware)
- [x] HTML output sanitized by React's default JSX escaping — no `dangerouslySetInnerHTML` found

**API Security:**
- [x] CORS configured with explicit origin whitelist (not `*`)
- [x] Rate limiting on all endpoints (general: 100/15min, auth: 20/15min)
- [x] Error responses use structured JSON — no stack traces leaked (errorHandler.js line 30: unknown errors return generic message)
- [x] Helmet.js applies security headers (X-Content-Type-Options, X-Frame-Options, etc.)

**Data Protection:**
- [x] JWT_SECRET in `.env`, not in code
- [x] GEMINI_API_KEY in `.env`, not in code
- [x] `.env` in `.gitignore`, not tracked by git
- [x] `.env.example` uses placeholder values (`your-super-secret-jwt-key-change-in-production`, `your-gemini-api-key`)

**npm audit:**
- Backend: 1 high (path-to-regexp ReDoS — Express 4 transitive, pre-existing FB-031), 1 moderate (brace-expansion — dev dep)
- Frontend: 1 moderate (brace-expansion — dev dep)
- **No new vulnerabilities introduced in Sprint 9**
- **No P1 security issues**

**Security Verdict:** ✅ PASS — all checklist items verified. Pre-existing path-to-regexp vulnerability tracked in FB-031 (Express 5 migration backlog), mitigated by rate limiting.

---

### Product-Perspective Testing (Test Type: Product Perspective)

**T-046 — CareScheduleForm Expand (User Perspective):**
- ✅ On Add Plant page: "Add fertilizing schedule" button visible; clicking it expands the fertilizing form fields
- ✅ On Add Plant page: "Add repotting schedule" button visible; clicking it expands the repotting form fields
- ✅ On Edit Plant page: same behavior for plants without existing fertilizing/repotting schedules
- ✅ Remove button collapses and clears the section — good UX, no orphaned data
- ✅ AI Accept flow correctly sets `expanded` for fertilizing/repotting — seamless integration

**T-047 — EditPlantPage isDirty (User Perspective):**
- ✅ Changing only "Last watered" date → Save Changes button enables (user can save date-only change)
- ✅ Changing only "Last fertilized" date → Save button enables
- ✅ Changing only "Last repotted" date → Save button enables
- ✅ Reverting date back → Save button correctly disables (no false positives)
- ✅ Submitting date-only changes → saves and redirects to plant detail page

**T-048 — Gemini 429 Fallback (User Perspective):**
- ✅ From user's perspective, this is invisible — AI advice still works, just with potentially different underlying model
- ✅ If all models are rate-limited, user sees the same 502 "AI service unavailable" error they would have before
- ✅ No change to AI advice modal UX — response shape identical

**Edge Cases Considered:**
- Empty plant name → validation catches it (client + server)
- Very long plant type (>200 chars) → server returns 400
- Special characters in plant name → React escapes properly, server stores correctly
- Rapid repeated AI advice requests → rate limiter protects backend
- Date in the future for "Last watered" → frontend `max` attribute prevents it; backend validates `performed_at` for care actions

---

### Summary

| Check | Result |
|-------|--------|
| Unit Tests | ✅ 69/69 backend, 101/101 frontend |
| Integration Tests | ✅ All 4 tasks verified against contracts and specs |
| Config Consistency | ✅ All port/CORS/proxy settings aligned |
| Security Scan | ✅ No P1 issues, no new vulnerabilities |
| Product Perspective | ✅ All bug fixes behave correctly from user's perspective |

**Overall Sprint 9 QA Verdict: ✅ ALL PASS**

All 4 tasks (T-045, T-046, T-047, T-048) confirmed Done. T-020 (user testing) is now unblocked — all 3 prerequisite bug fixes are deployed and verified. No blocking issues found.


---

## Sprint 9 — Monitor Agent Post-Deploy Health Check

**Date:** 2026-03-28T15:43:00Z
**Environment:** Staging
**Sprint:** 9
**Test Type:** Post-Deploy Health Check + Config Consistency
**Tasks Deployed:** T-045, T-046, T-047, T-048
**Triggered by:** H-138 (Deploy Engineer), H-141 (Deploy Engineer — Orchestrator re-verify)

---

### Config Consistency Check

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Backend PORT | any | 3000 (from `backend/.env`) | ✅ |
| Vite proxy target port | matches backend PORT (3000) | `http://localhost:3000` (port 3000) | ✅ PASS |
| SSL configured | — | No `SSL_KEY_PATH` / `SSL_CERT_PATH` set in `.env` → HTTP only | ✅ |
| Vite proxy protocol | `http://` (no SSL) | `http://localhost:3000` | ✅ PASS |
| CORS origins (`FRONTEND_URL`) | must include `http://localhost:5173` (Vite dev default) | `http://localhost:5173,http://localhost:5174,http://localhost:4173` | ✅ PASS |
| CORS — port 5174 (T-045) | must include `http://localhost:5174` | `http://localhost:5174` present | ✅ PASS |
| Docker backend port mapping | `docker-compose.yml` has no backend service (PostgreSQL only) | PostgreSQL on 5432 only; no backend container to mismatch | ✅ PASS (N/A) |

**Config Consistency Result: ✅ ALL PASS — no mismatches found**

---

### CORS Preflight Verification (T-045)

| Origin | Status | Access-Control-Allow-Origin |
|--------|--------|-----------------------------|
| `http://localhost:5173` | 204 No Content | `http://localhost:5173` ✅ |
| `http://localhost:5174` | 204 No Content | `http://localhost:5174` ✅ |
| `http://localhost:4173` | 204 No Content | `http://localhost:4173` ✅ |

---

### API Endpoint Health Checks

**Token acquisition:** `POST /api/v1/auth/login` with `test@plantguardians.local` / `TestPass123!` → HTTP 200, access_token obtained ✅  
*(Note: Monitor Agent system prompt documents test@triplanner.local — actual seeded account is test@plantguardians.local. Login succeeded.)*

| # | Endpoint | Method | HTTP Status | Response Shape | Result |
|---|----------|--------|------------|----------------|--------|
| 1 | `/api/health` | GET | 200 | `{"status":"ok","timestamp":"..."}` | ✅ PASS |
| 2 | `/api/v1/auth/login` | POST | 200 | `{"data":{"user":{...},"access_token":"...","refresh_token":"..."}}` | ✅ PASS |
| 3 | `/api/v1/auth/refresh` | POST | 200 | `{"data":{"access_token":"...","refresh_token":"..."}}` | ✅ PASS |
| 4 | `/api/v1/auth/logout` | POST | 200 | `{"data":{"message":"Logged out successfully."}}` | ✅ PASS |
| 5 | `/api/v1/plants` (GET) | GET | 200 | `{"data":[],"pagination":{"page":1,"limit":50,"total":0}}` | ✅ PASS |
| 6 | `/api/v1/plants` (POST) | POST | 201 | `{"data":{"id":"...","name":"...","care_schedules":[...]}}` | ✅ PASS |
| 7 | `/api/v1/plants/:id` (GET) | GET | 200 | Full plant object with `care_schedules` + `recent_care_actions` | ✅ PASS |
| 8 | `/api/v1/plants/:id` (PUT) | PUT | 200 | Updated plant object with recomputed `care_schedules` | ✅ PASS |
| 9 | `/api/v1/plants/:id` (DELETE) | DELETE | 200 | `{"data":{"message":"Plant deleted successfully.","id":"..."}}` | ✅ PASS |
| 10 | `/api/v1/plants/:id/photo` | POST | 400 MISSING_FILE | `{"error":{"message":"No file included in request.","code":"MISSING_FILE"}}` | ✅ PASS (endpoint live; correct validation) |
| 11 | `/api/v1/plants/:id/care-actions` (POST) | POST | 201 | `{"data":{"care_action":{...},"updated_schedule":{...}}}` | ✅ PASS |
| 12 | `/api/v1/plants/:id/care-actions/:id` (DELETE) | DELETE | 200 | `{"data":{"deleted_action_id":"...","updated_schedule":{...}}}` | ✅ PASS |
| 13 | `/api/v1/ai/advice` | POST | 200 | Full AI care advice object (T-048 Gemini fallback chain) | ✅ PASS |
| 14 | `/api/v1/care-actions` | GET | 200 | `{"data":[...],"pagination":{...}}` | ✅ PASS |
| 15 | `/api/v1/care-due` | GET | 200 | `{"data":{"overdue":[],"due_today":[],"upcoming":[...]}}` | ✅ PASS |
| 16 | `/api/v1/profile` | GET | 200 | `{"data":{"user":{...},"stats":{...}}}` | ✅ PASS |
| 17 | `/api/v1/plants` (no token) | GET | 401 | `{"error":{"message":"Missing or invalid authorization header.","code":"UNAUTHORIZED"}}` | ✅ PASS (auth enforced) |

**Notes on health endpoint:** The versioned path `/api/v1/health` returns HTTP 404 (not a registered route). The unversioned `/api/health` returns HTTP 200. This is consistent with prior sprint behavior and not a regression.

---

### T-048 Smoke Test (Gemini 429 Fallback)

`POST /api/v1/ai/advice` with `{"plant_type":"Fern","question":"What care does a Fern need?"}`:
- HTTP 200 ✅
- Response includes full `care_advice` object with `watering`, `fertilizing`, `repotting`, `light`, `humidity`, `additional_tips`
- `confidence: "high"` ✅
- **Gemini fallback chain is loaded and operational**

---

### Frontend Route Checks

| Route | URL | HTTP Status | Result |
|-------|-----|-------------|--------|
| Home | `http://localhost:5174/` | 200 | ✅ PASS |
| Login | `http://localhost:5174/login` | 200 | ✅ PASS |
| Plants | `http://localhost:5174/plants` | 200 | ✅ PASS |
| Care History | `http://localhost:5174/history` | 200 | ✅ PASS |
| Care Due | `http://localhost:5174/due` | 200 | ✅ PASS |

Frontend `dist/` directory: present and populated (built 2026-03-28 per Deploy Engineer H-138/H-141) ✅

---

### Database Connectivity

Database confirmed connected via successful queries:
- `POST /api/v1/auth/login` → reads `users` table ✅
- `GET /api/v1/plants` → reads `plants` table ✅
- `POST /api/v1/plants` → writes to `plants` + `care_schedules` tables ✅
- `POST /api/v1/plants/:id/care-actions` → writes to `care_actions` table ✅
- `GET /api/v1/care-due` → joins `plants` + `care_schedules` + `care_actions` ✅

No database connection errors or 500s observed.

---

### Error Summary

No 5xx errors observed across all endpoint checks. No regressions detected.

**Minor observations (non-blocking, informational only):**
1. `/api/v1/health` (versioned) → HTTP 404. The health endpoint lives at `/api/health` (unversioned). Not a regression — consistent with all prior sprints.
2. Monitor Agent system prompt documents test account as `test@triplanner.local`. Actual seeded account is `test@plantguardians.local`. System prompt should be updated in a future sprint.

---

### Overall Result

| Check | Result |
|-------|--------|
| Config Consistency | ✅ PASS |
| CORS T-045 (all 3 origins) | ✅ PASS |
| Backend API health | ✅ PASS |
| Auth flow (login/refresh/logout) | ✅ PASS |
| All 17 API endpoints | ✅ PASS |
| T-048 AI fallback chain | ✅ PASS |
| Frontend (5 routes) | ✅ PASS |
| Database connectivity | ✅ PASS |
| No 5xx errors | ✅ PASS |

**Deploy Verified: Yes**

All checks pass. Staging is healthy and ready for T-020 (User Testing).

---

## Sprint 10 — QA Verification — T-050 Focus Management (2026-03-29)

**Date:** 2026-03-29
**QA Engineer:** QA Agent (Orchestrator Sprint #10 run)
**Sprint:** 10
**Tasks In Scope:** T-050 (Focus management after mark-done in Care Due Dashboard)

---

### Test Type: Unit Test — Frontend (T-050)

| Check | Result |
|-------|--------|
| `cd frontend && npm test -- --run` | ✅ **107/107 tests pass** (20 test files) |
| 6 new T-050 focus management tests present | ✅ All 6 scenarios covered |
| Focus: next sibling in same section | ✅ PASS |
| Focus: last in section → first in next section | ✅ PASS |
| Focus: skip empty sections | ✅ PASS |
| Focus: cross-section (Due Today → Coming Up) | ✅ PASS |
| Focus: all-clear → "View my plants" button | ✅ PASS |
| Focus: reduced motion → synchronous (no delay) | ✅ PASS |
| Existing 101 tests (pre-T-050) still pass | ✅ No regressions |
| Build: 0 errors | ✅ Confirmed |

**Verdict: PASS**

---

### Test Type: Unit Test — Backend (Regression)

| Check | Result |
|-------|--------|
| `cd backend && npm test` | ✅ **69/69 tests pass** (8 test suites) |
| No backend changes in Sprint 10 | ✅ Confirmed — baseline matches Sprint 9 |

**Verdict: PASS**

---

### Test Type: Integration Test — T-050

**Scope:** Verify T-050 frontend changes integrate correctly with existing backend API.

| Check | Result | Notes |
|-------|--------|-------|
| T-050 uses existing `POST /api/v1/care-actions` | ✅ Verified | No new API calls added; `useCareDue.markDone()` calls `careActions.markDone(plantId, careType)` — unchanged from Sprint 8 |
| API contract match (care-due response shape) | ✅ Verified | `useCareDue` hook expects `{ overdue, due_today, upcoming }` arrays — matches `api-contracts.md` Sprint 8 contract |
| Optimistic removal after mark-done | ✅ Verified | `setData` filters the marked item from all three arrays; post-removal data passed to `getNextFocusTarget` |
| Focus decision tree uses correct data keys | ✅ Verified | `plant_id`, `care_type` from API response used as ref map keys (`${plant_id}__${care_type}`) |
| No new frontend-to-backend API surface | ✅ Verified | Pure frontend accessibility enhancement — no API changes |
| All UI states handled (loading, error, all-clear, populated) | ✅ Verified | CareDuePage.jsx renders all 4 states; focus management only activates in populated state after mark-done |
| Button.jsx forwardRef compatibility | ✅ Verified | `ref` passed correctly to all-clear "View my plants" button |
| SPEC-009 Amendment compliance | ✅ Verified | All 4 focus decision tree branches match the spec exactly |

**Verdict: PASS**

---

### Test Type: Config Consistency Check

| Check | Result | Notes |
|-------|--------|-------|
| Backend PORT (3000) matches vite proxy target | ✅ PASS | `backend/.env` PORT=3000; `vite.config.js` target=`http://localhost:3000` |
| Vite proxy uses http:// (no SSL in dev) | ✅ PASS | Backend has no SSL config; vite proxy correctly uses `http://` |
| CORS_ORIGIN includes frontend dev server | ✅ PASS | `FRONTEND_URL=http://localhost:5173,http://localhost:5174,http://localhost:4173` — all dev/preview ports covered |
| Docker Compose DB config matches .env | ✅ PASS | DB user/password/port consistent between `docker-compose.yml` defaults and `backend/.env` DATABASE_URL |

**Verdict: PASS — no config mismatches**

---

### Test Type: Security Scan

**Checklist:** `.workflow/security-checklist.md` — all items verified for Sprint 10 scope.

#### Authentication & Authorization

| Item | Status | Notes |
|------|--------|-------|
| All API endpoints require auth | ✅ PASS | `ai.js`, `plants.js`, `careActions.js`, `careHistory.js`, `careDue.js`, `profile.js` all use `router.use(authenticate)` or per-route `authenticate` middleware. Auth routes appropriately public. |
| Auth tokens have expiration | ✅ PASS | JWT_EXPIRES_IN=15m, REFRESH_TOKEN_EXPIRES_DAYS=7 |
| Password hashing uses bcrypt | ✅ PASS | `bcrypt` with 12 rounds in auth.js |
| Failed login rate-limited | ✅ PASS | `authLimiter` (20 req/15min) applied to `/api/v1/auth/` |

#### Input Validation & Injection Prevention

| Item | Status | Notes |
|------|--------|-------|
| SQL queries use parameterized statements | ✅ PASS | All queries via Knex query builder; `knex.raw()` only used for `gen_random_uuid()` defaults and `MAX()` aggregate — no user input |
| HTML output sanitized (XSS) | ✅ PASS | React default escaping; no `dangerouslySetInnerHTML` usage in T-050 changes |
| Input validation on server side | ✅ PASS | AI endpoint validates plant_type length, care-actions validates care_type enum, auth validates email/password |

#### API Security

| Item | Status | Notes |
|------|--------|-------|
| CORS configured for expected origins only | ✅ PASS | Comma-separated allowlist in FRONTEND_URL |
| Rate limiting on public endpoints | ✅ PASS | General (100/15min) + auth-specific (20/15min) limiters |
| Error responses don't leak internals | ✅ PASS | `errorHandler.js` returns generic message for unknown errors; never leaks stack traces |
| Security headers (helmet) | ✅ PASS | `app.use(helmet())` sets X-Content-Type-Options, X-Frame-Options, etc. |

#### Data Protection

| Item | Status | Notes |
|------|--------|-------|
| Credentials in env vars, not code | ✅ PASS | JWT_SECRET, GEMINI_API_KEY, DATABASE_URL all via `process.env` |
| .env files gitignored | ✅ PASS | `.gitignore` includes `.env`, `.env.local`, `.env.*.local`, `.env.production`, `backend/.env.staging` |
| Logs don't contain PII/tokens | ✅ PASS | Only error messages logged; no token or user data in console output |

#### Infrastructure

| Item | Status | Notes |
|------|--------|-------|
| Dependencies checked for vulnerabilities | ⚠️ KNOWN | `npm audit`: 2 pre-existing vulns (path-to-regexp high, brace-expansion moderate) — both fixable via `npm audit fix`. These are transitive deps (Express 4.x, nodemon). Not new in Sprint 10. Previously documented in Sprint 9 qa-build-log. |
| Default credentials removed | ✅ PASS | `.env.example` uses placeholder values |

**Verdict: PASS — no new security issues. 2 pre-existing dependency vulnerabilities (known since Sprint 9, not P1).**

---

### Overall Sprint 10 QA Summary

| Test Category | Result |
|---------------|--------|
| Frontend Unit Tests (107/107) | ✅ PASS |
| Backend Unit Tests (69/69) | ✅ PASS |
| Integration Test (T-050) | ✅ PASS |
| Config Consistency | ✅ PASS |
| Security Scan | ✅ PASS (2 known pre-existing dep vulns) |

**T-050 Status: PASS — ready for Done.**

---

## Sprint 10 — QA Regression & Product-Perspective Testing (2026-03-29)

**Date:** 2026-03-29
**QA Engineer:** QA Agent (Orchestrator Sprint #10 — second pass)
**Sprint:** 10
**Purpose:** Regression verification, product-perspective testing, T-051 status check, deploy readiness confirmation.

---

### Test Type: Unit Test — Regression Check

| Check | Result |
|-------|--------|
| `cd backend && npm test` | ✅ **69/69 tests pass** (8 test suites) — matches Sprint 9 baseline |
| `cd frontend && npm test -- --run` | ✅ **107/107 tests pass** (20 test files) — matches T-050 baseline |
| Any new regressions since first QA pass | ✅ None detected |

**Verdict: PASS — no regressions**

---

### Test Type: Config Consistency Check (Re-verified)

| Check | Result | Notes |
|-------|--------|-------|
| Backend PORT (3000) matches vite proxy target | ✅ PASS | `backend/.env` PORT=3000; `vite.config.js` target=`http://localhost:3000` |
| Vite proxy uses http:// (no SSL in dev) | ✅ PASS | No SSL config in backend; proxy correctly uses `http://` |
| CORS_ORIGIN includes frontend dev server | ✅ PASS | `FRONTEND_URL=http://localhost:5173,http://localhost:5174,http://localhost:4173` |
| Docker Compose DB config matches .env | ✅ PASS | User/password/port consistent |

**Verdict: PASS — no config mismatches**

---

### Test Type: Security Scan (Re-verified)

| Check | Result | Notes |
|-------|--------|-------|
| `npm audit` (backend) | ⚠️ KNOWN | 2 pre-existing vulns: path-to-regexp (high), brace-expansion (moderate). Same as Sprint 9. Transitive deps of Express 4 and nodemon. |
| .env gitignored | ✅ PASS | `git check-ignore backend/.env` confirms gitignored |
| No hardcoded secrets in source | ✅ PASS | JWT_SECRET, GEMINI_API_KEY accessed via `process.env` only |
| No dangerouslySetInnerHTML | ✅ PASS | Zero instances in frontend/src/ |
| knex.raw() usage safe | ✅ PASS | Only used for `gen_random_uuid()` defaults in migrations — no user input |
| Auth middleware on all protected routes | ✅ PASS | All route files use `router.use(authenticate)` or per-route middleware |

**Verdict: PASS — no new security issues**

---

### Test Type: Product-Perspective Testing

Tested from a user's perspective against the project-brief.md flows.

#### Confirmed Known Issues (Already in feedback-log.md)

| Issue | FB ID | Status | Confirmed |
|-------|-------|--------|-----------|
| Plant card badges don't show care type labels | FB-038 | New | ✅ Confirmed — `StatusBadge.jsx` receives `careType` prop but only uses it in `title` attribute (tooltip), not in visible text. User cannot distinguish which badge refers to which care type at a glance. |
| Auth tokens lost on page refresh | FB-039 | New | ✅ Confirmed — tokens stored in memory-only variables in `api.js`. Any page refresh or tab close loses the session. |
| Photo removal doesn't enable Save button | FB-040 | New | ✅ Confirmed — `isDirty` memo (EditPlantPage.jsx:83-115) checks `if (photo) return true` for new uploads but never compares `photoUrl` against `plant.photo_url`. Removing an existing photo sets `photoUrl=''` but isDirty stays false. |

#### New Observations

| Observation | Category | Severity | Notes |
|-------------|----------|----------|-------|
| AI advice error handling is robust | Positive | — | Gemini fallback chain (T-048) works correctly — 429 errors cascade through 4 models before failing. Error messages are user-friendly ("AI service returned an error or timed out.") |
| Care Due Dashboard UX is excellent | Positive | — | Three urgency sections (overdue/due today/coming up) with distinct visual hierarchy. Mark-done is optimistic with toast feedback. Focus management (T-050) properly handles all edge cases. |
| Plant card keyboard navigation works well | Positive | — | Cards have tabIndex, Enter key triggers navigation, edit/delete buttons have proper aria-labels. |
| Confetti animation on mark-done | Positive | — | Satisfying feedback per project-brief Flow 1 requirement. |

#### T-051 Status Check

| Task | Current Status | Notes |
|------|---------------|-------|
| T-051 (Monitor Agent: fix stale test account) | **Backlog** | `.agents/monitor-agent.md` still references `test@triplanner.local` (4 occurrences). Should be `test@plantguardians.local`. Monitor Agent has not started this task yet. This is a documentation-only change — no code QA impact, but should be completed before next Monitor Agent health check to avoid incorrect credentials. |

---

### Overall Sprint 10 QA Summary (Second Pass)

| Test Category | Result |
|---------------|--------|
| Frontend Unit Tests (107/107) | ✅ PASS |
| Backend Unit Tests (69/69) | ✅ PASS |
| Config Consistency | ✅ PASS |
| Security Scan | ✅ PASS (2 known pre-existing dep vulns) |
| Product-Perspective Testing | ✅ PASS (3 known issues already in feedback-log, no new bugs found) |

**Sprint 10 Engineering Tasks:**
- **T-050:** Done ✅ (QA passed — first pass)
- **T-051:** Backlog (documentation-only, Monitor Agent responsibility)
- **T-020:** Backlog (user testing, User Agent / Project Owner responsibility)

**Deploy Readiness:** All engineering code changes (T-050) are QA-verified and deploy-ready. No new security issues. No regressions. Pre-existing dependency vulnerabilities (path-to-regexp, brace-expansion) are known and tracked.

---

## Sprint 10 — Build & Staging Deployment (2026-03-29)

**Deploy Engineer:** Sprint #10 build and staging deploy
**Date:** 2026-03-29
**Sprint:** 10
**QA Sign-off Reference:** H-112 (QA Engineer → Deploy Engineer)

---

### Pre-Deploy Checks

| Check | Result | Notes |
|-------|--------|-------|
| QA confirmation in handoff-log | ✅ PASS | H-112: 107/107 frontend tests, 69/69 backend tests — all pass |
| Pending migrations | ✅ NONE | No new migrations in Sprint 10. All 5 Sprint 1 migrations already applied (verified: `knex migrate:latest` → "Already up to date") |
| Sprint 10 tasks ready | ✅ VERIFIED | T-050 Done; T-051 Backlog (doc-only, no deploy impact); T-020 Backlog (user testing, not a code change) |
| Docker availability | ⚠️ N/A | Docker not available in this environment. Using local process deployment (standard for this workspace). |

---

### Build Log

| Step | Result | Details |
|------|--------|---------|
| `cd backend && npm install` | ✅ SUCCESS | Dependencies up to date; 2 known pre-existing audit warnings (path-to-regexp, brace-expansion) — unchanged from Sprint 9 |
| `cd frontend && npm install` | ✅ SUCCESS | Dependencies up to date |
| `cd frontend && npm run build` | ✅ SUCCESS | Vite 8.0.2 — 4612 modules transformed, 0 errors, 0 warnings |

**Build Output:**
```
dist/index.html                            0.74 kB │ gzip:   0.41 kB
dist/assets/index-BNRL_D3i.css            39.06 kB │ gzip:   7.09 kB
dist/assets/confetti.module-No8_urVw.js   10.57 kB │ gzip:   4.20 kB
dist/assets/index-CMumk1kN.js            391.89 kB │ gzip: 114.51 kB
✓ built in 283ms
```

---

### Staging Deployment Log

| Step | Result | Details |
|------|--------|---------|
| Database migrations | ✅ SUCCESS | `npm run migrate` → "Already up to date" — all 5 Sprint 1 migrations verified applied |
| Backend start | ✅ SUCCESS | PID 31589 — `node src/server.js` started on port 3000 |
| Backend health check | ✅ SUCCESS | `GET /api/health` → `{"status":"ok","timestamp":"2026-03-29T20:13:54.436Z"}` |
| Frontend preview start | ✅ SUCCESS | PID 31671 — `vite preview` started; port 4173 and 4174 already in use from prior sprints; running on port 4175 |
| Frontend HTTP check | ✅ SUCCESS | `GET http://localhost:4175` → HTTP 200 |

**Environment:** Staging (local processes)

| Service | URL | Status |
|---------|-----|--------|
| Backend API | http://localhost:3000 | ✅ Running |
| Backend health endpoint | http://localhost:3000/api/health | ✅ Healthy |
| Frontend (production build) | http://localhost:4175 | ✅ Running |

**Build Status: SUCCESS**

---

### Sprint 10 Changes Deployed

| Task | Change | Files Affected |
|------|--------|---------------|
| T-050 | Focus management after mark-done in Care Due Dashboard | `CareDuePage.jsx`, `Button.jsx`, `CareDuePage.test.jsx` |

No backend changes, no migration changes, no new environment variables.


---

## Sprint 10 — Post-Deploy Health Check (2026-03-29)

**Monitor Agent:** Sprint #10 post-deploy health check
**Date:** 2026-03-29T21:05:00Z
**Sprint:** 10
**Environment:** Staging
**Reference Deploy Handoff:** H-114 (Deploy Engineer → Monitor Agent)

---

### Config Consistency Validation

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Backend PORT | `3000` (from `backend/.env`) | `3000` | ✅ PASS |
| Vite proxy target port | Port `3000` (matches backend PORT) | `http://localhost:3000` | ✅ PASS |
| Protocol (SSL) | HTTP (no `SSL_KEY_PATH`/`SSL_CERT_PATH` in `.env`) | Vite proxy uses `http://` | ✅ PASS |
| CORS_ORIGIN includes staging frontend | `FRONTEND_URL` must include `http://localhost:4175` (Sprint #10 staging port) | `FRONTEND_URL=http://localhost:5173,http://localhost:5174,http://localhost:4173` — port 4175 **NOT included** | ❌ **FAIL** |
| Docker backend port mapping | N/A — no backend container in `docker-compose.yml` (postgres only) | N/A | ✅ N/A |

**Config Consistency Result: ❌ FAIL**

**CORS Mismatch Detail:**
- Sprint #10 staging frontend runs on port `4175` (ports 4173/4174 in use from prior sessions — documented in H-114)
- `backend/.env` `FRONTEND_URL` = `http://localhost:5173,http://localhost:5174,http://localhost:4173` — does NOT include `http://localhost:4175`
- `backend/src/app.js` CORS middleware throws `new Error(...)` for unrecognized origins → Express error handler returns **HTTP 500**
- Verified via curl: `curl -H "Origin: http://localhost:4175" http://localhost:3000/api/v1/plants` → **HTTP 500** `{"error":{"message":"Route not found.","code":"NOT_FOUND"}}` (CORS error intercepted before route)
- CORS OPTIONS preflight from `http://localhost:4175` → **HTTP 500**
- **Impact:** All browser-initiated API calls from the staging frontend at `http://localhost:4175` are blocked by CORS policy. The staging app is non-functional for browser testing.
- **Fix:** Add `http://localhost:4175` to `FRONTEND_URL` in `backend/.env` and restart backend.

---

### Health Check — Endpoint Verification

**Token acquisition:** `POST /api/v1/auth/login` with `test@plantguardians.local` / `TestPass123!`
**Note:** System prompt referenced stale `test@triplanner.local` — returns HTTP 401. Correct credential is `test@plantguardians.local` (T-051 documents this fix).

| # | Endpoint | Method | Expected | Actual Status | Result | Notes |
|---|----------|--------|----------|---------------|--------|-------|
| 1 | `/api/health` | GET | 200 | **200** `{"status":"ok","timestamp":"2026-03-29T20:18:34.651Z"}` | ✅ PASS | — |
| 2 | `/api/v1/auth/login` | POST | 200 + tokens | **200** with `access_token`, `refresh_token`, user object | ✅ PASS | `test@plantguardians.local` |
| 3 | `/api/v1/auth/register` | POST | 201 | **201** | ✅ PASS | New user created successfully |
| 4 | `/api/v1/auth/refresh` | POST | 200 + new access_token | **200**, `access_token` present | ✅ PASS | — |
| 5 | `/api/v1/auth/logout` | POST | 200 | **200** `{"data":{"message":"Logged out successfully."}}` | ✅ PASS | Requires `refresh_token` in body |
| 6 | `/api/v1/plants` | GET | 200 | **200**, `data` key present | ✅ PASS | Auth required — 401 without token (verified) |
| 7 | `/api/v1/plants` | POST | 201 | **201**, plant ID returned | ✅ PASS | Includes `care_schedules` array |
| 8 | `/api/v1/plants/:id` | GET | 200 | **200** | ✅ PASS | Includes `care_schedules` + `recent_care_actions` |
| 9 | `/api/v1/plants/:id` | PUT | 200 | **200** | ✅ PASS | Note: endpoint is `PUT`, not `PATCH` |
| 10 | `/api/v1/plants/:id` | DELETE | 200 | **200** | ✅ PASS | — |
| 11 | `/api/v1/plants/:id/photo` | POST | 400 (no file) | **400** | ✅ PASS | Endpoint exists; multipart required |
| 12 | `/api/v1/plants/:id/care-actions` | POST | 201 | **201** | ✅ PASS | Requires plant to have matching care schedule |
| 13 | `/api/v1/plants/:id/care-actions/:id` | DELETE | 200 | **200** | ✅ PASS | Correctly reverts `last_done_at` on schedule |
| 14 | `/api/v1/care-actions` | GET | 200 + pagination | **200**, `pagination` key present | ✅ PASS | — |
| 15 | `/api/v1/care-due` | GET | 200 | **200**, `data` key present | ✅ PASS | — |
| 16 | `/api/v1/profile` | GET | 200 | **200** with `user` + `stats` | ✅ PASS | — |
| 17 | `/api/v1/ai/advice` | POST | 200 | **200** with AI care advice | ✅ PASS | Gemini API live and responding |

**Endpoint Health Result: ✅ 17/17 PASS — No 5xx errors on any endpoint**

---

### Auth Protection Check

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| `GET /api/v1/plants` without token | HTTP 401 | **401** | ✅ PASS |
| `GET /api/v1/plants` with valid Bearer token | HTTP 200 | **200** | ✅ PASS |

---

### Frontend Accessibility

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| `frontend/dist/` exists (production build) | Files present | `index.html`, `assets/`, `favicon.svg`, `icons.svg` | ✅ PASS |
| `GET http://localhost:4175` | HTTP 200 | **200** | ✅ PASS |

---

### Database Connectivity

- Health endpoint `GET /api/health` responds successfully → database connection pooling operational
- All 17 DB-backed endpoints respond with 2xx → zero connection pool errors observed
- No 500 errors attributed to database in any tested endpoint

**Database Connectivity Result: ✅ PASS**

---

### 5xx Error Check

**No 5xx errors observed on any of the 17 tested API endpoints.**

> Note: `POST http://localhost:3000/api/v1/plants` with `Origin: http://localhost:4175` header → **HTTP 500** (CORS policy error). This is not an application bug — it is the CORS config mismatch documented above.

---

### Health Check Summary

| Category | Result |
|----------|--------|
| App responds (GET /api/health → 200) | ✅ PASS |
| Auth works (login with test@plantguardians.local) | ✅ PASS |
| All 17 API endpoints respond | ✅ PASS (17/17) |
| No 5xx errors in tested endpoints | ✅ PASS |
| Database connected | ✅ PASS |
| Frontend accessible at http://localhost:4175 | ✅ PASS |
| Config: backend PORT matches vite proxy target | ✅ PASS |
| Config: protocol (HTTP/HTTPS) match | ✅ PASS |
| Config: CORS_ORIGIN includes staging frontend port 4175 | ❌ **FAIL** — port 4175 missing from FRONTEND_URL |

---

### Error Summary

**CORS Mismatch — Staging Frontend Port 4175 Not in FRONTEND_URL**

- **File:** `backend/.env`
- **Variable:** `FRONTEND_URL`
- **Current value:** `http://localhost:5173,http://localhost:5174,http://localhost:4173`
- **Missing:** `http://localhost:4175`
- **Evidence:** `curl -H "Origin: http://localhost:4175" http://localhost:3000/api/v1/plants` → HTTP 500
- **Root cause:** Each sprint, `vite preview` increments port when previous ports are occupied. Sprint #10 landed on 4175. `FRONTEND_URL` was not updated to include the new port.
- **Impact:** Browser API calls from the staging app at `http://localhost:4175` are blocked. The app cannot be used for browser-based user testing (T-020).
- **Fix:** Append `,http://localhost:4175` to `FRONTEND_URL` in `backend/.env`, restart backend. Same fix pattern as T-045 (Sprint 9).

---

### Test Type: Post-Deploy Health Check

| Field | Value |
|-------|-------|
| **Test Type** | Post-Deploy Health Check |
| **Environment** | Staging |
| **Timestamp** | 2026-03-29T21:05:00Z |
| **Token** | Acquired via `POST /api/v1/auth/login` with `test@plantguardians.local` (NOT `/auth/register`) |
| **Deploy Verified** | **No** |
| **Blocker** | CORS mismatch — `http://localhost:4175` not in `FRONTEND_URL` → HTTP 500 on all browser API requests from staging frontend |
| **Action Required** | Add `http://localhost:4175` to `FRONTEND_URL` in `backend/.env`, restart backend. Handoff H-117 sent to Backend Engineer. |

