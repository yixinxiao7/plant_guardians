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

## FB-129 — QA: Bug — Backend `npm audit` reports new moderate `uuid` advisory (not exploitable in our codebase) (Sprint 29, re-verification pass 3)

| Field | Value |
|-------|-------|
| ID | FB-129 |
| Source | QA Engineer |
| Sprint | 29 |
| Category | Bug |
| Severity | Minor |
| Description | `cd backend && npm audit` now reports 1 moderate vulnerability: `uuid <14.0.0 — Missing buffer bounds check in v3/v5/v6 when buf is provided` (GHSA-w5hq-g745-h8pq). The fix is a breaking-change bump to `uuid@14.0.0`. **This is not exploitable in our codebase** — `backend/src/middleware/upload.js` is the only consumer of the `uuid` package and it only calls `uuid.v4()` (no `v3`, `v5`, or `v6`, and no `buf` parameter). Sprint #29 acceptance bar ("0 high-severity vulnerabilities") is still met (0 high, 0 critical). Not a deploy blocker. |
| Steps to Reproduce | `cd backend && npm audit` |
| Expected vs Actual | Expected: 0 vulnerabilities (matches H-395 baseline). Actual: 1 moderate (uuid). |
| Recommendation | Defer to a future sprint that already touches `backend/package.json`. When bumping, verify `uuid.v4()` import path is unchanged in `middleware/upload.js`. Re-run `npm audit` to confirm 0. |
| Status | Acknowledged — Minor bug (uuid moderate advisory; non-exploitable in our codebase since only `uuid.v4()` is used with no `buf` argument). Scheduled for housekeeping fix in Sprint #30 (T-140). |

---

## FB-128 — QA: Positive — `DELETE /share` live response is a textbook 204 (Sprint 29, re-verification)

| Field | Value |
|-------|-------|
| ID | FB-128 |
| Source | QA Engineer |
| Sprint | 29 |
| Category | Positive |
| Severity | Cosmetic |
| Description | Captured a live `curl -i -X DELETE` against a shared plant: `HTTP/1.1 204 No Content` with no response body and no `Content-Type` header. All security-relevant response headers (HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Cross-Origin-Opener-Policy, Cross-Origin-Resource-Policy, X-XSS-Protection) are present on the 204 path too — good defense-in-depth. Exactly what the contract prescribes. |
| Status | Acknowledged — Positive feedback. 204 response contract compliance and defense-in-depth security headers are the expected team standard for all DELETE endpoints. |

---

## FB-127 — QA: Positive — T-139 anti-regression logic holds under a real stale-batch scenario (Sprint 29, re-verification)

| Field | Value |
|-------|-------|
| ID | FB-127 |
| Source | QA Engineer |
| Sprint | 29 |
| Category | Positive |
| Severity | Cosmetic |
| Description | Manually fired a `POST /care-actions/batch` with `performed_at=2026-01-01T00:00:00Z` on a schedule whose `last_done_at` was already `2026-04-20T16:00:05Z`. The action was inserted (status=created, visible in `care_actions`), but the schedule's `last_done_at` did NOT regress — it stayed at April 20. This is the exact edge case that would have silently corrupted user state if the update were unconditional; the implementation handles it cleanly via the `if (!current \|\| new Date(newest) > new Date(current))` guard inside `CareAction.batchCreate()`'s transaction. Good robustness. |
| Status | Acknowledged — Positive feedback. The "only-if-newer" guard in `CareAction.batchCreate()` is the correct durable pattern for all timestamp-update logic. Noted as a team standard for any future batch-insert+timestamp-update work. |

---

## FB-126 — QA: Positive — 404-before-403 ordering on GET/DELETE share prevents plant-ID enumeration (Sprint 29)

| Field | Value |
|-------|-------|
| ID | FB-126 |
| Source | QA Engineer |
| Sprint | 29 |
| Category | Positive |
| Severity | — |
| Description | Both new T-133 endpoints (`GET` and `DELETE /api/v1/plants/:plantId/share`) resolve the plant lookup first and return 404 NOT_FOUND when the plant does not exist — *before* performing the ownership check that would otherwise return 403. This is intentional (see `backend/src/routes/plants.js:412-418` for GET and `:442-448` for DELETE, and the explicit note in the published API contract: *"does not distinguish between 'plant doesn't exist' and 'share doesn't exist' to avoid enumeration"*). Together with the consistent 404 for "owned but never shared", the two non-error outcomes for a legitimate authenticated user are indistinguishable from a 404 for any random UUID an attacker might guess. Live verification: UUID `00000000-0000-4000-8000-000000000000` → 404; an intruder asking for someone else's plant → 403; but a random UUID that does not exist → 404. The only way to get 403 is to hit a plant you already know exists — which means the 403 surface does not leak whether a UUID is valid-but-not-yours. Nice defense-in-depth layered on top of the ownership check. |
| Status | Acknowledged |

---

## FB-125 — QA: Positive — Safe-degradation on GET /share is the right call for a non-critical surface (Sprint 29)

| Field | Value |
|-------|-------|
| ID | FB-125 |
| Source | QA Engineer |
| Sprint | 29 |
| Category | Positive |
| Severity | — |
| Description | SPEC-023 mandates that any non-404 error on `GET /api/v1/plants/:plantId/share` (network, 5xx, 403, etc.) coalesce into the NOT_SHARED state without a user-facing error toast — PlantDetailPage simply renders the original Share button. The Frontend Engineer implemented this faithfully (`useShareStatus.js` catches all errors and sets state to `NOT_SHARED`; `ShareStatusArea.test.jsx` tests 500 and 403 safe-degradation without any toast). This is the right posture for a UI affordance that is decorative on top of the core PlantDetailPage (photo, care schedules, history). If the share-status check fails, the user can still do everything else on the page, and clicking the (fallback) Share button will either succeed fresh or surface a real error at a more appropriate moment. Contrast this with the DELETE flow, which *does* show an explicit error toast on failure and keeps the modal open — because the user has taken a destructive action and expects acknowledgement. The two policies are opposite for the right reasons. |
| Status | Acknowledged |

---

## FB-124 — QA: Positive — T-139 batch mark-done fix closes the biggest MVP usability bug for the plant-killer persona (Sprint 29)

| Field | Value |
|-------|-------|
| ID | FB-124 |
| Source | QA Engineer |
| Sprint | 29 |
| Category | Positive |
| Severity | — |
| Description | Live verification of the FB-113 repro — plant watered 10 days ago with a 3-day frequency (7 days overdue) → batch mark-done via `POST /api/v1/care-actions/batch` with `performed_at=now` → `GET /api/v1/plants` returns `status: "on_track"` and `days_overdue: 0`; same plant also moves from "overdue" to "upcoming (due in 3 days)" in `GET /api/v1/care-due`. Before this fix, a plant-killer user who batch-marked all overdue plants from the Care Due Dashboard would see the *exact same* plants re-appear as overdue on the My Plants page seconds later — a textbook example of two parts of the product telling a user contradictory stories about the same data. The transactional fix (`CareAction.batchCreate` now updates `care_schedules.last_done_at` in the same Knex transaction as the INSERT, with the "only if newer" guard to prevent older batch entries from regressing newer single-action ones) is the correct, durable solution rather than a post-hoc reconciliation. This closes the loop on the core product value prop: "I marked everything done, so everything *is* done." Pairs with FB-105 and FB-109. |
| Status | Acknowledged |

---

## FB-123 — QA: UX Suggestion — Share button could acknowledge "already shared" state in a future polish pass (Sprint 28)

| Field | Value |
|-------|-------|
| ID | FB-123 |
| Source | QA Engineer |
| Sprint | 28 |
| Category | UX Issue |
| Severity | Cosmetic |
| Description | The Share button is idempotent on the backend (repeated POSTs return the same `share_url`) and the Sprint 28 UX deliberately keeps the click behavior identical every time — click, copy, "Link copied!" toast. This is correct per SPEC-022 ("No special 'already shared' state is shown. The revocation entry point is deferred."). From a product perspective, a user who has already shared this plant may wonder whether they are creating a new link or re-copying an existing one. A small future-sprint polish could surface a subtle inline affordance (e.g., a tooltip or secondary button action "Copy existing share link" vs "Create share link") or pair with the future revocation UI. Not a bug and explicitly out of scope for Sprint 28 — noted for the sharing-feature backlog. |
| Steps to Reproduce | Share the same plant twice — UX is identical (toast fires again). No hint that the backend short-circuited the create. |
| Expected vs Actual | Expected (per spec): identical UX — correct. Actual: identical UX — correct. Observation is about future enhancement, not a defect. |
| Status | Acknowledged — Cosmetic/backlog. Pair with future share revocation UX sprint when the "already shared" state can be surfaced alongside a revoke action. |

---

## FB-122 — QA: Positive — Privacy boundary on public plant endpoint is airtight (Sprint 28)

