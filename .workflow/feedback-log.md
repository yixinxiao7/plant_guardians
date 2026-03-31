# Feedback Log

Structured feedback from the User Agent and Monitor Agent after each test cycle. Triaged by the Manager Agent.

---

## Log Fields

| Field | Description |
|-------|-------------|
| ID | Unique feedback identifier (e.g., FB-001) |
| Source | Which agent submitted the feedback |
| Sprint | Sprint number when feedback was submitted |
| Category | Bug, UX Issue, Positive, Suggestion |
| Severity | Critical, Major, Minor, Cosmetic |
| Description | What was observed |
| Steps to Reproduce | How to trigger the issue (for bugs) |
| Expected vs Actual | What should happen vs what happened |
| Status | New, Acknowledged, Tasked (→ task ID), Won't Fix |

---

## FB-001 — Monitor Alert: CORS Origin Mismatch Blocks Staging Browser Testing

| Field | Value |
|-------|-------|
| **ID** | FB-001 |
| **Source** | Monitor Agent |
| **Sprint** | 1 |
| **Date** | 2026-03-23T22:37:00Z |
| **Category** | Bug |
| **Severity** | Major |
| **Status** | Acknowledged — Resolved in Sprint 1 (commit `4659ca6`). CORS middleware updated to accept comma-separated origins; both `:5173` and `:4173` now allowed. No Sprint 2 action needed. |

### Description

The backend CORS configuration (`FRONTEND_URL=http://localhost:5173`) does not include the staging frontend origin (`http://localhost:4173`). The staging frontend is served via `vite preview` on port 4173, but the backend only allows cross-origin requests from port 5173 (the Vite dev server port).

**Result:** Any API call made from the staging frontend UI in a browser will fail with a CORS error. The `Access-Control-Allow-Origin` header returned by the backend is `http://localhost:5173`, which the browser rejects when the request originates from `http://localhost:4173`. This blocks all User Agent browser-based testing.

Note: Direct curl-based API testing is unaffected — all 14 endpoints are healthy. CORS is enforced by browsers only.

### Steps to Reproduce

1. Open browser, navigate to `http://localhost:4173`
2. Attempt to log in or perform any action that triggers an API call
3. Open browser DevTools → Network tab
4. Observe preflight `OPTIONS` request to `http://localhost:3000/api/v1/auth/login`
5. `Access-Control-Allow-Origin: http://localhost:5173` is returned; browser blocks the response

### Expected vs Actual

| | Value |
|--|-------|
| **Expected** | Backend CORS allows requests from `http://localhost:4173` (staging frontend URL) |
| **Actual** | Backend CORS only allows `http://localhost:5173`; staging frontend at `:4173` is rejected by browser |

### Fix

In `backend/.env`, update `FRONTEND_URL=http://localhost:4173`, then restart the backend. Alternatively, support a comma-separated or array origin list in `app.js` to allow both `:5173` (dev) and `:4173` (staging preview) simultaneously.

---

## FB-002 — Monitor Alert: Server Startup Race Condition Causes Initial 500 Errors

| Field | Value |
|-------|-------|
| **ID** | FB-002 |
| **Source** | Monitor Agent |
| **Sprint** | 1 |
| **Date** | 2026-03-23T22:37:00Z |
| **Category** | Bug |
| **Severity** | Major |
| **Status** | Acknowledged — Resolved in Sprint 1 (commit `4659ca6`). `server.js` now awaits `db.raw('SELECT 1')` before `app.listen()`. No Sprint 2 action needed. |

### Description

The backend server returns `HTTP 500 INTERNAL_ERROR` on the first 1–2 requests immediately after startup. After the first few requests the error clears and all subsequent requests succeed normally.

**Root cause (probable):** Knex's database connection pool is not fully initialized when the server starts accepting requests. `server.js` calls `app.listen()` immediately without waiting for the DB pool to be ready, creating a race condition on cold start.

### Steps to Reproduce

1. Stop the backend process
2. Restart: `cd backend && node src/server.js`
3. Immediately send `POST http://localhost:3000/api/v1/auth/register` with valid body
4. Observe: `HTTP 500 {"error":{"message":"An unexpected error occurred.","code":"INTERNAL_ERROR"}}`
5. Wait 1 second; repeat the same request
6. Observe: `HTTP 201` (success)

### Expected vs Actual

| | Value |
|--|-------|
| **Expected** | Server only begins accepting requests once the database pool is ready |
| **Actual** | Server starts accepting requests before DB pool is ready; first requests fail with 500 |

### Fix Recommendation

Await a `db.raw('SELECT 1')` health check before `app.listen()` in `server.js`.

---

## FB-003 — Monitor Alert: Seeded Test Account Not Present on Staging

| Field | Value |
|-------|-------|
| **ID** | FB-003 |
| **Source** | Monitor Agent |
| **Sprint** | 1 |
| **Date** | 2026-03-23T22:37:00Z |
| **Category** | Bug |
| **Severity** | Minor |
| **Status** | Acknowledged — Resolved in Sprint 1 (commit `4659ca6`). Seed file `01_test_user.js` added and run. Deployment checklist updated. No Sprint 2 action needed. |

### Description

The seeded test account (`test@triplanner.local` / `TestPass123!`) is not present in the staging database. `POST /api/v1/auth/login` with these credentials returns `HTTP 401 INVALID_CREDENTIALS`. The `knex seed:run` command was not part of the staging deployment checklist (H-014).

**Impact:** Monitor health checks must fall back to registering new users, which consumes auth rate-limit quota (20 registrations/15 min). Risk of 429 rate-limit errors during automated smoke tests.

### Fix

Run `cd backend && knex seed:run` on staging. Add this step to the deployment checklist in H-016 / rollback-playbook.

---

## FB-004 — AI Modal: "Try Again" Shown on 502 Service Unavailable

| Field | Value |
|-------|-------|
| **ID** | FB-004 |
| **Source** | QA Engineer |
| **Sprint** | 3 |
| **Date** | 2026-03-24 |
| **Category** | UX Issue |
| **Severity** | Minor |
| **Status** | Tasked → T-028 (Sprint 4) |

### Description

When the AI advice endpoint returns 502 (AI_SERVICE_UNAVAILABLE), the modal shows both "Try Again" and "Close" buttons. Per H-020 clarification 2, the 502 error state should NOT show "Try Again" since the AI service is down (not a user error). Only "Close" should be shown. Additionally, the error message text says "Our AI is temporarily unavailable. Try again in a moment." but the spec says "Our AI service is temporarily offline. You can still add your plant manually."

### Expected vs Actual

- **Expected:** 502 → show only "Close" button + "AI service is temporarily offline" message
- **Actual:** 502 → shows both "Try Again" and "Close" + "temporarily unavailable" message

### Fix

In `AIAdviceModal.jsx`, differentiate the error state rendering based on error code. For 502, hide the "Try Again" button and update the message text.

---

## FB-005 — Edit Plant Redirects to Detail Page Instead of Inventory

| Field | Value |
|-------|-------|
| **ID** | FB-005 |
| **Source** | QA Engineer |
| **Sprint** | 3 |
| **Date** | 2026-03-24 |
| **Category** | UX Issue |
| **Severity** | Cosmetic |
| **Status** | Acknowledged — Cosmetic spec deviation; current redirect-to-detail behavior is arguably better UX. Spec to be updated in Sprint 4 (T-029). No functional change needed. |

### Description

After saving changes on the Edit Plant page, the app redirects to `/plants/:id` (plant detail page) instead of `/` (inventory) as specified in SPEC-004 and the API contracts. Redirecting to the detail page is arguably better UX — the user can immediately see their changes.

### Expected vs Actual

- **Expected (per spec):** Redirect to inventory `/`
- **Actual:** Redirect to plant detail `/plants/:id`

### Recommendation

Keep the current behavior (redirect to detail) — it's more useful. Update the spec to match if agreed.

---

## FB-006 — Positive: Excellent Implementation Quality Across All 7 Screens

| Field | Value |
|-------|-------|
| **ID** | FB-006 |
| **Source** | QA Engineer |
| **Sprint** | 3 |
| **Date** | 2026-03-24 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged — Strong MVP foundation. Shared with the team. |

### Description

The Sprint 3 frontend implementation is comprehensive and well-executed:

1. **All UI states implemented** — loading skeletons, error states with retry, empty states, success states across all 7 screens
2. **API contract adherence** — all request/response shapes match the contracts exactly
3. **Security** — tokens stored in memory only, no XSS vectors, proper auth guards
4. **Accessibility** — aria-labels, role attributes, keyboard navigation, prefers-reduced-motion check on confetti
5. **Error handling** — graceful degradation on API failures, informative user messages, proper error code mapping
6. **Code organization** — clean separation of concerns (api.js, hooks, pages, components)
7. **Care schedule flow** — years→months conversion, dirty state detection, full schedule replacement all work correctly
8. **10-second undo window** — timer with proper cleanup on unmount, clear UX

This is a strong MVP foundation.

---

## FB-007 — Positive: Robust Edge Case Handling

| Field | Value |
|-------|-------|
| **ID** | FB-007 |
| **Source** | QA Engineer |
| **Sprint** | 3 |
| **Date** | 2026-03-24 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged — Edge case coverage is production-grade. Noted as a quality benchmark. |

### Description

During final product-perspective testing, the following edge cases were verified as well-handled:

