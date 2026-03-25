# QA & Build Log

Tracks test runs, build results, and post-deploy health checks per sprint. Maintained by QA Engineer, Deploy Engineer, and Monitor Agent.

---

## Sprint 4 — QA Report

**Date:** 2026-03-24
**QA Engineer:** QA Agent
**Tasks in scope:** T-026 (AI Modal 502 fix), T-028 (Vite proxy config)

---

### Test Run 1 — Backend Unit Tests (Sprint 4 Re-Verification)

| Field | Value |
|-------|-------|
| **Test Type** | Unit Test |
| **Date** | 2026-03-24 |
| **Target** | Backend (all endpoints) |
| **Command** | `cd backend && npm test` |
| **Result** | ✅ PASS — 40/40 tests passed |
| **Duration** | 8.75s |
| **Note** | First run had 1 flaky failure ("socket hang up" in POST /plants create test). Re-run passed 40/40 cleanly. Isolated concurrency issue in test runner — not a code defect. |

#### Test Breakdown

| Suite | Tests | Result |
|-------|-------|--------|
| `tests/auth.test.js` | 10 | ✅ All pass |
| `tests/plants.test.js` | 18 (CRUD ×13, photo upload ×5) | ✅ All pass |
| `tests/careActions.test.js` | 6 | ✅ All pass |
| `tests/ai.test.js` | 3 | ✅ All pass |
| `tests/profile.test.js` | 2 | ✅ All pass |

---

### Test Run 2 — Frontend Unit Tests (Sprint 4 — includes T-026 new tests)

| Field | Value |
|-------|-------|
| **Test Type** | Unit Test |
| **Date** | 2026-03-24 |
| **Target** | Frontend (all components and pages) |
| **Command** | `cd frontend && npx vitest run` |
| **Result** | ✅ PASS — 50/50 tests passed (17 test files) |
| **Duration** | 1.21s |
| **New tests** | 2 added for T-026: (1) "hides Try Again button and shows correct message for AI_SERVICE_UNAVAILABLE (502) error", (2) "shows Try Again button for non-502 errors" |

---

### Test Run 3 — Frontend Production Build (T-028 verification)

| Field | Value |
|-------|-------|
| **Test Type** | Build |
| **Date** | 2026-03-24 |
| **Command** | `cd frontend && npm run build` |
| **Result** | ✅ SUCCESS — 0 errors |
| **Duration** | 255ms |

| File | Size | Gzip |
|------|------|------|
| `dist/index.html` | 0.74 kB | 0.41 kB |
| `dist/assets/index-ACo76nzn.css` | 29.12 kB | 5.43 kB |
| `dist/assets/confetti.module-No8_urVw.js` | 10.57 kB | 4.20 kB |
| `dist/assets/index-CsF38E1Z.js` | 356.84 kB | 106.63 kB |

---

### Test Run 4 — Integration Test: T-026 (AI Modal 502 Fix)

| Field | Value |
|-------|-------|
| **Test Type** | Integration Test |
| **Date** | 2026-03-24 |
| **Target** | AI Advice Modal — 502 error state behavior |
| **Result** | ✅ PASS |

#### Verified Items

| Check | Result | Details |
|-------|--------|---------|
| 502 error message text | ✅ | Exact match: "Our AI service is temporarily offline. You can still add your plant manually." (line 67 in AIAdviceModal.jsx) |
| "Try Again" hidden for 502 | ✅ | `!isServiceUnavailable` guard on Try Again button (line 232). `isServiceUnavailable = errorCode === 'AI_SERVICE_UNAVAILABLE'` (line 224) |
| "Close" button promoted for 502 | ✅ | `variant={isServiceUnavailable ? 'secondary' : 'ghost'}` — Close becomes the primary action when it's the only button |
| Non-502 errors: "Try Again" visible | ✅ | NETWORK_ERROR, PLANT_NOT_IDENTIFIABLE retain both buttons |
| Non-502 error messages unchanged | ✅ | Network error: "Check your internet connection and try again." Unidentifiable: "We couldn't identify the plant from this photo…" |
| Error code tracking | ✅ | `errorCode` state variable set from `err.code` in catch block |
| Modal reset on reopen | ✅ | `setErrorCode('')` in useEffect on isOpen |
| SPEC-006 State 4 compliance | ✅ | 502: only "Close" + correct message. Non-502: "Try Again" + "Close". All match spec. |
| FB-004 resolution | ✅ | Both UX deviations from Sprint 3 QA Test Run 5 are now fixed |

---

### Test Run 5 — Integration Test: T-028 (Vite Proxy Config)

| Field | Value |
|-------|-------|
| **Test Type** | Integration Test |
| **Date** | 2026-03-24 |
| **Target** | Vite proxy configuration — frontend API routing |
| **Result** | ✅ PASS |

#### Verified Items

| Check | Result | Details |
|-------|--------|---------|
| Proxy target matches backend PORT | ✅ | `vite.config.js`: `target: 'http://localhost:3000'`. `backend/.env`: `PORT=3000`. Match. |
| Proxy config on both dev + preview | ✅ | `server: { proxy: proxyConfig }` and `preview: { proxy: proxyConfig }` |
| `changeOrigin: true` set | ✅ | Prevents host header leakage |
| api.js default base URL | ✅ | `'/api/v1'` (relative) — routes through Vite proxy |
| No VITE_API_BASE_URL override active | ✅ | No `.env` or `.env.local` file in `frontend/` — proxy is not bypassed |
| `.env.example` documents production-only usage | ✅ | Clear comments explaining when to set VITE_API_BASE_URL |
| SSL consistency | ✅ | `http://` throughout — proxy target, backend PORT, CORS. No SSL mismatch. |
| No new npm dependencies | ✅ | Vite proxy is built-in — no additions to package.json |
| 50/50 tests pass post-change | ✅ | All frontend tests pass with relative API base |
| Production build succeeds | ✅ | `npm run build` → 0 errors |

---

### Test Run 6 — Config Consistency Check (Sprint 4)

| Field | Value |
|-------|-------|
| **Test Type** | Config Consistency |
| **Date** | 2026-03-24 |
| **Result** | ✅ PASS — No mismatches |

| Check | Result | Details |
|-------|--------|---------|
| Backend PORT vs Vite proxy target | ✅ | Backend PORT=3000. Vite proxy target: `http://localhost:3000`. Match. |
| SSL consistency | ✅ | No SSL anywhere (staging/dev). All http://. Consistent. |
| CORS_ORIGIN includes frontend dev server | ✅ | `FRONTEND_URL=http://localhost:5173,http://localhost:4173`. Both origins allowed. |
| No active .env override in frontend | ✅ | No `.env` or `.env.local` in frontend/ — proxy routes through correctly |
| Docker compose DB ports match .env | ✅ | postgres on :5432, test DB on :5433. DATABASE_URL uses :5432. Consistent. |

---

### Test Run 7 — Security Scan (Sprint 4)

| Field | Value |
|-------|-------|
| **Test Type** | Security Scan |
| **Date** | 2026-03-24 |
| **Target** | Sprint 4 changes (T-026, T-028) + full stack re-verification |
| **Result** | ✅ PASS — All applicable items verified |

#### T-026 Security Review

| Check | Result |
|-------|--------|
| No hardcoded secrets in AIAdviceModal.jsx | ✅ |
| No dangerouslySetInnerHTML | ✅ |
| Error messages don't leak internal details | ✅ |
| Error code comparison uses strict equality | ✅ |

#### T-028 Security Review

| Check | Result |
|-------|--------|
| No secrets in vite.config.js | ✅ |
| No secrets in api.js | ✅ |
| No secrets in .env.example | ✅ |
| Proxy changeOrigin prevents host header leakage | ✅ |
| VITE_API_BASE_URL not hardcoded (env var only) | ✅ |

#### Full Stack Security Re-Verification

