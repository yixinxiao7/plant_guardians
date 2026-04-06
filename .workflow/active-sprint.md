# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #26 — 2026-05-24 to 2026-05-30

**Sprint Goal:** Harden test reliability and polish edge-case UX — fix the timezone-dependent flakiness in `careActionsStreak.test.js` (FB-101) and improve the unsubscribe error page CTA to be contextually appropriate (FB-104).

**Context:** Sprint #25 delivered care-status consistency (T-116) and env var cleanup (T-115). Backend is at 188/188 tests, frontend at 259/259. Deploy Verified: Yes. All core MVP features are complete and live. Sprint #26 is a focused polish and reliability sprint drawn from the acknowledged backlog.

---

## In Scope

### P2 — Bug Fix: careActionsStreak.test.js Timezone Flakiness (FB-101)

- [ ] **T-117** — Backend Engineer: Fix `careActionsStreak.test.js` timezone-dependent test failures **(P2)**
  - **Description:** 5 tests in `backend/tests/careActionsStreak.test.js` fail when run between midnight and noon UTC. The `daysAgo(0)` helper sets the timestamp to noon UTC today — which is "in the future" during those hours — causing the backend's `performed_at` validation to reject the request with 400 instead of the expected 201. Fix: change `daysAgo(0)` to use `setUTCHours(0, 0, 0, 0)` (start of UTC day) so the timestamp is always in the past regardless of the current UTC hour.
  - **Acceptance Criteria:**
    - 5 affected streak tests pass regardless of UTC time-of-day (verified by running at any hour)
    - `daysAgo(0)` uses `d.setUTCHours(0, 0, 0, 0)` or equivalent (never produces a future timestamp)
    - All 188/188 backend tests continue to pass; no behavioral changes to production code
    - FB-101 resolved
  - **Blocked By:** None — start immediately.
  - **Fix location:** `backend/tests/careActionsStreak.test.js`

---

### P3 — UX Fix: Unsubscribe Error CTA Contextual Differentiation (FB-104)

- [ ] **T-118** — Frontend Engineer: Fix unsubscribe page error CTA to be contextually appropriate **(P3)**
  - **Description:** When the unsubscribe page shows an error (e.g., invalid/expired token, deleted account), the CTA button always reads "Sign In" and links to `/login`. For the 404 case (account already deleted), directing the user to "Sign In" is misleading — they cannot sign in. Replace the generic "Sign In" CTA with a neutral "Go to Plant Guardians" link for 404 errors, and keep "Sign In" only for recoverable token errors where the user likely has a valid account.
  - **Acceptance Criteria:**
    - For HTTP 404 responses from `GET /api/v1/unsubscribe`: CTA renders as "Go to Plant Guardians" linking to `/`
    - For all other errors (400, 401, 422, 5xx): CTA renders as "Sign In" linking to `/login` (existing behavior preserved)
    - All existing unsubscribe page tests continue to pass; add at least 1 new test for the 404 CTA differentiation
    - All 259/259 frontend tests pass; no regressions
    - FB-104 resolved
  - **Blocked By:** None — start immediately.
  - **Fix location:** `frontend/src/pages/UnsubscribePage.jsx` (or equivalent unsubscribe component)

---

## Out of Scope

- Social auth (Google OAuth) — B-001 — post-sprint
- Plant sharing / public profiles — B-003 — post-sprint
- Production deployment execution — blocked on project owner providing SSL certs
- Production email delivery — blocked on project owner providing SMTP credentials
- Express 5 migration — advisory backlog
- Soft-delete / grace period for account deletion — post-MVP
- New feature work — MVP is complete; sprint is polish/reliability only

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| Backend Engineer | Test reliability fix | T-117 (P2, start immediately) |
| Frontend Engineer | UX CTA polish | T-118 (P3, start immediately — no dependency on T-117) |
| QA Engineer | Verify T-117 and T-118; confirm no regressions | After T-117 and T-118 complete |
| Deploy Engineer | Staging re-deploy after QA sign-off | After QA-verified |
| Monitor Agent | Post-deploy health check | After Deploy Engineer re-deploy |
| Manager | Sprint coordination | Ongoing |

---

## Dependency Chain

```
T-117 (careActionsStreak fix — Backend Engineer, START IMMEDIATELY)
T-118 (unsubscribe CTA fix — Frontend Engineer, START IMMEDIATELY, parallel with T-117)
  ↓
QA verifies T-117 (188/188 backend tests pass) and T-118 (259/259 frontend tests pass)
  ↓
Deploy Engineer re-deploys to staging
  ↓
Monitor Agent health check
```

---

## Definition of Done

Sprint #26 is complete when:

- [ ] T-117: `daysAgo(0)` fixed; all 5 streak tests pass at any UTC hour; 188/188 backend tests pass
- [ ] T-118: Unsubscribe error CTA is contextual (404 → "Go to Plant Guardians", other errors → "Sign In"); 1+ new test added; 259/259 frontend tests pass
- [ ] Deploy Verified: Yes from Monitor Agent post-deploy health check
- [ ] No regressions: backend ≥ 188/188, frontend ≥ 259/259

---

## Success Criteria

- Zero flaky tests in the backend suite — `careActionsStreak.test.js` passes reliably at all UTC hours
- Unsubscribe error page provides appropriate guidance for deleted-account users
- Test counts: backend ≥ 188/188, frontend ≥ 260/259 (net +1 from T-118 new test)
- Deploy Verified: Yes

---

## Blockers

- Production deployment remains blocked on project owner providing SSL certificates
- Production email delivery blocked on project owner providing SMTP credentials
- **Infrastructure note:** Local staging backend process may terminate between Deploy and Monitor phases — Monitor Agent must restart it if connection refused before running health checks
