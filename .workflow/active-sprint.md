# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #25 — 2026-05-17 to 2026-05-23

**Sprint Goal:** Deliver the **AI Plant Advisor** — the last major MVP feature. Integrate the Gemini API so users can identify an unknown plant (by photo or name) and receive personalized care schedule recommendations that auto-populate the Add/Edit Plant form. This closes the core product loop described in the project brief and empowers the "plant killer" persona to get the right schedules without guessing. Concurrently, land a **quick .env cleanup** (FB-107/T-115) to eliminate developer confusion around stale rate-limit variable names.

**Context:** Sprint #24 delivered batch mark-done and rate limiting — eleven consecutive clean sprints. The AI Plant Advisor is the last unimplemented core MVP feature (project brief Flow 2 and Flow 3). Users can currently add plants manually, but the "get AI advice" button and Gemini-powered care recommendation flow are missing. This sprint closes that gap. The Gemini integration requires a new backend endpoint, a new API contract, and frontend integration on the Add/Edit Plant pages. The .env cleanup (T-115) is a trivial P3 task that can be done in parallel with any backend work.

---

## In Scope

### P1 — AI Plant Advisor (Gemini Integration)

- [ ] **T-112** — Design Agent: Write SPEC-020 — AI Plant Advisor UX spec **(P1)**
  - **Description:** Design the full AI Plant Advisor flow end-to-end for the Add Plant and Edit Plant pages. Cover: (1) **Entry point** — a "Get AI Advice" button on the Add/Edit Plant form (below the plant type field); (2) **Input modal/panel** — when the button is clicked, a modal or slide-in panel appears with two input options: (a) image upload (drag-and-drop + click-to-browse, shows preview thumbnail, accept: image/*); (b) text input ("Type your plant name or species, e.g. 'spider plant'"); either input is sufficient — both are optional but at least one must be provided before "Analyze" is enabled; (3) **Loading state** — "Analyzing your plant…" with a spinner; "Analyze" button disabled during request; (4) **AI response card** — displays: plant species/name identified (bold, prominent), confidence note (e.g. "Based on your description"), and a structured care summary: watering frequency, fertilizing frequency, repotting frequency, sunlight needs, humidity preference, and any notable care tips (free text, max 2–3 sentences); (5) **Accept flow** — "Use these recommendations" button autofills form fields: plant type (if empty), watering interval (days), fertilizing interval (days, if field exists), repotting interval (days, if field exists); panel/modal closes; form fields visually highlight briefly to confirm autofill; (6) **Reject/Dismiss** — "No thanks" button or × closes the panel without any changes; (7) **Error state** — if Gemini API fails or key is unconfigured: "Couldn't get AI advice right now. You can still fill in the form manually." with a "Try again" button and "Fill in manually" dismiss; (8) **Re-analyze** — after seeing a response, user can modify input and click "Re-analyze" to get a new result; (9) **Dark mode** — all new elements use CSS custom properties; (10) **Accessibility** — modal has `role="dialog"`, `aria-labelledby`, `aria-describedby`, focus trap, Escape key dismissal; file input has `aria-label`; loading state uses `aria-live="polite"`; accept/reject buttons have descriptive `aria-label`.
  - **Acceptance Criteria:**
    - SPEC-020 written to `.workflow/ui-spec.md` (appended as new section)
    - Covers entry point button, input modal, image upload + text input flows
    - Covers loading, AI response card, accept (autofill), reject, error, re-analyze states
    - Covers dark mode and full accessibility spec (role="dialog", focus trap, Escape key, aria-live)
    - Clear notes on which form fields are autofilled and how
  - **Dependencies:** None — start immediately.
  - **Fix locations:** `.workflow/ui-spec.md`

---

- [ ] **T-113** — Backend Engineer: Gemini API integration endpoint **(P1)**
  - **Description:** Implement `POST /api/v1/plants/ai-advice` (auth required). The endpoint accepts a JSON body `{ "plant_type": <string|null>, "image_base64": <string|null> }` — at least one of `plant_type` or `image_base64` must be provided (return `400` if both are absent). Behavior: (1) Validates input — `plant_type` max 200 chars; `image_base64` max 5 MB decoded (return `400 REQUEST_TOO_LARGE` if exceeded); (2) Constructs a Gemini API prompt requesting structured plant identification and care schedule advice; sends to Gemini via `@google/generative-ai` SDK using `GEMINI_API_KEY` env var; (3) Parses Gemini response into a structured object: `{ "species": <string>, "confidence_note": <string|null>, "care": { "watering_interval_days": <int>, "fertilizing_interval_days": <int|null>, "repotting_interval_days": <int|null>, "sunlight": <string>, "humidity": <string|null>, "tips": <string|null> } }`; (4) Returns `200` with `{ "data": { <structured_object> } }`; (5) Returns `400` for missing input, oversized image, or unparseable Gemini response; (6) Returns `401` for unauthenticated requests; (7) Returns `503 SERVICE_UNAVAILABLE` if `GEMINI_API_KEY` is not configured — with `{ "error": { "message": "AI advice is not available. Please fill in the form manually.", "code": "AI_SERVICE_UNAVAILABLE" } }` — graceful degradation, no 500; (8) Returns `502 BAD_GATEWAY` if the Gemini API call fails (network error, quota exceeded, etc.) — same structured error format; (9) Apply per-user rate limiting: 10 requests per minute per user ID (not IP — use JWT `user_id`); return `429` with structured error if exceeded. Publish updated API contract to `.workflow/api-contracts.md` before T-114 begins.
  - **Acceptance Criteria:**
    - `POST /api/v1/plants/ai-advice` implemented and registered in `app.js`
    - Validates at least one of `plant_type` / `image_base64` present; rejects oversized images (>5 MB)
    - Calls Gemini API via `@google/generative-ai` SDK; returns structured care object on success
    - Graceful degradation when `GEMINI_API_KEY` not configured → 503 (not 500)
    - 502 for Gemini API failures; 429 for per-user rate limit exceeded; 401 for unauthenticated
    - Unit tests: happy path (plant_type only → 200), happy path (image_base64 → 200), missing both inputs → 400, oversized image → 400, no auth → 401, GEMINI_API_KEY absent → 503, Gemini API failure → 502; minimum 7 new tests (mock Gemini calls in tests — do not make live API calls)
    - All 183/183 backend tests still pass; add minimum 7 new tests
    - Updated API contract published to `.workflow/api-contracts.md` before T-114 begins
  - **Blocked By:** None — start immediately. Publish updated contract before T-114 begins.
  - **Fix locations:** `backend/src/routes/plants.js` (add POST /ai-advice handler), `backend/src/services/GeminiService.js` (new), `.workflow/api-contracts.md`

---

- [ ] **T-114** — Frontend Engineer: AI Plant Advisor UI on Add/Edit Plant pages **(P1)**
  - **Description:** Implement the AI Plant Advisor flow on the Add Plant and Edit Plant pages per SPEC-020. (1) Add a "Get AI Advice" button on the form below the plant type/name field; (2) Clicking the button opens an `AiAdviceModal.jsx` component (`role="dialog"`, `aria-labelledby`, focus trap, Escape key); (3) Modal contains: image upload input (`<input type="file" accept="image/*">` with drag-and-drop zone and thumbnail preview) AND/OR a text input for plant name/type; "Analyze" button is disabled until at least one input is provided; (4) On submit: call `POST /api/v1/plants/ai-advice` with `{ plant_type, image_base64 }` (convert image file to base64 before sending); show loading state ("Analyzing your plant…" + spinner, `aria-live="polite"`); (5) On success (200): display AI response card inside modal — species name (bold), confidence note, care summary table (watering, fertilizing, repotting intervals, sunlight, humidity, tips); show "Use these recommendations" and "No thanks" buttons; (6) On "Use these recommendations": autofill form fields (plant type if empty, watering interval days, fertilizing interval days if field exists, repotting interval days if field exists); briefly highlight autofilled fields with a CSS transition; close modal; (7) On "No thanks" or Escape: close modal with no changes; (8) On error (503/502): show error message "Couldn't get AI advice right now. You can still fill in the form manually." with "Try again" and "Fill in manually" buttons; (9) "Re-analyze" button visible after a response is shown — clears response and returns to input state; (10) Dark mode via CSS custom properties; (11) Accessibility: focus trap in modal, Escape key, `aria-label` on file input, `aria-live="polite"` on loading/error states.
  - **Acceptance Criteria:**
    - "Get AI Advice" button visible on Add Plant and Edit Plant pages
    - `AiAdviceModal.jsx` opens on button click; closes on "No thanks", Escape, or "Fill in manually"
    - Image upload with preview OR text input — "Analyze" disabled until at least one provided
    - API call uses `POST /api/v1/plants/ai-advice` with correct request shape; image converted to base64
    - Loading state shown during API call; response card shown on success
    - "Use these recommendations" autofills form fields; autofill visually confirmed
    - Error state (503/502) shown with "Try again" + "Fill in manually"
    - "Re-analyze" returns to input state
    - Dark mode: all new elements use CSS custom properties
    - Accessibility: `role="dialog"`, `aria-labelledby`, focus trap, Escape key, `aria-live="polite"`, `aria-label` on file input
    - Unit tests: modal opens/closes, "Analyze" disabled with no input, enabled with input, loading state, success response displays, autofill on accept, no changes on reject, error state shown on 503, re-analyze resets to input state; minimum 9 new tests
    - All frontend tests still pass; add minimum 9 new tests
  - **Blocked By:** T-112 (SPEC-020 must exist), T-113 (updated API contract must be published)
  - **Fix locations:** `frontend/src/components/AiAdviceModal.jsx` (new), `frontend/src/pages/AddPlantPage.jsx`, `frontend/src/pages/EditPlantPage.jsx`, `frontend/src/utils/api.js` (add `plants.aiAdvice()`), `frontend/src/pages/AddPlantPage.css` / `EditPlantPage.css`

---

### P3 — Environment Variable Cleanup

- [ ] **T-115** — Backend Engineer: Clean up `backend/.env` stale rate-limit variable names (FB-107) **(P3)**
  - **Description:** The `backend/.env` file contains legacy rate-limit env var names (`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX`) from a prior sprint. T-111's `rateLimiter.js` uses different names (`RATE_LIMIT_AUTH_MAX`, `RATE_LIMIT_AUTH_WINDOW_MS`, `RATE_LIMIT_STATS_MAX`, `RATE_LIMIT_STATS_WINDOW_MS`, `RATE_LIMIT_GLOBAL_MAX`, `RATE_LIMIT_GLOBAL_WINDOW_MS`). Update `backend/.env` to remove the stale names and add the correct T-111 names with their default values, matching `backend/.env.example`. No code changes — `.env` cleanup only.
  - **Acceptance Criteria:**
    - `backend/.env` rate-limit section uses T-111 variable names matching `.env.example`
    - Stale legacy names (`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX`) removed
    - All 183/183 backend tests still pass (no behavioral change)
    - FB-107 resolved
  - **Blocked By:** None — can be done immediately, in parallel with T-113.
  - **Fix locations:** `backend/.env`

---

## Out of Scope

- Push notifications (browser or mobile) — requires service worker / APNs infrastructure — post-sprint
- Social auth (Google OAuth) — B-001 — post-sprint
- Plant sharing / public profiles — B-003 — post-sprint
- Production deployment execution — blocked on project owner providing SSL certs
- Unsubscribe error CTA contextual differentiation (FB-104) — cosmetic, backlog
- Express 5 migration — advisory backlog
- Soft-delete / grace period for account deletion — post-MVP
- Plant photo gallery / multiple photo management — separate from AI image upload (this sprint covers AI analysis only, not persistent gallery)
- Saving AI response as a permanent plant "fact sheet" — out of scope; AI advice autofills form, no separate storage

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Design Agent | AI Plant Advisor UX spec | T-112 (P1, start immediately) |
| Backend Engineer | Gemini API endpoint + .env cleanup | T-113 (P1, start immediately, publish contract before T-114), T-115 (P3, parallel with T-113) |
| Frontend Engineer | AI Plant Advisor UI on Add/Edit Plant pages | T-114 (P1, after T-112 spec + T-113 contract) |
| QA Engineer | Full QA of T-112–T-115, security checklist (API key handling, base64 validation) | After all tasks complete |
| Deploy Engineer | Staging re-deploy after QA sign-off | After all tasks QA-verified |
| Monitor Agent | Post-deploy health check — verify POST /plants/ai-advice + graceful 503 degradation on staging (restart backend if process terminated) | After Deploy Engineer re-deploy |
| Manager | Sprint coordination, API contract review, code review | Ongoing |

---

## Dependency Chain (Critical Path)

```
T-112 (SPEC-020 — Design Agent, START IMMEDIATELY)
  ↓ (spec complete)

T-113 (Gemini endpoint — Backend Engineer, START IMMEDIATELY — publish contract before T-114)
  ↓ (publish updated API contract)

T-114 (AI Advisor UI — Frontend Engineer, after T-112 spec + T-113 contract)
  ↓
T-115 (ENV cleanup — Backend Engineer, START IMMEDIATELY — parallel with T-113)
  ↓
QA verifies T-112 + T-113 + T-114 + T-115 end-to-end

[After all tasks QA-verified]
Deploy Engineer re-deploys to staging
  ↓
Monitor Agent health check — verify POST /plants/ai-advice (mock key) + 503 graceful degradation
```

**Critical path:** T-112 + T-113 (parallel start) → T-114 → QA → Deploy → Monitor → staging verified.
**Note:** T-115 has no blockers and can run in parallel with T-112/T-113. Monitor Agent: if backend process is not running at health check time, restart it before checking endpoints.

---

## Definition of Done

Sprint #25 is complete when:

- [ ] T-112: SPEC-020 written — covers entry point, input modal (image upload + text input), loading, AI response card, accept (autofill), reject, error, re-analyze states, dark mode, accessibility
- [ ] T-113: `POST /api/v1/plants/ai-advice` endpoint returns 200 with structured care object; 503 when GEMINI_API_KEY absent; 502 on Gemini failure; 429 on per-user rate limit; 401 unauthenticated; 400 for invalid input; 7+ new tests; all backend tests pass; API contract published
- [ ] T-114: "Get AI Advice" button on Add/Edit Plant pages; `AiAdviceModal.jsx` with image upload + text input + autofill + error + re-analyze flows implemented; 9+ new tests; all frontend tests pass
- [ ] T-115: `backend/.env` updated to use T-111 variable names; all 183/183 backend tests still pass
- [ ] Deploy Verified: Yes from Monitor Agent post-deploy health check
- [ ] No regressions: backend ≥ 190/190 (estimated: 183 + 7 T-113), frontend ≥ 268/268 (estimated: 259 + 9 T-114)

---

## Success Criteria

- **AI Plant Advisor works end-to-end** — A user adds a new plant, clicks "Get AI Advice", types "spider plant", clicks "Analyze", sees care recommendations, and clicks "Use these recommendations" — the form autofills with the correct watering/fertilizing/repotting intervals
- **Image-based identification works** — A user uploads a photo of an unknown plant and receives a species identification plus care schedule
- **Graceful degradation** — If `GEMINI_API_KEY` is not configured (staging without key), the endpoint returns 503 with a user-friendly message; the frontend shows "Couldn't get AI advice right now. You can still fill in the form manually." — no 500s, no broken UI
- **Per-user rate limiting** — Excessive AI advice requests from a single user (>10/min) are throttled with 429; normal usage is never affected
- **Test suite grows** — Backend adds minimum 7 new tests (T-113); frontend adds minimum 9 new tests (T-114); no regressions
- **MVP feature complete** — The AI Plant Advisor closes the last major feature gap in the project brief, completing the core product vision

---

## Blockers

- T-114 is blocked until: (1) Design Agent publishes SPEC-020; (2) Backend Engineer publishes updated API contract for `POST /api/v1/plants/ai-advice`
- T-112, T-113, T-115 have no blockers — all can start immediately
- `GEMINI_API_KEY` must be provisioned by project owner for live AI responses (staging/production); T-113 must implement graceful 503 degradation for environments without the key — tests must mock Gemini calls, not require a live key
- Production deployment remains blocked on project owner providing SSL certificates
- Production email delivery blocked on project owner providing SMTP credentials
- **Infrastructure note:** Local staging backend process may terminate between Deploy and Monitor phases — Monitor Agent must restart it if connection refused

---

*Sprint #25 plan written by Manager Agent on 2026-04-06.*
