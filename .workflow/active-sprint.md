# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #17 — 2026-04-01 to 2026-04-07

**Sprint Goal:** Deliver the AI Recommendations feature — the last major unbuilt MVP capability. Users will be able to ask for Gemini-powered care advice by entering a plant type name OR uploading a photo, then accept AI suggestions to auto-populate the Add/Edit Plant form. This makes Plant Guardians a true hands-holding companion for novice plant owners.

**Context:** Sprint #16 delivered a flawless clean sprint (third consecutive) — Delete Account, stats rate limiting, analytics CSS polish, warmer copy, flaky test fix, and plant name validation all shipped. Backend sits at 100/100 tests, frontend at 148/148. Deploy Verified: Yes at SHA 0eeac26. Sprint 17 now turns to the AI Recommendations feature (B-005 / project brief Flows 2 & 3) — the largest remaining MVP feature. This sprint will integrate the Gemini API for both text-based and image-based plant identification, and wire up the frontend accept/reject flow on the Add/Edit Plant page.

---

## In Scope

### P1 — AI Recommendations Feature (MVP Core)

- [ ] **T-076** — Design Agent: Write SPEC-012 — AI Recommendations UX **(P1)**
  - **Description:** Create a detailed UI spec for the AI Recommendations flows on the Add/Edit Plant page. Cover: (1) text-based advice — user enters a plant type name and taps "Get AI Advice," a panel/modal shows identification + care recommendations; (2) image-based advice — user uploads a photo, Gemini Vision identifies the plant and returns care advice; (3) accept/reject — "Accept" auto-populates the form fields, "Reject" closes without changes.
  - **Acceptance Criteria:**
    - SPEC-012 written to `.workflow/ui-spec.md` (or appended as a new section)
    - Covers both advice flows: text input and image upload
    - Describes the advice panel/modal: sections for plant identification, watering cadence, fertilizing cadence, repotting cadence, and free-text care tips
    - Describes accept/reject CTA behavior and form field mapping
    - Describes loading states, error states (Gemini unavailable, unrecognized plant), and empty / no-photo states
    - Describes how image upload fits into the existing Add Plant page layout
    - Dark mode and accessibility notes included
  - **Dependencies:** None — start immediately.
  - **Fix locations:** `.workflow/ui-spec.md`

---

- [ ] **T-077** — Backend Engineer: Gemini API service + `POST /api/v1/ai/advice` endpoint (text-based) **(P1)**
  - **Description:** Integrate the Gemini API to accept a plant type name and return structured care recommendations. Create a reusable `GeminiService` and expose `POST /api/v1/ai/advice`. The response must map directly to the plant form fields so the frontend can auto-populate them.
  - **Acceptance Criteria:**
    - Endpoint: `POST /api/v1/ai/advice` (authenticated)
    - Request body: `{ "plant_type": "string" }` (required, max 200 chars)
    - Response (200): structured JSON:
      ```json
      {
        "data": {
          "identified_plant": "String — matched/normalized plant name",
          "confidence": "high | medium | low",
          "care": {
            "watering_interval_days": number,
            "fertilizing_interval_days": number | null,
            "repotting_interval_days": number | null,
            "light_requirement": "string",
            "humidity_preference": "string",
            "care_tips": "string (free text, 1-3 sentences)"
          }
        }
      }
      ```
    - On missing/invalid `plant_type`: returns `400 VALIDATION_ERROR`
    - On Gemini API error / unrecognized plant: returns `502 EXTERNAL_SERVICE_ERROR` with message "AI advice is temporarily unavailable. Please try again."
    - On missing auth: `401 UNAUTHORIZED`
    - Gemini API key read from `GEMINI_API_KEY` env variable; never hardcoded
    - Rate limit: reuse general rate limiter (100 req/15min); no endpoint-specific limit needed
    - Unit tests: happy path (structured response), invalid body (400), Gemini error mocked (502), missing auth (401)
    - All 100/100 backend tests still pass; add minimum 4 new tests
    - API contract published to `.workflow/api-contracts.md` before Frontend Engineer begins T-079
  - **Dependencies:** None — start immediately. Publish API contract before T-079 begins.
  - **Fix locations:** `backend/src/services/GeminiService.js` (new), `backend/src/routes/ai.js` (new route file), `backend/src/server.js` (mount route)

---

