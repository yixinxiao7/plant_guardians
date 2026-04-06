# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #25 — 2026-05-17 to 2026-05-23

**Sprint Goal:** Clean up stale environment variable names left over from the Sprint 24 rate limiting work, and triage remaining backlog items now that all core MVP features are complete.

**Context:** Sprint #24 delivered batch mark-done and endpoint-specific rate limiting — eleven consecutive clean sprints. Backend is at 183/183 tests, frontend at 259/259. Deploy Verified: Yes.

**Important correction:** The original Sprint #25 plan (T-112–T-114) incorrectly scoped the AI Plant Advisor as a new feature. The AI advice feature was fully implemented in Sprints 3–5 (T-025/T-026 — Done) and is live in the codebase (`backend/src/routes/ai.js`, `backend/src/services/GeminiService.js`, `frontend/src/components/AIAdviceModal.jsx`). The project owner confirmed end-to-end verification with a real `GEMINI_API_KEY` on 2026-04-01. No AI work is needed this sprint.

---

## In Scope

### P1 — Bug Fix: Care Status Inconsistency (FB-108)

- [ ] **T-116** — Backend Engineer: Fix overdue status mismatch between My Plants and Care Due Dashboard **(P1)**
  - **Description:** A plant shown as overdue on the My Plants page appears in "Coming Up" on the Care Due Dashboard instead of "Overdue". Root cause is a divergence in date boundary / timezone handling between `GET /api/v1/plants` (uses `?utcOffset=` param via `careStatus.js`) and `GET /api/v1/care-due` (via `careDue.js`). Audit both status computation paths and align them so the same plant always lands in the same bucket across both views.
  - **Acceptance Criteria:**
    - A plant that is overdue on My Plants also appears in the Overdue section of the Care Due Dashboard
    - Both endpoints use the same date boundary and timezone offset logic
    - Existing backend tests pass; add at least 2 new regression tests covering the overdue/timezone boundary case
  - **Blocked By:** None — start immediately.
  - **Fix locations:** `backend/src/routes/careDue.js`, `backend/src/utils/careStatus.js`

---

### P3 — Environment Variable Cleanup

- [ ] **T-115** — Backend Engineer: Clean up `backend/.env` stale rate-limit variable names (FB-107) **(P3)**
  - **Description:** The `backend/.env` file contains legacy rate-limit env var names (`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX`) from a prior sprint. T-111's `rateLimiter.js` uses different names (`RATE_LIMIT_AUTH_MAX`, `RATE_LIMIT_AUTH_WINDOW_MS`, `RATE_LIMIT_STATS_MAX`, `RATE_LIMIT_STATS_WINDOW_MS`, `RATE_LIMIT_GLOBAL_MAX`, `RATE_LIMIT_GLOBAL_WINDOW_MS`). Update `backend/.env` to remove the stale names and add the correct T-111 names with their default values, matching `backend/.env.example`. No code changes — `.env` cleanup only.
  - **Acceptance Criteria:**
    - `backend/.env` rate-limit section uses T-111 variable names matching `.env.example`
    - Stale legacy names (`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX`) removed
    - All 183/183 backend tests still pass (no behavioral change)
    - FB-107 resolved
  - **Blocked By:** None — start immediately.
  - **Fix locations:** `backend/.env`

---

## Out of Scope

- AI Plant Advisor — **already implemented** (T-025/T-026, Sprints 3–5); `AIAdviceModal.jsx`, `GeminiService.js`, and `POST /ai/advice` are live
- Push notifications (browser or mobile) — post-sprint
- Social auth (Google OAuth) — B-001 — post-sprint
- Plant sharing / public profiles — B-003 — post-sprint
- Production deployment execution — blocked on project owner providing SSL certs
- Production email delivery — blocked on project owner providing SMTP credentials
- Unsubscribe error CTA contextual differentiation (FB-104) — cosmetic, backlog
- Express 5 migration — advisory backlog
- Soft-delete / grace period for account deletion — post-MVP

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Backend Engineer | .env cleanup | T-115 (P3, start immediately) |
| QA Engineer | Verify T-115; confirm no regressions | After T-115 complete |
| Deploy Engineer | Staging re-deploy after QA sign-off | After QA-verified |
| Monitor Agent | Post-deploy health check | After Deploy Engineer re-deploy |
| Manager | Sprint coordination | Ongoing |

---

## Dependency Chain

```
T-115 (.env cleanup — Backend Engineer, START IMMEDIATELY)
  ↓
QA verifies T-115 — 183/183 backend tests pass
  ↓
Deploy Engineer re-deploys to staging
  ↓
Monitor Agent health check
```

---

## Definition of Done

Sprint #25 is complete when:

- [ ] T-115: `backend/.env` updated to use T-111 variable names; stale names removed; all 183/183 backend tests pass
- [ ] Deploy Verified: Yes from Monitor Agent post-deploy health check
- [ ] No regressions: backend ≥ 183/183, frontend ≥ 259/259

---

## Blockers

- Production deployment remains blocked on project owner providing SSL certificates
- Production email delivery blocked on project owner providing SMTP credentials
- **Infrastructure note:** Local staging backend process may terminate between Deploy and Monitor phases — Monitor Agent must restart it if connection refused

---

*Sprint #25 plan corrected on 2026-04-06. Original plan (T-112–T-114) removed — AI advice feature already delivered in Sprints 3–5.*