| Field | Value |
|-------|-------|
| ID | FB-122 |
| Source | QA Engineer |
| Sprint | 28 |
| Category | Positive |
| Severity | — |
| Description | Live integration audit of `GET /api/v1/public/plants/:shareToken` confirmed that the public response exposes **only** the allowlisted fields — `name`, `species`, `photo_url`, `watering_frequency_days`, `fertilizing_frequency_days`, `repotting_frequency_days`, `ai_care_notes`. None of the following leaked: `user_id`, `id`, `created_at`, `updated_at`, `last_done_at`, `email`, `password_hash`, `google_id`, `refresh_token`, `recent_care_actions`. The explicit allowlist approach in `publicPlants.js` (building a fresh object rather than returning the plant row or whitelisting via `omit`) is the right pattern — a future plant schema addition will default to NOT being leaked, and the new field would need an explicit add. This is the kind of defense-in-depth that prevents the "schema migration accidentally leaked a PII field" class of incident. Backend Engineer deserves recognition for the explicit construction. |
| Status | Acknowledged |

---

## FB-121 — QA: Positive — Idempotent share endpoint makes the UX forgiving (Sprint 28)

| Field | Value |
|-------|-------|
| ID | FB-121 |
| Source | QA Engineer |
| Sprint | 28 |
| Category | Positive |
| Severity | — |
| Description | End-to-end test of clicking Share repeatedly (burst of 5 rapid POSTs) returns the same `share_url` every time with stable 200s and zero DB contention. From a user perspective this is the right design: the user never has to worry about "did I already share this?" — clicking again just copies the same link. The implementation (find-by-plant-id short-circuit before insert; CASCADE on plant delete) also means no orphaned share rows. Good work. |
| Status | Acknowledged |

---

## FB-120 — QA: Observation — Vite dev-server has HIGH-severity advisory (not Sprint 28 regression; dev-only)

| Field | Value |
|-------|-------|
| ID | FB-120 |
| Source | QA Engineer |
| Sprint | 28 |
| Category | Bug |
| Severity | Minor |
| Description | `cd frontend && npm audit` reports **1 HIGH severity** advisory against `vite` version 8.0.0–8.0.4 (installed: `8.0.2`). Three CVEs: path traversal in optimized deps `.map` handling (GHSA-4w7w-66w2-5vf9), `server.fs.deny` bypassed with queries (GHSA-v2wj-q39q-566r), and arbitrary file read via Vite dev-server WebSocket (GHSA-p9ff-h696-f583). **This is a dev-server-only vulnerability — it does not affect the production bundle or deployed frontend.** `npm audit fix` is available. Not introduced by Sprint 28 (pre-existing). Recommend handling as Sprint #29 housekeeping (analogous to T-127 nodemailer treatment) — bump `vite` within the `^8.0.1` range via `npm audit fix`, re-run 287/287 frontend tests, and re-run `npm run build`. |
| Steps to Reproduce | `cd frontend && npm audit` |
| Expected vs Actual | Expected: 0 vulnerabilities (matching backend after T-127 fix). Actual: 1 high severity. |
| Status | Acknowledged — Minor bug (dev-only, not production). Vite dev-server vulnerability will be addressed in Sprint #29 housekeeping (analogous to T-127 nodemailer treatment). |

---

## FB-117 — QA: Positive — Google OAuth implementation is clean, secure, and user-friendly (Sprint 27 Final)

| Field | Value |
|-------|-------|
| ID | FB-117 |
| Source | QA Engineer |
| Sprint | 27 |
| Category | Positive |
| Severity | N/A |
| Description | The Sprint #27 Google OAuth implementation is well-executed across the full stack. The Passport.js strategy with graceful degradation, the account-linking logic (find by google_id → find by email → create new), and the HttpOnly cookie token delivery (after P1 fix) are all solid. The frontend Google button follows brand guidelines with the multi-color "G" SVG, the "or" divider is clean, and the error/loading/disabled states are all handled. The `replaceState` URL cleanup and mutual button disable during loading are thoughtful security and UX touches. 199/199 backend tests and 276/276 frontend tests with zero regressions. This feature delivers on the sprint goal of reducing signup friction for "plant killer" users. |
| Status | Acknowledged — Positive feedback. HttpOnly cookie delivery, graceful degradation, URL cleanup, and mutual button disable are team standards for all future OAuth/auth work. |

---

## FB-118 — QA: Observation — nodemailer moderate vulnerability (pre-existing, not Sprint 27)

