# Active Sprint

The operational reference for the current development cycle. Refreshed at the start of each sprint by the Manager Agent.

---

## Sprint #10 — 2026-03-28 to 2026-04-01

**Sprint Goal:** Close the MVP. T-020 (user testing) carries into this sprint for the tenth time — but this time, staging is clean (Deploy Verified: Yes), all bugs are fixed, Gemini is live, and there are zero blockers. Sprint #10 MUST close T-020. After MVP is declared complete, polish Sprint 10 capacity is directed toward two P3 quality items: focus management in the Care Due Dashboard and updating the Monitor Agent system prompt to fix the stale test account reference.

**Context:** Sprint #9 delivered all four engineering tasks (T-045, T-046, T-047, T-048) in a single day. Monitor Agent confirmed Deploy Verified: Yes across all 17 endpoints and 5 frontend routes. The Gemini fallback chain is live. The three blocking bugs are gone. 69/69 backend + 101/101 frontend tests pass. T-020 is now fully unblocked with no excuses remaining.

---

## In Scope

### P0 — MVP Completion Gate (Absolute Priority — Sprint Cannot Close Without This)

- [ ] **T-020** — User Agent / Project Owner: User testing — all 3 MVP flows + Care History + Care Due Dashboard **(P0 — absolute hard gate)**
  - **Acceptance Criteria:** All three flows from `project-brief.md` tested end-to-end in a browser on staging.
    - **Flow 1 (Novice):** register → add plant with watering schedule (test fertilizing + repotting expand — FB-026 now fixed) → view inventory → navigate to plant detail → mark care done → confetti animation plays.
    - **Flow 2 (AI advice):** upload photo or enter plant type → get AI advice (Gemini key is live per FB-029, fallback chain live per T-048) → verify modal shows advice → accept → form populated. Also verify reject flow.
    - **Flow 3 (Inventory management):** edit care schedule including changing last-watered date (Save button now enables — FB-027 fixed) → save → view changes. Delete a plant → confirm modal → plant removed.
    - **Care History:** navigate to `/history` → verify care actions from Flows 1–3 appear, filter by plant works, pagination works.
    - **Care Due Dashboard:** navigate to `/due` → verify urgency sections correct → use "Mark as done" shortcut → item removed optimistically → sidebar badge updates.
    - All observations logged to `feedback-log.md` with Status: New. No P0 blocking errors.
  - **Dependencies:** None — T-045, T-046, T-047, T-048 are all Done. Staging is Deploy Verified: Yes.
  - **Hard rule:** This is the tenth and final carry-over. Sprint 10 will not close until T-020 is Done. If a User Agent is unavailable, the project owner must conduct the testing session. If a new P0 blocking issue is discovered, escalate to Manager Agent immediately.

---

### P3 — Post-MVP Polish (Begin After T-020 Is Done)

- [ ] **T-050** — Frontend Engineer: Implement focus management after mark-done in Care Due Dashboard (FB-033) **(P3)**
  - **Acceptance Criteria:** After a successful mark-done action removes an item from the Care Due Dashboard, focus moves to the next item's "Mark as done" button. If the removed item was the last in its section, focus moves to the next section's first "Mark as done" button. If all sections are empty (all-clear state), focus moves to the "View my plants" button. This improves screen-reader experience for keyboard users. Existing 101/101 frontend tests still pass; add tests covering focus movement behavior.
  - **Dependencies:** T-020 (begin after MVP testing complete — don't build polish while MVP is unverified).
  - **Fix location:** `frontend/src/pages/CareDuePage.jsx`

- [ ] **T-051** — Monitor Agent: Update system prompt — stale test account reference **(P3)**
  - **Acceptance Criteria:** The Monitor Agent's system prompt (`.agents/monitor-agent.md`) is updated to reference the correct seeded test account (`test@plantguardians.local` / `TestPass123!`) instead of the stale `test@triplanner.local`. All future health checks use the correct credentials without manual override. This was flagged in the Sprint 9 Monitor Agent health check notes.
  - **Dependencies:** None.
  - **Fix location:** `.agents/monitor-agent.md`

---

## Out of Scope

- Social auth (Google OAuth) — B-001 — post-MVP
- Push notifications for care reminders — B-002 — post-MVP
- Plant sharing / public profiles — B-003 — post-MVP
- Care history chart / analytics — B-004 — post-MVP
- Dark mode — B-005 — post-MVP
- Express 5 migration — advisory backlog; no fix available without breaking changes
- Production deployment execution (runbook exists; awaits project owner SSL certs)
- Email notification reminders
- Any new API endpoints or screens beyond current set

---

## Agent Assignments

| Agent | Focus Area This Sprint | Key Tasks |
|-------|----------------------|-----------|
| User Agent / Project Owner | End-to-end user testing — all flows | T-020 (P0, start immediately) |
| Frontend Engineer | Focus management polish (after T-020) | T-050 (P3) |
| Monitor Agent | Update system prompt stale reference | T-051 (P3) |
| QA Engineer | Verify T-050 fix + final T-020 sign-off | On-demand |
| Backend Engineer | No tasks this sprint | — |
| Deploy Engineer | No tasks this sprint | — |
| Design Agent | No tasks this sprint | — |
| Manager | Sprint coordination, T-020 closeout, MVP declaration | Ongoing |

---

## Dependency Chain (Critical Path)

```
T-020 (User testing — all flows)    ← P0, START IMMEDIATELY — zero blockers remain
T-051 (Monitor: fix stale account)  ← P3, can start immediately — no dependencies

[After T-020 Done]
T-050 (Frontend: focus management)  ← P3, start after T-020 confirmed — MVP must be declared first
```

**Critical path:** T-020 is the only task that matters this sprint. All other work is secondary polish.

---

## Definition of Done

Sprint #10 is complete when:

- [ ] T-020: User Agent / project owner has tested all 3 MVP flows + Care History + Care Due Dashboard in-browser and logged observations — **MVP officially declared complete**
- [ ] T-050: Focus moves to next "Mark as done" button (or "View my plants") after item removed; tests added; 101+ frontend tests pass
- [ ] T-051: Monitor Agent system prompt references `test@plantguardians.local` correctly
- [ ] No regressions: all backend + frontend tests at or above Sprint 9 counts (69/69 backend, 101/101 frontend)
- [ ] Feedback from T-020 triaged by Manager Agent

---

## Success Criteria

- **MVP formally declared complete** — T-020 closed, all 3 flows + Care History + Care Due Dashboard verified end-to-end in a real browser
- **Care Due Dashboard keyboard UX improved** — focus management after mark-done implemented
- **Monitor Agent accuracy improved** — correct test account in health checks going forward
- **CI is clean** — all tests pass; no new vulnerabilities above existing known risks

---

## Blockers

- **None.** T-020 has zero remaining blockers:
  - CORS covers all dev ports ✅ (T-045 Done)
  - CareScheduleForm expand buttons work ✅ (T-046 Done)
  - EditPlantPage isDirty covers date fields ✅ (T-047 Done)
  - Gemini 429 fallback chain live ✅ (T-048 Done)
  - Gemini API key provisioned and working ✅ (FB-029)
  - Deploy Verified: Yes ✅ (Monitor Agent Sprint 9 health check)
  - 69/69 backend + 101/101 frontend tests pass ✅

---

*Sprint #10 plan written by Manager Agent on 2026-03-28.*
