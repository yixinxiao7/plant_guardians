# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #27 — 2026-06-07 to 2026-06-13

**Sprint Goal:** Reduce signup friction for "plant killer" users by adding **Google OAuth (Sign in with Google)** — so new users can onboard in one tap instead of filling in a registration form.

**Context:** Sprint #26 closed the final polish backlog items (T-117, T-118). MVP is complete and fully verified at 188/188 backend + 262/262 frontend tests. Sprint #27 moves into post-MVP with the highest-value onboarding improvement: Google social login. Users who sign up via Google skip password management entirely — ideal for the casual, non-technical "plant killer" persona this app targets.

---

## In Scope

### P1 — Design: Google OAuth Login/Register UI Spec (SPEC-021)

- [ ] **T-119** — Design Agent: Write SPEC-021 — Google OAuth login/register UI additions **(P1)**
  - **Description:** Extend the existing Login and Sign Up pages (SPEC-001) to include a "Sign in with Google" button. Define button placement, styling (Google-branded), divider copy ("or"), and the post-OAuth redirect flow. Also specify the account-linking edge case: if a user already has an email/password account with the same email as their Google account, describe the merge or conflict UX (recommended: auto-link to existing account with a toast confirmation).
  - **Acceptance Criteria:**
    - SPEC-021 written to `ui-spec.md` and marked Approved
    - Login page: Google button placement, styling, divider, fallback error state documented
    - Register page: same Google button additions documented
    - Post-OAuth redirect: logged-in users land on `/` (plant inventory), same as email/password flow
    - Account-linking edge case (same email already exists) UX specified
    - Spec gates T-120 and T-121 — do not start those tasks until SPEC-021 is Approved
  - **Blocked By:** None — start immediately.

---

### P1 — Backend: Google OAuth Strategy + Callback Endpoint (T-120)

- [ ] **T-120** — Backend Engineer: Implement Google OAuth via Passport.js **(P1)**
  - **Description:** Add Google OAuth 2.0 login to the existing Express/Passport auth stack. Steps:
    1. Add `passport-google-oauth20` dependency
    2. New migration: add `google_id VARCHAR(255) UNIQUE` column to `users` table (nullable — existing email/password users are unaffected)
    3. Configure `GoogleStrategy` with `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and callback URL (`/api/v1/auth/google/callback`)
    4. `GET /api/v1/auth/google` — initiates OAuth redirect (scope: profile, email)
    5. `GET /api/v1/auth/google/callback` — handles Google callback; upserts user (find by `google_id`, or by `email` for account linking); issues same JWT `access_token` + `refresh_token` as email/password login; redirects to frontend with token in query param or short-lived cookie (align with Frontend Engineer on mechanism)
    6. For the account-linking case (Google email matches existing email/password account): set `google_id` on existing user, return their existing JWT (do not create a duplicate account)
    7. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env.example` with placeholder values
    8. New tests: happy path (new user via Google), account linking (existing email), missing Google env vars (graceful degradation), callback error path — all existing 188/188 tests continue to pass
  - **Acceptance Criteria:**
    - `GET /api/v1/auth/google` redirects to Google consent screen
    - `GET /api/v1/auth/google/callback` creates or links user and issues JWT
    - Migration: `google_id` column added, reversible `down()` implemented
    - Existing email/password auth is completely unaffected
    - `.env.example` updated with `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
    - All existing 188/188 backend tests continue to pass; ≥4 new tests for OAuth paths
    - API contract for `/auth/google` and `/auth/google/callback` published to `api-contracts.md`
    - T-119 (SPEC-021 Approved) must complete before this task begins
  - **Blocked By:** T-119

---

### P1 — Frontend: "Sign in with Google" Button Integration (T-121)

- [ ] **T-121** — Frontend Engineer: Add Google OAuth button to Login and Register pages **(P1)**
  - **Description:** Per SPEC-021, add a Google-branded "Sign in with Google" button to both `LoginPage.jsx` and the registration flow. When clicked, the button redirects the user to `GET /api/v1/auth/google` (the backend initiates the OAuth flow). On callback, the backend redirects back to the frontend with a token; the frontend stores it the same way as email/password login (in-memory token, no sessionStorage) and navigates to `/`.
    - Use the official Google button styling (SVG logo + correct brand colors) or a close approximation per Google's brand guidelines
    - Add a visual divider ("or") between the Google button and the email/password form
    - Handle the error case: if the OAuth callback returns an error query param, display an inline error message
    - Coordinate with Backend Engineer on the token delivery mechanism (query param vs short-lived cookie) before implementation
  - **Acceptance Criteria:**
    - "Sign in with Google" button visible on both Login and Register pages, per SPEC-021
    - Clicking button initiates OAuth flow (redirects to backend `/auth/google`)
    - Successful OAuth → user lands on `/` with valid session (same UX as email/password login)
    - Error state: if OAuth fails, inline error shown on the login/register page
    - All existing 262/262 frontend tests continue to pass; ≥3 new tests for Google button rendering, click behavior, and error state
    - T-119 (SPEC-021 Approved) must complete before this task begins
  - **Blocked By:** T-119

---

### P2 — QA: Sprint #27 Verification (T-122)

- [ ] **T-122** — QA Engineer: Verify T-119, T-120, T-121 and confirm no regressions **(P2)**
  - **Description:** After T-120 and T-121 are In Review/Done, run the full test suite and perform product-perspective testing of the Google OAuth flow:
    - Backend: all tests pass (≥192/188); T-120 new OAuth tests cover happy path, account linking, missing env vars, error path
    - Frontend: all tests pass (≥265/262); T-121 tests cover button render, click, and error state
    - SPEC-021 compliance: Google button placement, divider, styling match spec
    - Account-linking edge case behavior matches SPEC-021 spec
    - No regressions in existing email/password auth flows
    - Security checklist: no OAuth tokens logged, no client secrets in frontend code, redirect URI allowlist properly configured
  - **Acceptance Criteria:**
    - Backend ≥ 192/188 tests pass; frontend ≥ 265/262 tests pass
    - Full security checklist pass (especially: no secrets in frontend, no open redirects in callback)
    - SPEC-021 compliance verified
    - QA sign-off logged in `qa-build-log.md`
  - **Blocked By:** T-120, T-121

---

### P2 — Deploy: Staging Re-Deploy (T-123)

- [ ] **T-123** — Deploy Engineer: Staging re-deploy after QA sign-off **(P2)**
  - **Description:** After QA sign-off (T-122), run the standard staging deploy checklist: run migrations (`knex migrate:latest` — applies the `google_id` column migration), restart backend process, rebuild frontend dist. Note: Google OAuth will not be fully end-to-end testable in staging without real `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` env vars — document this limitation in `qa-build-log.md`. All other existing endpoints must remain healthy.
  - **Acceptance Criteria:**
    - Migration applied: `google_id` column present in `users` table
    - Backend process restarted and healthy on port 3000
    - `GET /api/health` → 200
    - All existing non-OAuth endpoints return expected status codes
    - Staging deploy logged in `qa-build-log.md`
  - **Blocked By:** T-122

---

### P2 — Monitor: Post-Deploy Health Check (T-124)

- [ ] **T-124** — Monitor Agent: Post-deploy health check for Sprint #27 **(P2)**
  - **Description:** Run the standard post-deploy health check after T-123 deploy. Verify all existing endpoints remain healthy. For the new OAuth endpoints, verify that `GET /api/v1/auth/google` returns a 302 redirect (or similar) rather than a 500 (even without real Google credentials configured, the route should exist and not crash). Log **Deploy Verified: Yes/No** in `qa-build-log.md`.
  - **Acceptance Criteria:**
    - `GET /api/health` → 200
    - All existing core endpoints → expected status codes (no regressions)
    - `GET /api/v1/auth/google` → exists and does not 500 (may 302 or 400 without real Google creds — either is acceptable)
    - Deploy Verified: Yes logged in `qa-build-log.md`
    - If backend process is not running, restart before health check (standard infrastructure note)
  - **Blocked By:** T-123

---

## Out of Scope

- Plant sharing / public profiles (B-003) — post-MVP, next sprint candidate
- Express 5 migration — advisory backlog, no urgency
- Soft-delete / grace period for account deletion — post-MVP
- Production deployment execution — blocked on project owner providing SSL certs
- Production email delivery — blocked on project owner providing SMTP credentials
- Any new plant-tracking feature work — backlog

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Design Agent | Google OAuth UI spec | T-119 (P1, start immediately — gates T-120 and T-121) |
| Backend Engineer | Google OAuth strategy + DB migration | T-120 (P1, starts after T-119) |
| Frontend Engineer | Google OAuth button + callback handling | T-121 (P1, starts after T-119; coordinate with Backend on token delivery) |
| QA Engineer | Full regression + OAuth flow verification | T-122 (P2, after T-120 + T-121) |
| Deploy Engineer | Staging re-deploy with migration | T-123 (P2, after T-122) |
| Monitor Agent | Post-deploy health check | T-124 (P2, after T-123) |
| Manager | Sprint coordination + code review | Ongoing |

---

## Dependency Chain

```
T-119 (SPEC-021 — Design Agent, START IMMEDIATELY)
  ↓
