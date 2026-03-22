# Multi-Agent Dev Framework

An automated development workspace where eight AI agents collaborate to build your app — planning, designing, coding, testing, and deploying in iterative sprints. You describe what you want; the agents build it.

## Prerequisites

Install these before starting:

| Tool | Purpose | Install |
|------|---------|---------|
| **Node.js 18+** | Runs the backend and build tools | [nodejs.org](https://nodejs.org) |
| **npm** | Installs JavaScript packages (included with Node.js) | Comes with Node.js |
| **Claude Code** | The AI agents that do the work | `npm install -g @anthropic-ai/claude-code` |
| **Git** | Tracks code changes | [git-scm.com](https://git-scm.com) |
| **Docker** *(optional)* | Runs the database locally | [docker.com](https://docker.com) |

## Getting Started

### 1. Describe your product

Open `.workflow/project-brief.md` and fill in the template. This is the single most important file — it tells the agents what to build. At minimum, fill in:

- Project name and one-line description
- Target users
- Problem statement
- Core features (MVP)
- Out of scope
- Success criteria

### 2. Set your design direction

Open `CLAUDE.md` and scroll to the **Design Context** section at the bottom. Fill in your target users, brand personality, visual style, and any reference apps. This guides the Design Agent's decisions.

### 3. Configure the platform

Run the setup script. It will check your prerequisites, create a config file, and prepare the environment:

```bash
./orchestrator/setup.sh
```

After setup, review `orchestrator/config.sh` if you want to change settings:

- `PLATFORM` — `"web"` (React + Vite) or `"mobile"` (React Native + Expo)
- `AGENT_MAX_TURNS` — How much work each agent can do per phase (default: 75)
- `MODEL_HEAVY` — Model for build, review, and QA phases (default: `"sonnet"`)
- `MODEL_LIGHT` — Model for design, contracts, deploy, monitor, closeout, and test phases (default: `"sonnet"`)
- `AUTO_CONTINUE` — `"true"` for fully autonomous sprints, `"false"` to pause for your feedback
- `NOTIFICATION_EMAIL` — Email address for sprint completion summaries (leave empty to disable)
- `GMAIL_APP_PASSWORD` — Gmail App Password for sending notifications

### 4. Start the first sprint

```bash
./orchestrator/orchestrate.sh
```

The orchestrator runs through 10 phases automatically:

1. **Plan** — Manager creates the sprint plan
2. **Design** — Design Agent writes UI specs
3. **Contracts** — Backend publishes API contracts
4. **Build** — Engineers build frontend and backend in parallel
5. **Review** — Manager reviews the code
6. **QA** — QA Engineer runs tests and security checks
7. **Deploy** — Deploy Engineer ships to staging
8. **Verify** — Monitor Agent checks deployment health
9. **Test** — User Agent tests the product and logs feedback
10. **Closeout** — Manager triages feedback and closes the sprint

When the sprint finishes, the orchestrator shows a summary and waits for your input.

## Providing Feedback

After each sprint, review what the agents built and add your feedback to `.workflow/feedback-log.md`. The agents pick this up automatically in the next sprint.

To run another sprint:

```bash
./orchestrator/orchestrate.sh
```

To run sprints continuously (pausing between each for your feedback):

```bash
./orchestrator/orchestrate.sh --loop
```

## Other Commands

| Command | What it does |
|---------|-------------|
| `./orchestrator/orchestrate.sh --status` | Show current sprint progress |
| `./orchestrator/orchestrate.sh --continue` | Resume a sprint that was interrupted |
| `./orchestrator/orchestrate.sh --reset` | Clear sprint state and start the current sprint over |

## Reusing This Framework

To start a completely new project from this template:

```bash
cp -r multi-agent-framework my-new-project
cd my-new-project
./orchestrator/scaffold.sh
```

This resets all app code and workflow files to blank templates while keeping the framework intact.

## Project Structure

```
.agents/          → AI agent prompts (one per role)
.workflow/        → Sprint plans, specs, logs, and tracking files
orchestrator/     → Automation scripts and config
frontend/         → Web app (created after first sprint)
mobile/           → Mobile app (created after first sprint, if platform=mobile)
backend/          → API server (created after first sprint)
shared/           → Shared types and constants
infra/            → Docker and deployment configs
```

## Learn More

- `CLAUDE.md` — Full framework documentation and agent reference
- `rules.md` — Constraints all agents follow
- `architecture.md` — Tech stack and design decisions