- [ ] **T-078** — Backend Engineer: `POST /api/v1/ai/identify` endpoint (image-based) **(P1)**
  - **Description:** Expose a second Gemini endpoint that accepts a plant photo (base64 or multipart) and returns the same structured care advice shape as T-077. Uses Gemini Vision (multimodal) to identify the plant from the image.
  - **Acceptance Criteria:**
    - Endpoint: `POST /api/v1/ai/identify` (authenticated)
    - Request: `multipart/form-data` with a single `image` field (JPEG/PNG/WebP, max 5MB)
    - Response (200): same JSON shape as `POST /api/v1/ai/advice` — `identified_plant`, `confidence`, `care` object
    - On missing image: `400 VALIDATION_ERROR` with message "An image is required."
    - On unsupported MIME type: `400 VALIDATION_ERROR` with message "Image must be JPEG, PNG, or WebP."
    - On image > 5MB: `400 VALIDATION_ERROR` with message "Image must be 5MB or smaller."
    - On Gemini API error / unrecognized plant in image: `502 EXTERNAL_SERVICE_ERROR`
    - On missing auth: `401 UNAUTHORIZED`
    - Image is NOT persisted — only passed to Gemini transiently; no file system or database writes for the image itself
    - Uses `multer` (or similar) for multipart parsing; memory storage (no disk writes)
    - Unit tests: happy path (image → structured response), missing image (400), bad MIME (400), too large (400), Gemini error mocked (502), missing auth (401)
    - All 100/100 backend tests still pass; add minimum 6 new tests
    - API contract published to `.workflow/api-contracts.md` before Frontend Engineer begins T-080
  - **Dependencies:** T-077 (`GeminiService.js` reused) — T-078 can begin as soon as T-077's `GeminiService` is scaffolded (does not need T-077's API contract).
  - **Fix locations:** `backend/src/services/GeminiService.js` (extend for vision), `backend/src/routes/ai.js` (add second route)

---

- [ ] **T-079** — Frontend Engineer: "Get AI Advice" text-based flow on Add/Edit Plant page **(P1)**
  - **Description:** On the Add Plant page (and Edit Plant page), add a "Get AI Advice" button. When clicked, a prompt input allows the user to type a plant type (e.g., "spider plant"). On submit, the app calls `POST /api/v1/ai/advice`, shows a structured advice panel with the AI response, and offers "Accept Advice" and "Dismiss" actions. Accepting auto-populates the form fields.
  - **Acceptance Criteria:**
    - "Get AI Advice" button visible on Add Plant form and Edit Plant form
    - Clicking the button opens an AI advice panel (modal or inline drawer per SPEC-012)
    - Panel has a text input for plant type, a "Get Advice" submit button, and a loading spinner while the request is in-flight
    - On success: displays identified plant name, confidence badge, and structured care info (watering, fertilizing, repotting intervals, light, humidity, care tips)
    - "Accept Advice" button: maps AI response fields to form inputs — `watering_interval_days` → watering schedule field, `fertilizing_interval_days` → fertilizing field (if present), `repotting_interval_days` → repotting field (if present); closes panel
    - "Dismiss" button: closes panel; no form changes
    - On 502 error: shows inline error "AI advice is temporarily unavailable. Please try again."
    - On 400 validation error: shows inline "Please enter a plant name."
    - Loading state: submit button disabled + spinner; input disabled
    - Dark mode: all panel elements use CSS custom properties
    - Accessibility: focus trap in panel/modal, `aria-live` for loading/error states
    - Unit tests: button opens panel, text submit calls correct endpoint, accept populates form fields, dismiss closes without changes, error states render correctly, loading disables button
    - All 148/148 frontend tests still pass; add minimum 6 new tests
  - **Blocked By:** T-076 (SPEC-012 must exist), T-077 (API contract must be published)
  - **Fix locations:** `frontend/src/pages/AddPlantPage.jsx` (or `EditPlantPage.jsx`), new `AIAdvicePanel.jsx` component

---

- [ ] **T-080** — Frontend Engineer: Image upload + plant identification flow on Add/Edit Plant page **(P1)**
  - **Description:** Extend the AI advice panel (from T-079) with an image upload path. User can choose to upload a photo instead of typing a plant name. The app calls `POST /api/v1/ai/identify`, shows the same advice panel with results, and the same accept/reject flow applies.
  - **Acceptance Criteria:**
    - AI advice panel (from T-079) shows two modes: "Enter plant name" (tab/toggle) and "Upload a photo" (tab/toggle) per SPEC-012
    - Upload mode: file picker input accepting JPEG/PNG/WebP; shows image preview thumbnail after selection
    - "Get Advice" in upload mode: sends `multipart/form-data` to `POST /api/v1/ai/identify`
    - Success, accept, dismiss, and error states behave identically to T-079 text flow
    - On file too large (client-side check): inline error "Image must be 5MB or smaller." (before API call)
    - On wrong file type (client-side check): inline error "Please upload a JPEG, PNG, or WebP image."
    - Loading state: upload button disabled + spinner
    - Dark mode: all upload elements use CSS custom properties
    - Accessibility: file input has visible label; error states use `aria-live`
    - Unit tests: file selection shows preview, wrong type shows inline error, too large shows inline error, successful upload calls identify endpoint, accept populates form, dismiss does not
    - All 148/148 frontend tests still pass; add minimum 6 new tests
  - **Blocked By:** T-076 (SPEC-012), T-078 (API contract for identify endpoint), T-079 (AIAdvicePanel must exist to extend)
  - **Fix locations:** `frontend/src/components/AIAdvicePanel.jsx` (extend), `frontend/src/pages/AddPlantPage.jsx`

---

## Out of Scope

