# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #29 — 2026-04-20 to 2026-04-26

**Sprint Goal:** Fix the batch mark-done correctness bug (FB-113 — Major), complete the sharing system with revocation and share status, add Open Graph meta tags to the public plant profile page, and fix the Vite dev-server HIGH severity vulnerability (FB-120).

**Context:** Sprint #28 delivered core plant sharing. Before continuing sharing polish, Sprint #29 must address a carry-over Major bug: `CareAction.batchCreate()` does not call `CareSchedule.updateLastDoneAt()`, so batch mark-done via the Care Due Dashboard leaves plants incorrectly shown as overdue on the My Plants page. This bug directly undermines the core value prop for "plant killer" users. Two sharing follow-ups are also due: share revocation (data model already in place) and a share status endpoint (needed for conditional "Copy / Remove" UI). OG meta tags and the Vite housekeeping fix round out the sprint.

---

## In Scope

### P1 — Backend: Fix Batch Mark-Done `last_done_at` Divergence (T-139)

- [ ] **T-139** — Backend Engineer: Fix `CareAction.batchCreate()` — call `CareSchedule.updateLastDoneAt()` after batch insert **(P1)**
  - **Description:** The batch mark-done path (`POST /api/v1/care-actions/batch`, used by the Care Due Dashboard) inserts into `care_actions` but does not call `CareSchedule.updateLastDoneAt()`. This leaves `care_schedules.last_done_at` stale, so `GET /api/v1/plants` still computes plants as overdue after a batch mark-done action — even though the Care Due Dashboard correctly shows them as Coming Up (because it reads `MAX(care_actions.performed_at)` directly).
    - **Fix location:** `backend/src/models/CareAction.js` — `batchCreate()` method. After inserting valid care actions, iterate over the inserted records and call `CareSchedule.updateLastDoneAt(schedule_id, performed_at)` for each, mirroring the single-action path in `POST /api/v1/care-actions`. Only update if the action's `performed_at` is more recent than the schedule's current `last_done_at` to avoid regressing a later action with an earlier batch entry.
    - All existing 209/209 backend tests must continue to pass. Add ≥ 3 new tests: (1) batch mark-done updates `last_done_at` for each affected schedule; (2) batch with `performed_at` older than existing `last_done_at` does NOT regress it; (3) end-to-end: after batch mark-done, `GET /api/v1/plants` no longer shows the plant as overdue.
  - **Acceptance Criteria:**
    - `CareAction.batchCreate()` calls `CareSchedule.updateLastDoneAt()` for each successfully inserted action
    - `performed_at` newer than current `last_done_at` → updates; older → does not update
    - `GET /api/v1/plants` returns correct status after batch mark-done (no stale overdue)
    - All 209/209 existing backend tests pass; ≥ 3 new tests
    - No new migrations required
  - **Blocked By:** None — start immediately.

---

### P2 — Design: Share Revocation + Status + OG Meta Spec (T-132)

- [ ] **T-132** — Design Agent: Write SPEC-023 — Share revocation, share status state, and OG meta tags **(P2)**
  - **Description:** Specify three UI surfaces:
    1. **Share status state on PlantDetailPage:** On page load, the frontend fetches `GET /api/v1/plants/:plantId/share` to determine whether the plant has an active share. If yes: show a "Copy link" button (copies existing share_url to clipboard with "Link copied!" toast) and a "Remove share link" option (text link or secondary button adjacent to the Copy button). If no: show the original "Share" button per SPEC-022 (creates a new share). Document the loading state while the share status is being fetched (e.g., share action area shows a skeleton/disabled state; does not block the rest of the PlantDetailPage from rendering).
    2. **Share revocation flow:** Clicking "Remove share link" opens a confirmation modal: "Remove share link? Anyone with the old link will no longer be able to view this plant." Two buttons: "Remove link" (destructive, calls `DELETE /api/v1/plants/:plantId/share`) and "Cancel". On success: toast "Share link removed." On error: toast "Failed to remove link. Please try again." After success, the PlantDetailPage share area transitions back to the "Share" button state.
    3. **Open Graph meta tags on `PublicPlantPage`:** Document the `<meta>` tags to inject into `<head>` on the public plant profile page: `og:title` = "{plant name} on Plant Guardians", `og:description` = "Learn how to care for {plant name}: watering every {N} days, fertilizing every {M} days." (omit if frequencies null), `og:image` = `photo_url` if present (else fallback to a default Plant Guardians OG image), `og:url` = canonical share URL, `og:type` = "article". Twitter/X card tags: `twitter:card` = "summary_large_image" (or "summary" if no photo), `twitter:title` same as og:title, `twitter:description` same as og:description.
  - **Acceptance Criteria:**
    - SPEC-023 written to `ui-spec.md` and marked Approved
    - Share status state: loading skeleton, "Copy link" + "Remove share link" (when shared), "Share" button (when not shared) — all states documented
    - Revocation modal: copy, two buttons, success/error toast documented
    - OG meta tags: all tag names and value construction rules documented; fallback behavior for missing photo / null frequencies explicit
    - Gates T-133, T-134
  - **Blocked By:** None — start immediately.