T-120 (Google OAuth backend — Backend Engineer)
T-121 (Google OAuth frontend — Frontend Engineer, parallel with T-120)
  ↓
T-122 (QA — after T-120 + T-121)
  ↓
T-123 (Deploy — after T-122)
  ↓
T-124 (Monitor health check)
```

**Note:** T-120 and T-121 should coordinate early on the OAuth callback token delivery mechanism (query param vs short-lived cookie) before each agent starts implementation, to avoid a mismatch at integration time.

---

## Definition of Done

Sprint #27 is complete when:

- [ ] T-119: SPEC-021 written and marked Approved in `ui-spec.md`; covers Google button placement, divider, account-linking edge case
- [ ] T-120: `/auth/google` and `/auth/google/callback` routes implemented; `google_id` migration applied; ≥4 new tests; 188/188 existing backend tests pass; API contract published
- [ ] T-121: Google button on Login and Register pages; OAuth callback handling; ≥3 new tests; 262/262 existing frontend tests pass
- [ ] T-122: QA sign-off — backend ≥192/188, frontend ≥265/262; SPEC-021 compliance verified; security checklist pass
- [ ] T-123: Migration applied to staging; backend and frontend redeployed
- [ ] T-124: Deploy Verified: Yes from Monitor Agent

---

## Success Criteria

- "Sign in with Google" button is visible and functional on Login and Register pages
- New users can complete Google OAuth onboarding in one click
- Existing email/password accounts with the same Google email are auto-linked (no duplicate accounts)
- Zero regressions in existing auth or plant-tracking flows
- Backend ≥ 192 tests; Frontend ≥ 265 tests
- Deploy Verified: Yes

---

## Blockers

- T-120 and T-121 are both blocked on T-119 (SPEC-021) — Design Agent must complete the spec before engineers start
- Real `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are required for full end-to-end OAuth testing in staging; project owner must provide these before staging verification of the happy path. Backend will add placeholder values to `.env.example`; the routes must not crash in the absence of real credentials
- Production deployment remains blocked on project owner providing SSL certificates
- Production email delivery blocked on project owner providing SMTP credentials
- **Infrastructure note:** Local staging backend process may terminate between Deploy and Monitor phases — Monitor Agent must restart it if connection refused before running health checks