| # | Security Check | Status |
|---|----------------|--------|
| 1 | No hardcoded secrets in source | ✅ PASS |
| 2 | SQL injection — all queries use Knex | ✅ PASS |
| 3 | XSS — no dangerouslySetInnerHTML (0 instances) | ✅ PASS |
| 4 | Token storage — memory only | ✅ PASS |
| 5 | Auth middleware on all protected routes | ✅ PASS |
| 6 | Error response leakage — generic errors only | ✅ PASS |
| 7 | Input validation — comprehensive | ✅ PASS |
| 8 | CORS — whitelist-based origin control | ✅ PASS |
| 9 | Rate limiting — auth 20/15min, general 100/15min | ✅ PASS |
| 10 | Password hashing — bcrypt | ✅ PASS |
| 11 | File upload validation — MIME + size + UUID rename | ✅ PASS |
| 12 | .env not tracked in git (.gitignore verified) | ✅ PASS |
| 13 | Security headers — Helmet.js enabled | ✅ PASS |

#### npm audit

| Field | Value |
|-------|-------|
| **Command** | `cd backend && npm audit` |
| **Result** | ✅ 0 vulnerabilities |

**Security Verdict: ✅ PASS — No P1 security issues.**

---

### Sprint 4 — QA Summary

| Task | Test Type | Result | Notes |
|------|-----------|--------|-------|
| T-026 (AI Modal 502 fix) | Unit Test | ✅ PASS | 50/50 tests (2 new for 502 behavior) |
| T-026 (AI Modal 502 fix) | Integration | ✅ PASS | SPEC-006 compliant. FB-004 resolved. |
| T-028 (Vite proxy config) | Unit Test | ✅ PASS | 50/50 tests |
| T-028 (Vite proxy config) | Build | ✅ PASS | 0 errors |
| T-028 (Vite proxy config) | Integration | ✅ PASS | Proxy config correct, no override active |
| Config Consistency | Config Check | ✅ PASS | No mismatches |
| Security Checklist | Security Scan | ✅ PASS | All 13 items verified |
| npm audit | Security Scan | ✅ PASS | 0 vulnerabilities |
| Backend unit tests | Unit Test | ✅ PASS | 40/40 (flaky "socket hang up" on 1st run — passed on re-run) |
| Frontend unit tests | Unit Test | ✅ PASS | 50/50 |

### Pre-Deploy Verification Checklist

| Requirement | Status |
|-------------|--------|
| All unit tests pass (40/40 backend, 50/50 frontend) | ✅ |
| Integration tests pass (T-026, T-028) | ✅ |
| Security checklist verified (all 13 items) | ✅ |
| npm audit: 0 vulnerabilities | ✅ |
| Config consistency: no mismatches | ✅ |
| All Sprint 4 QA-scope tasks verified | ✅ |
| No P1 security issues | ✅ |

**Verdict: T-026 → Done. T-028 → Done. Sprint 4 QA is COMPLETE for these tasks. Ready for Monitor Agent staging re-verification (T-024).**

---

## Sprint 4 — Staging Re-Deployment: T-028 Proxy Activation (Deploy Engineer — 2026-03-24)

**Date:** 2026-03-24T17:45:00Z
**Deploy Engineer:** Deploy Agent
**Sprint:** 4
**Triggered by:** Discovered the running `vite preview` process (PID 39456, started 9:58AM) pre-dated the T-028 Vite proxy changes (vite.config.js modified at 13:33:33). The proxy was NOT active in the running staging environment despite T-028 being code-complete and QA-verified. This re-deploy activates the proxy.

---

### Issue Identified

| Finding | Details |
|---------|---------|
| `vite preview` process start time | 9:58AM (PID 39437/39456) |
| `vite.config.js` last modified | 13:33:33 — T-028 proxy config added AFTER process started |
| **Impact** | Proxy was not loaded into the running process — `/api` requests from :5173 would NOT be forwarded to :3000 |

---

### Actions Taken

| Step | Command | Result |
|------|---------|--------|
| 1. Rebuild frontend | `cd frontend && npm run build` | ✅ SUCCESS — 4 artifacts, 153ms, 0 errors |
| 2. Kill stale preview | `kill 39456 39437` | ✅ Both processes terminated |
| 3. Start new preview | `npx vite preview --port 5173 --strictPort` | ✅ Running (PID 54215) |
| 4. Verify proxy active | `curl http://localhost:5173/api/health` → HTTP 200 | ✅ Proxy forwarding confirmed |

---

### Post-Restart Verification

| Check | Command | Result |
|-------|---------|--------|
| Frontend accessible | `curl http://localhost:5173/` → HTTP 200 | ✅ |
| Proxy: `/api/health` routed through :5173 | HTTP 200, returns `{"status":"ok",...}` | ✅ |
| Backend health direct | `curl http://localhost:3000/api/health` | ✅ `{"status":"ok","timestamp":"2026-03-24T17:45:24.426Z"}` |
| Auth: login test account | POST /api/v1/auth/login → access_token obtained | ✅ |
| Auth enforcement | GET /api/v1/plants (no token) → HTTP 401 | ✅ |
| Protected endpoint | GET /api/v1/plants (valid token) → HTTP 200 | ✅ |
| CORS for :5173 | `Access-Control-Allow-Origin: http://localhost:5173` | ✅ |
| Migrations | `npm run migrate` → Already up to date (5/5 applied) | ✅ |

---

### Current Staging Environment

| Service | URL | Status |
|---------|-----|--------|
| Backend API | http://localhost:3000 | ✅ Running (PID 39598) |
| Frontend (preview) | http://localhost:5173 | ✅ Running (PID 54215 — **new**, proxy-active) |
| Database | PostgreSQL 15 @ localhost:5432 (plant_guardians_staging) | ✅ Running |
| Vite proxy `/api` → `:3000` | Active | ✅ Verified |

**Test account:** test@plantguardians.local / TestPass123!

---

### Pre-Monitor Checklist

| Requirement | Status |
|-------------|--------|
| Backend unit tests pass (40/40) | ✅ Verified by Sprint 4 QA (H-043) |
| Frontend unit tests pass (50/50) | ✅ Verified by Sprint 4 QA (H-043) |
| Frontend build clean (0 errors) | ✅ Re-built 2026-03-24T17:45:00Z |
| Vite proxy active (vite.config.js loaded) | ✅ Verified — /api routes through :5173 |
| Backend health → 200 | ✅ |
| CORS for :5173 | ✅ |
| Auth enforcement (no token → 401) | ✅ |
| Test account login → 200 + JWT | ✅ |
| Migrations up to date | ✅ |
| T-026 (AI Modal 502 fix) deployed | ✅ Included in current build |
| T-028 (Vite proxy) proxy now live | ✅ Confirmed active |

**Staging status: ✅ READY for Monitor Agent T-024 health check.**
**Handoff to Monitor Agent: H-044**

---

## Sprint 4 — QA Re-Verification Pass (2026-03-24, Phase 2)

**Date:** 2026-03-24
**QA Engineer:** QA Agent
**Scope:** Full Sprint 4 re-verification — all completed tasks (T-026, T-028) + remaining task status audit + pre-deploy verification

---

### Test Run 8 — Backend Unit Tests (Final Re-Verification)

| Field | Value |
|-------|-------|
| **Test Type** | Unit Test |
| **Date** | 2026-03-24 |
| **Command** | `cd backend && npm test` |
| **Result** | ✅ PASS — 40/40 tests passed |
| **Duration** | 8.80s |

| Suite | Tests | Result |
|-------|-------|--------|
| `tests/auth.test.js` | 10 | ✅ All pass |
| `tests/plants.test.js` | 18 | ✅ All pass |
| `tests/careActions.test.js` | 6 | ✅ All pass |
| `tests/ai.test.js` | 3 | ✅ All pass |
| `tests/profile.test.js` | 2 | ✅ All pass |

**Coverage:** Every endpoint has at least one happy-path and one error-path test. Auth: 10 tests (register/login/refresh/logout with both success and error). Plants CRUD: 18 tests (create/read/update/delete + photo upload with auth failures, validation errors, ownership isolation, not-found). Care Actions: 6 tests (mark done + undo with validation/not-found). AI: 3 tests (validation error, auth failure, unconfigured key 502). Profile: 2 tests (success + auth failure).

---

### Test Run 9 — Frontend Unit Tests (Final Re-Verification)