---

### P1 — Backend: Share Status + Revocation Endpoints (T-133)

- [ ] **T-133** — Backend Engineer: Add `GET` and `DELETE` share endpoints **(P1)**
  - **Description:**
    1. **`GET /api/v1/plants/:plantId/share`** (auth required): Returns `{ share_url }` if an active share exists for this plant; returns 404 if no share row exists. Verifies the requesting user owns the plant (403 otherwise). Uses `PlantShare.findByPlantId()` (already exists from T-126). Returns same `share_url` format as the POST endpoint (built via `resolveFrontendBaseUrl()`).
    2. **`DELETE /api/v1/plants/:plantId/share`** (auth required): Deletes the `plant_shares` row for this plant. Verifies ownership (403). Returns 204 on success. Returns 404 if no share exists for this plant. Returns 400 for invalid UUID plant ID. Extend `PlantShare` model with `deleteByPlantId(plantId)`.
    3. **New tests:** ≥ 6 tests — GET happy path (returns share_url), GET 404 (no share), GET 403 wrong owner, DELETE happy path (204), DELETE 404 (no share), DELETE 403 wrong owner. All existing 209/209 backend tests continue to pass.
    4. Publish API contracts for both new endpoints to `api-contracts.md`.
  - **Acceptance Criteria:**
    - `GET /api/v1/plants/:plantId/share` → 200 + `{ share_url }` if share exists; 404 if not; 403 wrong owner; 401 unauthenticated; 400 invalid UUID
    - `DELETE /api/v1/plants/:plantId/share` → 204 on success; 404 if no share; 403 wrong owner; 401 unauthenticated; 400 invalid UUID
    - All 209/209 existing backend tests pass; ≥ 6 new tests
    - API contracts published
    - Blocked By: T-132
  - **Blocked By:** T-132

---

### P1 — Frontend: Share Status UI + Revocation + OG Meta Tags (T-134)

- [ ] **T-134** — Frontend Engineer: Update PlantDetailPage share area; add revocation modal; add OG meta tags to PublicPlantPage **(P1)**
  - **Description:** Per SPEC-023:
    1. **PlantDetailPage share area:** On mount (or when `plantId` changes), call `GET /api/v1/plants/:plantId/share`. While fetching: render the share action area in a loading/disabled state (do not block rest of page). On 200: switch ShareButton to "Copy link" mode (clicking copies the returned `share_url` to clipboard, same clipboard + toast logic as SPEC-022) and render a "Remove share link" text button next to it. On 404: render original "Share" button (unchanged from Sprint 28). On error: log quietly; fall back to original "Share" button (safe degradation).
    2. **Share revocation modal (`ShareRevokeModal.jsx`):** Triggered by "Remove share link". Confirm text per SPEC-023. On confirm: call `DELETE /api/v1/plants/:plantId/share`; show loading state; on 204 → toast "Share link removed." + close modal + transition share area back to "Share" button; on error → toast "Failed to remove link. Please try again." + keep modal open for retry.
    3. **OG meta tags on `PublicPlantPage`:** Using `react-helmet-async` (already in `package.json` if present; add if missing), inject `<Helmet>` with `og:*` and `twitter:*` tags per SPEC-023 constructed from the fetched `plant` object. Only render on success state (not loading/404/error states).
    4. **New tests:** ≥ 6 tests — PlantDetailPage shows "Copy link" + revoke when GET /share returns 200; shows "Share" when GET returns 404; ShareRevokeModal renders with correct text; DELETE success → toast + transition; DELETE error → error toast; PublicPlantPage renders OG meta tags when plant data loaded. All existing 287/287 frontend tests pass.
  - **Acceptance Criteria:**
    - PlantDetailPage: loading state, "Copy link" + "Remove share link" (when shared), "Share" (when not shared) — all implemented per SPEC-023
    - ShareRevokeModal: modal text, confirm/cancel buttons, loading, success toast, error toast
    - PublicPlantPage: OG + Twitter meta tags rendered in `<head>` on success state
    - All 287/287 existing frontend tests pass; ≥ 6 new tests
    - T-132 (SPEC-023 Approved) must complete before this task begins
  - **Blocked By:** T-132, T-133 (for response shape; use published API contract)

---

### P2 — Frontend Housekeeping: Vite Dev-Server Vulnerability Fix (T-135)

