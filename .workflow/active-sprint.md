# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #28 — 2026-04-13 to 2026-04-19

**Sprint Goal:** Enable plant sharing — allow users to generate a shareable public link for any plant in their inventory, so friends and family can view the plant's care profile without needing an account. Also address two housekeeping items from Sprint #27: fix the `nodemailer` moderate vulnerability and update the OAuth API contract to reflect HttpOnly cookie token delivery.

**Context:** Sprint #27 delivered Google OAuth, completing all planned MVP and post-MVP authentication work. Sprint #28 begins the social/sharing layer — the highest-value post-MVP feature for the "plant killer" persona, who may want to show off a thriving plant or share care instructions with a partner. Housekeeping (T-127) is scoped small and can be done in parallel with the design phase.

---

## In Scope

### P2 — Backend: Housekeeping — Nodemailer Vulnerability Fix + API Contract Update (T-127)

- [ ] **T-127** — Backend Engineer: Fix nodemailer vulnerability and update OAuth API contract **(P2)**
  - **Description:** Two small housekeeping items from Sprint #27 feedback (FB-118, FB-119):
    1. Run `npm audit fix` in `backend/` to resolve the `nodemailer` SMTP CRLF injection vulnerability (GHSA-vvjj-xcjg-gr5g). Verify all 199/199 backend tests still pass after the dependency update.
    2. Update `api-contracts.md` — the `GET /api/v1/auth/google/callback` section still documents `refresh_token` in the redirect URL query param. Update it to reflect the actual post-H-370 implementation: `refresh_token` is delivered exclusively via `Set-Cookie: refresh_token` (HttpOnly, Secure, SameSite=Strict), and the redirect URL does not include a `refresh_token` param.
  - **Acceptance Criteria:**
    - `npm audit` in `backend/` reports zero moderate or higher vulnerabilities (or explicitly documents any that cannot be fixed without breaking changes)
    - All 199/199 existing backend tests continue to pass after `npm audit fix`
    - `api-contracts.md` OAuth callback section updated: redirect URL params are `access_token` and `_oauthAction` only; `refresh_token` delivery documented as HttpOnly cookie
    - No other contract changes
  - **Blocked By:** None — start immediately, parallel with T-125.

---

### P1 — Design: Plant Sharing UI Spec (T-125)

- [ ] **T-125** — Design Agent: Write SPEC-022 — Plant sharing / public plant profile **(P1)**
  - **Description:** Specify the end-to-end plant sharing experience. This covers two surfaces:
    1. **Share button on Plant Detail page:** A "Share" button (or icon button) on the PlantDetailPage that generates (or retrieves) a shareable link for the plant. On click: calls the backend share endpoint, receives the share URL, and copies it to the clipboard with a "Link copied!" toast. The button should show a loading state while the API call is in flight. If the user has already shared this plant, the same share URL should be returned (idempotent).
    2. **Public plant profile page (`/plants/share/:shareId`):** A read-only, no-auth-required page displaying the plant's name, type, optional photo, care schedules (watering/fertilizing/repotting frequency), and AI care notes (if any). No care history, no overdue/due status (that's private). Page should be clean, readable, and embeddable (good for sharing on social or messaging). Include an "Add your own plants on Plant Guardians" CTA for new-user acquisition.
    - **Privacy:** Only information the plant owner has explicitly chosen to share should appear (name, type, photo, schedule). Care history (what was watered when), profile info, and account details must NOT appear on the public page.
    - **Revocation:** The spec should document how a user revokes a share link (e.g., delete the share token; future: per the backend). Revocation UX can be a future sprint but should be considered in the data model.
    - **Dark mode:** Public page must support dark mode via CSS custom properties, consistent with existing pages.
    - **Accessibility:** Share button: `aria-label="Share plant"`. Public page: standard landmark roles and alt text.
  - **Acceptance Criteria:**
    - SPEC-022 written to `ui-spec.md` and marked Approved
    - Share button surface: placement, loading state, "Link copied!" toast, error state documented
    - Public plant profile page: all visible fields enumerated; privacy boundary explicit (what is/is not shown)
    - Dark mode and accessibility requirements documented
    - Spec gates T-126 and T-128 — do not start those tasks until SPEC-022 is Approved
  - **Blocked By:** None — start immediately.