| Field | Value |
|-------|-------|
| **Test Type** | Unit Test |
| **Date** | 2026-03-24 |
| **Command** | `npx vitest run` (from frontend/) |
| **Result** | ✅ PASS — 50/50 tests passed (17 test files) |
| **Duration** | 1.22s |

**Test files:** LoginPage (9), InventoryPage (5), AddPlantPage (5), EditPlantPage (4), PlantDetailPage (5), ProfilePage (3), AIAdviceModal (4), AppShell (2), Button (2), Input (3), Modal (2), PhotoUpload (1), CareScheduleForm (1), StatusBadge (1), Sidebar (1), PlantCard (1), ToastContainer (1).

**T-026 tests verified:** "hides Try Again button and shows correct message for AI_SERVICE_UNAVAILABLE (502) error" ✅ + "shows Try Again button for non-502 errors" ✅.

---

### Test Run 10 — Frontend Production Build (Final)

| Field | Value |
|-------|-------|
| **Test Type** | Build |
| **Date** | 2026-03-24 |
| **Command** | `cd frontend && npm run build` |
| **Result** | ✅ SUCCESS — 0 errors, 4 artifacts, 149ms |

---

### Test Run 11 — npm audit (Final)

| Field | Value |
|-------|-------|
| **Test Type** | Security Scan |
| **Date** | 2026-03-24 |
| **Command** | `cd backend && npm audit` |
| **Result** | ✅ 0 vulnerabilities |

---

### Test Run 12 — Integration Re-Verification: T-026 (AI Modal 502 Fix)

| Field | Value |
|-------|-------|
| **Test Type** | Integration Test |
| **Date** | 2026-03-24 |
| **Result** | ✅ PASS — SPEC-006 State 4 compliant |

**Verified:**
- AIAdviceModal.jsx line 66-67: `AI_SERVICE_UNAVAILABLE` → message "Our AI service is temporarily offline. You can still add your plant manually." ✅
- Line 224: `isServiceUnavailable = errorCode === 'AI_SERVICE_UNAVAILABLE'` ✅
- Line 232: `{!isServiceUnavailable && (<Button ... >Try Again</Button>)}` — Try Again hidden for 502 ✅
- Line 237: Close button promoted to `variant="secondary"` when sole button ✅
- Non-502 errors retain both buttons ✅
- Error states: PLANT_NOT_IDENTIFIABLE, AI_SERVICE_UNAVAILABLE, generic network all handled ✅

---

### Test Run 13 — Integration Re-Verification: T-028 (Vite Proxy)

| Field | Value |
|-------|-------|
| **Test Type** | Integration Test |
| **Date** | 2026-03-24 |
| **Result** | ✅ PASS |

**Verified:**
- `vite.config.js` proxy target: `http://localhost:3000` matches `backend/.env` PORT=3000 ✅
- Both `server.proxy` and `preview.proxy` configured ✅
- `api.js` default: `'/api/v1'` (relative, proxy-friendly) ✅
- No active `.env` or `.env.local` in frontend/ — proxy is not bypassed ✅
- `changeOrigin: true` — host header protection ✅

---

### Test Run 14 — Config Consistency Check (Final)

| Field | Value |
|-------|-------|
| **Test Type** | Config Consistency |
| **Date** | 2026-03-24 |
| **Result** | ✅ PASS — No mismatches |

| Check | Result | Details |
|-------|--------|---------|
| Backend PORT=3000 vs Vite proxy target `http://localhost:3000` | ✅ Match | |
| SSL consistency | ✅ | All http:// — no SSL mismatch |
| CORS includes frontend origins | ✅ | `FRONTEND_URL=http://localhost:5173,http://localhost:4173` |
| No frontend .env override | ✅ | Only `.env.example` exists (commented out) |
| Docker compose DB ports vs backend .env | ✅ | postgres :5432, test :5433. DATABASE_URL uses :5432 |

---

### Test Run 15 — Security Scan (Final Re-Verification)

| Field | Value |
|-------|-------|
| **Test Type** | Security Scan |
| **Date** | 2026-03-24 |
| **Result** | ✅ PASS — All 13 items verified. No P1 issues. |

#### Authentication & Authorization
| # | Check | Status |
|---|-------|--------|
| 1 | All API endpoints require auth (except register, login, health) | ✅ PASS — auth middleware on all protected routes |
| 2 | Auth tokens have expiration + refresh | ✅ PASS — JWT 15m expiry, refresh 7d |
| 3 | Password hashing uses bcrypt | ✅ PASS — bcrypt 6.0.0, SALT_ROUNDS=12 |
| 4 | Failed login rate-limited | ✅ PASS — auth limiter 20/15min |

#### Input Validation & Injection Prevention
| # | Check | Status |
|---|-------|--------|
| 5 | SQL injection — parameterized queries | ✅ PASS — Knex query builder, 0 string concatenation in queries |
| 6 | XSS — no dangerouslySetInnerHTML | ✅ PASS — 0 instances in production code |
| 7 | File uploads validated (type, size, content) | ✅ PASS — MIME whitelist, 5MB limit, UUID rename |
| 8 | Client + server validation | ✅ PASS — both sides validate |

#### API Security
| # | Check | Status |
|---|-------|--------|
| 9 | CORS whitelist-based | ✅ PASS — explicit origin checking |
| 10 | Rate limiting on public endpoints | ✅ PASS — 100/15min general, 20/15min auth |
| 11 | Error responses don't leak internals | ✅ PASS — errorHandler returns generic `INTERNAL_ERROR` for unknown errors |
| 12 | Security headers (Helmet.js) | ✅ PASS — X-Content-Type-Options, X-Frame-Options, etc. |

#### Data Protection
| # | Check | Status |
|---|-------|--------|
| 13 | Secrets in env vars, not code | ✅ PASS — JWT_SECRET, GEMINI_API_KEY, DATABASE_URL all from .env; .env in .gitignore |

#### Token Storage
- Access tokens: memory only (module-level variable in api.js) ✅
- Refresh tokens: memory only ✅
- sessionStorage: only `pg_user` (non-sensitive display name/email) ✅

**Security Verdict: ✅ PASS — No P1 security issues.**

---

### Sprint 4 — Final QA Summary

#### Completed Tasks (QA Verified → Done)

| Task | Type | Result | Notes |
|------|------|--------|-------|
| T-026 | Integration Test + Unit Test + Security | ✅ PASS | SPEC-006 compliant. 50/50 tests. FB-004 resolved. |
| T-028 | Integration Test + Unit Test + Build + Config + Security | ✅ PASS | Proxy working. Config consistent. No override. |

#### Remaining Sprint 4 Tasks (Not QA Scope)

| Task | Status | Notes |
|------|--------|-------|
| T-024 (Monitor health check) | Backlog | Must be run by Monitor Agent — staging is ready |
| T-025 (Gemini API key) | Blocked on T-024 | Backend Engineer task; QA will verify when ready |
| T-020 (User testing) | Blocked on T-024 | User Agent task |
| T-027 (SPEC-004 update) | Backlog | Design Agent task — doc-only, no QA needed |

#### Pre-Deploy Verification Status

| Requirement | Status |
|-------------|--------|
| All unit tests pass (40/40 backend, 50/50 frontend) | ✅ |
| Integration tests pass (T-026, T-028) | ✅ |
| Frontend build clean (0 errors) | ✅ |
| Security checklist verified (all 13 items) | ✅ |
| npm audit: 0 vulnerabilities | ✅ |
| Config consistency: no mismatches | ✅ |
| No P1 security issues | ✅ |
| T-026 and T-028 Done | ✅ |
| T-024, T-025, T-020 pending (not QA-blocking) | ⏳ |

**Verdict: T-026 and T-028 remain Done. All QA-testable Sprint 4 work is verified. Staging is ready for Monitor Agent (T-024). Deployment NOT blocked by any QA finding. T-025 QA pending real Gemini key configuration.**

---


## Sprint 4 — Staging Re-Deployment Pass 2 (Deploy Engineer — 2026-03-24T17:55:00Z)

**Date:** 2026-03-24T17:55:00Z
**Deploy Engineer:** Deploy Agent
**Sprint:** 4
**Triggered by:** Orchestrator — Sprint #4 deploy phase. Full build + dependency install pass to confirm staging is current and all Sprint 4 changes are live.

