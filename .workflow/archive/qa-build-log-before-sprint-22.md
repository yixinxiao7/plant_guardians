## Sprint 21 — Monitor Agent: Post-Deploy Health Check (2026-04-05)

**Timestamp:** 2026-04-05T20:25:00Z
**Agent:** Monitor Agent
**Sprint:** #21
**Environment:** Staging (local Node.js processes)
**Git SHA Deployed:** d8a7b17
**Reference Handoff:** H-289 (Deploy Engineer → Monitor Agent)

---

### Config Consistency Validation

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Backend PORT (`.env`) | — | `3000` | ✅ PASS |
| Vite proxy target port (`vite.config.js`) | must match PORT=3000 | `http://localhost:3000` | ✅ PASS — ports match |
| Vite proxy protocol | HTTP (no SSL certs in .env) | `http://` | ✅ PASS — no SSL keys set, HTTP correct |
| CORS origin includes frontend dev server | `http://localhost:5173` in FRONTEND_URL | `http://localhost:5173,http://localhost:5174,http://localhost:4173,http://localhost:4175` | ✅ PASS |
| Docker port mapping | N/A | Docker not available — services run as local Node.js processes | ✅ N/A — docker-compose.yml defines postgres only (port 5432), no backend container port conflict |
| SSL_KEY_PATH / SSL_CERT_PATH | — | Not set in `.env` — backend runs HTTP | ✅ PASS — consistent with Vite proxy using `http://` |

**Config Consistency: ALL PASS**

---

### Health Check Results

#### Baseline: GET /api/health

| Check | Result |
|-------|--------|
| HTTP Status | `200 OK` |
| Response Body | `{"status":"ok","timestamp":"2026-04-05T20:24:29.347Z"}` |
| Result | ✅ PASS |

*Note: Actual health path is `/api/health` (not `/api/v1/health`). The pre-deploy smoke test from Deploy Engineer confirmed this path. Tested `/api/v1/health` first — returned 404 as expected (no v1 health route). Confirmed working path is `/api/health`.*

---

#### Auth: POST /api/v1/auth/login

| Check | Result |
|-------|--------|
| HTTP Status | `200 OK` |
| Response | Access token issued for `test@plantguardians.local` |
| `data.access_token` present | ✅ Yes |
| `data.user.email` | `test@plantguardians.local` |
| Result | ✅ PASS |

---

#### Auth: POST /api/v1/auth/refresh (invalid token)

| Check | Result |
|-------|--------|
| HTTP Status | `401` |
| Result | ✅ PASS — invalid token correctly rejected |

---

#### Auth Guard: GET /api/v1/plants (unauthenticated)

| Check | Result |
|-------|--------|
| HTTP Status | `401` |
| Result | ✅ PASS — auth guard active |

---

#### Plants: GET /api/v1/plants (authenticated)

| Check | Result |
|-------|--------|
| HTTP Status | `200 OK` |
| Response shape | `{"data":[...],"pagination":{...}}` |
| Result | ✅ PASS |

---

#### Plants: GET /api/v1/plants/:id (authenticated)

| Check | Result |
|-------|--------|
| Plant ID tested | `ee21a6cd-d1e6-4a34-a1d8-1e8e00083031` |
| HTTP Status | `200 OK` |
| Result | ✅ PASS |

---

#### Plants: POST /api/v1/plants (create)

| Check | Result |
|-------|--------|
| HTTP Status | `201 Created` (implied — response contained `data.id`) |
| New plant ID | `f094180c-7baa-4fd9-9cc9-3afff1a0d433` |
| Result | ✅ PASS |

---

#### Plants: DELETE /api/v1/plants/:id

| Check | Result |
|-------|--------|
| Deleted plant | `f094180c-7baa-4fd9-9cc9-3afff1a0d433` (test plant just created) |
| HTTP Status | `200 OK` |
| Result | ✅ PASS |

---

#### Profile: GET /api/v1/profile (authenticated)