- [ ] **T-135** — Frontend Engineer: Fix Vite dev-server HIGH severity vulnerability (FB-120) **(P2)**
  - **Description:** Per FB-120: run `npm audit fix` in `frontend/` to patch `vite` (CVE path traversal + WebSocket file read + fs.deny bypass, GHSA-4w7w-66w2-5vf9 / GHSA-v2wj-q39q-566r / GHSA-p9ff-h696-f583). After the upgrade: (1) verify `npm audit` reports 0 high-severity vulnerabilities; (2) verify all 287/287 frontend tests continue to pass (`npm test`); (3) verify `npm run build` succeeds with 0 errors. This is a dev-dependency upgrade only — no production bundle changes expected. Update `package.json` and `package-lock.json`. This task can run in parallel with the T-132 design phase.
  - **Acceptance Criteria:**
    - `cd frontend && npm audit` reports 0 high-severity vulnerabilities (or explicitly documents any that cannot be fixed without breaking changes)
    - All 287/287 frontend tests pass after upgrade
    - `npm run build` succeeds with 0 errors
    - No other dependency changes beyond what `npm audit fix` applies
  - **Blocked By:** None — start immediately, parallel with T-132.

---

### P2 — QA: Sprint #29 Verification (T-136)

- [ ] **T-136** — QA Engineer: Verify T-132, T-133, T-134, T-135 and confirm no regressions **(P2)**
  - **Description:** After T-133 and T-134 are In Review/Done, run the full test suite and perform product-perspective testing:
    - Backend: all tests pass (≥ 215/209); T-133 new tests cover GET status happy path + 404, DELETE happy path + 404, plus auth enforcement
    - Frontend: all tests pass (≥ 293/287); T-134 tests cover share status loading/Copy+Revoke/Share states, revocation modal, OG meta tags
    - SPEC-023 compliance: share status UI states on PlantDetailPage, revocation modal text + behavior, OG meta tag values
    - T-135 housekeeping: `npm audit` reports 0 high severity in frontend; 287+ tests pass; build clean
    - Security checklist: auth enforced on GET + DELETE; ownership check (no IDOR); 204 no-body on DELETE
    - API contract for T-133 endpoints verified
  - **Acceptance Criteria:**
    - Backend ≥ 215/209 tests pass; frontend ≥ 293/287 tests pass
    - Full security checklist pass (auth + ownership on both new endpoints)
    - SPEC-023 compliance verified (share status states, revocation flow, OG tags)
    - T-135 housekeeping verified: 0 high-severity npm vulnerabilities in frontend
    - QA sign-off logged in `qa-build-log.md`
  - **Blocked By:** T-133, T-134, T-135

---

### P2 — Deploy: Staging Re-Deploy (T-137)

- [ ] **T-137** — Deploy Engineer: Staging re-deploy after QA sign-off **(P2)**
  - **Description:** After QA sign-off (T-136), run the standard staging deploy checklist. No new migrations this sprint (T-133 adds endpoints only — no schema changes). Restart backend process, rebuild frontend dist. Verify `/api/health` → 200 and spot-check new endpoints.
  - **Acceptance Criteria:**
    - No new migrations (confirm `knex migrate:latest` returns "Already up to date")
    - Backend process restarted and healthy on port 3000
    - `GET /api/health` → 200
    - `GET /api/v1/plants/:plantId/share` (authenticated, shared plant) → 200 + `{ share_url }` (verifies status endpoint is live)
    - `GET /api/v1/plants/:plantId/share` (authenticated, unshared plant) → 404
    - Staging deploy logged in `qa-build-log.md`
  - **Blocked By:** T-136

---

### P2 — Monitor: Post-Deploy Health Check (T-138)

- [ ] **T-138** — Monitor Agent: Post-deploy health check for Sprint #29 **(P2)**
  - **Description:** Run the standard post-deploy health check after T-137 deploy. Verify all existing endpoints remain healthy. For new endpoints: verify `GET /api/v1/plants/:plantId/share` (with valid auth) returns 200 + `{ share_url }` for a shared plant and 404 for an unshared plant; verify `DELETE /api/v1/plants/:plantId/share` (with valid auth) returns 204 and subsequent GET returns 404. Log **Deploy Verified: Yes/No** in `qa-build-log.md`.
  - **Acceptance Criteria:**
    - `GET /api/health` → 200
    - All existing core endpoints → expected status codes (no regressions)
    - `GET /api/v1/plants/:plantId/share` (shared) → 200 + share_url; (unshared) → 404
    - `DELETE /api/v1/plants/:plantId/share` → 204; subsequent GET → 404
    - Deploy Verified: Yes logged in `qa-build-log.md`
    - If backend process is not running, restart before health check
  - **Blocked By:** T-137

---