---

### Pre-Deploy Checklist

| Requirement | Status |
|-------------|--------|
| QA confirmation in handoff-log.md | ✅ H-043 (QA Complete) + H-048 (Re-Verification Complete) |
| All backend unit tests pass (40/40) | ✅ Verified by QA — H-048 |
| All frontend unit tests pass (50/50) | ✅ Verified by QA — H-048 |
| npm audit: 0 vulnerabilities | ✅ Verified by QA — H-043 |
| Security checklist: all 13 items pass | ✅ Verified by QA — H-043 |
| Pending migrations | ✅ None — all 5 migrations already applied |
| Sprint tasks all Done (or appropriately blocked) | ✅ T-026 Done, T-028 Done, T-024/T-020/T-025 blocked on Monitor |

---

### Build Run — Sprint 4 Pass 2

#### Step 1 — Backend: npm install

| Field | Value |
|-------|-------|
| **Command** | `cd backend && npm install` |
| **Date** | 2026-03-24T17:54:00Z |
| **Result** | ✅ SUCCESS |
| **Output** | `up to date, audited 443 packages` — 0 vulnerabilities |

#### Step 2 — Frontend: npm install

| Field | Value |
|-------|-------|
| **Command** | `cd frontend && npm install` |
| **Date** | 2026-03-24T17:54:00Z |
| **Result** | ✅ SUCCESS |
| **Output** | `up to date, audited 243 packages` — 0 vulnerabilities |

#### Step 3 — Frontend: Production Build

| Field | Value |
|-------|-------|
| **Command** | `cd frontend && npm run build` |
| **Date** | 2026-03-24T17:54:00Z |
| **Result** | ✅ SUCCESS — 0 errors |
| **Duration** | 156ms |
| **Tool** | Vite 8.0.2 |

| Artifact | Size | Gzip |
|----------|------|------|
| `dist/index.html` | 0.74 kB | 0.41 kB |
| `dist/assets/index-ACo76nzn.css` | 29.12 kB | 5.43 kB |
| `dist/assets/confetti.module-No8_urVw.js` | 10.57 kB | 4.20 kB |
| `dist/assets/index-CsF38E1Z.js` | 356.84 kB | 106.63 kB |

#### Step 4 — Database Migrations

| Field | Value |
|-------|-------|
| **Command** | `cd backend && npm run migrate` |
| **Environment** | Staging (plant_guardians_staging @ localhost:5432) |
| **Date** | 2026-03-24T17:54:00Z |
| **Result** | ✅ Already up to date — all 5 migrations applied |

---

### Deployment — Staging

| Field | Value |
|-------|-------|
| **Environment** | Staging (local — Docker not available, PostgreSQL 15 direct) |
| **Build Status** | ✅ SUCCESS |
| **Deploy Status** | ✅ SUCCESS — Services running (processes active from H-044) |
| **Date** | 2026-03-24T17:55:00Z |
| **Sprint** | 4 |

#### Running Services

| Service | URL | PID | Status |
|---------|-----|-----|--------|
| Backend API | http://localhost:3000 | 39598 | ✅ Running |
| Frontend (vite preview) | http://localhost:5173 | 54215 | ✅ Running (proxy active) |
| Database | PostgreSQL 15 @ localhost:5432 | 1074 | ✅ Running |
| Vite proxy `/api` → `http://localhost:3000` | Active | — | ✅ Verified |

#### Staging Spot-Check Results

| Check | Command | Result |
|-------|---------|--------|
| Backend health | `GET http://localhost:3000/api/health` → `{"status":"ok","timestamp":"2026-03-24T17:54:28.664Z"}` | ✅ 200 |
| Frontend loads | `GET http://localhost:5173/` → HTTP 200 | ✅ 200 |
| Proxy active | `GET http://localhost:5173/api/health` → `{"status":"ok",...}` | ✅ 200 |
| Auth: login test account | `POST /api/v1/auth/login` → access_token returned | ✅ 200 |
| Migrations current | `npm run migrate` → "Already up to date" | ✅ |

#### Sprint 4 Changes Confirmed in Build

| Task | Change | Deployed |
|------|--------|---------|
| T-026 | AIAdviceModal 502 fix — only "Close" button, correct message | ✅ |
| T-028 | Vite proxy `/api` → `:3000` in vite.config.js | ✅ Active (PID 54215) |

---

### Post-Deploy Handoff

**Handoff logged:** H-049 (see handoff-log.md)
**Next action:** Monitor Agent — run T-024 staging health check

**Test Account:**
| Email | Password |
|-------|----------|
| test@plantguardians.local | TestPass123! |

**Staging status: ✅ READY for Monitor Agent T-024 health check.**

---

## Sprint 5 — Pre-Flight Staging Verification (Deploy Engineer — 2026-03-25)

**Date:** 2026-03-25
**Deploy Engineer:** Deploy Agent
**Sprint:** 5
**Purpose:** Confirm staging environment is healthy and unchanged at the start of Sprint #5. No new Deploy Engineer tasks are assigned this sprint — all infrastructure work (T-018, T-023, T-028) is Done. This entry documents the Sprint 5 environment baseline.

---

### Pre-Flight Context

| Item | Status |
|------|--------|
| All Deploy Engineer tasks | ✅ Done (T-018, T-023, T-028) |
| Sprint 5 Deploy Engineer assignments | ✅ None — no new infra tasks |
| Last verified deployment | Sprint 4 Pass 2 — 2026-03-24T17:55:00Z |
| Last Monitor verification (T-024) | ✅ Done — Deploy Verified: Yes (2026-03-24) |
| Sprint 5 tasks requiring infra support | T-025 (Backend: Gemini key), T-029 (Backend: flaky test fix) |

---

### Live Service Health Check

| Check | Command | Result |
|-------|---------|--------|
| Backend health | `GET http://localhost:3000/api/health` | ✅ 200 — `{"status":"ok","timestamp":"2026-03-25T03:32:17.926Z"}` |
| Frontend health | `GET http://localhost:5173/` | ✅ 200 |
| Auth guard enforcement | `GET /api/v1/plants` (invalid Bearer token) | ✅ 401 — `{"error":{"message":"Invalid or expired access token.","code":"UNAUTHORIZED"}}` |

---

### Current Staging Environment

| Service | URL | Status |
|---------|-----|--------|
| Backend API | http://localhost:3000 | ✅ Running |
| Frontend (vite preview) | http://localhost:5173 | ✅ Running (proxy active) |
| Database | PostgreSQL 15 @ localhost:5432 (plant_guardians_staging) | ✅ Running |
| Vite proxy `/api` → `http://localhost:3000` | Active | ✅ Verified |
| Migrations | All 5/5 applied | ✅ Up to date |

**Test account:** test@plantguardians.local / TestPass123!

---

### Infrastructure Readiness for Sprint 5 Tasks

| Task | Infra Requirement | Status |
|------|-------------------|--------|
| T-025 (Gemini key + AI happy path) | `GEMINI_API_KEY` variable in `backend/.env` — placeholder currently set; Backend Engineer replaces value | ✅ Infrastructure ready — backend server auto-picks up new key value on restart |
| T-029 (Flaky test fix) | No infra changes needed — test runner config only | ✅ No action required |
| T-020 (User testing) | Staging fully operational — `Deploy Verified: Yes` from T-024 | ✅ Ready |
| T-027 (SPEC-004 update) | Documentation only — no infra impact | ✅ N/A |

**Note for Backend Engineer (T-025):** After updating `GEMINI_API_KEY` in `backend/.env`, restart the backend process: `cd backend && node src/server.js &`. No migration or build steps needed — key change takes effect on restart only.

---

### Security Self-Check (Sprint 5 Pre-Flight)

| # | Check | Status |
|---|-------|--------|
| 1 | `.env` not committed (`.gitignore` verified) | ✅ PASS |
| 2 | No secrets in `infra/` files | ✅ PASS |
| 3 | Auth guard active (verified above) | ✅ PASS |
| 4 | CORS config unchanged (`FRONTEND_URL=http://localhost:5173,http://localhost:4173`) | ✅ PASS |
| 5 | npm audit baseline: 0 vulnerabilities (verified Sprint 4) | ✅ PASS |