1. **Input validation** — Frontend validates email format, password length (8+), full name length (2+), plant name required, frequency values (1–365) before submission. Backend mirrors all validations server-side.
2. **Care schedule edge cases** — Empty schedules allowed (API doesn't require watering; UI enforces it). Duplicate care types rejected with 400. Schedule deletion via PUT omission works correctly.
3. **Photo upload** — MIME type validation (JPEG/PNG/WebP only), 5MB limit enforced, UUID filenames prevent path traversal. Missing file and invalid type produce clear error codes.
4. **Auth resilience** — Token auto-refresh silently handles expired access tokens. Failed refresh redirects to login. Rate limiting (20 auth requests/15min) prevents brute force.
5. **Plant ownership isolation** — Attempting to access another user's plant returns 404 (not 403), preventing existence leakage.
6. **Confetti accessibility** — `prefers-reduced-motion` media query check before firing animation.

---

## FB-008 — Positive: T-026 AI Modal 502 Error Handling — Clean User Experience

| Field | Value |
|-------|-------|
| **ID** | FB-008 |
| **Source** | QA Engineer |
| **Sprint** | 4 |
| **Date** | 2026-03-24 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |

### Description

The T-026 fix for the AI Modal 502 error state is well-implemented from a user's perspective:

1. **No confusing "Try Again" for service outages** — When the AI service is down (502), showing only "Close" is the right UX. Users shouldn't repeatedly retry when the issue is server-side.
2. **Helpful fallback message** — "You can still add your plant manually" is actionable. The user knows what to do next instead of being stuck.
3. **Non-502 errors still offer retry** — Network errors and unidentifiable plant errors still show "Try Again", which is correct since those may be transient or user-correctable.
4. **"Close" button promotion** — Promoting the Close button from `ghost` to `secondary` variant when it's the only action provides appropriate visual weight.

---

## FB-009 — Positive: Vite Proxy Eliminates CORS Complexity for Development

| Field | Value |
|-------|-------|
| **ID** | FB-009 |
| **Source** | QA Engineer |
| **Sprint** | 4 |
| **Date** | 2026-03-24 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |

### Description

T-028's Vite proxy configuration is a clean technical debt resolution:

1. **Relative API URLs** — `api.js` defaults to `/api/v1` instead of `http://localhost:3000/api/v1`. This means dev, staging, and production all work without CORS issues.
2. **Production override preserved** — `VITE_API_BASE_URL` env var still works for production deployments with a separate backend origin.
3. **Both dev and preview covered** — Proxy is configured on both `server` and `preview`, so `npm run dev` and `npm run preview` both work identically.

---

## FB-010 — Observation: Flaky Backend Test — "socket hang up" in POST /plants

| Field | Value |
|-------|-------|
| **ID** | FB-010 |
| **Source** | QA Engineer |
| **Sprint** | 4 |
| **Date** | 2026-03-24 |
| **Category** | Bug |
| **Severity** | Minor |
| **Status** | Acknowledged — Minor flaky test; backlog for Sprint 5 (T-029). Consider `--runInBand` or improved supertest teardown. |

### Description

During Sprint 4 backend test runs, `POST /api/v1/plants > should create a plant with care schedules` failed with "socket hang up" on the first full-suite run. The same test passed on subsequent runs (both isolated and full-suite). This appears to be a flaky test caused by concurrency in the test runner (Jest parallel test suites competing for DB connections or server ports).

### Steps to Reproduce

1. `cd backend && npm test` — run all 5 test suites in parallel
2. Observe occasional "socket hang up" failure on the `plants.test.js` create test
3. Re-run → passes

### Expected vs Actual

- **Expected:** 40/40 tests pass reliably on every run
- **Actual:** Intermittent 39/40 with "socket hang up" on plant creation test

### Recommendation

Consider adding `--runInBand` to Jest config for CI, or investigating the supertest/server teardown timing between suites.

---

## FB-011 — Positive: Comprehensive Error Handling Architecture

| Field | Value |
|-------|-------|
| **ID** | FB-011 |
| **Source** | QA Engineer |
| **Sprint** | 4 |
| **Date** | 2026-03-24 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged — Strong architectural pattern; noted as quality benchmark for future services. |

### Description

The centralized error handling architecture (AppError hierarchy → errorHandler middleware → structured JSON responses) is well designed. Unknown errors never leak stack traces or internal details — they return `{"error":{"message":"An unexpected error occurred.","code":"INTERNAL_ERROR"}}`. This is a strong security and UX pattern.

The frontend error handling in `api.js` (ApiError class with code/status) and the AI modal's per-error-code branching provide contextually useful messages to users. This is production-quality error handling for an MVP.

---

## FB-012 — Observation: Gemini API Key Still Placeholder — AI Feature Non-Functional

| Field | Value |
|-------|-------|
| **ID** | FB-012 |
| **Source** | QA Engineer |
| **Sprint** | 4 |
| **Date** | 2026-03-24 |
| **Category** | Feature Gap |
| **Severity** | Major |
| **Status** | Tasked → T-025 (Sprint 5 — T-024 now complete; Gemini key configuration unblocked) |

### Description

`backend/.env` has `GEMINI_API_KEY=your-gemini-api-key` (placeholder). The backend correctly detects this (line 80 in `ai.js`: `!apiKey || apiKey === 'your-gemini-api-key'`) and returns 502 AI_SERVICE_UNAVAILABLE. This means the AI advice feature — a core MVP pillar — is completely non-functional.

T-025 addresses this but is blocked on T-024 (Monitor health check). Until a real Gemini key is configured, Flow 2 and Flow 3 from the project brief cannot be fully tested.

### Expected vs Actual

- **Expected:** POST /ai/advice returns 200 with care advice
- **Actual:** POST /ai/advice returns 502 AI_SERVICE_UNAVAILABLE

---

## FB-013 — Positive: Memory-Only Token Storage

| Field | Value |
|-------|-------|
| **ID** | FB-013 |
| **Source** | QA Engineer |
| **Sprint** | 4 |
| **Date** | 2026-03-24 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged — Best-practice XSS-resilient token storage confirmed. Noted as security quality benchmark. |

### Description

Access and refresh tokens are stored exclusively in module-level variables in `api.js` (not localStorage, not sessionStorage). Only non-sensitive display data (`pg_user` — name and email) is stored in sessionStorage. This is best practice for XSS-resilient token management in SPAs. Good implementation.

---

## FB-014 — Positive: Comprehensive AI Endpoint Test Coverage (Sprint 5)

| Field | Value |
|-------|-------|
| **ID** | FB-014 |
| **Source** | QA Engineer |
| **Sprint** | 5 |
| **Date** | 2026-03-24 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |

### Description

T-025 added 4 mocked Gemini tests, bringing AI endpoint coverage to 7 tests total. Every error code in the API contract (400, 401, 422, 502) plus the happy path (200) now has a dedicated test with proper assertions on response shape. The mock approach (jest.mock of @google/generative-ai) is clean and doesn't require a real API key for CI. Excellent test design.

---

## FB-015 — Positive: Flaky Test Root Cause Correctly Identified and Fixed (Sprint 5)

| Field | Value |
|-------|-------|
| **ID** | FB-015 |
| **Source** | QA Engineer |
| **Sprint** | 5 |
| **Date** | 2026-03-24 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |

### Description

T-029 correctly identified the root cause of the intermittent "socket hang up" error (parallel test files competing for PG connections) and applied a multi-layered fix: `--runInBand` for serial execution, reduced pool size, idle timeout, and `activeFiles` tracking in teardown. The fix is CI-ready — 3 consecutive clean runs with 44/44 tests and zero flaky failures. Test suite is now reliable.

---

## FB-016 — Observation: Gemini API Key Still Placeholder — AI Happy Path Not Testable End-to-End

| Field | Value |
|-------|-------|
| **ID** | FB-016 |
| **Source** | QA Engineer |
| **Sprint** | 5 |
| **Date** | 2026-03-24 |
| **Category** | Feature Gap |
| **Severity** | Minor |
| **Status** | Acknowledged — accepted per sprint plan. Real key must be provisioned by project owner for end-to-end AI testing. |

### Description

The `GEMINI_API_KEY` in `backend/.env` remains set to the placeholder value `your-gemini-api-key`. The AI advice endpoint (POST /api/v1/ai/advice) correctly returns 502 AI_SERVICE_UNAVAILABLE when called with this placeholder. The happy path is verified only via mocked tests. User flows involving AI advice (Flow 2 from project-brief.md) cannot be fully validated until a real key is provisioned.

### Impact

- Flow 1 (Novice) and Flow 3 (Inventory management) are fully testable
- Flow 2 (AI advice) can be tested up to the point of clicking "Get Advice" — the modal will show the 502 error state (correctly handled per SPEC-006 and T-026 fix)

---

## FB-017 — Bug: Intermittent Timeout in profile.test.js (Sprint 5 Final QA)

| Field | Value |
|-------|-------|
| **ID** | FB-017 |
| **Source** | QA Engineer |
| **Sprint** | 5 |
| **Date** | 2026-03-25 |
| **Category** | Bug |
| **Severity** | Minor (P3) |
| **Status** | Acknowledged — Minor flaky test (P3); test infrastructure issue, not a production defect. Tasked → T-031 (Sprint 6 backlog). |

### Description

During the Sprint 5 final QA verification pass, `profile.test.js` → "should return user profile with stats" timed out at 30,000ms on the second of three consecutive backend test runs. Runs 1 and 3 passed cleanly (44/44). This is a new flaky test distinct from the T-029 fix (which addressed "socket hang up" errors in plants.test.js).

### Steps to Reproduce

1. `cd backend && npm test` — run three consecutive times
2. Observe that one of the three runs may timeout on the profile test

### Expected vs Actual

- **Expected:** All 44/44 tests pass on every run
- **Actual:** 1/3 runs had a 30s timeout on the profile "stats" test

### Likely Root Cause

The profile stats test creates a user, a plant, and a care action before querying the profile endpoint. Under certain PG connection pool conditions (even with --runInBand), the test may hit a slow query or connection acquisition delay that exceeds the 30s Jest timeout.

### Recommended Fix

- Increase the test timeout for this specific test (e.g., `it('...', async () => {...}, 60000)`)
- Or investigate PG query performance for the profile stats aggregation query
- This is test infrastructure — not a production code defect

---

## FB-018 — Delete Account: Excellent Destructive Action UX Pattern

| Field | Value |
|-------|-------|
| **ID** | FB-018 |
| **Source** | QA Engineer |
| **Sprint** | 6 |
| **Date** | 2026-03-25 |
| **Category** | Positive |
| **Severity** | N/A |
| **Status** | Acknowledged — Excellent destructive-action UX pattern; noted as internal design standard. |

### Description

The Delete Account feature (T-033 + T-034) implements a best-practice destructive action pattern: confirmation modal with clear warning text, default focus on Cancel (not Delete), Escape key dismisses, backdrop click does NOT dismiss, focus trap within modal, aria-modal + role=dialog, and distinct error states for 401 vs 5xx. This is a model for how to handle irreversible operations in the app.

---

## FB-019 — Production Runbook: Comprehensive and Actionable

| Field | Value |
|-------|-------|
| **ID** | FB-019 |
| **Source** | QA Engineer |
| **Sprint** | 6 |
| **Date** | 2026-03-25 |
| **Category** | Positive |
| **Severity** | N/A |
| **Status** | Acknowledged — Comprehensive production runbook significantly reduces deployment risk. Shared with team. |

### Description

The production deployment runbook (T-032) covers first-time server setup, two SSL provisioning methods (Let's Encrypt + BYO), pre-deploy checklist with 4 quality gates, startup sequence for both manual and automated deploys, rollback steps with severity classification, DB migration rollback with warnings, environment variable reference with generation commands, and 4 troubleshooting scenarios. The deploy-prod.sh script has pre-flight safety checks that abort on missing .env or SSL certs. This level of documentation significantly reduces production deployment risk.

---

## FB-020 — Delete Account: Toast Uses 'error' Variant for Success Notification

| Field | Value |
|-------|-------|
| **ID** | FB-020 |
| **Source** | QA Engineer |
| **Sprint** | 6 |
| **Date** | 2026-03-25 |
| **Category** | UX Issue |
| **Severity** | Cosmetic |
| **Status** | Acknowledged — Cosmetic backlog; tasked → T-035 (Sprint 7 P3). Change toast variant from 'error' to 'info' on delete account success. |

### Description

In ProfilePage.jsx, the delete account success toast uses the 'error' variant: `addToast('Your account has been deleted.', 'error')`. While the message is correct, using an error-styled toast (typically red) for a successful operation may confuse users. A neutral or info variant would be more appropriate for a confirmation message after a deliberate destructive action.

### Steps to Reproduce

1. Log in, go to Profile
2. Click "Delete Account" → Confirm
3. Observe the toast notification on the /login page

### Expected vs Actual

- **Expected:** Toast with neutral/info styling confirming account deletion
- **Actual:** Toast with error styling (red) confirming account deletion

---

## FB-021 — Frontend: Missing "test" Script in package.json

| Field | Value |
|-------|-------|
| **ID** | FB-021 |
| **Source** | QA Engineer |
| **Sprint** | 6 |
| **Date** | 2026-03-25 |
| **Category** | UX Issue |
| **Severity** | Minor |
| **Status** | Acknowledged — Minor DX issue; tasked → T-036 (Sprint 7 P3). Add `"test": "vitest run"` to frontend/package.json scripts. |

### Description

Frontend `package.json` does not have a `"test"` script entry. Running `npm test` fails with "Missing script: test". Tests must be invoked via `npx vitest run` instead. This is inconsistent with the backend (which has `"test": "NODE_ENV=test jest --runInBand --forceExit --detectOpenHandles"`). Recommend adding `"test": "vitest run"` to `frontend/package.json` scripts for CI consistency and developer ergonomics.

---

## FB-022 — Dev Dependency Vulnerability: picomatch (High Severity, Dev-Only)

| Field | Value |
|-------|-------|
| **ID** | FB-022 |
| **Source** | QA Engineer |
| **Sprint** | 6 |
| **Date** | 2026-03-25 |
| **Category** | Bug |
| **Severity** | Minor |
| **Status** | Acknowledged — Dev-only, no production impact; tasked → T-037 (Sprint 7 P3). Run npm audit fix in both backend and frontend. |

### Description

`npm audit` now reports 1 high-severity vulnerability in `picomatch` (both backend and frontend). The vulnerability is in dev-only dependencies (jest, nodemon, vitest, vite) and does NOT affect production runtime. Fix available via `npm audit fix`. Recommend addressing in next sprint's dependency maintenance pass.

---

## FB-023 — Positive: Care History Feature Reinforces Product Vision

| Field | Value |
|-------|-------|
| **ID** | FB-023 |
| **Source** | QA Engineer |
| **Sprint** | 7 |
| **Date** | 2026-03-26 |
| **Category** | Positive |
| **Severity** | N/A |
| **Status** | Acknowledged — Positive feedback on Care History feature; reinforces product vision. Shared with team as quality benchmark. |

### Description

The Care History page (T-039 + T-040) is the first post-MVP feature and it directly reinforces the habit loop that is central to Plant Guardians' value proposition. Seeing a growing list of past care actions creates a sense of accomplishment and motivates continued engagement — exactly what the project brief describes.

Key UX wins:
1. **Color-coded care type icons** — watering (blue), fertilizing (green), repotting (terracotta) provide instant visual recognition without reading text
2. **Empty state is encouraging, not discouraging** — "No care actions yet. Start by marking a plant as watered!" with a friendly sprout SVG illustration and a clear CTA
3. **Filter dropdown populated from plants list** — all plants appear even if they have no history, which avoids confusion
4. **Relative timestamps with full-date tooltips** — scannable at a glance, precise on hover
5. **Load more (N remaining) pattern** — less disruptive than traditional page numbers, works well on mobile
6. **Dual navigation entry points** — sidebar "History" + profile "View care history →" — both discoverable in different contexts

---

## FB-024 — Observation: Moderate npm audit Vulnerabilities in Dev Dependencies (brace-expansion)

| Field | Value |
|-------|-------|
| **ID** | FB-024 |
| **Source** | QA Engineer |
| **Sprint** | 7 |
| **Date** | 2026-03-26 |
| **Category** | Bug |
| **Severity** | Minor |
| **Status** | Acknowledged — Dev-only moderate vulnerabilities (brace-expansion in jest/eslint); no production impact. Fixing requires major version bumps (jest@25→29 breaking change). Accept as known risk; revisit when upstream patches are available. No Sprint 8 action needed. |

### Description

After T-037's npm audit fix (which resolved the picomatch high-severity vulnerability), `npm audit` now reports moderate-severity vulnerabilities in `brace-expansion` — a transitive dependency of `jest` (backend, 20 moderate) and `eslint` (frontend, 5 moderate). These are exclusively in dev dependencies and have zero production runtime impact.

Fixing requires major version bumps: jest@25 (from 29) or eslint@10 (from 9), which are breaking changes that would require significant test configuration updates. Not recommended for an MVP-stage project.

### Recommendation

Accept as known risk. Revisit when jest or eslint release non-breaking patches that resolve the brace-expansion chain. No production impact.

---

## FB-025 — CORS blocks register/login when frontend runs on port 5174

| Field | Value |
|-------|-------|
| **ID** | FB-025 |
| **Source** | Project Owner |
| **Sprint** | 8 |
| **Date** | 2026-03-27 |
| **Category** | Bug |
| **Severity** | Major |
| **Status** | Tasked → T-045 (Sprint 9) — Add http://localhost:5174 to FRONTEND_URL in backend/.env |

### Description

When the Vite dev server starts on port 5174 (because 5173 is already occupied), the backend CORS middleware rejects all requests with `Error: CORS policy: origin http://localhost:5174 not allowed`. `backend/.env` only lists ports 5173 and 4173 in `FRONTEND_URL`. Any attempt to register or log in from the browser fails immediately.

**Fix:** Add `http://localhost:5174` to `FRONTEND_URL` in `backend/.env`.

---

## FB-026 — "Add fertilizing/repotting schedule" buttons do nothing

| Field | Value |
|-------|-------|
| **ID** | FB-026 |
| **Source** | Project Owner |
| **Sprint** | 8 |
| **Date** | 2026-03-27 |
| **Category** | Bug |
| **Severity** | Major |
| **Status** | Tasked → T-046 (Sprint 9) — Fix CareScheduleForm expand button by adding onExpand callback prop |

### Description

On the Add Plant (and likely Edit Plant) page, clicking "Add fertilizing schedule" and "Add repotting schedule" has no effect — the form does not expand.

`CareScheduleForm` manages its collapsed/expanded state internally via `localExpanded`. However, `AddPlantPage` passes `expanded={fertilizingExpanded}` and `expanded={repottingExpanded}` as controlled props. Per the component logic, when `controlledExpanded` is defined (even as `false`), it takes precedence over `localExpanded`. The "Add" button calls `setLocalExpanded(true)` but this is ignored. No `onExpand` callback exists to update the parent's state.

All downstream logic is fully implemented — state, validation, and API payload construction for both care types are complete. Only the expand trigger is broken.

**Fix:** Pass an `onExpand` callback prop (e.g. `onExpand={() => setFertilizingExpanded(true)}`) from `AddPlantPage` and `EditPlantPage` into `CareScheduleForm`, and call it in the "Add" button's `onClick` handler instead of (or in addition to) `setLocalExpanded`.

---

## FB-027 — Save button stays greyed out when only last-watered date is changed

| Field | Value |
|-------|-------|
| **ID** | FB-027 |
| **Source** | Project Owner |
| **Sprint** | 8 |
| **Date** | 2026-03-27 |
| **Category** | Bug |
| **Severity** | Major |
| **Status** | Tasked → T-047 (Sprint 9) — Add last_done_at comparisons to isDirty memo in EditPlantPage |

### Description

On the Edit Plant page, changing only the "Last watered" date field does not enable the Save Changes button — it remains greyed out (`disabled={!isDirty}`).

Root cause: the `isDirty` memo in `EditPlantPage.jsx` (lines 80–109) compares watering/fertilizing/repotting frequency values and units against the original plant data, but never compares the `last_done_at` / `lastDoneAt` fields. So updating a date field alone leaves `isDirty = false`.

**Fix:** Add comparisons for `wateringLastDone`, `fertilizingLastDone`, and `repottingLastDone` against the original `last_done_at` values from `plant.care_schedules` inside the `isDirty` memo. The memo's dependency array will also need these three state variables added.

---

## FB-028 — Gemini 429 rate limit errors; add model fallback chain

| Field | Value |
|-------|-------|
| **ID** | FB-028 |
| **Source** | Project Owner |
| **Sprint** | 8 |
| **Date** | 2026-03-27 |
| **Category** | Bug |
| **Severity** | Major |
| **Status** | Tasked → T-048 (Sprint 9) — Implement Gemini 429 model fallback chain in backend/src/routes/ai.js |

### Description

The AI advice endpoint hits Gemini 429 (rate limit / RPM exceeded) errors during normal use. When a 429 is returned the backend currently treats it as a generic `ExternalServiceError` and returns a 502 to the frontend, showing "service offline" to the user.

**Requested fix:** Implement a model fallback chain in `backend/src/routes/ai.js`. On a 429 response from Gemini, retry the same prompt with the next model in the chain before giving up:

1. **Default:** `gemini-2.0-flash`
2. **Fallback 1:** `gemini-2.5-flash` (on 429 from default)
3. **Fallback 2:** `gemini-2.5-flash-lite` (on 429 from fallback 1)
4. **Fallback 3:** `gemini-2.5-pro` (on 429 from fallback 2)
5. **Give up:** if all four models return 429, throw `ExternalServiceError` as today

Detection: check the caught error for a 429 status (e.g. `err.status === 429` or `err.message` includes `429`) before deciding whether to fall back or re-throw.

---

## FB-029 — Positive: AI advice flow verified end-to-end by project owner

| Field | Value |
|-------|-------|
| **ID** | FB-029 |
| **Source** | Project Owner |
| **Sprint** | 8 |
| **Date** | 2026-03-27 |
| **Category** | Positive |
| **Severity** | N/A |
| **Status** | Acknowledged — AI flow confirmed working by project owner with real Gemini key. Gemini integration is production-ready (model: gemini-2.5-flash). |

### Description

Project owner tested the AI advice flow end-to-end in a browser. Gemini integration is confirmed working (model: gemini-2.5-flash). All 4 modal states verified: loading, success (advice returned), accept/reject actions, and 502 error state. This partially satisfies the AI flow component of T-020 (Flow 2).

---

## FB-030 — Care Due Dashboard: Excellent User-Centric Design

| Field | Value |
|-------|-------|
| **ID** | FB-030 |
| **Source** | QA Engineer (Product-Perspective Review) |
| **Sprint** | 8 |
| **Date** | 2026-03-27 |
| **Category** | Positive |
| **Severity** | N/A |
| **Status** | Acknowledged — Excellent UX on Care Due Dashboard; design decisions shared as team benchmark. |

### Description

The Care Due Dashboard directly addresses the project brief's core promise of "painfully obvious reminders." Several design decisions stand out as particularly effective for the target audience (plant novices):

1. **"Never done" text for unwatered plants** — instead of showing "0 days overdue" or a confusing calculation, it clearly communicates that care has never been performed. This is especially helpful for new users who just added a plant.
2. **"Due tomorrow" instead of "Due in 1 days"** — natural language that avoids robotic phrasing.
3. **Mark-done shortcut from the dashboard** — eliminates the multi-step journey (dashboard → plant detail → mark done → back). Ideal for daily routines.
4. **Sidebar badge** — provides constant, non-intrusive awareness from any page. The 99+ cap prevents absurd numbers for neglected inventories.
5. **All-clear state** ("All your plants are happy!") — positive reinforcement that makes the user feel accomplished. Great UX for the target audience.

---

## FB-031 — Advisory: Express 4 path-to-regexp Dependency — Track for Future Upgrade

| Field | Value |
|-------|-------|
| **ID** | FB-031 |
| **Source** | QA Engineer (Security Scan) |
| **Sprint** | 8 |
| **Date** | 2026-03-27 |
| **Category** | UX Issue |
| **Severity** | P3 |
| **Status** | Acknowledged — Low-risk advisory; tracked for Express 5 migration in a future sprint. No blocking action required. |

### Description

`npm audit` reports a high-severity ReDoS vulnerability in `path-to-regexp@0.1.12` (via Express 4.22.1). Risk is LOW for this application since route patterns are developer-defined, not user-input. However, this should be tracked for eventual Express 5 migration to keep dependencies current. Not blocking any sprint work.

---

## FB-032 — Positive: Care Due Dashboard — Excellent Product-User Alignment

| Field | Value |
|-------|-------|
| **ID** | FB-032 |
| **Source** | QA Engineer (Product-Perspective Testing) |
| **Sprint** | 8 |
| **Date** | 2026-03-27 |
| **Category** | Positive |
| **Severity** | N/A |
| **Status** | Acknowledged — Care Due Dashboard fully delivers on "painfully obvious reminders" product promise. Shared with team. |

### Description

The Care Due Dashboard at `/due` is an excellent implementation of the project brief's core promise: "painfully obvious reminders." Key positives:

1. **Three urgency sections with color coding** make it immediately clear what needs attention. The red/amber/green visual hierarchy is intuitive even for first-time users.
2. **"Mark as done" shortcut** eliminates the need to navigate to each plant detail page — a significant UX improvement for the target "novice plant-killer" user who may have many overdue items.
3. **Optimistic UI removal** with fade-out animation makes the interaction feel snappy and satisfying — similar to the confetti animation on plant detail, this creates positive reinforcement.
4. **Sidebar badge** provides persistent visibility of care needs from any screen, fulfilling the "painfully obvious" promise without being intrusive.
5. **"All your plants are happy!" state** is an encouraging reward moment that motivates continued care.
6. **Never-done display** ("Never done" urgency text for plants with no care history) is a smart touch that catches newly added plants that haven't been tended to yet.

---

## FB-033 — Minor: Focus Management After Mark-Done Not Implemented

| Field | Value |
|-------|-------|
| **ID** | FB-033 |
| **Source** | QA Engineer (Product-Perspective Testing) |
| **Sprint** | 8 |
| **Date** | 2026-03-27 |
| **Category** | UX Issue |
| **Severity** | Minor |
| **Status** | Acknowledged — Minor a11y polish item; added to backlog for a future sprint. Does not block any current work. |

### Description

SPEC-009 specifies that after a successful mark-done action, focus should move to the next item's "Mark as done" button (or to the "View my plants" button if all sections become empty). This focus management is not yet implemented (noted in H-116 as a known limitation). While all buttons remain keyboard-reachable via Tab order, screen reader users may lose their place after an item is removed.

**Impact:** Low — affects keyboard/screen reader users only. The Tab order is still logical, and the aria-live region announces the action result. This is a polish-level accessibility improvement, not a blocker.

**Recommendation:** Track as a minor enhancement for a future sprint.

---

## FB-034 — Sprint 9 QA: CareScheduleForm Expand Fix Works Cleanly (T-046)

| Field | Value |
|-------|-------|
| **Category** | Positive |
| **Severity** | N/A |
| **Sprint** | 9 |
| **Source** | QA Engineer — product-perspective review |
| **Status** | Acknowledged — Clean engineering pattern; noted as internal design standard for controlled component expansion. |
| **Date** | 2026-03-28 |

The `onExpand` callback pattern is a clean solution. It preserves backward compatibility (uncontrolled mode still works) while enabling the controlled expand from parent pages. The dual `setLocalExpanded(true)` + `onExpand()` approach means the component works correctly in both contexts. Good engineering decision.

---

## FB-035 — Sprint 9 QA: Gemini 429 Fallback Chain — Good Resilience Pattern (T-048)

| Field | Value |
|-------|-------|
| **Category** | Positive |
| **Severity** | N/A |
| **Sprint** | 9 |
| **Source** | QA Engineer — product-perspective review |
| **Status** | Acknowledged — Gemini 429 resilience pattern praised; accepted as production-quality AI error handling. |
| **Date** | 2026-03-28 |

The model fallback chain is well-implemented. The `isRateLimitError` helper handles both `err.status` and message-string detection, covering different Gemini SDK error formats. Non-429 errors correctly bypass the fallback (no unnecessary retries). The user experience improves: instead of immediately showing "service offline" on a rate limit, the system silently tries alternative models. The slight latency increase (up to 4 sequential attempts) is an acceptable tradeoff for better availability.

---

## FB-036 — Sprint 9 QA: normalizeLastDone Edge Case — Empty String Comparison

| Field | Value |
|-------|-------|
| **Category** | UX Issue |
| **Severity** | Low |
| **Sprint** | 9 |
| **Source** | QA Engineer — product-perspective review |
| **Status** | Acknowledged — Verified edge case, not a bug. normalizeLastDone handles null → empty string correctly; no action needed. |
| **Date** | 2026-03-28 |

The `normalizeLastDone` helper (`val ? val.split('T')[0] : ''`) works correctly for the current use case. However, if a care schedule has `last_done_at: null` (never done) and the user sets a date, then clears it back to empty, the comparison works because both normalize to `''`. This is correct behavior — just noting it as a verified edge case, not a bug.

---

## FB-037 — Sprint 9 QA: npm audit — path-to-regexp High Severity Still Open

| Field | Value |
|-------|-------|
| **Category** | Bug |
| **Severity** | Low (pre-existing, not new) |
| **Sprint** | 9 |
| **Source** | QA Engineer — security scan |
| **Status** | Acknowledged — Pre-existing advisory (same as FB-031). ReDoS risk is low (static routes, not user-input). Tracked for Express 5 migration in backlog. No Sprint 10 action needed. |
| **Date** | 2026-03-28 |

`npm audit` reports a **high** severity vulnerability in `path-to-regexp` (GHSA-37ch-88jc-xwx2 — ReDoS). This is a transitive dependency of Express 4. It has been present since the project was created and is tracked in FB-031 (Express 5 migration). Not actionable within Express 4. Risk is mitigated by rate limiting on all routes. No user action needed this sprint, but the Express 5 migration should remain on the backlog.

---

## FB-038 — Plant card care status badges don't show which care type is overdue

| Field | Value |
|-------|-------|
| **ID** | FB-038 |
| **Source** | Project Owner |
| **Sprint** | 10 |
| **Date** | 2026-03-28 |
| **Category** | UX Issue |
| **Severity** | Major |
| **Status** | Tasked → T-052 (Sprint 11) |

### Description

On the Plant Inventory page, each plant card shows care status badges (e.g. "1 day overdue", "On track", "On track") but the badges do not indicate which care type they refer to. The user cannot tell at a glance whether watering, fertilizing, or repotting is overdue.

**Requested fix:** Each badge should be prefixed with a care type label or icon so the status is unambiguous. For example: "Watering: 1 day overdue", "Fertilizing: On track", "Repotting: On track" — or equivalent icon-based labelling (e.g. a water droplet icon before the watering badge). The Care History page already uses color-coded icons per care type (blue for watering, green for fertilizing, terracotta for repotting) — the same visual system should be applied to the plant card badges for consistency.

**Fix location:** `frontend/src/components/PlantCard.jsx` (badge rendering logic).

---

## FB-039 — Users are forced to log in again on every page refresh

| Field | Value |
|-------|-------|
| **ID** | FB-039 |
| **Source** | Project Owner |
| **Sprint** | 10 |
| **Date** | 2026-03-28 |
| **Category** | UX Issue |
| **Severity** | Major |
| **Status** | Tasked → T-053 (Sprint 11) |

### Description

Auth tokens are stored in memory only (`let accessToken` / `refreshToken` in `frontend/src/utils/api.js`). This was a deliberate security decision in Sprint 3 to avoid XSS-vulnerable `localStorage`/`sessionStorage` token storage. The tradeoff is that any hard page refresh wipes both tokens, forcing the user to log in again — even if their session should still be valid.

For production this is unacceptable UX. Users expect to remain logged in across browser sessions and page refreshes.

**Recommended fix:** Persist the refresh token in an `HttpOnly` cookie set by the backend on login/refresh (the backend sends `Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict`). The frontend never reads or writes this cookie directly — it is sent automatically by the browser on requests to the refresh endpoint. The access token can remain in memory (short-lived, XSS-safe). On page load, the frontend attempts a silent token refresh using the cookie; if it succeeds, the user is transparently re-authenticated without seeing a login screen.

This is the industry-standard pattern for secure session persistence and resolves the UX issue without reintroducing XSS risk.

**Files affected:** `backend/src/routes/auth.js` (set/clear HttpOnly cookie on login, refresh, logout), `frontend/src/utils/api.js` (call refresh endpoint on app init, pass `credentials: 'include'` on refresh requests).

---

## FB-040 — Removing a plant photo doesn't enable the Save button

| Field | Value |
|-------|-------|
| **ID** | FB-040 |
| **Source** | Project Owner |
| **Sprint** | 10 |
| **Date** | 2026-03-29 |
| **Category** | Bug |
| **Severity** | Major |
| **Status** | Tasked → T-054 (Sprint 11) |

### Description

On the Edit Plant page, removing an existing photo (via the remove button) does not enable the Save Changes button — it remains greyed out.

Root cause: the `isDirty` memo in `EditPlantPage.jsx` (line 88) only returns `true` when a new photo file is selected (`if (photo) return true`). It never compares `photoUrl` against the original `plant.photo_url`. When the user removes the photo, `setPhotoUrl('')` is called but `isDirty` stays `false` because the comparison is never made.

**Fix:** Add a check inside the `isDirty` memo comparing `photoUrl` against `(plant.photo_url || '')`. If they differ, return `true`. Also add `photoUrl` to the memo's dependency array.

**Fix location:** `frontend/src/pages/EditPlantPage.jsx`, `isDirty` useMemo (around line 83–115).

---

## FB-041 — Care Due Dashboard focus management works excellently after T-050

| Field | Value |
|-------|-------|
| **ID** | FB-041 |
| **Source** | QA Engineer — product-perspective testing |
| **Sprint** | 10 |
| **Date** | 2026-03-29 |
| **Category** | Positive |
| **Severity** | N/A |
| **Status** | Acknowledged — Focus management after mark-done verified working correctly; excellent accessibility implementation. |

### Description

The Care Due Dashboard (`/due`) is a standout feature. The three-section urgency layout (Overdue → Due Today → Coming Up) makes it immediately clear what needs attention. The T-050 focus management fix ensures keyboard/screen-reader users can efficiently work through their care tasks — focus correctly moves to the next actionable button after each mark-done, including the edge case of reaching all-clear state. The reduced-motion path is properly handled. This is excellent accessibility work.

---

## FB-042 — Gemini fallback chain provides resilient AI advice experience

| Field | Value |
|-------|-------|
| **ID** | FB-042 |
| **Source** | QA Engineer — product-perspective testing |
| **Sprint** | 10 |
| **Date** | 2026-03-29 |
| **Category** | Positive |
| **Severity** | N/A |
| **Status** | Acknowledged — Gemini 429 fallback chain validated as production-quality AI resilience pattern. |

### Description

The 4-model Gemini fallback chain (T-048) makes the AI advice feature much more resilient. In test runs, 429 rate-limit errors correctly cascade through `gemini-2.0-flash → gemini-2.5-flash → gemini-2.5-flash-lite → gemini-2.5-pro` before failing gracefully with a user-friendly error. The error message ("AI service returned an error or timed out") is appropriately vague — no internal details leaked. This is the right pattern for external API dependencies.

---

---

## FB-043 — Monitor Alert: CORS Mismatch — Staging Frontend Port 4175 Not in FRONTEND_URL

| Field | Value |
|-------|-------|
| **ID** | FB-043 |
| **Source** | Monitor Agent — Sprint #10 Post-Deploy Health Check |
| **Sprint** | 10 |
| **Date** | 2026-03-29 |
| **Category** | Monitor Alert |
| **Severity** | Major |
| **Status** | Tasked → T-055 (Sprint 11) — Add http://localhost:4175 to FRONTEND_URL; implement durable fixed-port vite preview config to prevent future port drift |

### Description

The Sprint #10 staging frontend preview server is running on port **4175** (ports 4173 and 4174 were already in use from prior sprint sessions). However, `backend/.env` `FRONTEND_URL` only includes `http://localhost:5173,http://localhost:5174,http://localhost:4173` — port **4175 is missing**.

`backend/src/app.js` CORS middleware calls `callback(new Error(...))` for unrecognized origins. Express's error handler converts this to an HTTP 500 response with no `Access-Control-Allow-Origin` header.

**Observed behavior:**
- `curl -H "Origin: http://localhost:4175" http://localhost:3000/api/v1/plants` → **HTTP 500**
- CORS OPTIONS preflight from `http://localhost:4175` → **HTTP 500**
- Direct API calls (no Origin header) → **HTTP 200** ✅ (working normally)

**Impact:** Browser-initiated API calls from the staging frontend at `http://localhost:4175` are blocked. The staging app cannot be used for T-020 user testing. The /due page (T-050) change cannot be validated in a real browser session.

**Fix:** Add `,http://localhost:4175` to `FRONTEND_URL` in `backend/.env` and restart the backend process. Same pattern as T-045 (Sprint 9).

**Root cause pattern:** The `vite preview` port increments each sprint when prior ports are occupied. `FRONTEND_URL` is not automatically updated. A more durable fix would be to document the expected preview port in `.env.example` and remind the Deploy Engineer to update it each sprint.

**Handoff created:** H-117 (Monitor Agent → Backend Engineer)

---

### FB-041 — Sprint #11 QA Product Observations (2026-03-30)

**Source:** QA Engineer — Sprint #11 product-perspective testing

---

**Observation 1: Care type badges are a major clarity improvement**
- **Category:** Positive
- **Severity:** N/A
- **Details:** T-052 badges ("Watering: 2 days overdue", "Fertilizing: On track") are significantly clearer than the previous unlabeled status pills. The color-coded Phosphor icons (blue drop, green leaf, terracotta pot) provide instant visual recognition. Multi-badge layout wraps cleanly. This makes the inventory page immediately more useful for the target audience (novice plant carers).

**Observation 2: Photo removal Save button fix resolves a real dead-end**
- **Category:** Positive
- **Severity:** N/A
- **Details:** T-054 fixes a genuine user frustration — before this, removing a plant photo left the Save button disabled with no way to persist the change. Simple fix, high impact.

**Observation 3: Frontend auth refresh is temporarily broken**
- **Category:** Bug
- **Severity:** P1
- **Details:** The backend now reads refresh tokens from cookies, but `api.js` still sends them in the request body. This means automatic token refresh (on 401) will fail — users will be logged out unexpectedly when their access token expires. Frontend Engineer needs to complete the `api.js` cookie migration (H-130, H-131) before this can ship. Not a regression for users yet (not deployed), but MUST be fixed before any deploy that includes T-053 backend changes.

**Observation 4: CORS port drift permanently resolved**
- **Category:** Positive
- **Severity:** N/A
- **Details:** T-055 pins `vite preview` to port 4173, eliminating the recurring CORS failures that blocked T-020 for 10 consecutive sprints. The `.env.example` now documents all canonical ports. This is a long-overdue infrastructure fix.

---

### QA Pass #2 — Product-Perspective Testing (2026-03-30)

**Source:** QA Engineer — Sprint #11 product-perspective testing (pass #2)

---

**Observation 5: Error handler properly shields internal details**
- **Category:** Positive
- **Severity:** N/A
- **Details:** The centralized `errorHandler.js` correctly returns generic "An unexpected error occurred" for unknown errors, never leaking stack traces, file paths, or internal state. Structured JSON error format (`{ error: { message, code } }`) is consistent across all endpoints. This is critical for the novice user audience — they should never see scary technical errors.

**Observation 6: Rate limiting protects against brute force**
- **Category:** Positive
- **Severity:** N/A
- **Details:** Auth endpoints have a stricter rate limit (20/15min) vs general API (100/15min). This protects user accounts from brute-force attacks. Rate limit messages are user-friendly ("Too many authentication attempts, please try again later.").

**Observation 7: Test DB port inconsistency in .env**
- **Category:** UX Issue
- **Severity:** P3
- **Details:** `backend/.env` has `TEST_DATABASE_URL` pointing to port 5432 (same as staging DB), while `docker-compose.yml` and `.env.example` map the test postgres to port 5433. This doesn't cause test failures because the test DB is differentiated by name, but it's a papercut that could confuse a new contributor. Recommend aligning `.env` TEST_DATABASE_URL to port 5433 for consistency.

**Observation 8: HttpOnly cookie auth is a solid security upgrade (backend side)**
- **Category:** Positive
- **Severity:** N/A
- **Details:** T-053 backend implementation is textbook: token rotation on refresh, HttpOnly + Secure + SameSite=Strict + scoped Path. Refresh tokens are never exposed to JavaScript. Cookie clearing on logout and account deletion. This eliminates the XSS-accessible refresh token that was previously stored in JS memory. Once the frontend half is done, this will be a significant security improvement.


---

## FB-044 — Monitor Alert: Intermittent 500 on POST /api/v1/auth/login

**ID:** FB-044
**Type:** Monitor Alert
**Severity:** Major
**Sprint:** 11
**Date:** 2026-03-30
**Reported By:** Monitor Agent
**Environment:** Staging (http://localhost:3000)
**Status:** Tasked → T-056 (Sprint 12) — Investigate and fix intermittent auth 500 on POST /api/v1/auth/login; Major bug must be resolved before T-020 user testing can proceed.

### Description

During the Sprint #11 post-deploy health check (triggered by H-133 / H-137), `POST /api/v1/auth/login` returned HTTP 500 `{"error":{"message":"An unexpected error occurred.","code":"INTERNAL_ERROR"}}` on 2 of the first 8 calls in the session.

**Reproduction pattern:**
- Call 1 (first call of session): HTTP 500
- Call 2 (verbose curl with `-v` flag): HTTP 200 ✅
- Call 3 (standard curl): HTTP 500
- Calls 4–18: HTTP 200 ✅ (until rate limit at call 19/20)

**Backend process:** PID 41646 (`node src/server.js`) running since 2026-03-30 09:19 AM.
**Database:** PostgreSQL on localhost:5432, staging DB `plant_guardians_staging` — connected and healthy (3 users, CRUD succeeds).

### Suspected Root Cause

1. **DB connection pool cold start**: On first requests after an idle period, the connection pool may have uninitialized connections, causing a transient query failure. Subsequent requests succeed once the pool is warmed up.
2. **T-053 cookie-parser race**: The newly added `cookie-parser` middleware (T-053 / H-120) could introduce a timing issue in the request parsing pipeline that affects a subset of requests.

### Impact

- Users hitting the backend after restart or idle period may receive a 500 login error (P1 UX failure — cannot log in).
- T-020 user testing should not begin until this is confirmed non-reproducible after warm-up, or root cause is identified and fixed.

### Recommended Investigation Steps

1. Check backend error logs (stderr / pm2 logs / nodemon output) for stack traces around the 500 responses.
2. Reproduce: restart backend cold → immediately run 5 POST /api/v1/auth/login calls and observe.
3. Check if `cookie-parser` initialization order in `backend/src/app.js` is correct (must be registered before auth router).
4. Check if `refresh_tokens` table has any constraint violations being swallowed by the generic error handler.
5. If DB pool cold-start is confirmed, consider configuring `knex` pool `min` size to keep at least 1 connection alive.

### Handoff

→ H-138 filed to Deploy Engineer for investigation.

---

## FB-045 — Plant photo broken after upload and save

| Field | Value |
|-------|-------|
| **ID** | FB-045 |
| **Source** | Project Owner |
| **Sprint** | 12 |
| **Date** | 2026-03-30 |
| **Category** | Bug |
| **Severity** | Major |
| **Status** | Tasked → T-059 (Sprint 13) |

### Description

After adding a photo to a plant and saving, the photo does not display — the image appears broken. The upload appears to succeed (no error shown), but the resulting photo URL is not resolvable in the browser.

**Likely root cause:** Photos are uploaded to `./uploads/` on the backend server (`UPLOAD_DIR` in `.env`). If the backend does not serve the uploads directory as static files, or if `photo_url` is stored as a server-local path rather than a publicly accessible URL, the browser cannot load the image.

**Investigation steps:**
1. Inspect the plant detail API response — check the value of `photo_url` after upload.
2. Check whether the backend serves `/uploads/` as static files (`express.static` in `backend/src/app.js`).
3. Verify the URL returned by `POST /plants/:id/photo` is correctly relative or absolute and loadable by the browser.

**Fix location:** `backend/src/app.js` (static file serving), upload route (URL construction in photo upload response).

---

## FB-046 — Care Due Dashboard categorizes plants into wrong urgency sections due to UTC/local timezone mismatch

| Field | Value |
|-------|-------|
| **ID** | FB-046 |
| **Source** | Project Owner |
| **Sprint** | 12 |
| **Date** | 2026-03-30 |
| **Category** | Bug |
| **Severity** | Major |
| **Status** | Tasked → T-060 (Sprint 13) |

### Description

Plants that should appear in "Due Today" or "Upcoming" show up in the wrong section on the Care Due Dashboard. For example, a plant due today appears as overdue, or an upcoming plant appears as due today.

**Root cause:** `backend/src/routes/careDue.js` calculates "today" using `startOfDayUTC(new Date())` — midnight UTC. If the user's local timezone is behind UTC (e.g. US Eastern = UTC-4/5), the backend's UTC "today" is already tomorrow from the user's perspective. This shifts all categorization by one day, causing plants to appear one bucket too urgent.

**Fix:** The backend should base its day boundary on the user's local timezone, not UTC. The simplest approach is to accept an optional `tz` or `utcOffset` query parameter from the frontend (e.g. `GET /api/v1/care-due?utcOffset=-240` for UTC-4) and use it to compute the local midnight boundary. Alternatively, use the browser's `Intl.DateTimeFormat().resolvedOptions().timeZone` to send a timezone name and compute the local day on the backend using a library like `date-fns-tz`.

**Fix locations:** `backend/src/routes/careDue.js` (accept timezone param, adjust `today` calculation), `frontend/src/utils/api.js` or `CareDuePage.jsx` (send timezone in request).

---

## FB-047 — T-020 COMPLETE: All MVP flows verified by project owner

| Field | Value |
|-------|-------|
| **ID** | FB-047 |
| **Source** | Project Owner |
| **Sprint** | 12 |
| **Date** | 2026-03-30 |
| **Category** | Positive |
| **Severity** | N/A |
| **Status** | Acknowledged — T-020 Done. MVP officially declared complete. Shared with team. |

### Description

Project owner has completed T-020 user testing. All 5 flows verified end-to-end in the browser:

- **Flow 1 (Novice):** Register → add plant → mark care done → confetti ✅
- **Flow 2 (AI advice):** Accept + reject flows ✅
- **Flow 3 (Inventory management):** Edit schedule + save; delete a plant ✅
- **Care History (/history):** ✅
- **Care Due Dashboard (/due):** Functional but has a timezone categorization bug (FB-046 — already logged). Non-blocking for MVP declaration.

**T-020 is Done. The MVP is officially complete.** FB-046 (Care Due timezone bug) and FB-045 (photo display broken) are carried forward as Sprint 13 bug fixes. T-020 must be marked Done in `dev-cycle-tracker.md` and the sprint closeout summary must declare MVP complete.

---

## FB-048 — QA Product-Perspective: Sprint 12 Auth Reliability

| Field | Value |
|-------|-------|
| **ID** | FB-048 |
| **Source** | QA Engineer |
| **Sprint** | 12 |
| **Date** | 2026-03-30 |
| **Category** | Positive |
| **Severity** | N/A |
| **Status** | Acknowledged — T-056 pool warm-up quality noted. Shared with team. |

### Description

T-056 pool warm-up fix is well-engineered. The `afterCreate` connection validation + `idleTimeoutMillis` + pool warm-up before accepting traffic is a robust defense-in-depth approach. The 2 regression tests (rapid sequential and concurrent login) provide good ongoing protection. Auth reliability should be significantly improved.

---

## FB-049 — QA Product-Perspective: Cookie Auth Migration Clean

| Field | Value |
|-------|-------|
| **ID** | FB-049 |
| **Source** | QA Engineer |
| **Sprint** | 12 |
| **Date** | 2026-03-30 |
| **Category** | Positive |
| **Severity** | N/A |
| **Status** | Acknowledged — T-053-frontend cookie migration quality noted. Shared with team. |

### Description

T-053-frontend cookie auth migration is thorough. All 5 fetch call sites have `credentials: 'include'`. The silent re-auth pattern in useAuth.jsx handles the loading state correctly — users won't see a flash of the login page on hard refresh. The `setTokens()` legacy alias is a good backward-compatibility touch. 13 new tests cover the full happy + error path surface area.

---

## FB-050 — QA Advisory: Flaky careDue Test (Pre-existing)

| Field | Value |
|-------|-------|
| **ID** | FB-050 |
| **Source** | QA Engineer |
| **Sprint** | 12 |
| **Date** | 2026-03-30 |
| **Category** | Bug |
| **Severity** | P3 |
| **Status** | Acknowledged — Minor/pre-existing flaky test. Backlog for future sprint investigation. |

### Description

`careDue.test.js` → "should handle never-done plants" intermittently fails with `socket hang up` when run as part of the full backend test suite (74 tests). Passes consistently in isolation. Likely related to connection pool pressure during full suite execution — the `idleTimeoutMillis: 10000` in the test config may be too aggressive when tests run quickly back-to-back. Not a Sprint 12 regression (pre-existing). Recommend investigating as a Sprint 13 task.

---

## FB-051 — QA Advisory: npm audit Vulnerabilities (Sprint 13 Housekeeping)

| Field | Value |
|-------|-------|
| **ID** | FB-051 |
| **Source** | QA Engineer |
| **Sprint** | 12 |
| **Date** | 2026-03-30 |
| **Category** | Bug |
| **Severity** | P3 |
| **Status** | Acknowledged — P3 housekeeping. Scheduled as Sprint 13 tech debt task T-061. |

### Description

`npm audit` reports 2 vulnerabilities: (1) path-to-regexp ReDoS in Express 4 (high severity, but mitigated by rate limiting), (2) brace-expansion DoS in nodemon (moderate, dev-only). Both have `npm audit fix` available. Recommend running `npm audit fix` as Sprint 13 housekeeping. Express 5 migration remains out of scope.

---

## FB-052 — QA Product-Perspective: Auth Flow Robustness (Positive)

| Field | Value |
|-------|-------|
| **ID** | FB-052 |
| **Source** | QA Engineer |
| **Sprint** | 12 |
| **Date** | 2026-03-30 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged — Production-quality auth architecture noted. Shared with team. |

### Description

The auth flow is now robust and well-architected. Refresh token rotation with SHA-256 hashing, HttpOnly cookies with `Secure` + `SameSite=Strict`, automatic token refresh on 401, and silent re-auth on mount all work correctly. The T-056 cold-start fix eliminates the intermittent 500 that was blocking MVP testing. This is solid production-quality authentication.

---

## FB-053 — QA Product-Perspective: Silent Re-Auth UX (Positive)

| Field | Value |
|-------|-------|
| **ID** | FB-053 |
| **Source** | QA Engineer |
| **Sprint** | 12 |
| **Date** | 2026-03-30 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged — Silent re-auth UX quality noted. Consistent with Japandi aesthetic direction. |

### Description

The loading state in useAuth.jsx prevents the jarring "login page flash" on hard refresh. When a user refreshes the page, they see a loading state (not the login form) while the silent re-auth call completes. This is good UX — consistent with the Japandi "calm, no surprises" aesthetic direction.

---

## FB-054 — QA Product-Perspective: Gemini API Key Placeholder

| Field | Value |
|-------|-------|
| **ID** | FB-054 |
| **Source** | QA Engineer |
| **Sprint** | 12 |
| **Date** | 2026-03-30 |
| **Category** | UX Issue |
| **Severity** | Minor |
| **Status** | Acknowledged — Gemini API key is active and quota-available per FB-058. No action needed. |

### Description

The GEMINI_API_KEY in backend/.env appears to be a real key (`AIzaSyB_...`) but the Gemini API returns 429/502 consistently in tests (quota exceeded). During T-020 user testing, Flow 2 (AI advice) will likely fail with a 502. The error handling is correct (returns structured error, doesn't leak internals), but the user experience during testing may be impacted. The project owner should ensure a valid, quota-available Gemini API key is configured before T-020 testing, or accept that AI advice will return errors during MVP demo.

### Expected vs Actual

- **Expected:** POST /ai/advice returns 200 with care advice
- **Actual:** Returns 502 "AI service returned an error or timed out." (due to API quota)

---

## FB-055 — QA Product-Perspective: Edge Case — Long Plant Names

| Field | Value |
|-------|-------|
| **ID** | FB-055 |
| **Source** | QA Engineer |
| **Sprint** | 12 |
| **Date** | 2026-03-30 |
| **Category** | UX Issue |
| **Severity** | Cosmetic |
| **Status** | Acknowledged — Cosmetic/minor validation gap. Backlog for future sprint. |

### Description

The POST /plants endpoint validates `name` as required string but does not enforce a max length. A user could submit a very long plant name (e.g., 10,000 characters) and it would be stored. This could cause UI overflow issues on the inventory page plant cards. Recommend adding `max: 200` to the plant name validation rule as a Sprint 13 improvement.

---

## FB-056 — QA Product-Perspective: Error Handling Quality (Positive)

| Field | Value |
|-------|-------|
| **ID** | FB-056 |
| **Source** | QA Engineer |
| **Sprint** | 12 |
| **Date** | 2026-03-30 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged — Production-ready error handling quality noted. Shared with team. |

### Description

The centralized error handler in errorHandler.js is well-implemented. Unknown errors never leak stack traces or file paths. All structured errors return consistent `{ error: { message, code } }` format. The frontend's ApiError class properly captures status codes and error codes for UI display. This is production-ready error handling.

---

## FB-057 — Monitor Alert: Transient 500 on POST /api/v1/auth/login After Pool Idle Reaping

| Field | Value |
|-------|-------|
| **ID** | FB-057 |
| **Source** | Monitor Agent |
| **Sprint** | 12 |
| **Date** | 2026-03-30 |
| **Category** | Monitor Alert |
| **Severity** | Major |
| **Status** | Tasked → T-058 (Sprint 13 P1) |

### Description

During Sprint 12 post-deploy health check, the first call to `POST /api/v1/auth/login` (and in a separate earlier Monitor Agent run, the first 3 consecutive calls) returned `HTTP 500 Internal Server Error`:

```
HTTP/1.1 500 Internal Server Error
{"error":{"message":"An unexpected error occurred.","code":"INTERNAL_ERROR"}}
```

After the initial failure(s), all subsequent calls succeeded with HTTP 200 and a valid access token. The behavior is **self-healing** but represents a recurring transient failure window.

### Root Cause Assessment

T-056 added a Knex pool warm-up at server **startup** (2 concurrent `SELECT 1` queries before the HTTP server binds). However, `knexfile.js` sets `idleTimeoutMillis: 30000` (30 seconds) — connections are reaped after 30 seconds of inactivity. `reapIntervalMillis: 1000` checks every second. When the server has been idle for >30 seconds (common in staging), the pool's 2 connections are reaped. When a request arrives, `tarn` (Knex's pool manager) attempts to refill `min: 2`, but the `afterCreate` validation hook adds latency. There appears to be a brief race window where the request races against connection creation, resulting in a 500.

T-056 fixed **cold-start** 500s (server process just started, pool never initialized). It does **not** prevent post-idle 500s when connections are reaped after 30 seconds of inactivity.

### Impact

- **Staging:** Low — self-healing within 1–3 requests. Does not block T-020 user testing.
- **Production:** High risk — users hitting login immediately after a traffic lull could receive a 500. One transient 500 on login is a serious UX failure.

### Recommended Fix (Sprint 13)

1. Increase `idleTimeoutMillis` from `30000` to `600000` (10 minutes) to match typical PostgreSQL server idle timeout
2. Or implement a periodic keepalive query (e.g., `setInterval(() => db.raw('SELECT 1'), 25000)`) after server startup to prevent pool connections from idling out
3. Alternatively, set `min: 2, max: 10` on the pool AND disable `idleTimeoutMillis` entirely (rely on PostgreSQL's server-side `tcp_keepalives_idle`)

### Related

- T-056 (partial fix — addresses cold-start but not post-idle reaping)
- H-150 (Deploy Engineer staging deploy)
- See `knexfile.js` `pool.idleTimeoutMillis: 30000` and `pool.reapIntervalMillis: 1000`

---

## FB-058 — Monitor Observation: Gemini AI Now Returning 200 OK (Contradicts FB-054)

| Field | Value |
|-------|-------|
| **ID** | FB-058 |
| **Source** | Monitor Agent |
| **Sprint** | 12 |
| **Date** | 2026-03-30 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged — Gemini AI active and quota-available. Resolves FB-054 advisory. |

### Description

During Sprint 12 post-deploy health check (2026-03-31T01:10Z), `POST /api/v1/ai/advice` with payload `{"plant_type":"Pothos"}` returned **HTTP 200 OK** with a valid, complete Gemini care advice response:

```json
{
  "data": {
    "identified_plant_type": "Pothos",
    "confidence": "high",
    "care_advice": {
      "watering": {"frequency_value": 7, "frequency_unit": "days", "notes": "..."},
      "fertilizing": {"frequency_value": 1, "frequency_unit": "months", "notes": "..."},
      ...
    }
  }
}
```

This contradicts FB-054 which reported consistent 502 errors due to API quota exhaustion. The `GEMINI_API_KEY` in `backend/.env` is apparently now active and has available quota.

**Impact on T-020:** Flow 2 (AI advice) is now testable in the staging environment. The advisory in H-151 about Gemini returning 502 during user testing is no longer applicable.

---

## FB-059 — QA Product-Perspective: Pool Idle Fix Eliminates Intermittent Login Failures (Positive)

| Field | Value |
|-------|-------|
| **ID** | FB-059 |
| **Source** | QA Engineer |
| **Sprint** | 14 |
| **Date** | 2026-03-31 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |

### Description

T-058 pool idle fix is well-engineered. The 5-minute keepalive with `.unref()` is the right pattern — keeps connections warm without preventing graceful shutdown. Users will no longer experience random 500 errors when the server has been idle for 30+ seconds. This was a critical UX issue (FB-057) and is now fully resolved.

---

## FB-060 — QA Product-Perspective: Dark Mode Implementation Quality (Positive)

| Field | Value |
|-------|-------|
| **ID** | FB-060 |
| **Source** | QA Engineer |
| **Sprint** | 14 |
| **Date** | 2026-03-31 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |

### Description

T-063 dark mode implementation is thorough and well-executed. The CSS custom properties approach avoids JS runtime color switching. FOUC prevention script in `<head>` prevents flash of light mode on dark-mode users' first load. The ThemeToggle uses proper ARIA (`radiogroup` + `aria-checked`). System preference listener automatically updates when OS theme changes. Reduced-motion support for theme transitions is a nice accessibility touch. This is a high-quality first post-MVP feature.

---

## FB-061 — QA Product-Perspective: Confetti Animation Colors in Dark Mode

| Field | Value |
|-------|-------|
| **ID** | FB-061 |
| **Source** | QA Engineer |
| **Sprint** | 14 |
| **Date** | 2026-03-31 |
| **Category** | UX Issue |
| **Severity** | Cosmetic |
| **Status** | Tasked → Backlog (B-007) |

### Description

The confetti animation (triggered when marking a care action as done) uses the existing light-mode color palette in dark mode. While the existing colors still work acceptably on a dark background, adding vibrancy colors (`#7EAF7E`, `#E8B94A`) per the SPEC-010 guidance would enhance the celebration effect in dark mode. This is a nice-to-have enhancement for a future sprint.

---

## FB-062 — QA Product-Perspective: Care Due Dashboard Timezone Fix Works Correctly

| Field | Value |
|-------|-------|
| **ID** | FB-062 |
| **Source** | QA Engineer |
| **Sprint** | 14 |
| **Date** | 2026-03-31 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |

### Description

T-060 timezone fix correctly addresses the UTC/local timezone mismatch (FB-046). The backend validation is thorough — integer check, range check (-840 to 840), and float rejection via string equality. The frontend correctly converts JavaScript's inverted `getTimezoneOffset()` by multiplying by -1. Backward compatibility is preserved when the param is omitted. Users in timezones behind UTC will no longer see plants bucketed one day too urgent.

---

## FB-063 — QA Re-Verification: Sprint 14 Full Test Suite Stable

| Field | Value |
|-------|-------|
| **ID** | FB-063 |
| **Source** | QA Engineer |
| **Sprint** | 14 |
| **Date** | 2026-03-31 |
| **Category** | Positive |
| **Severity** | — |
| **Status** | Acknowledged |

### Description

Full independent re-verification of Sprint 14 confirms all 83 backend tests and 135 frontend tests pass consistently. No flaky tests observed. npm audit reports 0 vulnerabilities in both packages. All Sprint 14 fixes (pool idle, photo upload, timezone, dark mode) are verified correct. The codebase is in excellent shape for continued development.

---

## FB-064 — QA Advisory: Gemini API Key in .env May Need Rotation

| Field | Value |
|-------|-------|
| **ID** | FB-064 |
| **Source** | QA Engineer |
| **Sprint** | 14 |
| **Date** | 2026-03-31 |
| **Category** | Suggestion |
| **Severity** | Minor |
| **Status** | Acknowledged — Minor suggestion. Not blocking. Noted as a pre-production checklist item for the project owner: rotate GEMINI_API_KEY before first production deploy. No Sprint 15 task required. |

### Description

The `GEMINI_API_KEY` value in `backend/.env` appears to be a real Google API key (starts with `AIzaSyB_`). While `.env` is gitignored and not committed to the repository, best practice is to rotate API keys before any production deployment. The `.env.example` correctly uses a placeholder value. This is informational — not blocking staging or development.

---

## FB-065 — Monitor Observation: Residual Single Transient 500 on First Login (Post-T-058)

| Field | Value |
|-------|-------|
| **ID** | FB-065 |
| **Source** | Monitor Agent |
| **Sprint** | 14 |
| **Date** | 2026-03-31 |
| **Category** | Monitor Alert |
| **Severity** | Minor |
| **Status** | Acknowledged — Minor residual issue. T-058 is a clear improvement (1 transient vs 1–3 pre-fix). Pool startup warm-up improvement added to Sprint 15 technical debt backlog (T-066). Not blocking production. |

### Description

During Sprint 14 post-deploy health check, a single transient `HTTP 500 Internal Server Error` was observed on the very first call to `POST /api/v1/auth/login` with the seeded test account (`test@plantguardians.local`). The server (PID 88596) had been running idle for approximately 4 hours at the time of the check.

```
POST /api/v1/auth/login
→ HTTP 500: {"error":{"message":"An unexpected error occurred.","code":"INTERNAL_ERROR"}}
```

All subsequent calls immediately returned correct status codes:
- Second call: HTTP 401 INVALID_CREDENTIALS (wrong password test) → correct
- Valid credentials: HTTP 200 with access_token → correct
- T-058 regression: 5 sequential logins → all HTTP 200 → correct

### Comparison to Pre-T-058

**FB-057 (Sprint 12):** First 1–3 consecutive calls could fail with 500. Self-healing required multiple retries.
**Sprint 14 (post-T-058):** Only 1 transient 500 on the very first call of a cold health check session. The keepalive (`setInterval` every 5 min) appears to be maintaining the pool during normal operation, but a brief pool re-establishment window remains on the very first request after an extended idle period (>4 hours, beyond any keepalive window if server process was newly started).

### Impact

- **Staging:** Negligible — self-healed after one call. Does not block testing or user flows.
- **Production:** Low — T-058 significantly reduces exposure. If server process restarts and receives immediate traffic before the first keepalive fires (within 5 min), one user could see a 500. The keepalive prevents recurring failures after that window.

### Recommendation

Consider adding a connection pool warm-up on server start (execute `SELECT 1` before binding HTTP server) to eliminate the 1-request startup window. This was the intent of T-056 but may need re-verification after T-058's keepalive changes. **Not blocking — T-058 is a clear improvement and passes the regression test.**

### Related

- FB-057 (original issue, Sprint 12)
- T-058 (pool idle fix, Sprint 13/14)
