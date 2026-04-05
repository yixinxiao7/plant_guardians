# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #22 — 2026-04-26 to 2026-05-02

**Sprint Goal:** Close the most critical engagement loop for the "plant killer" persona — **Care Reminder Email Notifications**. When a plant's care is due or overdue, opted-in users receive an email reminder so they never silently miss a care event. Add notification preferences (opt-in toggle + reminder timing) to the Profile page so users own their notification experience from day one.

**Context:** Sprint #21 delivered the Care Notes write path and resolved the three SPEC-015 cosmetic deviations — eighth consecutive clean sprint. Backend is at 149/149 tests, frontend at 227/227. Deploy Verified: Yes at SHA d8a7b17. The app's core tracking loop (add plant → get due reminders → mark done → see history + streak → add notes) is now feature-complete. Sprint #22 adds the proactive outbound engagement layer: email reminders that meet the user where they are, outside the app, reinforcing the care habit the product is designed to build.

---

## In Scope

### P1 — Email Notification Infrastructure

- [ ] **T-100** — Design Agent: Write SPEC-017 — Care Reminder Email Notifications UX spec **(P1)**
  - **Description:** Design the care reminder email feature end-to-end. Cover: (1) **Notification preferences UI** — a new "Reminders" section at the bottom of the Profile page, with an opt-in toggle ("Get email reminders when care is due") and a reminder timing selector (three options: Morning ~8 AM, Midday ~12 PM, Evening ~6 PM — stored as UTC hour integers in the backend); (2) **Preference save flow** — changes auto-save or save on explicit button press; success toast on save; (3) **Email template layout** — warm, minimal botanical aesthetic (consistent with app brand); header with app logo/name; body listing the plants with care due/overdue (care type icon, plant name, days overdue or "due today"); single CTA button "Open Plant Guardians"; footer with unsubscribe link; (4) **Unsubscribe / opt-out** — one-click unsubscribe from email footer sets opt_in=false; confirmation page or toast; (5) **Empty-state handling** — if no care is due on a given day, no email is sent (do not send "all clear" emails); (6) **Dark mode** — preferences UI uses CSS custom properties; (7) **Accessibility** — `aria-label` on toggle, `role="switch"` for toggle, `aria-label` on timing selector.
  - **Acceptance Criteria:**
    - SPEC-017 written to `.workflow/ui-spec.md` (appended as new section)
    - Covers preference UI (toggle + timing selector on Profile page)
    - Covers preference save flow and success feedback
    - Covers email template layout (plant list, care types, CTA, unsubscribe link)
    - Covers unsubscribe / opt-out flow
    - Covers empty-state (no email if nothing due)
    - Dark mode and accessibility notes included
  - **Dependencies:** None — start immediately.
  - **Fix locations:** `.workflow/ui-spec.md`

---