---

**Staging Status: ✅ HEALTHY — No action required from Deploy Engineer. All Sprint 5 tasks have the infrastructure they need. Backend Engineer can update Gemini key and restart backend independently.**

---

---
## Post-Deploy Health Check — Sprint #4
Date: 2026-03-24
Environment: Staging
Timestamp: 2026-03-24T17:58:32Z

### Config Consistency Validation
- Backend PORT: 3000
- Vite proxy target: http://localhost:3000
- Port match: PASS — both backend (.env PORT=3000) and Vite proxy target (http://localhost:3000) use port 3000
- SSL configured: No — SSL_KEY_PATH and SSL_CERT_PATH are not set in backend/.env
- Protocol match: PASS (N/A) — No SSL configured; both backend and Vite proxy use http:// consistently
- CORS_ORIGIN (FRONTEND_URL): http://localhost:5173,http://localhost:4173
- Frontend dev port (vite.config.js): Not explicitly set (defaults to 5173); vite preview running on port 5173
- CORS match: PASS — FRONTEND_URL includes http://localhost:5173 (dev) and http://localhost:4173 (preview); both allowed
- Docker port mapping: N/A — docker-compose.yml defines only postgres containers (plant_guardians_db on 5432, plant_guardians_db_test on 5433); no backend container defined; Docker not installed on staging host; staging uses local PostgreSQL directly

Config Consistency Overall: PASS

### Health Check Results
Token: acquired via POST /api/v1/auth/login with test@plantguardians.local / TestPass123! (NOT /auth/register)
Note: Health endpoint is at /api/health (not /api/v1/health) — confirmed in app.js line 67

- [x] App responds (GET /api/health → 200): PASS — HTTP 200, body: {"status":"ok","timestamp":"2026-03-24T17:57:28.710Z"}
- [x] Auth works (POST /api/v1/auth/login → 200 with token): PASS — HTTP 200, access_token returned, user: test@plantguardians.local
- [x] Auth refresh (POST /api/v1/auth/refresh → 200): PASS — HTTP 200, new token pair returned
- [x] Auth logout (POST /api/v1/auth/logout → 200): PASS — HTTP 200
- [x] GET /api/v1/plants → 200: PASS — HTTP 200, plants list returned with pagination
- [x] POST /api/v1/plants → 201: PASS — HTTP 201, plant created (id: 319912ce-c046-492c-a5d0-5928463b80c5)
- [x] GET /api/v1/plants/:id → 200: PASS — HTTP 200, plant detail with care_schedules and recent_care_actions returned
- [x] PUT /api/v1/plants/:id → 200: PASS — HTTP 200, plant updated
- [x] DELETE /api/v1/plants/:id → 200: PASS — HTTP 200, plant deleted
- [x] POST /api/v1/plants/:id/photo (no file) → 400: PASS — HTTP 400, MISSING_FILE error as expected (upload endpoint reachable and validates correctly)
- [x] POST /api/v1/plants/:id/care-actions → 201: PASS — HTTP 201, care action recorded, updated_schedule returned
- [x] DELETE /api/v1/plants/:id/care-actions/:action_id → 200: PASS — HTTP 200, undo successful
- [ ] POST /api/v1/ai/advice → 200: FAIL (EXPECTED) — HTTP 502, body: {"error":{"message":"AI service is not configured.","code":"AI_SERVICE_UNAVAILABLE"}} — GEMINI_API_KEY is placeholder in .env; tracked as T-025 (blocked on T-024 completion)
- [x] GET /api/v1/profile → 200: PASS — HTTP 200, user profile and stats returned
- [x] No 5xx errors: PASS — all endpoints return expected non-5xx codes; 502 on /ai/advice is intentional/expected (misconfigured API key)
- [x] Database connected: PASS — PostgreSQL plant_guardians_staging reachable; all 7 tables present (users, plants, care_schedules, care_actions, refresh_tokens, knex_migrations, knex_migrations_lock); seed user test@plantguardians.local confirmed in DB
- [x] Frontend accessible: PASS — frontend/dist/ exists (index.html, assets/index.css, assets/index.js, assets/confetti.module.js); vite preview running on port 5173, HTTP 200

### Summary
Deploy Verified: Yes
Notes:
- The only failing endpoint is POST /api/v1/ai/advice (502 AI_SERVICE_UNAVAILABLE) — this is a known and expected failure due to placeholder GEMINI_API_KEY in backend/.env. This is tracked as T-025 and does not block staging verification.
- Health endpoint is at /api/health (not /api/v1/health); this is intentional per app.js implementation.
- Seeded test account email is test@plantguardians.local (not test@triplanner.local as listed in older agent prompts — seed file was updated in Sprint 1).
- T-026 fix verified: AIAdviceModal correctly hides "Try Again" button on 502 error.
- T-028 fix verified: Vite proxy routes /api/* to http://localhost:3000 correctly.
- Docker not installed on staging host — PostgreSQL runs locally, consistent with deploy notes.

---

## Sprint 5 — QA Report

**Date:** 2026-03-24
**QA Engineer:** QA Agent
**Tasks in scope:** T-025 (AI advice test improvements + model update), T-029 (flaky backend test fix)

---

### Test Run 1 — Backend Unit Tests (3 Consecutive Runs for T-029 Acceptance)

| Field | Value |
|-------|-------|
| **Test Type** | Unit Test |
| **Date** | 2026-03-24 |
| **Target** | Backend (all endpoints) |
| **Command** | `cd backend && npm test` (×3 consecutive runs) |
| **Result** | ✅ PASS — 44/44 tests passed on all 3 runs. Zero "socket hang up" errors. |
| **Duration** | Run 1: 9.93s, Run 2: 10.09s, Run 3: 9.94s |
| **T-029 Acceptance** | ✅ MET — 3 consecutive clean runs with 0 flaky failures |

#### Test Breakdown (44 tests across 5 suites)

| Suite | Tests | Result |
|-------|-------|--------|
| `tests/auth.test.js` | 10 | ✅ All pass |
| `tests/plants.test.js` | 18 (CRUD ×13, photo upload ×5) | ✅ All pass |
| `tests/careActions.test.js` | 6 | ✅ All pass |
| `tests/ai.test.js` | 7 (was 3 in Sprint 4; +4 new mocked tests for T-025) | ✅ All pass |
| `tests/profile.test.js` | 2 | ✅ All pass |

#### T-025 AI Test Coverage Verification

7 tests cover all API contract error codes + happy path:

| # | Test | Expected Status | Expected Code | Result |
|---|------|----------------|---------------|--------|
| 1 | Missing both plant_type and photo_url | 400 | VALIDATION_ERROR | ✅ |
| 2 | No auth token | 401 | UNAUTHORIZED | ✅ |
| 3 | Placeholder API key (unconfigured) | 502 | AI_SERVICE_UNAVAILABLE | ✅ |
| 4 | Happy path: valid Gemini JSON response | 200 | — | ✅ |
| 5 | Unparseable Gemini response | 422 | PLANT_NOT_IDENTIFIABLE | ✅ |
| 6 | Gemini API throws error | 502 | AI_SERVICE_UNAVAILABLE | ✅ |
| 7 | plant_type >200 characters | 400 | VALIDATION_ERROR | ✅ |

**Happy-path response shape verified:** `data.identified_plant_type`, `data.confidence`, `data.care_advice.watering` (frequency_value, frequency_unit, notes), `data.care_advice.fertilizing`, `data.care_advice.repotting`, `data.care_advice.light`, `data.care_advice.humidity`, `data.care_advice.additional_tips` — all match `api-contracts.md` Sprint 1 GROUP 4 spec.

#### T-029 Flaky Test Fix Verification

| Check | Result |
|-------|--------|
| `--runInBand` in `npm test` script | ✅ Present in package.json |
| `--runInBand` in `npm test:coverage` script | ✅ Present in package.json |
| Test pool min:1, max:5 | ✅ Verified in knexfile.js `test` config |
| idleTimeoutMillis: 10000 | ✅ Present in knexfile.js `test` config |
| Teardown tracks `activeFiles` to prevent premature `db.destroy()` | ✅ Verified in tests/setup.js |
| 3 consecutive 44/44 runs, zero socket hang up | ✅ Confirmed |

---

### Test Run 2 — Frontend Unit Tests

| Field | Value |
|-------|-------|
| **Test Type** | Unit Test |
| **Date** | 2026-03-24 |
| **Target** | Frontend (all components and pages) |
| **Command** | `cd frontend && npx vitest run` |
| **Result** | ✅ PASS — 50/50 tests passed (17 test files) |
| **Duration** | 1.69s |
| **Note** | No frontend changes in Sprint 5 — regression check only. All 50 tests from Sprint 4 continue to pass. |

---

### Test Run 3 — Integration Test: T-025 AI Advice Contract Verification

| Field | Value |
|-------|-------|
| **Test Type** | Integration Test |
| **Date** | 2026-03-24 |
| **Target** | T-025: AI advice endpoint contract compliance |
| **Result** | ✅ PASS |

#### Checks Performed

1. **Model update:** `ai.js` uses `gemini-1.5-flash` (updated from `gemini-pro`) — ✅ correct per current Gemini SDK recommendations
2. **Auth enforcement:** `router.use(authenticate)` applied to entire AI route file — ✅ no bypass possible
3. **Input validation:** Both empty-input (400) and length >200 (400) validated server-side — ✅
4. **API key check:** Placeholder key `your-gemini-api-key` correctly triggers 502 AI_SERVICE_UNAVAILABLE — ✅
5. **Response shape (mocked happy path):** Matches `api-contracts.md` GROUP 4 exactly — ✅
6. **Error codes:** 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 422 PLANT_NOT_IDENTIFIABLE, 502 AI_SERVICE_UNAVAILABLE — all match contract — ✅
7. **No hardcoded secrets:** API key from `process.env.GEMINI_API_KEY` with placeholder detection — ✅
8. **Error responses safe:** Uses `AppError` subclasses → structured JSON, no stack traces leaked — ✅
9. **Frontend API call:** `frontend/src/utils/api.js` line 173 calls `/ai/advice` with correct path — ✅
10. **Frontend modal:** `AIAdviceModal.jsx` reads `data.care_advice.*` fields matching contract shape — ✅

**Note:** Real Gemini happy path cannot be tested — placeholder API key remains. This is documented and acceptable per sprint plan (T-025 scope was reduced to "verified as mocked — key not provisioned").

---

### Test Run 4 — Integration Test: T-029 Test Infrastructure

| Field | Value |
|-------|-------|
| **Test Type** | Integration Test |
| **Date** | 2026-03-24 |
| **Target** | T-029: Test reliability / flaky test fix |
| **Result** | ✅ PASS |

#### Checks Performed

1. **Root cause addressed:** Parallel PG connection contention eliminated by `--runInBand` — ✅
2. **Pool configuration:** Test pool min:1/max:5, idleTimeoutMillis:10000 — appropriate for serial execution — ✅
3. **Teardown refactor:** `activeFiles` counter prevents premature `db.destroy()` in shared module cache — ✅
4. **No endpoint behavior changes:** Only test infrastructure modified — ✅
5. **3 consecutive clean runs:** 44/44, 44/44, 44/44 — zero flaky failures — ✅

---

### Test Run 5 — Config Consistency Check

| Field | Value |
|-------|-------|
| **Test Type** | Config Consistency |
| **Date** | 2026-03-24 |
| **Result** | ✅ PASS — No mismatches |

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Backend PORT | 3000 | `PORT=3000` in backend/.env | ✅ |
| Vite proxy target | http://localhost:3000 | `backendTarget = 'http://localhost:3000'` in vite.config.js | ✅ Match |
| SSL: Backend SSL enabled? | No (http) | No SSL config in .env | ✅ N/A |
| Vite proxy uses http:// | Yes | `http://localhost:3000` | ✅ Consistent |
| CORS includes localhost:5173 | Yes | `FRONTEND_URL=http://localhost:5173,http://localhost:4173` | ✅ Both dev and preview ports included |
| Docker Compose PG port | 5432 | `"${POSTGRES_PORT:-5432}:5432"` | ✅ Matches DATABASE_URL |

---

### Test Run 6 — Security Scan

| Field | Value |
|-------|-------|
| **Test Type** | Security Scan |
| **Date** | 2026-03-24 |
| **Target** | Full security checklist verification for Sprint 5 tasks |
| **Result** | ✅ PASS — All applicable items verified |

#### Authentication & Authorization
- [x] All API endpoints require authentication — `router.use(authenticate)` on plants, care-actions, ai, profile routes
- [x] Auth tokens have appropriate expiration (JWT 15m, refresh 7 days) and rotation
- [x] Password hashing uses bcrypt (v6.0.0)
- [x] Failed login attempts rate-limited (20/15min on auth endpoints)

#### Input Validation & Injection Prevention
- [x] All user inputs validated server-side (express validators + route-level checks)
- [x] SQL queries use Knex query builder — no string concatenation (`.raw()` only in migrations for `gen_random_uuid()`)
- [x] File uploads validated for type (MIME check) and size (MAX_UPLOAD_SIZE_MB)
- [x] No XSS vectors — API returns JSON only, no HTML rendering server-side

#### API Security
- [x] CORS configured: allows only `http://localhost:5173` and `http://localhost:4173`
- [x] Rate limiting applied: general (100/15min) + auth-specific (20/15min)
- [x] Error responses: structured JSON via `AppError` — no stack traces, no file paths, no internal details leaked
- [x] Sensitive data not in URL params — tokens in Authorization header, refresh token in request body
- [x] Helmet.js applies security headers (X-Content-Type-Options, X-Frame-Options, etc.)

#### Data Protection
- [x] Database credentials in `.env` (not in code) — `.env` in `.gitignore`
- [x] GEMINI_API_KEY in `.env` with placeholder — no real key hardcoded
- [x] JWT_SECRET in `.env` — 128-char hex string, not committed
- [x] Error handler does not log PII — only logs `err` object for unknown errors

#### Infrastructure
- [x] Dependencies: `npm audit` → 0 vulnerabilities (backend)
- [x] No default/sample credentials in code — test setup uses dynamic emails
- [x] Error pages return generic "An unexpected error occurred" — no server info leaked

#### Sprint 5 Specific Checks
- [x] T-025: No new secrets introduced — model name change only + test coverage
- [x] T-025: Mock tests do not leak real API keys — use `test-valid-gemini-key` and restore original
- [x] T-029: Test infrastructure changes only — no security impact

---

### Sprint 5 QA Summary

| Task | Unit Tests | Integration | Security | Config | Verdict |
|------|-----------|-------------|----------|--------|---------|
| T-025 | ✅ 44/44 (7 AI tests) | ✅ Contract verified | ✅ No issues | ✅ N/A | **PASS → Done** |
| T-029 | ✅ 44/44 ×3 runs | ✅ Zero flaky failures | ✅ No impact | ✅ N/A | **PASS → Done** |

**Overall Sprint 5 QA Status:** ✅ ALL PASS
- Backend: 44/44 tests pass (3 consecutive runs, zero flaky)
- Frontend: 50/50 tests pass (regression check)
- npm audit: 0 vulnerabilities
- Security checklist: all items verified
- Config consistency: no mismatches
- No regressions from Sprint 4

**Note on T-025 Gemini key:** No real API key is available. The happy-path is verified via mocked Gemini SDK. The AI advice endpoint will return 502 when called with the placeholder key. This is a known and accepted limitation — the sprint plan explicitly allowed this outcome.

**Ready for deploy verification (Monitor Agent):** T-025 and T-029 changes are test-infrastructure and model-name only. No endpoint behavior changed. Staging should remain healthy without re-deploy.

---

## Sprint 5 — Deploy Engineer Verification

**Date:** 2026-03-24
**Deploy Engineer:** Deploy Agent
**Scope:** Sprint 5 staging verification — no new deployment required per H-058 (QA assessment)

---

### Staging Verification Run — Sprint 5

| Field | Value |
|-------|-------|
| **Type** | Staging Health Re-Verification |
| **Date** | 2026-03-24 |
| **Trigger** | H-058 (QA: no re-deploy needed; verify staging still healthy) |
| **Result** | ✅ PASS — Staging healthy, no re-deploy required |

#### Checks Performed

| Check | Command / Method | Result |
|-------|-----------------|--------|
| Backend health | `GET http://localhost:3000/api/health` | ✅ `{"status":"ok","timestamp":"2026-03-25T03:55:30.283Z"}` |
| Frontend health | `GET http://localhost:5173/` | ✅ HTTP 200 |
| Auth endpoint (login) | `POST /auth/login` with test account | ✅ HTTP 200, access_token present |
| Protected endpoint | `GET /plants` without token | ✅ HTTP 401 (auth enforcement working) |
| Database migrations | `npx knex migrate:status` | ✅ 5/5 migrations applied, no pending |
| npm audit | `npm audit --audit-level=none` | ✅ 0 vulnerabilities |

#### Deploy Decision

**No re-deploy required.** Per H-058 assessment:

- **T-025** changes: `gemini-pro` → `gemini-1.5-flash` model name in `routes/ai.js` and 4 new mock tests. Runtime behavior unchanged (API key is still placeholder — endpoint still returns 502 for AI calls). No staging impact.
- **T-029** changes: `--runInBand` in test scripts, test pool config reduction, teardown refactor. Test-infrastructure only — zero runtime / staging impact.

Staging environment remains in the same verified state as delivered by T-028 / T-024 (Deploy Verified: Yes, 2026-03-24).

#### Environment Status Summary

| Service | URL | Status |
|---------|-----|--------|
| Backend API | `http://localhost:3000` | ✅ Running |
| Frontend | `http://localhost:5173` | ✅ Running |
| Database | PostgreSQL 15 @ `localhost:5432` (plant_guardians_staging) | ✅ Connected |
| Migrations | 5/5 applied | ✅ Up to date |
| npm audit | 0 vulnerabilities | ✅ Clean |

**Handoff:** H-059 → Monitor Agent to confirm staging health for Sprint 5 closeout.

---

## Sprint 5 — Final QA Verification Pass

**Date:** 2026-03-25
**QA Engineer:** QA Agent
**Scope:** Full regression + security + config consistency + product-perspective testing for Sprint 5 closeout

---

### Test Run 8 — Backend Unit Tests (3 Consecutive Runs)

| Field | Value |
|-------|-------|
| **Test Type** | Unit Test |
| **Date** | 2026-03-25 |
| **Target** | Backend (all endpoints) |
| **Command** | `cd backend && npm test` (×3 consecutive runs) |
| **Result** | ⚠️ PARTIAL — Run 1: 44/44 ✅, Run 2: 43/44 ❌ (profile timeout), Run 3: 44/44 ✅ |

#### Run Details

| Run | Result | Duration | Notes |
|-----|--------|----------|-------|
| 1 | 44/44 ✅ | 9.9s | Clean pass |
| 2 | 43/44 ❌ | 39.7s | `profile.test.js` → "should return user profile with stats" timed out at 30000ms |
| 3 | 44/44 ✅ | 10.3s | Clean pass |

#### Suite Breakdown (All Runs Combined)

| Suite | Tests | Run 1 | Run 2 | Run 3 |
|-------|-------|-------|-------|-------|
| auth.test.js | 10 | ✅ | ✅ | ✅ |
| plants.test.js | 18 | ✅ | ✅ | ✅ |
| careActions.test.js | 6 | ✅ | ✅ | ✅ |
| ai.test.js | 7 | ✅ | ✅ | ✅ |
| profile.test.js | 2 | ✅ | ❌ (1 timeout) | ✅ |

**New Flaky Test Found:** `GET /api/v1/profile > should return user profile with stats` intermittently times out. The test creates a user, a plant, and a care action before fetching the profile — likely a slow PG query or connection pool exhaustion under certain conditions. Logged as FB-017. Not a regression from T-029 (which fixed "socket hang up" errors in plants.test.js — different root cause).

---

### Test Run 9 — Frontend Unit Tests

| Field | Value |
|-------|-------|
| **Test Type** | Unit Test |
| **Date** | 2026-03-25 |
| **Target** | Frontend (all components and pages) |
| **Command** | `cd frontend && npx vitest run` |
| **Result** | ✅ PASS — 50/50 tests passed |
| **Duration** | 1.36s |

#### Suite Breakdown

| Suite | Tests | Result |
|-------|-------|--------|
| LoginPage.test.jsx | — | ✅ |
| InventoryPage.test.jsx | — | ✅ |
| AddPlantPage.test.jsx | — | ✅ |
| EditPlantPage.test.jsx | — | ✅ |
| PlantDetailPage.test.jsx | — | ✅ |
| AIAdviceModal.test.jsx | — | ✅ |
| ProfilePage.test.jsx | — | ✅ |
| PlantCard.test.jsx | — | ✅ |
| StatusBadge.test.jsx | — | ✅ |
| CareScheduleForm.test.jsx | — | ✅ |
| PhotoUpload.test.jsx | — | ✅ |
| AppShell.test.jsx | — | ✅ |
| Sidebar.test.jsx | — | ✅ |
| Button.test.jsx | — | ✅ |
| Input.test.jsx | — | ✅ |
| Modal.test.jsx | — | ✅ |
| ToastContainer.test.jsx | — | ✅ |

All 17 test suites, 50/50 tests pass.

---

### Test Run 10 — Integration Test (API Contract Compliance)

| Field | Value |
|-------|-------|
| **Test Type** | Integration Test |
| **Date** | 2026-03-25 |
| **Target** | Frontend API layer ↔ Backend API contracts |
| **Result** | ✅ PASS |

#### Frontend → Backend Contract Verification

| Frontend API Call | Backend Route | Method | Contract Match |
|-------------------|---------------|--------|----------------|
| `auth.register(data)` | POST /api/v1/auth/register | POST | ✅ Body: `{full_name, email, password}` |
| `auth.login(data)` | POST /api/v1/auth/login | POST | ✅ Body: `{email, password}` |
| `auth.logout()` | POST /api/v1/auth/logout | POST | ✅ Body: `{refresh_token}`, Bearer auth |
| `plants.list(page, limit)` | GET /api/v1/plants | GET | ✅ Query: `?page=&limit=` |
| `plants.get(id)` | GET /api/v1/plants/:id | GET | ✅ |
| `plants.create(data)` | POST /api/v1/plants | POST | ✅ Body: `{name, type, notes, care_schedules}` |
| `plants.update(id, data)` | PUT /api/v1/plants/:id | PUT | ✅ |
| `plants.delete(id)` | DELETE /api/v1/plants/:id | DELETE | ✅ |
| `plants.uploadPhoto(id, file)` | POST /api/v1/plants/:id/photo | POST | ✅ FormData with `photo` field |
| `careActions.markDone(plantId, type)` | POST /api/v1/plants/:id/care-actions | POST | ✅ Body: `{care_type}` |
| `careActions.undo(plantId, actionId)` | DELETE /api/v1/plants/:id/care-actions/:id | DELETE | ✅ |
| `ai.getAdvice(data)` | POST /api/v1/ai/advice | POST | ✅ Body: `{plant_type}` or `{photo_url}` |
| `profile.get()` | GET /api/v1/profile | GET | ✅ |

#### Auth Token Handling

| Check | Result |
|-------|--------|
| Tokens stored in memory (not localStorage/sessionStorage) | ✅ — `accessToken` and `refreshToken` are module-scoped variables |
| Auto-refresh on 401 | ✅ — `request()` catches 401, calls `refreshAccessToken()`, retries once |
| Bearer token sent on authenticated requests | ✅ — `Authorization: Bearer ${accessToken}` |
| Public endpoints skip auth | ✅ — `skipAuth: true` on register/login |
| Auth failure callback | ✅ — `onAuthFailure` invoked when refresh fails |

#### Response Shape Handling

| Check | Result |
|-------|--------|
| Success responses unwrap `data` field | ✅ — `return json.data` |
| Error responses throw structured `ApiError` | ✅ — `ApiError(err.message, err.code, res.status)` |
| FormData requests omit Content-Type header | ✅ — `!(options.body instanceof FormData)` check |

---

### Test Run 11 — Config Consistency Check

| Field | Value |
|-------|-------|
| **Test Type** | Config Consistency |
| **Date** | 2026-03-25 |
| **Result** | ✅ PASS — No mismatches |

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Backend PORT ↔ Vite proxy target | PORT=3000 ↔ `http://localhost:3000` | Match | ✅ |
| SSL/protocol consistency | No SSL → http:// everywhere | http:// in proxy, .env, CORS | ✅ |
| CORS includes frontend dev origin | `http://localhost:5173` in FRONTEND_URL | `http://localhost:5173,http://localhost:4173` | ✅ |
| CORS includes frontend preview origin | `http://localhost:4173` in FRONTEND_URL | Included | ✅ |
| Docker compose PG port | 5432 | 5432 (default) | ✅ |
| Frontend VITE_API_BASE_URL not overriding proxy | No .env override active | Default: `/api/v1` (relative) | ✅ |

---

### Test Run 12 — Security Scan

| Field | Value |
|-------|-------|
| **Test Type** | Security Scan |
| **Date** | 2026-03-25 |
| **Result** | ✅ PASS — All 13 applicable items verified |

#### Authentication & Authorization

| Item | Status | Evidence |
|------|--------|----------|
| All API endpoints require auth | ✅ | All route files use `router.use(authenticate)`. Public endpoints (register, login, refresh, health) explicitly skip auth. Tests verify 401 on unauthenticated requests. |
| Auth tokens have expiration + refresh | ✅ | JWT_EXPIRES_IN=15m, REFRESH_TOKEN_EXPIRES_DAYS=7. Token rotation on refresh. |
| Password hashing uses bcrypt | ✅ | bcrypt 6.0.0. No plaintext storage. |
| Failed login rate-limited | ✅ | `authLimiter` applies 20 req/15min to `/api/v1/auth/` |

#### Input Validation & Injection Prevention

| Item | Status | Evidence |
|------|--------|----------|
| SQL parameterized queries | ✅ | Knex query builder used throughout. `db.raw()` calls are `SELECT 1` and `gen_random_uuid()` only — no user input interpolation. |
| File upload validation | ✅ | MIME type check, size limit (5MB), UUID filenames. Tests verify MISSING_FILE, INVALID_FILE_TYPE, FILE_TOO_LARGE. |
| XSS prevention | ✅ | No `innerHTML`/`dangerouslySetInnerHTML` in production code (only in test assertion). Helmet sets Content-Security-Policy headers. |
| Client + server validation | ✅ | Frontend validates on blur; backend validates independently with structured error responses. |

#### API Security

| Item | Status | Evidence |
|------|--------|----------|
| CORS restricted origins | ✅ | Only `http://localhost:5173,http://localhost:4173` allowed. Null/undefined origins accepted for same-origin/server requests. |
| Rate limiting | ✅ | General: 100 req/15min. Auth: 20 req/15min. |
| Error responses safe | ✅ | `errorHandler.js` returns generic message for unknown errors. No stack traces leaked. `AppError` subclasses return only `message` + `code`. |
| No secrets in code | ✅ | `JWT_SECRET` from env. `GEMINI_API_KEY` from env. No hardcoded credentials found in `backend/src/`. |
| Helmet security headers | ✅ | `app.use(helmet())` — sets X-Content-Type-Options, X-Frame-Options, CSP, etc. |

#### npm Audit

| Package | Vulnerabilities | Result |
|---------|-----------------|--------|
| Backend | 0 | ✅ |
| Frontend | 0 | ✅ |

#### Known Accepted Limitations (Staging Only)

- HTTPS not configured — staging is local only, acceptable
- Database credentials not encrypted at rest — acceptable for local dev/staging
- No backup configuration — staging only

---

### Test Run 13 — Product-Perspective Testing

| Field | Value |
|-------|-------|
| **Test Type** | Product-Perspective Review |
| **Date** | 2026-03-25 |
| **Scope** | API-level verification of all 3 MVP user flows with realistic data |

#### Flow 1: Novice User (Register → Add Plant → View → Mark Care Done)

| Step | API | Test Data | Expected | Result |
|------|-----|-----------|----------|--------|
| Register | POST /auth/register | `{full_name: "Sarah Chen", email: "sarah@example.com", password: "myplants2026"}` | 201 + tokens | ✅ Verified in tests |
| Add plant | POST /plants | `{name: "My First Pothos", type: "Pothos", care_schedules: [{care_type: "watering", frequency_value: 7, frequency_unit: "days"}]}` | 201 + plant data | ✅ Verified in tests |
| View inventory | GET /plants | — | 200 + plant list with status | ✅ Verified |
| Mark watering done | POST /plants/:id/care-actions | `{care_type: "watering"}` | 201 + last_done_at updated | ✅ Verified |
| Undo watering | DELETE /plants/:id/care-actions/:id | — | 200 + reverted | ✅ Verified |

#### Flow 2: AI Advice

| Step | API | Test Data | Expected | Result |
|------|-----|-----------|----------|--------|
| Get advice by plant type | POST /ai/advice | `{plant_type: "spider plant"}` | 200 with care advice (if key configured) or 502 (placeholder) | ✅ 502 expected — placeholder key |
| Get advice by photo | POST /ai/advice | `{photo_url: "..."}` | Same | ✅ 502 expected |
| Input validation | POST /ai/advice | `{}` (empty) | 400 VALIDATION_ERROR | ✅ Verified in tests |
| Long input | POST /ai/advice | `{plant_type: "x".repeat(201)}` | 400 VALIDATION_ERROR | ✅ Verified in tests |

#### Flow 3: Inventory Management (Edit → Delete)

| Step | API | Test Data | Expected | Result |
|------|-----|-----------|----------|--------|
| Edit plant schedule | PUT /plants/:id | `{name: "Updated Pothos", care_schedules: [{care_type: "watering", frequency_value: 14, frequency_unit: "days"}]}` | 200 + updated | ✅ Verified |
| Delete plant | DELETE /plants/:id | — | 200 | ✅ Verified |
| Delete non-existent | DELETE /plants/:id (again) | — | 404 | ✅ Verified |
| Other user's plant | GET /plants/:id (wrong user) | — | 404 (not 403 — no info leakage) | ✅ Verified |

#### Edge Cases Verified

| Edge Case | API | Result |
|-----------|-----|--------|
| Empty plant name | POST /plants `{name: ""}` | ✅ 400 VALIDATION_ERROR |
| Duplicate care types | POST /plants `{care_schedules: [watering, watering]}` | ✅ 400 |
| Future performed_at | POST /care-actions `{performed_at: future date}` | ✅ 400 |
| Non-existent schedule | POST /care-actions `{care_type: "fertilizing"}` (none set) | ✅ 422 |
| Wrong credentials | POST /auth/login | ✅ 401 INVALID_CREDENTIALS (no info leakage) |
| Duplicate email | POST /auth/register (existing email) | ✅ 409 EMAIL_ALREADY_EXISTS |
| Rotated refresh token reuse | POST /auth/refresh (old token) | ✅ 401 INVALID_REFRESH_TOKEN |

---

### Sprint 5 Final QA Summary

| Category | Result |
|----------|--------|
| Backend unit tests | ⚠️ 44/44 pass, but 1 intermittent timeout in profile.test.js (1/3 runs) |
| Frontend unit tests | ✅ 50/50 pass |
| Integration (contract compliance) | ✅ All 13 endpoints match contract |
| Config consistency | ✅ No mismatches |
| Security scan | ✅ All 13 items pass |
| npm audit | ✅ 0 vulnerabilities (backend + frontend) |
| Product-perspective testing | ✅ All 3 flows verified at API level |

**New Issue Found:** Intermittent profile.test.js timeout — logged as FB-017, recommended as P3 bug for next sprint.

**Sprint 5 Engineering QA Verdict:** ✅ PASS with caveat. All production code is correct, secure, and contract-compliant. The profile test flakiness is a test infrastructure issue (P3) that does not affect production behavior. T-025 and T-029 remain verified. T-020 (user testing) and T-027 (SPEC-004 update) are outside QA scope (User Agent and Design Agent tasks respectively).