---

### P1 — Backend: Plant Sharing API (T-126)

- [ ] **T-126** — Backend Engineer: Implement plant sharing API **(P1)**
  - **Description:** Add a plant sharing system to the backend:
    1. **New migration:** Add `plant_shares` table — `id` (PK), `plant_id` (FK → plants, CASCADE DELETE), `user_id` (FK → users, for ownership verification), `share_token` (VARCHAR(64), UNIQUE, indexed), `created_at`. Token should be a random URL-safe string (e.g., 32-byte `crypto.randomBytes` encoded as base64url).
    2. **`POST /api/v1/plants/:plantId/share`** (auth required): Creates or retrieves a share token for the given plant (idempotent — if a share token already exists for this plant, return the existing one). Verifies the requesting user owns the plant (403 otherwise). Returns `{ share_url: "https://<FRONTEND_URL>/plants/share/<token>" }`. Use `FRONTEND_URL` env var for the base URL.
    3. **`GET /api/v1/public/plants/:shareToken`** (no auth required): Returns public plant data — `name`, `species` (plant type), `photo_url` (if present), `watering_frequency_days`, `fertilizing_frequency_days` (if set), `repotting_frequency_days` (if set), `ai_care_notes` (if set). Does NOT return `user_id`, `created_at`, care history, or any user-identifiable data. Returns 404 if `shareToken` does not exist.
    4. Add `FRONTEND_URL` to `.env.example` if not already present (check first).
    5. **New tests:** ≥ 6 new tests — happy path create share (new plant), idempotent (existing share returns same token), unauthorized plant (403), public endpoint happy path, public endpoint 404 (unknown token), auth required for POST (401 without token). All existing 199/199 backend tests continue to pass.
    6. Publish API contract for both new endpoints to `api-contracts.md`.
  - **Acceptance Criteria:**
    - Migration: `plant_shares` table created with correct schema; reversible `down()` implemented
    - `POST /api/v1/plants/:plantId/share` → 200 + `{ share_url }` for owned plants; 403 for unowned; 401 unauthenticated; idempotent
    - `GET /api/v1/public/plants/:shareToken` → 200 + public plant data (no private fields); 404 for unknown token; no auth required
    - All 199/199 existing backend tests pass; ≥ 6 new tests
    - API contract published
    - T-125 (SPEC-022 Approved) must complete before this task begins
  - **Blocked By:** T-125

---

### P1 — Frontend: Plant Sharing UI (T-128)

- [ ] **T-128** — Frontend Engineer: Add plant sharing UI to Plant Detail page and create public plant profile page **(P1)**
  - **Description:** Per SPEC-022:
    1. **Share button on PlantDetailPage:** Add a "Share" icon button to the plant detail header. On click: call `POST /api/v1/plants/:plantId/share`, receive the `share_url`, and copy it to the clipboard via `navigator.clipboard.writeText`. Show a "Link copied!" success toast. Handle loading state (button disabled + spinner). Handle error (inline toast error: "Failed to generate link"). If the user's browser does not support `navigator.clipboard`, fall back to selecting the URL in an `<input>` for manual copy.
    2. **Public plant profile page (`/plants/share/:shareToken`):** New route in `App.jsx`. Fetches `GET /api/v1/public/plants/:shareToken` on mount. Displays: plant name (heading), species, photo (if present), care schedule chips (watering every N days, etc.), AI care notes (if present). Loading skeleton while fetching. 404 state: "This plant link is no longer active" message. Error state: generic error with retry. "Discover Plant Guardians" CTA at the bottom (links to `/`). Dark mode via CSS custom properties. No auth required — no navigation header with login links that could confuse unauthenticated visitors (a minimal header or no header is fine).
    3. Coordinate with Backend Engineer on the shape of the public plant data response (use published API contract from T-126).
  - **Acceptance Criteria:**
    - "Share" button on PlantDetailPage: loading state, clipboard copy, "Link copied!" toast, error state — all implemented per SPEC-022
    - `/plants/share/:shareToken` route renders public plant profile: all documented fields, loading skeleton, 404 state, error state, "Discover Plant Guardians" CTA, dark mode
    - All existing 276/276 frontend tests continue to pass; ≥ 5 new tests (share button render, click → API call, clipboard copy, 404 state, error state)
    - T-125 (SPEC-022 Approved) must complete before this task begins
  - **Blocked By:** T-125