## Out of Scope

- Email care reminders / notification delivery — blocked on project owner providing SMTP credentials
- Push notifications — post-MVP (B-002)
- Open Graph image generation (dynamic social cards with plant photo) — future sprint polish
- Share analytics (view count per share token) — future
- Production deployment execution — blocked on project owner providing SSL certs
- Express 5 migration — advisory backlog, no urgency
- Soft-delete / grace period for account deletion — post-MVP
- Dark mode confetti palette (B-007) — cosmetic, low priority backlog
- Real Google OAuth credentials for full end-to-end OAuth staging test — blocked on project owner

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Backend Engineer | Batch mark-done fix + share status/revocation endpoints | T-139 (P1, start immediately), T-133 (P1, after T-132) |
| Design Agent | Share revocation + status + OG meta spec | T-132 (P2, start immediately — gates T-133 and T-134) |
| Frontend Engineer | Vite housekeeping + share status/revoke UI + OG tags | T-135 (P2, start immediately — parallel with T-132 and T-139), T-134 (P1, after T-132 + T-133) |
| QA Engineer | Full regression + batch fix + revocation flow verification | T-136 (P2, after T-139 + T-133 + T-134 + T-135) |
| Deploy Engineer | Staging re-deploy | T-137 (P2, after T-136) |
| Monitor Agent | Post-deploy health check | T-138 (P2, after T-137) |
| Manager | Sprint coordination + code review | Ongoing |

---

## Dependency Chain

```
T-139 (Batch last_done_at fix — Backend, START IMMEDIATELY)
T-132 (SPEC-023 — Design Agent, START IMMEDIATELY)     T-135 (Vite fix — Frontend, START IMMEDIATELY)
  ↓                                                          ↓
T-133 (Share status + revocation API — Backend)        (feeds into T-136)
T-134 (Share status/revoke UI + OG tags — Frontend, parallel with T-133, after T-132)
  ↓
T-136 (QA — after T-139 + T-133 + T-134 + T-135)
  ↓
T-137 (Deploy — after T-136)
  ↓
T-138 (Monitor health check)
```

**Note:** T-139, T-132, and T-135 can all start immediately in parallel. Backend Engineer: prioritize T-139 first (P1, independent), then T-133 after T-132 is approved. Frontend Engineer: prioritize T-135 first (XS), then T-134 after T-132 is approved and T-133's API contract is published.

---

## Definition of Done

Sprint #29 is complete when:

- [ ] T-139: `CareAction.batchCreate()` calls `CareSchedule.updateLastDoneAt()` after batch insert; `GET /api/v1/plants` returns correct status post-batch; ≥ 3 new tests; 209/209 existing backend tests pass
- [ ] T-132: SPEC-023 written and marked Approved in `ui-spec.md`; covers share status states, revocation modal, OG meta tags
- [ ] T-133: `GET /api/v1/plants/:plantId/share` and `DELETE /api/v1/plants/:plantId/share` implemented; ≥ 6 new tests; all existing backend tests pass; API contracts published
- [ ] T-134: PlantDetailPage shows share status (Copy + Revoke when shared; Share when not); ShareRevokeModal implemented; OG meta tags on PublicPlantPage; ≥ 6 new tests; all existing frontend tests pass
- [ ] T-135: `cd frontend && npm audit` reports 0 high-severity vulnerabilities; all frontend tests pass; `npm run build` succeeds
- [ ] T-136: QA sign-off — all backend and frontend tests pass; batch fix verified; SPEC-023 compliance; security checklist pass; T-135 housekeeping verified
- [ ] T-137: Backend restarted, frontend rebuilt; all new endpoints live
- [ ] T-138: Deploy Verified: Yes from Monitor Agent

---

## Success Criteria

- Batch mark-done on the Care Due Dashboard updates `care_schedules.last_done_at` — My Plants no longer shows plants as overdue after batch-marking them done
- Users can see at a glance whether their plant is already shared (PlantDetailPage shows "Copy link" + "Remove share link" vs original "Share" button)
- Users can revoke a share link — after revocation, the old URL returns 404 to anyone who had it
- Shared plant links render richly in social/messaging apps (OG title, description, image)
- `npm audit` reports 0 high-severity vulnerabilities in both frontend and backend
- Deploy Verified: Yes

---

## Blockers

- T-133 and T-134 are both blocked on T-132 (SPEC-023) — Design Agent must complete the spec before engineers start
- T-136 is blocked on T-139, T-133, T-134, and T-135 all being complete
- Production deployment remains blocked on project owner providing SSL certificates
- Production email delivery blocked on project owner providing SMTP credentials
- **Infrastructure note:** Local staging backend process may terminate between Deploy and Monitor phases — Monitor Agent must restart it if connection refused before running health checks
