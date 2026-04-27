# CLAUDE.md — Multi-Agent Dev Workspace

This file is the entry point for any Claude Code agent working in this repository. Read this first.

## Workspace Overview

This is a multi-agent development workspace where specialized Claude Code agents collaborate to build applications. Each agent has a defined role, reads/writes specific files, and communicates through structured handoff logs.

This workspace supports both **web** and **mobile** platforms. The platform is configured in `orchestrator/config.sh` and determines the tech stack, directory layout, and conventions.

## Before You Do Anything

1. Read `rules.md` — Non-negotiable constraints for all agents
2. Read `architecture.md` — System design and tech stack decisions
3. Read your agent prompt in `.agents/` — Your specific role, responsibilities, and rules
4. Read `.workflow/active-sprint.md` — What you should be working on right now

## Key Directories

```
.agents/          → System prompts for each agent role
.workflow/        → All workflow docs, logs, specs, and tracking
orchestrator/     → Automation: runner, phase scripts, platform configs
frontend/         → React + Vite frontend (web platform)
mobile/           → React Native + Expo app (mobile platform)
backend/          → Express + PostgreSQL backend API
shared/           → Shared types and constants
infra/            → Docker, CI/CD, and deployment configs
```

## Agent Roles

| Agent | Prompt File | Primary Responsibility |
|-------|-------------|----------------------|
| Manager | `.agents/manager.md` | Sprint planning, code review, orchestration |
| Design Agent | `.agents/design-agent.md` | UI specs and screen descriptions |
| Backend Engineer | `.agents/backend-engineer.md` | API, database, server-side logic |
| Frontend Engineer | `.agents/frontend-engineer.md` | UI components, pages, client-side logic |
| QA Engineer | `.agents/qa-engineer.md` | Testing, security checklist, product-perspective testing |
| Deploy Engineer | `.agents/deploy-engineer.md` | Build, deploy, environment management |
| Monitor Agent | `.agents/monitor-agent.md` | Post-deploy health checks, error monitoring |

## Workflow Cycle

```
Manager plans sprint
  → Design Agent writes UI specs
  → Backend Engineer publishes API contracts
  → Engineers build in parallel
  → Manager reviews code
  → QA runs tests, security checks, and product-perspective testing
  → Deploy ships to staging
  → Monitor verifies health
  → Manager triages feedback → next sprint
```

## Communication Protocol

Agents do NOT talk to each other directly. All coordination happens through files:
- `.workflow/dev-cycle-tracker.md` — Task assignments and status
- `.workflow/handoff-log.md` — Context passed between agents
- `.workflow/api-contracts.md` — Backend ↔ Frontend interface agreements
- `.workflow/feedback-log.md` — QA Engineer and Monitor Agent observations

## Git Credentials & Commit Permissions

All git commits in this workspace must be made under the following credentials:

- **Name:** Yixin Xiao
- **Email:** yixinxiao7@gmail.com

These are configured globally via `git config --global`. Do not override them.

### Commit Permissions

Agents are pre-authorized to commit and push to **any branch except `main` and `master`** without prompting the user. This keeps the automated sprint cycle uninterrupted.

| Branch | Permission |
|--------|-----------|
| `feature/*`, `fix/*`, `hotfix/*`, `refactor/*`, `infra/*` | Auto-approved — no user confirmation needed |
| Any other non-protected branch | Auto-approved — no user confirmation needed |
| `main` / `master` | **Requires explicit user approval before every push** |

Additional hard rules:
- Force pushes (`--force`) are **never permitted** without explicit user approval
- Branch deletion requires explicit user approval
- Always reference the task ID from `dev-cycle-tracker.md` in commit messages

## Orchestrator (Automated Runner)

The orchestrator automates the full sprint lifecycle. Instead of manually invoking each agent, run:

```bash
# First time setup
./orchestrator/setup.sh

# Run a sprint
./orchestrator/orchestrate.sh

# Resume from where you left off
./orchestrator/orchestrate.sh --continue

# Run sprints in a loop (pauses for feedback between sprints)
./orchestrator/orchestrate.sh --loop

# Check current status
./orchestrator/orchestrate.sh --status
```

### How It Works

1. You fill in `.workflow/project-brief.md` with your product vision
2. You set the platform (web or mobile) in `orchestrator/config.sh`
3. You run `./orchestrator/orchestrate.sh`
4. The orchestrator invokes each agent in the correct order, checks for completion between phases, and handles rework cycles if code review or QA finds issues
5. When the sprint finishes, it presents a summary and waits for your feedback
6. You add feedback to `.workflow/feedback-log.md` and press Enter
7. The next sprint incorporates your feedback automatically