---

### P2 — QA: Sprint #28 Verification (T-129)

- [ ] **T-129** — QA Engineer: Verify T-125, T-126, T-127, T-128 and confirm no regressions **(P2)**
  - **Description:** After T-126 and T-128 are In Review/Done, run the full test suite and perform product-perspective testing:
    - Backend: all tests pass (≥ 205/199); T-126 new share tests cover happy path, idempotent, 403, 401, public 200, public 404; T-127 nodemailer fix — 0 moderate/high vulnerabilities
    - Frontend: all tests pass (≥ 281/276); T-128 tests cover share button render, click, clipboard, 404, error states
    - SPEC-022 compliance: share button placement and behavior, public page fields, privacy boundary
    - Security checklist: no user-identifiable data in public endpoint response, share token is URL-safe and sufficiently random (≥ 32 bytes entropy), auth enforced on POST endpoint, no IDOR on public GET
    - API contract for T-126 endpoints verified
    - T-127: `npm audit` clean; api-contracts.md OAuth section updated
  - **Acceptance Criteria:**
    - Backend ≥ 205/199 tests pass; frontend ≥ 281/276 tests pass
    - Full security checklist pass (especially: no private data in public endpoint, auth on share creation)
    - SPEC-022 compliance verified
    - T-127 housekeeping verified: zero moderate+ npm vulnerabilities; API contract updated
    - QA sign-off logged in `qa-build-log.md`
  - **Blocked By:** T-126, T-127, T-128

---

### P2 — Deploy: Staging Re-Deploy (T-130)

- [ ] **T-130** — Deploy Engineer: Staging re-deploy after QA sign-off **(P2)**
  - **Description:** After QA sign-off (T-129), run the standard staging deploy checklist: run migrations (`knex migrate:latest` — applies the `plant_shares` table migration), restart backend process, rebuild frontend dist. Verify `/api/health` → 200 and spot-check a few key endpoints.
  - **Acceptance Criteria:**
    - Migration applied: `plant_shares` table present in DB
    - Backend process restarted and healthy on port 3000
    - `GET /api/health` → 200
    - `GET /api/v1/public/plants/nonexistent` → 404 (verifies public route is live)
    - Staging deploy logged in `qa-build-log.md`
  - **Blocked By:** T-129

---

### P2 — Monitor: Post-Deploy Health Check (T-131)

- [ ] **T-131** — Monitor Agent: Post-deploy health check for Sprint #28 **(P2)**
  - **Description:** Run the standard post-deploy health check after T-130 deploy. Verify all existing endpoints remain healthy. For new endpoints: verify `POST /api/v1/plants/:plantId/share` (with valid auth) returns 200, and `GET /api/v1/public/plants/nonexistent` returns 404. Log **Deploy Verified: Yes/No** in `qa-build-log.md`.
  - **Acceptance Criteria:**
    - `GET /api/health` → 200
    - All existing core endpoints → expected status codes (no regressions)
    - `GET /api/v1/public/plants/nonexistent` → 404
    - `POST /api/v1/plants/:plantId/share` (authenticated) → 200 + `share_url`
    - Deploy Verified: Yes logged in `qa-build-log.md`
    - If backend process is not running, restart before health check (standard infrastructure note)
  - **Blocked By:** T-130

---

## Out of Scope

