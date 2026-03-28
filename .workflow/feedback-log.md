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
| **Status** | New |

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
| **Status** | New |

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
| **Status** | New |

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
| **Status** | New |

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
| **Status** | New |

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
| **Status** | New |

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
| **Status** | New |

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
| **Status** | New |

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
| **Status** | New |

### Description

SPEC-009 specifies that after a successful mark-done action, focus should move to the next item's "Mark as done" button (or to the "View my plants" button if all sections become empty). This focus management is not yet implemented (noted in H-116 as a known limitation). While all buttons remain keyboard-reachable via Tab order, screen reader users may lose their place after an item is removed.

**Impact:** Low — affects keyboard/screen reader users only. The Tab order is still logical, and the aria-live region announces the action result. This is a polish-level accessibility improvement, not a blocker.

**Recommendation:** Track as a minor enhancement for a future sprint.

---