- [ ] **T-101** — Backend Engineer: Email notification service + daily care-reminder cron job + notification preferences API **(P1)**
  - **Description:** Three deliverables: (1) **Database migration** — add `notification_preferences` table: `user_id` (FK → users.id, unique), `opt_in` (boolean, default false), `reminder_hour_utc` (integer 0–23, default 8). (2) **API endpoints** — `GET /api/v1/profile/notification-preferences` (returns current preferences, creates default row if not exists) and `POST /api/v1/profile/notification-preferences` (updates opt_in and/or reminder_hour_utc; validates reminder_hour_utc is integer 0–23; returns updated preferences). Both endpoints require auth. (3) **Email service + cron job** — integrate Nodemailer (SMTP via env vars: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`). Create a daily cron job (or manual-trigger endpoint for testing: `POST /api/v1/admin/trigger-reminders` — auth-protected, dev only) that: queries all users with opt_in=true whose `reminder_hour_utc` matches the current UTC hour; for each such user, queries their plants with care due today or overdue; if any plants have due/overdue care, sends a reminder email listing the plants and care types; if no care is due, skips (no email). Publish the updated API contract to `.workflow/api-contracts.md` before T-102 begins.
  - **Acceptance Criteria:**
    - `notification_preferences` migration runs cleanly; table has correct columns and FK
    - `GET /api/v1/profile/notification-preferences` returns `{opt_in, reminder_hour_utc}`; creates default row on first call
    - `POST /api/v1/profile/notification-preferences` updates preferences; validates `reminder_hour_utc` (0–23 integer); returns updated object
    - Both endpoints return 401 for unauthenticated requests
    - Nodemailer integration works with SMTP env vars; EMAIL env vars are optional (service degrades gracefully if not set — logs a warning but does not crash)
    - Daily job (or trigger endpoint) correctly identifies due/overdue plants per opted-in user and sends emails
    - No email sent if no care is due for a user
    - Unit tests: GET preferences (new user → defaults), POST preferences (valid update, invalid hour → 400, auth guard), email send with mocked transporter, cron job skips users with opt_in=false; minimum 6 new tests
    - All 149/149 backend tests still pass; add minimum 6 new tests
    - Updated API contract published to `.workflow/api-contracts.md` before T-102 begins
  - **Blocked By:** None — start immediately. Publish updated contract before T-102 begins.
  - **Fix locations:** `backend/src/routes/notificationPreferences.js` (new), `backend/src/services/emailService.js` (new), `backend/src/jobs/careReminderJob.js` (new), `backend/migrations/` (new migration), `backend/src/app.js` (register routes + cron)

---

- [ ] **T-102** — Frontend Engineer: Notification preferences UI on Profile page **(P1)**
  - **Description:** Add a "Reminders" section to the Profile page below the existing stats section (per SPEC-017). The section contains: (1) A toggle (`role="switch"`, `aria-label="Email reminders"`) labelled "Get email reminders when care is due" — defaults to off until user opts in; (2) When toggled on, a timing selector appears (three radio buttons or a select: "Morning (8 AM)", "Midday (12 PM)", "Evening (6 PM)") — maps to UTC hours 8, 12, 18; (3) A save button ("Save reminder settings") or auto-save on change — show a success toast on successful save; show inline error if the API call fails; (4) On page load, fetch current preferences from `GET /api/v1/profile/notification-preferences` and pre-populate the toggle and selector; (5) Dark mode: all new elements use CSS custom properties; (6) Accessibility: `role="switch"` on toggle, `aria-label` on timing selector, `aria-describedby` linking toggle to description text.
  - **Acceptance Criteria:**
    - Profile page shows "Reminders" section below stats
    - Toggle defaults to off (opt_in=false); toggling on reveals timing selector
    - Timing selector maps to correct UTC hours (8, 12, 18) in POST body
    - Page load fetches and pre-populates current preferences
    - Save action calls `POST /api/v1/profile/notification-preferences`; success toast shown; API error shows inline error
    - Dark mode: new elements use CSS custom properties; no hardcoded colors
    - Accessibility: `role="switch"` on toggle, `aria-label` on selector, `aria-describedby` on toggle
    - Unit tests: toggle on/off, timing selector selection, API success + toast, API failure + error, pre-population on load; minimum 4 new tests
    - All 227/227 frontend tests still pass; add minimum 4 new tests
  - **Blocked By:** T-100 (SPEC-017 must exist), T-101 (updated API contract must be published)
  - **Fix locations:** `frontend/src/pages/ProfilePage.jsx`, `frontend/src/api.js` (add notificationPreferences.get / notificationPreferences.update), `frontend/src/pages/ProfilePage.css` (new Reminders section styles)

---

## Out of Scope

- Push notifications (browser or mobile) — requires service worker / APNs infrastructure — post-sprint
- Email template HTML rendering framework (MJML etc.) — keep templates as simple inline HTML for now
- Social auth (Google OAuth) — B-001 — post-sprint
- Plant sharing / public profiles — B-003 — post-sprint
- Reference photo in AI advice results (FB-081) — post-MVP
- Production deployment execution — blocked on project owner providing SSL certs
- Express 5 migration — advisory backlog
- Soft delete / grace period for account deletion (FB-077) — backlog
- Batch mark-done on Care Due Dashboard — backlog
- Endpoint-specific rate limiting on `/care-actions/stats` (FB-073) — backlog

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Design Agent | Care reminder email UX spec | T-100 (P1, start immediately) |
| Backend Engineer | Email service + cron job + notification preferences API | T-101 (P1, start immediately, publish contract before T-102) |
| Frontend Engineer | Notification preferences UI on Profile page | T-102 (P1, after T-100 + T-101) |
| QA Engineer | Full QA of T-100–T-102, security checklist (new SMTP env vars) | After all tasks complete |
| Deploy Engineer | Staging re-deploy after QA sign-off | After all tasks QA-verified |
| Monitor Agent | Post-deploy health check — verify preferences endpoints + email trigger on staging | After Deploy Engineer re-deploy |
| Manager | Sprint coordination, API contract review, code review | Ongoing |

---

## Dependency Chain (Critical Path)

```
T-100 (SPEC-017 — Design Agent, START IMMEDIATELY)
  ↓ (spec complete)

T-101 (Backend service + cron + API — Backend Engineer, START IMMEDIATELY — publish contract before T-102)
  ↓ (publish updated API contract to api-contracts.md)

T-102 (preferences UI — Frontend Engineer, after T-100 spec + T-101 contract)
  ↓
QA verifies T-100 + T-101 + T-102 end-to-end

[After all tasks QA-verified]
Deploy Engineer re-deploys to staging
  ↓
Monitor Agent health check — verify GET/POST preferences + email trigger on staging
```

**Critical path:** T-100 + T-101 (parallel start) → T-102 → QA → Deploy → Monitor → staging verified.
**Note:** T-101 is the most complex task (L complexity) — Backend Engineer should start immediately and publish the API contract as soon as the endpoints are defined, even before the email service is complete, to unblock T-102.

---

## Definition of Done

Sprint #22 is complete when:

- [ ] T-100: SPEC-017 written covering preferences UI (toggle + timing), save flow, email template layout, unsubscribe flow, empty-state (no email if nothing due), dark mode, and accessibility
- [ ] T-101: `notification_preferences` migration applied; GET + POST preferences endpoints working; Nodemailer integration; daily cron job sends reminders only to opted-in users with due/overdue care; 6+ new tests; all 149/149 backend tests pass
- [ ] T-102: "Reminders" section on Profile page with toggle + timing selector; page-load pre-population; save with success toast; dark mode; accessibility (`role="switch"`, `aria-label`); 4+ new tests; all 227/227 frontend tests pass
- [ ] Deploy Verified: Yes from Monitor Agent post-deploy health check
- [ ] No regressions: backend ≥ 149/149, frontend ≥ 227/227

---

## Success Criteria

- **Opt-in works** — User can toggle email reminders on/off from the Profile page; preference is persisted and pre-populated on next visit
- **Timing preference works** — User can select morning / midday / evening reminder time; preference is persisted
- **Email sent when due** — Opted-in users with due or overdue care receive an email listing the affected plants and care types
- **Email not sent when nothing due** — If no care is due for a user that day, no email is sent (no "all clear" spam)
- **Unsubscribe works** — Footer unsubscribe link in email disables opt_in; user no longer receives reminders
- **Graceful degradation** — If SMTP env vars are not set, backend starts and runs without crashing; email sending is skipped with a logged warning
- **Test suite grows** — Backend adds minimum 6 new tests; frontend adds minimum 4 new tests; no regressions

---

## Blockers

- T-102 is blocked until: (1) Design Agent publishes SPEC-017; (2) Backend Engineer publishes updated API contract for notification preferences endpoints
- T-100 and T-101 have no blockers — both can start immediately
- Production deployment remains blocked on project owner providing SSL certificates
- Email delivery in production requires project owner to provide SMTP credentials (EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM) — staging can test with a local test SMTP server (e.g., Mailpit or Ethereal)

---

*Sprint #22 plan written by Manager Agent on 2026-04-05.*