- Share link revocation UI (per-plant "remove share" button) — post-Sprint #28, data model supports it
- Share analytics (view count, etc.) — future
- Plant sharing to social platforms (Open Graph meta tags, Twitter card) — future sprint polish
- Express 5 migration — advisory backlog, no urgency
- Soft-delete / grace period for account deletion — post-MVP
- Production deployment execution — blocked on project owner providing SSL certs
- Production email delivery — blocked on project owner providing SMTP credentials

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Design Agent | Plant sharing UI spec | T-125 (P1, start immediately — gates T-126 and T-128) |
| Backend Engineer | Plant sharing API + housekeeping | T-126 (P1, after T-125), T-127 (P2, start immediately — parallel with T-125) |
| Frontend Engineer | Share button + public plant page | T-128 (P1, after T-125; coordinate with Backend on response shape) |
| QA Engineer | Full regression + sharing flow verification | T-129 (P2, after T-126 + T-127 + T-128) |
| Deploy Engineer | Staging re-deploy with plant_shares migration | T-130 (P2, after T-129) |
| Monitor Agent | Post-deploy health check | T-131 (P2, after T-130) |
| Manager | Sprint coordination + code review | Ongoing |

---

## Dependency Chain

```
T-125 (SPEC-022 — Design Agent, START IMMEDIATELY)     T-127 (Housekeeping — Backend, START IMMEDIATELY)
  ↓                                                          ↓
T-126 (Plant sharing API — Backend Engineer)            (feeds into T-129)
T-128 (Plant sharing UI — Frontend Engineer, parallel with T-126)
  ↓
T-129 (QA — after T-126 + T-127 + T-128)
  ↓
T-130 (Deploy — after T-129)
  ↓
T-131 (Monitor health check)
```

**Note:** T-127 (housekeeping) is independent and can be completed in parallel with T-125 (design). Backend Engineer should prioritize T-127 first (it's XS complexity) then begin T-126 once T-125 is approved.

---

## Definition of Done

Sprint #28 is complete when:

- [ ] T-125: SPEC-022 written and marked Approved in `ui-spec.md`; covers share button, public page, privacy boundary, dark mode, accessibility
- [ ] T-126: `POST /api/v1/plants/:plantId/share` and `GET /api/v1/public/plants/:shareToken` implemented; `plant_shares` migration applied; ≥ 6 new tests; 199/199 existing backend tests pass; API contract published
- [ ] T-127: `npm audit` clean (zero moderate+ vulnerabilities in backend); `api-contracts.md` OAuth callback section updated to reflect HttpOnly cookie delivery; 199/199 backend tests pass
- [ ] T-128: Share button on PlantDetailPage; `/plants/share/:shareToken` public page; ≥ 5 new tests; 276/276 existing frontend tests pass
- [ ] T-129: QA sign-off — backend ≥ 205/199, frontend ≥ 281/276; SPEC-022 compliance verified; security checklist pass; T-127 housekeeping verified
- [ ] T-130: Migration applied to staging; backend and frontend redeployed
- [ ] T-131: Deploy Verified: Yes from Monitor Agent

---

## Success Criteria

- Users can generate a shareable link for any plant they own from the Plant Detail page
- Anyone with the share link can view the public plant profile without logging in
- Public page exposes only name, species, photo, schedules, and AI care notes — no user-identifiable data
- Share token creation is idempotent (clicking "Share" twice returns the same link)
- `npm audit` reports zero moderate or higher vulnerabilities in backend
- `api-contracts.md` accurately reflects the post-H-370 OAuth callback token delivery (HttpOnly cookie)
- Backend ≥ 205 tests; Frontend ≥ 281 tests
- Deploy Verified: Yes

---

## Blockers

- T-126 and T-128 are both blocked on T-125 (SPEC-022) — Design Agent must complete the spec before engineers start
- T-129 is blocked on T-126, T-127, and T-128 all being complete
- Production deployment remains blocked on project owner providing SSL certificates
- Production email delivery blocked on project owner providing SMTP credentials
- **Infrastructure note:** Local staging backend process may terminate between Deploy and Monitor phases — Monitor Agent must restart it if connection refused before running health checks