- Soft delete / grace period for account deletion (FB-077) — backlog; current hard delete is correct per spec
- Social auth (Google OAuth) — B-001 — post-sprint
- Push notifications for care reminders — B-002 — post-sprint
- Plant sharing / public profiles — B-003 — post-sprint
- Production deployment execution — blocked on project owner providing SSL certs
- Express 5 migration — advisory backlog; no breaking-change-safe path yet
- Care streak / gamification features — post-sprint
- CORS `FRONTEND_URL` port advisory (4176 absent) — non-blocking; no action required this sprint
- T-020 user testing session — **Done (2026-04-01).** Project owner completed browser testing session. All flows validated. Not a blocker.

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Design Agent | AI Recommendations UX spec | T-076 (P1, start immediately) |
| Backend Engineer | Gemini API service + two AI endpoints | T-077 (P1), T-078 (P1) |
| Frontend Engineer | AI advice panel — text + image flows | T-079 (P1, after T-076 spec + T-077 contract), T-080 (P1, after T-078 contract + T-079) |
| QA Engineer | Full QA of AI Recommendations feature end-to-end, security checklist | After T-079 + T-080 complete |
| Deploy Engineer | Staging re-deploy after QA sign-off | After all tasks QA-verified |
| Monitor Agent | Post-deploy health check — verify `/api/v1/ai/advice` + `/api/v1/ai/identify` endpoints | After Deploy Engineer re-deploy |
| Manager | Sprint coordination, API contract review/approval, code review | Ongoing |

---

## Dependency Chain (Critical Path)

```
T-076 (SPEC-012 — Design Agent, START IMMEDIATELY)
  ↓ (spec complete → Frontend can begin T-079 UI layout)

T-077 (POST /ai/advice — Backend, START IMMEDIATELY)
  ↓ (publish API contract to api-contracts.md)
T-079 (AI advice text flow — Frontend, after T-076 spec + T-077 contract)
  ↓
T-080 (Image upload flow — Frontend, after T-078 contract + T-079 panel exists)
  ↓
QA verifies T-077 + T-078 + T-079 + T-080 end-to-end

[Parallel — Backend]
T-078 (POST /ai/identify — Backend, after T-077 GeminiService scaffolded)
  ↓ (publish API contract to api-contracts.md)
→ unblocks T-080 frontend image flow

[After all tasks QA-verified]
Deploy Engineer re-deploys to staging
  ↓
Monitor Agent health check — verify /ai/advice + /ai/identify endpoints
```

**Critical path:** T-076 + T-077 (parallel start) → T-079 → T-078 → T-080 → QA → Deploy → Monitor → staging verified.

---

## Definition of Done

Sprint #17 is complete when:

- [ ] T-076: SPEC-012 written and covers both advice flows (text + image), accept/reject behavior, loading/error states, dark mode notes
- [ ] T-077: `POST /api/v1/ai/advice` implemented; API contract published; 4+ new tests; all 100/100 backend tests pass
- [ ] T-078: `POST /api/v1/ai/identify` implemented; API contract published; 6+ new tests; all 100/100 backend tests pass
- [ ] T-079: AI advice text flow functional; accept auto-populates form; dismiss closes without changes; 6+ new tests; all 148/148 frontend tests pass
- [ ] T-080: Image upload flow functional; client-side validations work; accept auto-populates form; 6+ new tests; all 148/148 frontend tests pass
- [ ] Deploy Verified: Yes from Monitor Agent post-deploy health check
- [ ] No regressions: backend ≥ 100/100, frontend ≥ 148/148
- [ ] GEMINI_API_KEY is read from environment and never hardcoded in any source file
- [ ] Images are NOT persisted server-side (only passed transiently to Gemini)

---

## Success Criteria

- **AI advice by name works** — User types "peace lily," gets structured watering/fertilizing/repotting/tips response, accepts to auto-populate form
- **AI advice by photo works** — User uploads a plant photo, Gemini Vision identifies it, returns same structured advice, user can accept to populate form
- **Graceful degradation** — Gemini errors (502) show friendly message; malformed input (400) shows inline validation; the app never crashes on AI failure
- **Security** — GEMINI_API_KEY never exposed in source; images never persisted; endpoints require authentication
- **Test suite grows** — Backend adds minimum 10 new tests; frontend adds minimum 12 new tests; no regressions
- **Zero new vulnerabilities** — npm audit remains at 0 vulnerabilities

---

## Blockers

- T-079 (text advice UI) is blocked until: (1) Design Agent publishes SPEC-012; (2) Backend Engineer publishes `POST /ai/advice` API contract
- T-080 (image upload UI) is blocked until: (1) T-076 spec complete; (2) T-078 API contract published; (3) T-079 `AIAdvicePanel` component exists
- T-078 can start as soon as T-077's `GeminiService.js` is scaffolded (does not need the full T-077 contract)
- All other Sprint #17 tasks have no blockers — T-076 and T-077 start immediately

---

*Sprint #17 plan written by Manager Agent on 2026-04-01.*