### Configuration

See `orchestrator/config.sh` for settings:
- `PLATFORM` — "web" or "mobile"
- `AGENT_MAX_TURNS` — How many API calls per agent (higher = more complex work)
- `AUTO_CONTINUE` — Whether to auto-start the next sprint or wait for human input
- `MAX_SPRINTS` — Cap on total sprints (0 = unlimited)

## Design Context

### Users
Self-described "plant-killers" — adults who want houseplants but lack the instincts and habits to keep them alive. They are not gardeners and don't want to become gardeners; they want a forgiving system that nags them at the right moment and tells them what to do without jargon. Most encounters happen in passing: a quick glance to see "what's wrong / what's due," a tap to mark a plant watered, an occasional photo upload to ask the AI "what is this and how do I not kill it?" The app should make them feel **capable**, **reassured**, and **a little proud** every time they finish a task — never lectured, never overwhelmed.

A secondary, quieter user is the experienced plant owner who wants a clean inventory and history. The interface should not condescend to them; the hand-holding (AI advice, big status cues) should be available but never in the way.

### Brand Personality
Three words: **calm, nurturing, encouraging.**

Voice is plain and warm — the tone of a knowledgeable friend, not a coach or a system alert. Status messages and microcopy should be specific and human ("Watering is 3 days overdue" beats "Action required"). Successful actions deserve a small moment of joy (the confetti dependency, satisfying check animations) — celebration is part of the product, not decoration. Errors and overdue states are honest but never punitive: red means "this needs you," not "you failed."

### Aesthetic Direction
- **Style:** Japandi botanical — Japanese restraint meets Scandinavian warmth. Generous whitespace, soft natural surfaces, organic curves over hard geometry. Minimal but not cold; lived-in but not cluttered.
- **Theme:** Light and dark both first-class (manual toggle + system preference, see `frontend/src/styles/design-tokens.css`). Warm cream background (`#F7F4EF`) in light, deep warm-brown (`#1A1815`) in dark — never pure white or pure black.
- **Palette:** Sage green accent (`#5C7A5C`) as the primary; warm clay (`#A67C5B`) as the secondary. Status uses muted, earthy versions of green/yellow/red — never neon or saturated. Backgrounds and surfaces lean beige/oatmeal, not gray.
- **Typography:** **Playfair Display** (serif, 600) for headings and display moments — gives the product a calm, editorial gravity. **DM Sans** (400/500/600) for body, UI, and data — keeps interfaces legible and modern. Pair, don't compete: Playfair for the page title, DM Sans for everything else.
- **References:** [easyplant.com](https://easyplant.com) — warm, minimal, photography-forward, generous spacing. Also in the spirit of Notion calm, Linear's restraint, and small Japanese stationery shops.
- **Anti-references:** Avoid the "tech app" look — saturated gradients, glassy neon, dark-mode-as-default cyberpunk, gamified RPG-style UI, dense dashboards, generic Material/iOS chrome. No emoji-heavy copy. No mascots.
- **Decoration:** Restrained. Soft shadows (`--shadow-card`), 12px card radii, 24px pill radii, occasional botanical iconography (Phosphor icons, leaf/water/sun glyphs). No skeuomorphism, no heavy borders, no patterned backgrounds. Motion is gentle and spring-eased (`--transition-spring`); celebratory animations (confetti, check) are saved for genuine wins.

### Design Principles
1. **Painfully obvious beats clever.** A novice should always know, at a glance, which plant needs attention and what the next action is. Status colors, dates, and CTAs should leave nothing to interpretation.
2. **Warm minimalism.** Fewer elements, more breathing room, soft natural color. If it doesn't help the user care for a plant, it doesn't earn its space on the page.
3. **Celebrate the small win.** Watering a plant is the core loop — make finishing it feel disproportionately good (confetti, check animation, streak nudges) without being childish.
4. **Hand-hold the novice; get out of the expert's way.** AI advice, defaults, and explanations are offered, never forced. Power features (bulk actions, filters, history) are present but secondary to the daily glance.
5. **Honest, never punitive.** Overdue plants are flagged clearly but framed as "needs you now," not "you messed up." The product is on the user's team.
6. **Light and dark are equals.** Every component must look intentional in both themes — no afterthought dark mode. Use design tokens (`design-tokens.css`), never hardcoded colors.
