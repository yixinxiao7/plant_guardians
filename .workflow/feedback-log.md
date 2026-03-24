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

