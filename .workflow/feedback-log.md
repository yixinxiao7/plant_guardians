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
| **Status** | New |

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