| Field | Value |
|-------|-------|
| ID | FB-118 |
| Source | QA Engineer |
| Sprint | 27 |
| Category | Suggestion |
| Severity | Minor |
| Description | `npm audit` reports 1 moderate vulnerability in `nodemailer` (≤8.0.4) — SMTP command injection via CRLF in transport name option (GHSA-vvjj-xcjg-gr5g). Fix available via `npm audit fix`. This is pre-existing and not Sprint #27 related, but should be addressed in a housekeeping pass. Email sending is currently disabled (no SMTP credentials configured), so the practical risk is low. |
| Status | Tasked → T-127 (Sprint #28: Backend housekeeping — fix nodemailer vulnerability via npm audit fix + update API contract for OAuth callback) |

---

## FB-119 — QA: Observation — API contract for /auth/google/callback needs refresh_token delivery update (Sprint 27)

| Field | Value |
|-------|-------|
| ID | FB-119 |
| Source | QA Engineer |
| Sprint | 27 |
| Category | UX Issue |
| Severity | Minor |
| Description | The API contract in `api-contracts.md` still documents `refresh_token` in the callback redirect URL. After the P1 fix (H-370), refresh token is delivered exclusively via HttpOnly cookie. The contract should be updated to match the actual (and more secure) implementation. Handoff H-372 created for Backend Engineer. |
| Status | Tasked → T-127 (Sprint #28: Backend housekeeping — fix nodemailer vulnerability + update api-contracts.md OAuth callback to reflect HttpOnly cookie delivery) |

---

## FB-113 — QA: Bug — OAuth users silently logged out after 15 minutes (Sprint 27)

| Field | Value |
|-------|-------|
| ID | FB-113 |
| Source | QA Engineer |
| Sprint | 27 |
| Category | Bug |
| Severity | Critical |
| Description | Users who sign in via Google OAuth will be silently logged out after 15 minutes (when the JWT access token expires). The refresh token is passed in the URL but never stored as an HttpOnly cookie, so the silent refresh mechanism fails. For the target "plant killer" persona who may have long gaps between interactions, this means they'd need to re-authenticate via Google every time they return — destroying the "one-tap onboarding" value proposition of Sprint 27. |
| Steps to Reproduce | 1. Click "Sign in with Google" → complete OAuth flow → land on `/` with valid session. 2. Wait 15+ minutes (or manually expire the access token). 3. Perform any authenticated action (e.g., view plants). 4. Session refresh fails → user redirected to login page. |
| Expected vs Actual | **Expected:** Session persists via refresh token cookie, same as email/password users. **Actual:** No refresh token cookie set; session cannot be refreshed. |
| Status | Resolved — P1 fix applied by Deploy Engineer (H-370, commit 483c5e1). `setRefreshTokenCookie` now called in OAuth callback. 199/199 tests pass. Verified in QA final pass 2026-04-12. |

---

## FB-114 — QA: Positive — Graceful OAuth degradation is exactly right for staging (Sprint 27)

| Field | Value |
|-------|-------|
| ID | FB-114 |
| Source | QA Engineer |
| Sprint | 27 |
| Category | Positive |
| Severity | — |
| Description | The graceful degradation when `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are absent is well-implemented. Both endpoints return 302 → `/login?error=oauth_failed` instead of crashing with a 500. The `isGoogleOAuthConfigured()` check is clean and the Passport strategy simply isn't registered when credentials are missing. This means staging and dev environments work without real Google credentials — the routes exist, respond, and degrade gracefully. No code changes needed when real credentials are eventually provided. |
| Status | Acknowledged |

---

## FB-115 — QA: Positive — OAuth token cleanup from URL is a good security practice (Sprint 27)

| Field | Value |
|-------|-------|
| ID | FB-115 |
| Source | QA Engineer |
| Sprint | 27 |
| Category | Positive |
| Severity | — |
| Description | The frontend immediately cleans OAuth tokens from the URL via `window.history.replaceState` in `consumeOAuthParams()`. This prevents tokens from appearing in browser history, the back button URL, or accidental sharing. The error param is also cleaned in `LoginPage.jsx`. The `_oauthAction` pattern (returning, linked, new) for controlling toast behavior is a clean approach to passing context through the OAuth redirect without adding more URL params. |
| Status | Acknowledged |

---

## FB-116 — QA: Positive — Mutual button disable prevents double-submit race (Sprint 27)

| Field | Value |
|-------|-------|
| ID | FB-116 |
| Source | QA Engineer |
| Sprint | 27 |
| Category | Positive |
| Severity | — |
| Description | The `anyLoading = loading || oauthLoading` pattern in LoginPage disables both the Google button and the email/password submit button when either is in progress. This prevents a race condition where a user could click both buttons simultaneously. The loading states are also properly reflected in aria attributes (`aria-busy`, `disabled`). Good attention to accessibility. |
| Status | Acknowledged |

---

## FB-111 — QA: Positive — Unsubscribe CTA differentiation is a thoughtful UX improvement (Sprint 26)

| Field | Value |
|-------|-------|
| ID | FB-111 |
| Source | QA Engineer |
| Sprint | 26 |
| Category | Positive |
| Severity | — |
| Description | The 404 → "Go to Plant Guardians" vs other errors → "Sign In" differentiation on the unsubscribe page is a genuinely considerate UX detail. Users whose accounts are deleted won't be confused by a "Sign In" CTA they can't use. The error messages are clear and human-readable. |
| Status | Acknowledged |

---

## FB-112 — QA: Positive — Timezone flakiness fix eliminates a persistent CI pain point (Sprint 26)

| Field | Value |
|-------|-------|
| ID | FB-112 |
| Source | QA Engineer |
| Sprint | 26 |
| Category | Positive |
| Severity | — |
| Description | The `daysAgo(0)` fix from noon UTC to start-of-day UTC is a clean, minimal solution. The comment explaining the rationale is excellent documentation. This removes a flaky test that could erode CI trust over time. |
| Status | Acknowledged |

---

## FB-109 — QA: Positive — Care status consistency fix (T-116) directly addresses core user confusion (Sprint 25)

| Field | Value |
|-------|-------|
| **ID** | FB-109 |
| **Source** | QA Engineer |
| **Sprint** | 25 |
| **Category** | Positive |
| **Severity** | N/A |
| **Description** | T-116 fixes a real user-facing confusion where the same plant could show as "overdue" on My Plants but "coming up" on the Care Due Dashboard. For the target audience ("plant killers" who need clear, unambiguous reminders), this inconsistency was actively harmful — it could cause a user to ignore an overdue plant. The fix uses a shared `computeNextDueAt` function as a single source of truth, which is architecturally clean and prevents future drift. The 5 regression tests covering multiple timezones give strong confidence this won't regress. |
| **Status** | Acknowledged — Positive feedback. T-116's shared `computeNextDueAt` architecture and multi-timezone regression tests are team standards for all future date-boundary work. |

---

## FB-110 — QA: Positive — Env var cleanup (T-115) eliminates a subtle configuration hazard (Sprint 25)

| Field | Value |
|-------|-------|
| **ID** | FB-110 |
| **Source** | QA Engineer |
| **Sprint** | 25 |
| **Category** | Positive |
| **Severity** | N/A |
| **Description** | T-115 cleanly removes stale rate-limit variable names that could confuse developers or operators trying to tune rate limits in production. All three env files (.env, .env.example, .env.staging.example) are now aligned with the actual `rateLimiter.js` middleware. The test file was also updated to use the correct names. Small chore, well executed. |
| **Status** | Acknowledged — Positive feedback. Env var hygiene standard established: when adding new env vars via `.env.example`, the local `.env` must be updated in the same task. |

---

## FB-105 — QA: Positive — Batch mark-done delivers on core product mission for "plant killer" users (Sprint 24)

| Field | Value |
|-------|-------|
| **ID** | FB-105 |
| **Source** | QA Engineer |
| **Sprint** | 24 |
| **Category** | Positive |
| **Severity** | N/A |
| **Description** | The batch mark-done feature (T-109 + T-110) directly addresses the core friction for "plant killer" users with multiple overdue items. The selection mode is intuitive — clicking "Select" enters the mode, checkboxes appear, "Select all" works correctly with indeterminate state. The sticky action bar with live count, confirmation flow, and success toast create a satisfying interaction. The partial failure handling is particularly well-designed: failed items stay selected with a clear retry path, while successful items animate out. This turns a 10-tap chore into a 2-tap action. The accessibility implementation (aria-labels on every checkbox, aria-live on count, role="toolbar") is thorough. |
| **Status** | Acknowledged — Positive feedback. Batch mark-done for "plant killer" persona is exactly the right UX investment. Partial failure handling and accessibility implementation are team standards going forward. |

---

## FB-106 — QA: Positive — Rate limiting hardens the API for production readiness (Sprint 24)

| Field | Value |
|-------|-------|
| **ID** | FB-106 |
| **Source** | QA Engineer |
| **Sprint** | 24 |
| **Category** | Positive |
| **Severity** | N/A |
| **Description** | The 3-tier rate limiting (T-111) is well-designed: strict on auth (brute-force protection), moderate on stats (prevents expensive query abuse), permissive global fallback (invisible to normal users). The structured 429 response matches the existing error shape convention. The test environment skip prevents test regressions. Env var overrides make it tunable per environment. Trust proxy configuration ensures correct IP detection behind a reverse proxy. This closes the long-deferred FB-073 feedback item. |
| **Status** | Acknowledged — Positive feedback. 3-tier rate limiting strategy and structured 429 shape are team standards for all future rate-limited endpoints. |

---

## FB-107 — QA: Observation — backend/.env has stale rate limit env var names (Sprint 24)

| Field | Value |
|-------|-------|
| **ID** | FB-107 |
| **Source** | QA Engineer |
| **Sprint** | 24 |
| **Category** | UX Issue |
| **Severity** | Cosmetic |
| **Description** | The `backend/.env` file still contains legacy rate limit env vars (`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX`) from a prior sprint. T-111's `rateLimiter.js` uses different names (`RATE_LIMIT_AUTH_MAX`, `RATE_LIMIT_STATS_MAX`, etc.) and falls back to hardcoded defaults when the env vars are missing, so there is no functional issue. However, the `.env` should be updated to match `.env.example` to avoid developer confusion. |
| **Steps to Reproduce** | Compare `backend/.env` rate limit section with `backend/.env.example` rate limit section. |
| **Expected vs Actual** | Expected: `.env` uses T-111 env var names. Actual: `.env` uses old names that are ignored by the code. |
| **Status** | Tasked → T-115 — Cosmetic cleanup: update `backend/.env` to match `backend/.env.example` T-111 rate limit variable names. Scheduled for Sprint #25 as a P3 quick-win. |

---

## FB-102 — QA: Positive — Unsubscribe page UX is clean and handles all edge cases (Sprint 23)

| Field | Value |
|-------|-------|
| **ID** | FB-102 |
| **Source** | QA Engineer |
| **Sprint** | 23 |
| **Category** | Positive |
| **Severity** | N/A |
| **Description** | The unsubscribe page (T-103) handles all edge cases gracefully: missing params show error immediately without making an API call, the cancelled flag prevents stale state updates on fast unmount, and the success page provides clear next-step guidance ("re-enable from Profile page"). The loading → success/error transitions are smooth. Dark mode and accessibility are solid. |
| **Status** | Acknowledged |

---

## FB-103 — QA: Positive — Account deletion flow has excellent safety gates (Sprint 23)

| Field | Value |
|-------|-------|
| **ID** | FB-103 |
| **Source** | QA Engineer |
| **Sprint** | 23 |
| **Category** | Positive |
| **Severity** | N/A |
| **Description** | The account deletion flow (T-106 + T-107) is well-designed for safety: the Danger Zone is collapsed by default (users can't stumble into it), the "DELETE" text-match gate is case-sensitive and exact (no accidental deletions), the modal has focus trapping and Escape key support, and the backend uses a single transaction to avoid partial data loss. The inline error with retry on failure is a good UX pattern. The login page deletion banner provides clear closure. |
| **Status** | Acknowledged |

---

## FB-104 — QA: UX Issue — Unsubscribe page error state has generic "Sign In" CTA even when user may not have an account (Sprint 23)

| Field | Value |
|-------|-------|
| **ID** | FB-104 |
| **Source** | QA Engineer |
| **Sprint** | 23 |
| **Category** | UX Issue |
| **Severity** | Cosmetic |
| **Description** | When the unsubscribe page shows an error (e.g., invalid token), the CTA is "Sign In" with a link to /login. If the user's account was already deleted (404 from backend), directing them to "Sign In" is slightly misleading — they can't sign in. Consider a more neutral CTA like "Go to Plant Guardians" for the 404 case, or simply "Go back". This is cosmetic and non-blocking. |
| **Steps to Reproduce** | Visit `/unsubscribe?token=valid&uid=deleted-user-id` → API returns 404 → page shows "Link not valid" with "Sign In" CTA. |
| **Expected vs Actual** | Expected: contextual CTA. Actual: generic "Sign In" CTA regardless of error type. |
| **Status** | Acknowledged — Cosmetic UX issue. Unsubscribe error CTA is generic "Sign In" regardless of error type. Low severity; deferred to backlog. Consider a more neutral "Go back to Plant Guardians" CTA for future polish sprint. |

---

## FB-101 — QA: Bug — careActionsStreak.test.js timezone-dependent flakiness (Sprint 22)

| Field | Value |
|-------|-------|
| **ID** | FB-101 |
| **Source** | QA Engineer |
| **Sprint** | 22 |
| **Category** | Bug |
| **Severity** | Minor |
| **Description** | 5 tests in `backend/tests/careActionsStreak.test.js` fail when run between midnight and noon UTC. The `daysAgo(0)` helper sets timestamp to noon UTC today, which is "in the future" during those hours, causing the backend's `performed_at` validation to reject with 400. |
| **Steps to Reproduce** | Run `npm test` in backend when the current UTC time is before 12:00 UTC (e.g., 00:07 UTC). The 5 streak tests that call `recordCareAction` with `daysAgo(0)` will fail. |
| **Expected vs Actual** | Expected: all streak tests pass regardless of time of day. Actual: 5 tests fail with 400 instead of 201 due to future-timestamp rejection. |
| **Fix** | Change `daysAgo(0)` to use `new Date()` (current time) or set hours to a value guaranteed to be in the past (e.g., `d.setUTCHours(0, 0, 0, 0)` for start-of-day). |
| **Status** | Acknowledged — Minor bug. Backlog for a future sprint. Fix: change `daysAgo(0)` to use `new Date()` or `d.setUTCHours(0, 0, 0, 0)` so the timestamp is never "in the future" during early UTC hours. |

---

## FB-098 — QA: Positive — RemindersSection dirty-tracking and micro-copy are exemplary (Sprint 22)

| Field | Value |
|-------|-------|
| **ID** | FB-098 |
| **Source** | QA Engineer |
| **Sprint** | 22 |
| **Date** | 2026-04-05 |
| **Category** | Positive |
| **Severity** | — |
| **Description** | The RemindersSection component tracks "dirty" state by comparing current values against the last server-confirmed state (`serverOptIn`, `serverHour`). This means the Save button only appears when there's an actual unsaved change — no false "you have unsaved changes" warnings. The micro-copy distinction between "Save reminder settings" (when toggling on) and "Save changes" (when toggling off) is a thoughtful UX touch that gives the user clear intent feedback. The toast message similarly differentiates "Reminder settings saved" from "Email reminders turned off". This level of contextual copy should be the standard for all toggle-based settings going forward. |
| **Status** | Acknowledged — Positive feedback. Dirty-tracking pattern and contextual micro-copy are team standards. |

---

## FB-099 — QA: Positive — EmailService graceful degradation is production-safe (Sprint 22)

| Field | Value |
|-------|-------|
| **ID** | FB-099 |
| **Source** | QA Engineer |
| **Sprint** | 22 |
| **Date** | 2026-04-05 |
| **Category** | Positive |
| **Severity** | — |
| **Description** | The EmailService is a singleton that checks `EMAIL_HOST` at construction time and sets `this.enabled = false` if not configured. Every send method short-circuits with `if (!this.enabled) return false`. The trigger-reminders endpoint still executes its full logic (querying opted-in users, evaluating due plants) and returns accurate stats (`emails_sent: 0`) — only the actual SMTP send is skipped. This means QA and staging environments can test the full reminder pipeline without SMTP infrastructure. The warning log at startup (`[EmailService] WARNING: EMAIL_HOST not configured — email sending disabled`) is clear and not noisy. Excellent graceful degradation pattern. |
| **Status** | Acknowledged — Positive feedback. |

---

## FB-100 — QA: UX Issue — Frontend unsubscribe() missing uid parameter (Sprint 22)

| Field | Value |
|-------|-------|
| **ID** | FB-100 |
| **Source** | QA Engineer |
| **Sprint** | 22 |
| **Date** | 2026-04-05 |
| **Category** | UX Issue |
| **Severity** | Minor |
| **Description** | `frontend/src/utils/api.js` defines `notificationPreferences.unsubscribe(token)` which calls `GET /unsubscribe?token=<token>`, but the backend endpoint requires both `token` and `uid` query parameters. This will cause unsubscribe to fail (400 INVALID_TOKEN) when a frontend unsubscribe page is eventually built. Not blocking for Sprint 22 since no unsubscribe page exists yet (T-102 covered Surface 1 only). |
| **Steps to Reproduce** | Call `notificationPreferences.unsubscribe(someToken)` — backend returns 400 because `uid` is missing. |
| **Expected vs Actual** | Expected: unsubscribe function sends both `token` and `uid`. Actual: only sends `token`. |
| **Status** | Acknowledged — Minor UX issue. Will be resolved in Sprint 23 when the unsubscribe landing page (SPEC-017 Surface 3) is built. The api.js function must be updated to pass both `token` and `uid` query params to `GET /api/v1/unsubscribe`. |

---

## FB-095 — QA: Positive — Care Notes feature is elegantly non-intrusive (Sprint 21)

| Field | Value |
|-------|-------|
| **ID** | FB-095 |
| **Source** | QA Engineer |
| **Sprint** | 21 |
| **Date** | 2026-04-05 |
| **Category** | Positive |
| **Severity** | — |
| **Description** | The Care Notes feature nails the "quiet, natural extension" design constraint from SPEC-016. The "+ Add note" link is visually lightweight — it doesn't pressure users to write anything, which is exactly right for the novice persona who might feel overwhelmed by extra fields. The inline expand animation keeps the user in context (no modal interruption). The character counter appearing only at 200+ chars is a thoughtful touch — users typing short notes never see it, reducing cognitive load. The null-note handling in history is flawless: items without notes look identical to pre-Sprint-21 items, so the timeline stays clean for users who never use notes. |
| **Status** | Acknowledged — Positive feedback. The "quiet, non-intrusive" design pattern should be carried forward as a standard for all optional input features. |

---

## FB-096 — QA: Positive — Excellent edge case handling in notes normalization (Sprint 21)

| Field | Value |
|-------|-------|
| **ID** | FB-096 |
| **Source** | QA Engineer |
| **Sprint** | 21 |
| **Date** | 2026-04-05 |
| **Category** | Positive |
| **Severity** | — |
| **Description** | Both frontend and backend handle the full matrix of edge cases for notes: null, undefined, empty string, whitespace-only, and the 280-char boundary. The belt-and-suspenders approach (client trims and omits empty; server also trims and normalizes) means even a buggy or stale frontend cache can't produce junk data in the database. The `CareHistoryItem` guard `notes != null && notes.trim() !== ''` is defensive enough to handle any historical data that might have empty strings stored. This level of normalization consistency between layers is unusual and commendable. |
| **Status** | Acknowledged — Positive feedback. The dual-layer normalization pattern (client + server) should be adopted as a team standard for all user-provided text fields going forward. |

---

## FB-097 — QA: Positive — Accessibility implementation exceeds minimum requirements (Sprint 21)

| Field | Value |
|-------|-------|
| **ID** | FB-097 |
| **Source** | QA Engineer |
| **Sprint** | 21 |
| **Date** | 2026-04-05 |
| **Category** | Positive |
| **Severity** | — |
| **Description** | The accessibility implementation goes beyond basic compliance. `aria-expanded`/`aria-controls` on the toggle, `aria-label` on the textarea, `aria-describedby` linking to the character counter, and `aria-live="polite"` on the counter with threshold-based announcements (not every keystroke) — this is a screen-reader-friendly implementation. The `role="tabpanel"` fix on the history panel (T-099) closes the last accessibility gap in the Plant Detail page. The `prefers-reduced-motion` support for the notes expansion animation is a nice inclusive touch. |
| **Status** | Acknowledged — Positive feedback. Threshold-based aria-live announcements and prefers-reduced-motion support should be carried forward as standards for all new interactive components. |

---

## FB-091 — QA: Positive — Care History feature is well-architected and user-friendly (Sprint 20)

| Field | Value |
|-------|-------|
| **ID** | FB-091 |
| **Source** | QA Engineer |
| **Sprint** | 20 |
| **Date** | 2026-04-05 |
| **Category** | Positive |
| **Severity** | — |
| **Description** | The Care History feature is a natural companion to the Care Streak tracker from Sprint #19. The tab bar on Plant Detail is intuitive, the filter pills are clean, and the month-grouped list is easy to scan. The empty state messaging ("Mark your first care action done…") is encouraging and action-oriented — exactly right for the novice user persona. The "Go to Overview" CTA in the empty state is a smart touch that closes the loop. |
| **Status** | Acknowledged |

---

## FB-092 — QA: Positive — Race condition handling in usePlantCareHistory hook (Sprint 20)

| Field | Value |
|-------|-------|
| **ID** | FB-092 |
| **Source** | QA Engineer |
| **Sprint** | 20 |
| **Date** | 2026-04-05 |
| **Category** | Positive |
| **Severity** | — |
| **Description** | The `requestId` ref in `usePlantCareHistory.js` prevents stale API responses from overwriting newer data when users rapidly switch filters. This is a subtle but important detail that avoids UI flicker and data inconsistency. Well done. |
| **Status** | Acknowledged |

---

## FB-093 — QA: UX Issue — Minor SPEC-015 deviations noted by Manager (non-blocking) (Sprint 20)

| Field | Value |
|-------|-------|
| **ID** | FB-093 |
| **Source** | QA Engineer |
| **Sprint** | 20 |
| **Date** | 2026-04-05 |
| **Category** | UX Issue |
| **Severity** | Cosmetic |
| **Description** | Three minor SPEC-015 deviations were noted during Manager code review (H-274) and confirmed during QA: (1) Missing `role="tabpanel"` on the history panel div in PlantDetailPage.jsx — the overview panel has it correctly. (2) Notes expansion panel lacks `transition: max-height 0.25s ease` per SPEC-015 — uses a CSS class toggle instead. (3) Dark mode icon background colors are defined in CARE_CONFIG but not applied in CSS/styles. None of these are functional blockers. |
| **Steps to Reproduce** | Inspect DOM of History tab; check notes expansion animation; toggle dark mode and check care type icon circle backgrounds. |
| **Expected vs Actual** | Expected: animated notes expansion, dark mode icon backgrounds, tabpanel role. Actual: instant toggle, no dark icon backgrounds, missing role attribute. |
| **Status** | Acknowledged — log as backlog items for future sprint. |

---

## FB-094 — QA: Positive — Backend error handling is consistent and secure (Sprint 20)

| Field | Value |
|-------|-------|
| **ID** | FB-094 |
| **Source** | QA Engineer |
| **Sprint** | 20 |
| **Date** | 2026-04-05 |
| **Category** | Positive |
| **Severity** | — |
| **Description** | The care-history endpoint follows the same error-handling patterns as all other endpoints: structured JSON errors with message + code, never leaking stack traces or internal paths. The 404 vs 403 distinction (plant not found vs plant not owned) is correctly implemented without leaking information about other users' plants. Parameterized Knex queries throughout. Exemplary. |
| **Status** | Acknowledged |

---

## FB-088 — QA: Positive — Care Streak feature delivers on core product mission (Sprint 19)

| Field | Value |
|-------|-------|
| **ID** | FB-088 |
| **Source** | QA Engineer |
| **Sprint** | 19 |
| **Date** | 2026-04-05 |
| **Category** | Positive |
| **Severity** | N/A |
| **Description** | The Care Streak feature (T-090 + T-091) directly addresses the product's core mission of helping "plant-killers" build care habits. The motivational copy is well-calibrated — empathetic for broken streaks ("That's okay. Every day is a fresh start"), encouraging for active streaks, and celebratory for milestones. The 30-day message ("officially no longer a plant-killer") is a particularly nice touch that ties to the target user persona. Sidebar indicator provides gentle positive reinforcement without requiring a Profile page visit. |
| **Status** | Acknowledged |

---

## FB-089 — QA: Positive — Accessibility implementation in streak components is thorough (Sprint 19)

| Field | Value |
|-------|-------|
| **ID** | FB-089 |
| **Source** | QA Engineer |
| **Sprint** | 19 |
| **Date** | 2026-04-05 |
| **Category** | Positive |
| **Severity** | N/A |
| **Description** | Streak components have comprehensive accessibility: `aria-label` on all counts and badges, `aria-live="polite"` on motivational messages, `aria-busy` on loading skeleton, keyboard navigation (Enter + Space) on sidebar indicator, and `prefers-reduced-motion` compliance for confetti and pop animations. The `StreakProvider` context also prevents duplicate fetches, which is both a performance and accessibility win (avoids redundant screen reader announcements). |
| **Status** | Acknowledged |

---

## FB-090 — QA: Suggestion — Run `npm audit fix` for lodash vulnerability (Sprint 19)

| Field | Value |
|-------|-------|
| **ID** | FB-090 |
| **Source** | QA Engineer |
| **Sprint** | 19 |
| **Date** | 2026-04-05 |
| **Category** | Suggestion |
| **Severity** | Minor |
| **Description** | `npm audit` reports 1 high severity vulnerability in lodash (≤4.17.23) — prototype pollution via `_.unset`/`_.omit` and code injection via `_.template`. This is a transitive dependency and the vulnerable functions are not directly called in application code, so risk is low. However, `npm audit fix` should resolve it. Recommend addressing in Sprint 20 backlog. |
| **Status** | Acknowledged — Minor suggestion. Vulnerability is in a transitive dependency with no direct call site in application code. Tasked → T-095 (Sprint 20) as a quick security housekeeping task. |

---

## FB-084 — QA: Positive — Search & Filter implementation is polished and user-friendly (Sprint 18)

| Field | Value |
|-------|-------|
| **ID** | FB-084 |
| **Source** | QA Engineer |
| **Sprint** | 18 |
| **Date** | 2026-04-05 |
| **Category** | Positive |
| **Severity** | N/A |
| **Description** | The plant inventory search and filter feature (T-083/T-084) is well-executed. The 300ms debounce on search feels responsive without being wasteful. The status filter tabs use semantically meaningful colors (red for overdue, yellow for due today, green for on track) that are consistent with the Care Due Dashboard palette. All three empty state variants (search-only, filter-only, combined) provide clear, friendly messages with actionable CTAs. The `aria-live` region for result count updates is a nice accessibility touch. The combined AND logic for search + filter is intuitive. |
| **Status** | Acknowledged |

---

## FB-085 — QA: Positive — Focus management after mark-done is best-in-class accessibility (Sprint 18)

| Field | Value |
|-------|-------|
| **ID** | FB-085 |
| **Source** | QA Engineer |
| **Sprint** | 18 |
| **Date** | 2026-04-05 |
| **Category** | Positive |
| **Severity** | N/A |
| **Description** | The Care Due focus management (T-086) goes above and beyond. The decision tree — next sibling → next section → earlier section → all-clear CTA — handles every edge case. The `prefers-reduced-motion` respect is exemplary. The 300ms fade-out animation with transitionend listener (plus 350ms fallback timeout) is robust. Ref cleanup after removal prevents stale focus targets. This is production-quality keyboard accessibility. |
| **Status** | Acknowledged |

---

## FB-086 — QA: UX Issue — PlantSearchFilter uses hardcoded color values in status tab active styles (Sprint 18)

| Field | Value |
|-------|-------|
| **ID** | FB-086 |
| **Source** | QA Engineer |
| **Sprint** | 18 |
| **Date** | 2026-04-05 |
| **Category** | UX Issue |
| **Severity** | Minor |
| **Description** | `PlantSearchFilter.jsx` lines 18-34 define `ACTIVE_STYLES` with hardcoded hex colors (`#FAEAE4`, `#B85C38`, `#FDF4E3`, `#C4921F`, `#E8F4EC`, `#4A7C59`) for the status filter tab active states. These are the same semantic colors used in `CareDuePage.jsx` section config. While both files are consistent with each other, neither uses CSS custom properties from the design system. For dark mode resilience and consistency, these should migrate to design tokens in a future sprint — similar to how T-085 migrated ProfilePage icons. |
| **Steps to Reproduce** | View PlantSearchFilter.jsx ACTIVE_STYLES constant and CareDuePage.jsx SECTION_CONFIG / CARE_TYPE_CONFIG. |
| **Expected vs Actual** | Expected: status colors defined as CSS custom properties. Actual: hardcoded hex values. |
| **Status** | Acknowledged — Minor UX issue. PlantSearchFilter status-tab colors and CareDuePage section colors should migrate to CSS custom properties in a future sprint for full dark-mode resilience. Tasked → T-088 (Sprint 19). |

---

## FB-087 — QA: Observation — auth.test.js pre-existing Secure cookie failure should be fixed (Sprint 18)

| Field | Value |
|-------|-------|
| **ID** | FB-087 |
| **Source** | QA Engineer |
| **Sprint** | 18 |
| **Date** | 2026-04-05 |
| **Category** | Bug |
| **Severity** | Minor |
| **Description** | `auth.test.js` test "should register a new user, return access_token in body and refresh_token in cookie" fails because it expects the `Secure` flag on the refresh_token cookie. In NODE_ENV=test (non-HTTPS), the cookie correctly omits `Secure`. The test assertion is overly strict for the dev/test environment. This has been a pre-existing failure for multiple sprints and should be fixed — either conditionally assert `Secure` only when NODE_ENV=production, or set NODE_ENV-aware cookie options in the auth route. |
| **Steps to Reproduce** | Run `cd backend && npm test` — auth.test.js line 45 fails. |
| **Expected vs Actual** | Expected: All tests pass in test environment. Actual: 1 test fails checking for `Secure` flag absent in non-HTTPS context. |
| **Status** | Tasked → T-087 (Sprint 19) — Pre-existing minor bug. Fix auth.test.js to conditionally assert the Secure cookie flag only when NODE_ENV=production (or update auth route to use NODE_ENV-aware cookie options). |

---

## FB-073 — QA: Stats endpoint lacks endpoint-specific rate limiting

| Field | Value |
|-------|-------|
| **ID** | FB-073 |
| **Source** | QA Engineer |
| **Sprint** | 15 |
| **Date** | 2026-04-01 |
| **Category** | Suggestion |
| **Severity** | Minor |
| **Description** | `GET /api/v1/care-actions/stats` performs multiple JOINs and aggregation queries. It is only protected by the general rate limiter (100 req/15min). For production, consider adding endpoint-specific rate limiting (e.g., 30 req/15min) to prevent abuse of this resource-intensive endpoint. |
| **Status** | Acknowledged — Tasked → T-071 (Sprint 16). Adding endpoint-specific rate limiting to stats endpoint for production hardening. |

---

## FB-074 — QA: StatTile icon colors use hardcoded hex values instead of CSS custom properties

| Field | Value |
|-------|-------|
| **ID** | FB-074 |
| **Source** | QA Engineer |
| **Sprint** | 15 |
| **Date** | 2026-04-01 |
| **Category** | UX Issue |
| **Severity** | Cosmetic |
| **Description** | In `AnalyticsPage.jsx`, StatTile components pass hardcoded hex colors (`#5C7A5C`, `#C4921F`) as `iconColor` props. While these mid-tone botanical colors work adequately in both light and dark modes, they bypass the CSS custom property theming system. The StatTile component already has a fallback to `var(--color-accent-primary)`. Consider using CSS variables for full theme consistency. |
| **Status** | Acknowledged — Tasked → T-072 (Sprint 16). Cosmetic CSS polish to align StatTile icon colors with the CSS custom property theming system. |

---

## FB-076 — QA: Positive — Delete Account flow is well-executed and accessible

| Field | Value |
|-------|-------|
| **ID** | FB-076 |
| **Source** | QA Engineer |
| **Sprint** | 16 |
| **Date** | 2026-04-01 |
| **Category** | Positive |
| **Severity** | — |
| **Description** | The Delete Account feature (T-069/T-070) is excellent. The confirmation modal with password re-entry prevents accidental deletion. Wrong-password handling is smooth — inline error, modal stays open, password field re-focused for retry. The focus trap, ARIA attributes, and keyboard navigation make this fully accessible. Dark mode uses CSS variables throughout. The toast confirmation + redirect to /login on success is clean. Overall, this feels like a thoughtful, production-quality feature. |
| **Status** | Acknowledged |

---

## FB-077 — QA: Suggestion — Consider soft delete with grace period for account deletion

| Field | Value |
|-------|-------|
| **ID** | FB-077 |
| **Source** | QA Engineer |
| **Sprint** | 16 |
| **Date** | 2026-04-01 |
| **Category** | Suggestion |
| **Severity** | Minor |
| **Description** | Account deletion is currently permanent and immediate — once confirmed, all user data (plants, care schedules, care actions) is cascade-deleted with no recovery option. For a product aimed at novice plant owners who may be frustrated in the moment, consider implementing a 30-day soft delete (mark account as "pending deletion," purge after 30 days, allow re-login to cancel). This is a common pattern in consumer apps and reduces support burden from accidental deletions. Not blocking — current implementation is correct per spec. |
| **Status** | Acknowledged — Minor suggestion; added to backlog for post-AI-feature consideration. Hard delete is correct per spec. Soft delete is a worthwhile future enhancement once the product matures. |

---

## FB-078 — QA: Positive — Sprint 16 analytics polish completes the design system alignment

| Field | Value |
|-------|-------|
| **ID** | FB-078 |
| **Source** | QA Engineer |
| **Sprint** | 16 |
| **Date** | 2026-04-01 |
| **Category** | Positive |
| **Severity** | — |
| **Description** | The StatTile CSS variable migration (T-072) and warmer empty state copy (T-073) complete the analytics page's alignment with the Japandi design system. "Your care journey starts here" is warm, encouraging, and on-brand — much better than the clinical Sprint 15 copy. The rate limiter on stats (T-071) and plant name max-length (T-075) are invisible to users but important production guardrails. The flaky test fix (T-074) improves CI reliability. Sprint 16 is a solid polish + hardening sprint. |
| **Status** | Acknowledged |

---

## FB-075 — QA: Positive — Analytics empty state and accessibility patterns are excellent

| Field | Value |
|-------|-------|
| **ID** | FB-075 |
| **Source** | QA Engineer |
| **Sprint** | 15 |
| **Date** | 2026-04-01 |
| **Category** | Positive |
| **Severity** | — |
| **Description** | The analytics page empty state is well-crafted and actionable — it encourages users to start caring for plants rather than showing a blank page. The donut chart with a hidden accessible data table is an excellent a11y pattern. The confetti botanical palette in dark mode feels cohesive with the Japandi aesthetic. Overall, Sprint 15 features add strong user-facing value. |
| **Status** | Acknowledged |

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

## FB-066 — QA Product-Perspective: Care Analytics Page Quality (Positive)

| Field | Value |
|-------|-------|
| **ID** | FB-066 |
| **Source** | QA Engineer |
| **Sprint** | 15 |
| **Date** | 2026-03-31 |
| **Category** | Positive |
| **Severity** | N/A |
| **Status** | Acknowledged |

### Description

The Care Analytics page (/analytics) is well-crafted. The pure SVG donut chart avoids heavy dependencies (no recharts bundle cost), the sr-only data table ensures WCAG AA accessibility, and the four page states (loading skeleton, empty, error with retry, populated) all have clear, warm copy aligned with the "botanical guardianship" brand. The dark mode chart color system (separate LIGHT_COLORS/DARK_COLORS maps) matches SPEC-011 exactly and looks cohesive in both themes. This is the first user-facing "value" feature beyond the core inventory — it meaningfully rewards users for caring for their plants.

---

## FB-067 — QA Product-Perspective: Pool Startup Hardening Effective (Positive)

| Field | Value |
|-------|-------|
| **ID** | FB-067 |
| **Source** | QA Engineer |
| **Sprint** | 15 |
| **Date** | 2026-03-31 |
| **Category** | Positive |
| **Severity** | N/A |
| **Status** | Acknowledged |

### Description

T-066 addresses the residual transient 500 (FB-065) with a minimal, well-scoped fix. Reading pool.min from the knexfile config (not the tarn instance) and guaranteeing ≥ 2 warm-up queries before `app.listen()` is a clean approach. The Deploy Engineer smoke test confirmed 3 fresh-start logins all returned 200 with zero 500s. This closes the pool startup issue that has been tracked since Sprint 12.

---

## FB-068 — QA Product-Perspective: Confetti Dark Mode Colors Look Warm and Celebratory (Positive)

| Field | Value |
|-------|-------|
| **ID** | FB-068 |
| **Source** | QA Engineer |
| **Sprint** | 15 |
| **Date** | 2026-03-31 |
| **Category** | Positive |
| **Severity** | N/A |
| **Status** | Acknowledged |

### Description

T-068 resolves FB-061 (confetti colors washed out in dark mode). The new dark palette (`#2D5A3D`, `#D4A76A`, `#C2956A`, `#7EAF7E`, `#B87A5A`) uses deep greens, warm amber, and terracotta — consistent with the Japandi botanical aesthetic. The implementation correctly checks `data-theme` attribute for mode detection and respects `prefers-reduced-motion`. The try/catch around the dynamic import is a nice touch for graceful degradation.

---

## FB-069 — QA Advisory: Analytics Empty State Copy Could Be More Inviting

| Field | Value |
|-------|-------|
| **ID** | FB-069 |
| **Source** | QA Engineer |
| **Sprint** | 15 |
| **Date** | 2026-03-31 |
| **Category** | UX Issue |
| **Severity** | Cosmetic |
| **Status** | Acknowledged — Tasked → T-073 (Sprint 16). Cosmetic copy improvement for the analytics empty state to feel warmer and more encouraging. |

### Description

The analytics empty state says "No care actions recorded yet. Mark a plant as cared for to start tracking." While accurate, the copy could be warmer for a feature that's meant to feel affirming. Consider something like "Your care journey starts here — water, fertilize, or repot a plant and watch your progress grow." The CTA button "Go to my plants" is good. Not blocking — cosmetic polish for a future sprint.

---

## FB-072 — QA Product-Perspective: Edge Case Handling is Robust Across All Sprint 15 Endpoints (Positive)

| Field | Value |
|-------|-------|
| **ID** | FB-072 |
| **Source** | QA Engineer |
| **Sprint** | 15 |
| **Date** | 2026-04-01 |
| **Category** | Positive |
| **Severity** | N/A |
| **Status** | Acknowledged |

### Description

Re-verified Sprint 15 endpoints with adversarial inputs on 2026-04-01: empty strings, 500-character emails, XSS payloads (`<script>alert(1)</script>` in email field), and 5 rapid sequential logins. All cases returned structured JSON errors with safe messages — no stack traces, no input reflection, no 500s. The validation layer catches bad input before it reaches the database. The rate limiter is in place on auth endpoints. The care-actions/stats endpoint correctly returns 401 without auth and proper data with auth. This confirms the application handles real-world abuse scenarios gracefully.

---

## FB-070 — QA Product-Perspective: Sprint 15 Analytics Feature Delivers Real User Value (Positive)

| Field | Value |
|-------|-------|
| **ID** | FB-070 |
| **Source** | QA Engineer |
| **Sprint** | 15 |
| **Date** | 2026-03-31 |
| **Category** | Positive |
| **Severity** | N/A |
| **Status** | Acknowledged |

### Description

The Care Analytics page (`/analytics`) is the first user-facing feature that turns plant care data into insight. The implementation is clean: summary stats bar gives instant gratification (total actions, top plant, most common type), the donut chart is readable and accessible (sr-only table, dark mode colors), and the plant frequency table gives per-plant detail. The empty state is friendly with a clear CTA. The page fits naturally into the sidebar navigation. This is a meaningful post-MVP addition that reinforces the product's identity as a care companion, not just a task tracker.

---

## FB-071 — QA Product-Perspective: Pool Startup Hardening Eliminates Transient 500s (Positive)

| Field | Value |
|-------|-------|
| **ID** | FB-071 |
| **Source** | QA Engineer |
| **Sprint** | 15 |
| **Date** | 2026-03-31 |
| **Category** | Positive |
| **Severity** | N/A |
| **Status** | Acknowledged |

### Description

T-066 pool startup hardening is well-implemented. The warm-up reads pool.min from the knexfile config (with fallback ≥ 2), fires concurrent SELECT 1 queries, and waits for all to complete before calling app.listen(). The keepalive interval is unref'd so it doesn't prevent graceful shutdown. On startup failure, the process exits with code 1 instead of silently serving with a broken pool. Deploy smoke test (3 fresh-start logins → all 200) confirms the fix works. The residual transient 500 from FB-065 should be fully eliminated.

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

---

## FB-075 — QA Engineer: ProfilePage stat tiles still use hardcoded hex colors (Sprint 16 QA observation)

**Date:** 2026-04-01
**Category:** UX Issue
**Severity:** Low (P4)
**Sprint Observed:** 16
**Status:** Acknowledged — Cosmetic backlog. Tasked → T-085 (Sprint 18). Low-effort design system consistency fix: replace `color="#5C7A5C"` with `color="var(--color-accent-primary)"` in `frontend/src/pages/ProfilePage.jsx` lines 136, 141, 146.

### Detail

T-072 correctly removed hardcoded hex colors from `AnalyticsPage.jsx` StatTile icon colors. However, `ProfilePage.jsx` (lines 136, 141, 146) still passes hardcoded `#5C7A5C` to `Plant`, `CalendarBlank`, and `CheckCircle` icon colors. These should also use CSS custom properties (e.g., `var(--color-accent-primary)`) for design system consistency.

**File:** `frontend/src/pages/ProfilePage.jsx`
**Lines:** 136, 141, 146

### Recommendation

Replace `color="#5C7A5C"` with `color="var(--color-accent-primary)"` on all three stat tile icons. Low effort, no test changes expected.

---

## FB-076 — QA Engineer: Delete Account flow is well-implemented (Sprint 16 Positive Feedback)

**Date:** 2026-04-01
**Category:** Positive
**Severity:** N/A
**Sprint Observed:** 16
**Status:** Acknowledged — Positive feedback shared with team. Noted as internal quality benchmark for destructive-action UX patterns.

### Detail

The Delete Account feature (T-069 + T-070) is thorough and user-friendly:

- Password confirmation prevents accidental deletion — good safety measure
- Inline error "Password is incorrect." keeps the modal open without losing context — excellent UX
- Focus trap and ARIA attributes make the modal fully accessible
- Password visibility toggle is a nice touch
- Cascade delete is verified in tests — no orphaned data
- Cookie and auth state are properly cleaned up on success
- Dark mode works seamlessly via CSS custom properties

The engineering quality is high and the user experience is safe and clear.

---

## FB-077 — QA Engineer: Analytics empty state copy is warm and on-brand (Sprint 16 Positive Feedback)

**Date:** 2026-04-01
**Category:** Positive
**Severity:** N/A
**Sprint Observed:** 16
**Status:** Acknowledged — Positive feedback. T-073 copy confirmed on-brand and aligned with Japandi botanical voice.

### Detail

"Your care journey starts here" and "Water, fertilize, or repot a plant and watch your progress grow here." — this copy is encouraging, warm, and fits the Japandi botanical brand voice well. The CTA "Go to my plants" provides a clear next step. Good execution on T-073.

---

## FB-078 — QA Engineer: AI Advice Panel is a standout feature (Sprint 17 Positive Feedback)

**Date:** 2026-04-01
**Category:** Positive
**Severity:** N/A
**Sprint Observed:** 17
**Status:** Acknowledged — Sprint 17 highlight. Two-tab design, confidence badge, and smart accept behaviour praised as production-quality companion-app UX. Shared with team.

### Detail

The AI Advice Panel (T-079 + T-080) is the highlight of this sprint. The two-tab design (text + image) is intuitive and feels natural. The slide-in panel on desktop / bottom sheet on mobile is smooth and non-intrusive. The loading skeleton gives appropriate feedback. The confidence badge (high/medium/low) builds trust without overwhelming the user. Accept auto-populating the form fields — including the smart behavior of only filling the species field if it's currently empty — is a thoughtful UX decision. The "Try a different plant" link after results makes it easy to iterate. This is the feature that makes Plant Guardians feel like a true companion app for novice plant owners.

---

## FB-079 — QA Engineer: Client-side validation prevents unnecessary API calls (Sprint 17 Positive Feedback)

**Date:** 2026-04-01
**Category:** Positive
**Severity:** N/A
**Sprint Observed:** 17
**Status:** Acknowledged — Positive UX pattern. Instant client-side validation reduces round-trips and user frustration. Noted as quality benchmark.

### Detail

The image upload flow validates file type and size on the client side before making any API call. This means users get instant feedback ("Please upload a JPEG, PNG, or WebP image." or "Image must be 5MB or smaller.") without waiting for a network round-trip. The disabled submit button for empty text input is also a good pattern. These small touches reduce frustration and feel polished.

---

## FB-080 — QA Engineer: Tab switching disabled during loading prevents race conditions (Sprint 17 Positive Feedback)

**Date:** 2026-04-01
**Category:** Positive
**Severity:** N/A
**Sprint Observed:** 17
**Status:** Acknowledged — Positive edge-case handling. Disabled tab toggle during loading state prevents confusing mid-request state. Good defensive UX.

### Detail

When an AI advice request is in-flight (loading state), the tab toggle buttons are disabled. This prevents a user from switching modes mid-request and causing confusing state. A small but important detail that shows attention to edge cases.

---

## FB-081 — QA Engineer: Consider adding plant photo to advice results (Sprint 17 Suggestion)

**Date:** 2026-04-01
**Category:** Suggestion
**Severity:** Minor
**Sprint Observed:** 17
**Status:** Acknowledged — Minor backlog suggestion. Reference image alongside AI identification results would help novice users build confidence. Requires botanical image API integration (out of current scope). Tracked for post-MVP consideration.

### Detail

When using the text input mode (entering a plant name), the advice results show the identified plant name but no reference image. For novice users who might not know what a "Golden Pothos" looks like, showing a reference photo alongside the identification would help build confidence in the AI's recommendation. This could be a future enhancement — perhaps Gemini could return or the frontend could fetch a reference image from a botanical image API. Not blocking — the current text-only results are clear and useful.

---

## FB-082 — User: Care Due Dashboard does not show overdue plants correctly

| Field | Value |
|-------|-------|
| **ID** | FB-082 |
| **Source** | User (project owner) |
| **Sprint** | 18 |
| **Date** | 2026-04-05 |
| **Category** | Bug |
| **Severity** | Major |
| **Description** | A plant named "long legs" is 2 days overdue for watering (visible on the plant detail/inventory view), but the Care Due Dashboard does not reflect this — the plant either does not appear in the overdue section or is categorized incorrectly. The care due section should prominently show any plant that is past its watering schedule. |

### Steps to Reproduce

1. Open the app and confirm the plant "long legs" shows as 2 days overdue for watering (e.g., on the inventory page or plant detail page).
2. Navigate to the Care Due Dashboard.
3. Observe that "long legs" is not displayed as overdue for watering, or is missing/miscategorized.

### Expected vs Actual

| | Behavior |
|---|---|
| **Expected** | "long legs" appears in the Care Due Dashboard's overdue section, clearly marked as 2 days overdue for watering. |
| **Actual** | The Care Due Dashboard does not show "long legs" as overdue for watering, despite other views in the app correctly indicating it is 2 days past due. |

### Status

New — Needs triage by Manager Agent. Likely related to the care due query logic or timezone handling (see also FB-046 for prior timezone-related care due bug).

---

## FB-083 — User: Search bar placeholder shows raw unicode escape instead of ellipsis

| Field | Value |
|-------|-------|
| **ID** | FB-083 |
| **Source** | User (project owner) |
| **Sprint** | 18 |
| **Date** | 2026-04-05 |
| **Category** | Bug |
| **Severity** | Minor |
| **Description** | The search bar placeholder on the My Plants / Inventory page displays `Search plants\u2026` instead of `Search plants…` (or simply `Search plants`). A unicode escape sequence is being rendered as literal text rather than being interpreted as the ellipsis character. The placeholder should just read "Search plants". |

### Steps to Reproduce

1. Log in and navigate to the My Plants (Inventory) page.
2. Look at the search bar placeholder text.

### Expected vs Actual

| | Behavior |
|---|---|
| **Expected** | Placeholder reads "Search plants" (clean, no special characters or escape sequences). |
| **Actual** | Placeholder reads `Search plants\u2026` — the unicode escape for an ellipsis is rendered as literal text. |

### Status

New — Needs triage by Manager Agent. Likely a string encoding issue in the frontend placeholder prop.

---

**Type:** Monitor Alert
**Sprint:** 23
**Date:** 2026-04-05
**Severity:** Critical
**Issue:** Backend process not running at time of post-deploy health check — all API endpoints unreachable.
**Details:**
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/health` → HTTP 000, curl exit code 7 (connection refused). No process is bound to port 3000.
- `curl -s -X POST http://localhost:3000/api/v1/auth/login` → curl exit code 7 (connection refused). Login endpoint unreachable.
- All other protected endpoints (GET /api/v1/plants, GET /api/v1/care-due, GET /api/v1/care-actions, GET /api/v1/profile) not tested — backend prerequisite not met.
- Frontend dev server (http://localhost:5173) also not running — curl exit code 7.
- Frontend production build artifacts confirmed present in `frontend/dist/` (index.html + assets).
- Deploy Engineer log confirms backend started successfully during the deploy phase — process has since terminated.
- Config consistency checks all passed (PORT=3000 matches Vite proxy, no SSL mismatch, CORS includes http://localhost:5173).
- Action required: Deploy Engineer to restart backend (`npm start` in `backend/`) and confirm sustained operation before Monitor Agent re-runs health checks.

---

### FB-108 — Bug: Plant shows overdue on My Plants page but appears in Coming Up on Care Due Dashboard

| Field | Value |
|-------|-------|
| Feedback | Overdue status shown on My Plants inventory does not match the Care Due Dashboard — same plant appears overdue in one view and "coming up" in the other |
| Sprint | 25 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-116 (Done — fixed in Sprint #25). Shared `computeNextDueAt` function in `careStatus.js` used as single source of truth by both endpoints. 5 regression tests added. |
| Related Task | T-116 |

**Description:** On the My Plants (inventory) page, a plant is correctly shown as 2 days overdue for watering. However, navigating to the Care Due Dashboard (`/due`), the same plant does not appear in the Overdue section — it appears in the Coming Up section instead. The two pages are computing care status inconsistently for the same plant.

The root cause is likely a divergence between the status logic used by `GET /api/v1/plants` (which drives the inventory page) and `GET /api/v1/care-due` (which drives the Care Due Dashboard). Both endpoints compute overdue/due_today/upcoming status independently. A likely suspect is timezone handling: `GET /api/v1/plants` accepts a `?utcOffset=` parameter for client-side timezone-aware bucketing (added in Sprint 18/20, T-083), while `GET /api/v1/care-due` may not apply the same timezone offset, causing a date boundary mismatch that shifts an overdue plant into the upcoming bucket.

**Steps to Reproduce:**
1. Have a plant with a watering schedule that is 2+ days past due.
2. Navigate to My Plants — confirm the plant shows "2 days overdue" status badge.
3. Navigate to the Care Due Dashboard (`/due`).
4. Observe the plant appears under "Coming Up" instead of "Overdue".

**Expected vs Actual:**

| | Behavior |
|---|---|
| **Expected** | Plant appears in the Overdue section of the Care Due Dashboard, consistent with the 2-days-overdue status shown on My Plants. |
| **Actual** | Plant appears in the Coming Up section of the Care Due Dashboard despite being shown as overdue on My Plants. |

**Fix guidance:** Audit the care status computation in both `GET /api/v1/plants` (via `careStatus.js`) and `GET /api/v1/care-due` (via `careDue.js`) and ensure they use the same date boundary logic, including timezone offset handling. If `utcOffset` is applied in one but not the other, align them.

*(Duplicate entry — same bug reported twice; both resolved by T-116.)*

---

### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---

### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---

### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---
### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---

### FB-120 — Bug: Google OAuth sign-in fails silently in development due to React StrictMode

| Field | Value |
|-------|-------|
| Feedback | Google OAuth sign-in redirects user back to login page despite successful backend authentication |
| Sprint | 28 |
| Category | Bug |
| Severity | Critical |
| Status | Fixed (manual patch applied — must not be reverted) |
| Related Task | T-120, T-121 |

**Description:** Google OAuth sign-in fails in development because React StrictMode double-invokes `useEffect`. The `consumeOAuthParams()` function in `frontend/src/hooks/useAuth.jsx` reads the `access_token` from the URL and immediately removes it via `window.history.replaceState()`. When StrictMode cancels the first effect run and re-invokes it, the token is already gone from the URL. The second run falls through to silent refresh, which fails (no refresh cookie for this session), and the user is redirected to login.

**Fix applied (2026-04-19):** Added a module-level cache (`_cachedOAuthParams`) in `useAuth.jsx` so `consumeOAuthParams()` returns the cached result on subsequent calls instead of re-reading the (now-cleaned) URL. This is safe because the module is only loaded once per page load.

**File changed:** `frontend/src/hooks/useAuth.jsx` — `consumeOAuthParams()` function.

**IMPORTANT:** This fix is already applied in the working tree. Agents must NOT revert or overwrite `consumeOAuthParams()` without preserving the module-level `_cachedOAuthParams` pattern. Any refactor of the OAuth token consumption must account for React StrictMode's double-invocation of effects.

---

### FB-121 — Bug: Google OAuth callback logs no errors on failure — silent redirect to login

| Field | Value |
|-------|-------|
| Feedback | Backend OAuth callback swallows all errors and redirects to login with no server-side logging |
| Sprint | 28 |
| Category | Bug |
| Severity | Minor |
| Status | Fixed (manual patch applied — must not be reverted) |
| Related Task | T-120 |

**Description:** The `GET /api/v1/auth/google/callback` handler in `backend/src/routes/googleAuth.js` had `failureRedirect` set on `passport.authenticate`, which caused Passport to redirect on token exchange errors without calling the callback function. The `catch` block also silently redirected without logging. This made OAuth failures impossible to diagnose from server logs.

**Fix applied (2026-04-19):** Removed `failureRedirect` from `passport.authenticate` options so errors flow through the callback. Added `console.error` logging at both the `if (err || !user)` branch and the `catch` block. Added a `console.log` at callback entry showing query params and code presence. Added `process.on('unhandledRejection')` handler in `server.js`.

**Files changed:**
- `backend/src/routes/googleAuth.js` — removed `failureRedirect`, added error logging
- `backend/src/server.js` — added `unhandledRejection` handler

**IMPORTANT:** These logging additions are already applied in the working tree. Agents must preserve the error logging if refactoring the OAuth callback.

---

### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---
### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---
### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---
### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---

### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---
### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---
### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---
### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---
### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---
### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---
### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---
### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---

### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---
### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---
### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---
### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---
### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---
### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---
### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---
### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---
### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---
### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---
### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---
### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---
### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---
### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---
### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---
### FB-113 — Bug: Batch mark-done does not update care_schedules.last_done_at — causes persisting overdue/coming-up mismatch

| Field | Value |
|-------|-------|
| Feedback | Plants marked done via the Care Due Dashboard still show as overdue on My Plants after the action |
| Sprint | 27 |
| Category | Bug |
| Severity | Major |
| Status | Tasked → T-139 (Sprint #29: Backend fix — CareAction.batchCreate() must call CareSchedule.updateLastDoneAt() after inserting batch actions, mirroring the single-action path. Duplicate entries consolidated — one task covers all instances.) |
| Related Task | — |

**Description:** The overdue/coming-up status mismatch between My Plants and the Care Due Dashboard persists despite T-116. Root cause identified: `CareAction.batchCreate()` (used by `POST /api/v1/care-actions/batch`, which powers the Care Due Dashboard "Mark Done" button) inserts into `care_actions` but never calls `CareSchedule.updateLastDoneAt()`.

This creates a data divergence:
- `GET /api/v1/care-due` reads `MAX(care_actions.performed_at)` via `CareSchedule.findAllWithLastAction()` — sees the fresh batch action and correctly computes next due as future → "Coming Up"
- `GET /api/v1/plants` reads `care_schedules.last_done_at` directly — still has the pre-batch stale value → computes the plant as overdue

The single-action mark-done path (`POST /api/v1/care-actions`) correctly calls `CareSchedule.updateLastDoneAt()` and does not have this bug. Only the batch path is affected.

**Steps to Reproduce:**
1. Have a plant with overdue watering showing on both My Plants and Care Due Dashboard.
2. On the Care Due Dashboard, use the batch mark-done flow to mark it done.
3. Navigate to My Plants — the plant still shows as overdue.
4. Navigate back to Care Due Dashboard — the plant correctly shows in Coming Up.

**Fix:** In `CareAction.batchCreate()` (`backend/src/models/CareAction.js`), after inserting valid actions, call `CareSchedule.updateLastDoneAt()` for each successfully inserted action — mirroring the single-action path. Only update if `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.

**Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method.

---