| Check | Result |
|-------|--------|
| HTTP Status | `200 OK` |
| Response | `data.user` + `data.stats` present (`plant_count:4, days_as_member:12, total_care_actions:4`) |
| Result | ✅ PASS |

---

#### T-097 (Sprint #21 Primary): POST /api/v1/plants/:id/care-actions — notes field

| # | Test Scenario | HTTP Status | Response | Result |
|---|---------------|-------------|----------|--------|
| 1 | Unauthenticated request | `401` | Auth error | ✅ PASS |
| 2 | Valid `notes` string (35 chars) | `201 Created` | `care_action.notes:"Leaves looking healthy, soil was dry."` | ✅ PASS |
| 3 | Whitespace-only `notes` (`"   "`) | `201 Created` | `care_action.notes:null` | ✅ PASS |
| 4 | `notes` > 280 chars (281 chars) | `400` | `{"error":{"message":"notes must be 280 characters or fewer","code":"VALIDATION_ERROR"}}` | ✅ PASS |
| 5 | No `notes` field (backward compat) | `201 Created` | Success | ✅ PASS |

**T-097 result: ALL 5 SCENARIOS PASS**

---

#### Frontend Build Artifact

| Check | Result |
|-------|--------|
| `frontend/dist/` exists | ✅ Yes — `assets/`, `favicon.svg`, `icons.svg`, `index.html` present |
| Frontend at http://localhost:4177 | HTTP `200 OK` |
| Result | ✅ PASS |

---

#### Security: npm audit

| Package | Vulnerabilities | Result |
|---------|-----------------|--------|
| `backend/` | 0 | ✅ PASS |
| `frontend/` | 0 | ✅ PASS |

---

### Summary

| Category | Checks | Passed | Failed |
|----------|--------|--------|--------|
| Config Consistency | 6 | 6 | 0 |
| Health / Baseline | 1 | 1 | 0 |
| Auth Endpoints | 3 | 3 | 0 |
| Plants CRUD | 4 | 4 | 0 |
| Profile | 1 | 1 | 0 |
| T-097 care-actions notes (Sprint #21) | 5 | 5 | 0 |
| Frontend Build | 2 | 2 | 0 |
| Security (npm audit) | 2 | 2 | 0 |
| **TOTAL** | **24** | **24** | **0** |

### Deploy Verified: Yes

All 24 checks passed. Sprint #21 staging deployment is healthy and verified. Handoff H-290 sent to Manager Agent.

---

## Sprint 21 — Deploy Engineer: Staging Build & Deploy (2026-04-05)

**Date:** 2026-04-05
**Agent:** Deploy Engineer
**Sprint:** #21
**Git SHA:** d8a7b17
**Environment:** Staging (local Node.js processes — Docker not available in this environment)

### Pre-Deploy Gate Check

| Check | Result |
|-------|--------|
| QA Sign-off (H-288) | ✅ PASS — All T-097, T-098, T-099 Done |
| Pending Migrations | ✅ None — No schema changes in Sprint #21 |
| Sprint Tasks Done | ✅ T-097 Done, T-098 Done, T-099 Done |

### Dependency Install

| Package | Result |
|---------|--------|
| `backend/ npm install` | ✅ Success — 0 vulnerabilities |
| `frontend/ npm install` | ✅ Success — 0 vulnerabilities |

### Frontend Build

| Step | Result |
|------|--------|
| `frontend/ npm run build` | ✅ Success |
| Build output | `dist/assets/index-qg4qA6QZ.js` (445.38 kB / 127.09 kB gzip) |
| CSS output | `dist/assets/index-BK0oV7hZ.css` (78.95 kB / 12.62 kB gzip) |
| Build time | 336ms |
| Errors | None |

### Database Migrations

| Step | Result |
|------|--------|
| `backend/ npm run migrate` | ✅ Already up to date — all 5 Sprint 1 migrations applied |
| New migrations this sprint | None (T-097 required no schema changes) |

### Staging Service Status

| Component | URL | PID | Status |
|-----------|-----|-----|--------|
| Backend (Express API) | http://localhost:3000 | 20147 | ✅ Running |
| Frontend (Vite Preview) | http://localhost:4177 | 20175 | ✅ Running |
| Database | localhost:5432/plant_guardians_staging | — | ✅ Connected |

### Smoke Tests (Deploy Engineer)

| Check | Result |
|-------|--------|
| `GET /api/health` | ✅ 200 OK — `{"status":"ok"}` |
| `GET /api/v1/plants` (no auth) | ✅ 401 Unauthorized — auth guard working |
| Frontend at http://localhost:4177 | ✅ 200 OK |

### Infrastructure Note

Docker is not available in this environment. Services run as local Node.js processes:
- Backend: `npm start` in `backend/` (port 3000)
- Frontend: `npx vite preview` in `frontend/` (port 4177 — 4173–4176 in use from prior sprints)

### Build Status: ✅ SUCCESS
### Deploy Status: ✅ STAGING DEPLOYED

Handoff H-289 sent to Monitor Agent for post-deploy health checks.

---

## Sprint 21 — QA Engineer: Full QA Verification (2026-04-05)

**Date:** 2026-04-05
**Agent:** QA Engineer
**Sprint:** #21
**Tasks Under Test:** T-097 (Backend — notes field), T-098 (Frontend — notes UI), T-099 (Frontend — SPEC-015 cosmetic fixes)
**Reference Handoffs:** H-284 (Backend → QA), H-286 (Frontend → QA), H-287 (Manager → QA)

---

### Test Type: Unit Test — Backend

**Command:** `cd backend && npm test`
**Result:** ✅ **149/149 tests pass** (16 test suites, 0 failures)

| Test File | Tests | Status |
|-----------|-------|--------|
| `careActionsNotes.test.js` (T-097 — NEW) | 7 | ✅ PASS |
| `careActions.test.js` | — | ✅ PASS |
| `careActionsStats.test.js` | — | ✅ PASS |
| `careActionsStreak.test.js` | — | ✅ PASS |
| `careDue.test.js` | — | ✅ PASS |
| `careHistory.test.js` | — | ✅ PASS |
| `plantCareHistory.test.js` | — | ✅ PASS |
| `plants.test.js` | — | ✅ PASS |
| `plantsSearchFilter.test.js` | — | ✅ PASS |
| `plantNameMaxLength.test.js` | — | ✅ PASS |
| `auth.test.js` | — | ✅ PASS |
| `account.test.js` | — | ✅ PASS |
| `accountDelete.test.js` | — | ✅ PASS |
| `ai.test.js` | — | ✅ PASS |
| `profile.test.js` | — | ✅ PASS |
| `statsRateLimit.test.js` | — | ✅ PASS |

**Coverage analysis for T-097 (careActionsNotes.test.js — 7 new tests):**

| # | Test | Path | Status |
|---|------|------|--------|
| 1 | Valid notes string, trimmed | Happy path | ✅ |
| 2 | Notes omitted (backward compat) | Happy path | ✅ |
| 3 | Whitespace-only → null | Edge case | ✅ |
| 4 | Empty string → null | Edge case | ✅ |
| 5 | Notes > 280 chars → 400 | Error path | ✅ |
| 6 | Notes exactly 280 chars → 201 | Boundary | ✅ |
| 7 | Explicit null → null | Edge case | ✅ |

**Assessment:** Excellent coverage — 7 new tests exceed the 4-test minimum. All happy paths and error paths covered. Boundary testing (exactly 280 chars) included. Backward compatibility verified. No regressions (142 existing + 7 new = 149).

---

### Test Type: Unit Test — Frontend

**Command:** `cd frontend && npm test` (Vitest)
**Result:** ✅ **227/227 tests pass** (31 test suites, 0 failures)

| Test File | Tests | Status | Sprint |
|-----------|-------|--------|--------|
| `CareNoteInput.test.jsx` (T-098 — NEW) | 10 | ✅ PASS | 21 |
| `CareHistoryItem.test.jsx` (T-098 — NEW) | 12 | ✅ PASS | 21 |
| `CareDuePage.test.jsx` (T-098 — MODIFIED) | — | ✅ PASS | 21 |
| `CareHistorySection.test.jsx` (T-099 — MODIFIED) | — | ✅ PASS | 21 |
| All other 27 test files | — | ✅ PASS | — |

**Coverage analysis for T-098 (CareNoteInput — 10 tests):**

| # | Test | Path | Status |
|---|------|------|--------|
| 1 | Renders "+ Add note" collapsed | Happy path | ✅ |
| 2 | No textarea when collapsed | State | ✅ |
| 3 | Expands textarea on click | Happy path | ✅ |
| 4 | Collapses and clears on "Remove" | Interaction | ✅ |
| 5 | Character counter at 200+ | Boundary | ✅ |
| 6 | Counter hidden below 200 | State | ✅ |
| 7 | Yellow class at 240+ | Visual state | ✅ |
| 8 | Red class at 270+ | Visual state | ✅ |
| 9 | Disabled when disabled=true | Error path | ✅ |
| 10 | Calls onNoteChange on typing | Interaction | ✅ |

**Coverage analysis for T-098 (CareHistoryItem — 12 tests):**

| # | Test | Path | Status |
|---|------|------|--------|
| 1 | No notes → no note UI | Null handling | ✅ |
| 2 | Null notes → no note UI | Null handling | ✅ |
| 3 | Empty string notes → no note UI | Edge case | ✅ |
| 4 | Whitespace-only notes → no note UI | Edge case | ✅ |
| 5 | Non-null notes → shows text + divider | Happy path | ✅ |
| 6 | Correct aria-label with notes | Accessibility | ✅ |
| 7 | Correct aria-label without notes | Accessibility | ✅ |
| 8 | Note text has clamped class by default | Truncation | ✅ |
| 9 | Dark mode icon circle class applied | T-099 cosmetic | ✅ |
| 10 | Fertilizing care type renders correctly | Variant | ✅ |
| 11 | History panel renders listitem role | Structural | ✅ |
| 12 | (implicit via CareHistorySection.test.jsx updates) | Integration | ✅ |

**Assessment:** 22 new tests exceed the 6-test minimum. Comprehensive coverage of CareNoteInput (all states, interactions, accessibility). CareHistoryItem covers null/empty/whitespace edge cases, note display, truncation, aria-labels, and dark mode icon backgrounds. No regressions (205 existing + 22 new = 227).

---

### Test Type: Integration Test

**Verification Method:** Code review of frontend ↔ backend integration points

#### API Contract Compliance (T-097 ↔ T-098)

| Check | Expected (api-contracts.md) | Actual (code) | Result |
|-------|---------------------------|----------------|--------|
| Frontend calls `POST /plants/:id/care-actions` | Via `careActions.markDone(plantId, careType, notes)` | `api.js` line 202: correct — sends `care_type` + optional `notes` | ✅ PASS |
| Notes trimmed client-side | `noteText.trim() \|\| null` | `api.js` lines 204–208: trims, omits if empty | ✅ PASS |
| Notes omitted when null/empty | Field not sent | `api.js` line 204: `if (notes != null)` guard, then trim check | ✅ PASS |
| Response field `notes` (plural) used | `data.care_action.notes` | Backend aliases `note` → `notes` at line 98; frontend reads `notes` | ✅ PASS |
| Backend validates max 280 chars | 400 VALIDATION_ERROR | `careActions.js` line 50: `notes.length > 280` check after trim | ✅ PASS |
| Backend normalizes whitespace-only to null | `null` stored | `careActions.js` lines 47–49: trim → length 0 → null | ✅ PASS |
| CareDuePage passes notes to markDone | Hook receives `notes` param | `CareDuePage.jsx` line 182–184: extracts from noteValues state | ✅ PASS |
| PlantDetailPage passes notes to markCareAsDone | Hook receives `notes` param | `PlantDetailPage.jsx` lines 57–58: extracts from noteValues state | ✅ PASS |
| CareHistoryItem reads `notes` from API | `item.notes` | `CareHistoryItem.jsx` line 64: `item.notes != null && item.notes.trim() !== ''` | ✅ PASS |
| Auth enforced on POST | 401 without token | `careActions.js` line 13: `router.use(authenticate)` applied to all routes | ✅ PASS |

#### UI States (SPEC-016 Compliance)

| State | Expected (ui-spec.md) | Implemented | Result |
|-------|----------------------|-------------|--------|
| Default (collapsed) | "+ Add note" visible, no textarea in DOM | `CareNoteInput.jsx`: textarea only renders when `expanded=true` | ✅ PASS |
| Expanded | Textarea with aria-label, maxLength=280, focus on expand | Lines 88–102: correct attributes, useEffect auto-focus | ✅ PASS |
| Counter hidden <200 | Counter exists but not visible | Counter has `care-note-counter--visible` class only at ≥200 | ✅ PASS |
| Counter yellow at 240+ | Yellow styling | `getCounterClass()` returns `--yellow` at ≥240 | ✅ PASS |
| Counter red at 270+ | Red styling | `getCounterClass()` returns `--red` at ≥270 | ✅ PASS |
| Disabled during submit | Button + textarea disabled | `disabled` prop passed through | ✅ PASS |
| History — null notes | No note UI | Guard: `item.notes != null && item.notes.trim() !== ''` | ✅ PASS |
| History — note ≤ 2 lines | Full note, no toggle | Overflow detection via `scrollHeight > clientHeight` | ✅ PASS |
| History — note > 2 lines | 2-line clamp + "Show more" | `ch-item-note-text--clamped` class + toggle button | ✅ PASS |
| History — note expanded | Full note, "Show less" | Toggle flips `noteExpanded` state | ✅ PASS |

#### T-099 Cosmetic Fixes Verification

| Fix | Expected | Verified | Result |
|-----|----------|----------|--------|
| `role="tabpanel"` on history panel | `<div role="tabpanel">` in PlantDetailPage.jsx | Line 367: `role="tabpanel"` present on history panel | ✅ PASS |
| Notes expansion CSS transition | `max-height 0.25s ease` instead of class toggle | CareHistorySection.css lines 221–228: `max-height: 0` → `max-height: 200px` with `transition: max-height 0.25s ease` | ✅ PASS |
| Dark mode icon backgrounds | CSS custom properties per care type | CareHistorySection.css lines 467–477: `[data-theme="dark"]` selectors override `--icon-bg` for watering/fertilizing/repotting | ✅ PASS |
| Reduced motion support | `prefers-reduced-motion` respected | CareHistorySection.css — transition respects reduced-motion (verified in code review notes from H-287) | ✅ PASS |

**Integration Test Result: ✅ ALL PASS**

---

### Test Type: Config Consistency

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Backend PORT | `3000` | `PORT=3000` in `.env` | ✅ PASS |
| Vite proxy target | `http://localhost:3000` | `vite.config.js` line 8: `http://localhost:3000` | ✅ PASS |
| PORT match | Backend PORT = Vite proxy port | Both `3000` | ✅ PASS |
| SSL status | No SSL vars set | `SSL_KEY_PATH` / `SSL_CERT_PATH` not in `.env` | ✅ HTTP mode |
| Protocol match | No SSL → `http://` | Vite proxy uses `http://localhost:3000` | ✅ PASS |
| CORS origin includes frontend | `http://localhost:5173` in FRONTEND_URL | `FRONTEND_URL=http://localhost:5173,http://localhost:5174,http://localhost:4173,http://localhost:4175` | ✅ PASS |
| Docker port mapping | Postgres 5432 | `docker-compose.yml`: `${POSTGRES_PORT:-5432}:5432` | ✅ No conflict |

**Config Consistency Result: ✅ ALL PASS** — No mismatches. Backend, Vite proxy, and CORS are aligned.

---

### Test Type: Security Scan

**npm audit:** `cd backend && npm audit` → **0 vulnerabilities found**

#### Authentication & Authorization

| Check | Status | Evidence |
|-------|--------|----------|
| All API endpoints require auth | ✅ PASS | `careActions.js` line 13: `router.use(authenticate)` — all care action routes protected |
| Auth tokens have appropriate expiration | ✅ PASS | `.env`: `JWT_EXPIRES_IN=15m`, `REFRESH_TOKEN_EXPIRES_DAYS=7` |
| Password hashing uses bcrypt | ✅ PASS | Verified in prior sprints; no changes this sprint |
| Failed login rate-limited | ✅ PASS | `AUTH_RATE_LIMIT_MAX=20` configured |

#### Input Validation & Injection Prevention

| Check | Status | Evidence |
|-------|--------|----------|
| All user inputs validated server-side | ✅ PASS | `careActions.js`: `notes` validated for type (string), length (≤280 after trim), normalized (whitespace → null) |
| SQL queries use parameterized statements | ✅ PASS | `careActions.js` line 78: `note: notes` passed to Knex query builder — no string concatenation |
| HTML output sanitized (XSS prevention) | ✅ PASS | React auto-escapes JSX interpolation. `CareHistoryItem.jsx` line 107: `{item.notes}` rendered as text node, not `dangerouslySetInnerHTML` |
| File uploads validated | ✅ PASS | No new file upload code in Sprint 21 |
| Client-side validation present | ✅ PASS | `maxLength={280}` on textarea; belt-and-suspenders with backend |

#### API Security

| Check | Status | Evidence |
|-------|--------|----------|
| CORS configured for expected origins only | ✅ PASS | `app.js` lines 33–38: origin whitelist from `FRONTEND_URL` env var |
| Rate limiting applied | ✅ PASS | Global rate limit + stats-specific limit from prior sprints |
| API responses don't leak internals | ✅ PASS | `errorHandler.js` lines 28–35: unknown errors return generic message, stack trace logged server-side only |
| Sensitive data not in URL params | ✅ PASS | `notes` sent in POST body, not query params |
| Security headers (helmet) | ✅ PASS | `app.js` line 30: `app.use(helmet())` |

#### Data Protection

| Check | Status | Evidence |
|-------|--------|----------|
| Credentials in env vars, not code | ✅ PASS | `JWT_SECRET`, `DATABASE_URL`, `GEMINI_API_KEY` all in `.env`; `.env` is in `.gitignore` and not tracked by git |
| `.env` not committed to git | ✅ PASS | `git ls-files --cached` shows no `.env` files tracked |
| Logs don't contain PII | ✅ PASS | Error handler logs error object only; notes content not logged |

#### Infrastructure

| Check | Status | Evidence |
|-------|--------|----------|
| Dependencies checked for vulnerabilities | ✅ PASS | `npm audit`: 0 vulnerabilities |
| Default credentials removed | ✅ PASS | No sample credentials in code |
| Error pages don't reveal server info | ✅ PASS | Helmet + custom error handler |

**Security Scan Result: ✅ ALL PASS** — No security issues found. No P1 bugs.

---

### Overall Sprint 21 QA Verdict

| Category | Result |
|----------|--------|
| Backend Unit Tests | ✅ 149/149 pass (7 new) |
| Frontend Unit Tests | ✅ 227/227 pass (22 new) |
| Integration Tests | ✅ All contract checks pass |
| Config Consistency | ✅ No mismatches |
| Security Scan | ✅ 0 vulnerabilities, all checklist items pass |
| T-097 (Backend notes) | ✅ PASS |
| T-098 (Frontend notes UI) | ✅ PASS |
| T-099 (SPEC-015 cosmetic) | ✅ PASS |

**Sprint 21 QA Status: ✅ ALL PASS — Ready for Deploy**

---

