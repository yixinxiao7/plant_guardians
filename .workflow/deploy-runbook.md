# Plant Guardians — Production Deployment Runbook

**Maintained by:** Deploy Engineer
**Last updated:** 2026-03-25
**Applies to:** Production environment
**Infrastructure files:** `infra/docker-compose.prod.yml`, `infra/nginx.prod.conf`, `infra/deploy-prod.sh`

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [First-Time Server Setup](#first-time-server-setup)
3. [SSL Certificate Provisioning](#ssl-certificate-provisioning)
4. [Pre-Deploy Checklist](#pre-deploy-checklist)
5. [Startup Sequence](#startup-sequence)
6. [Ongoing Deployments](#ongoing-deployments)
7. [Rollback Steps](#rollback-steps)
8. [Database Migration Rollback](#database-migration-rollback)
9. [Environment Variable Reference](#environment-variable-reference)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
  Internet
     │
     ▼
 ┌─────────────────────────────────────────┐
 │   nginx (ports 80 + 443)                │
 │   - HTTP → HTTPS redirect              │
 │   - HTTPS termination (TLS 1.2/1.3)   │
 │   - Serves React SPA static files      │
 │   - Proxies /api/* → backend:3000      │
 └────────────────┬────────────────────────┘
                  │  internal Docker network
                  ▼
 ┌─────────────────────────────────────────┐
 │   backend (Express, port 3000)          │
 │   - REST API with JWT auth             │
 │   - Reads DATABASE_URL                 │
 └────────────────┬────────────────────────┘
                  │
                  ▼
 ┌─────────────────────────────────────────┐
 │   postgres (PostgreSQL 16, port 5432)   │
 │   - Internal only (no external port)   │
 └─────────────────────────────────────────┘
```

**Docker Compose file:** `infra/docker-compose.prod.yml`
**Network isolation:** All services share `plant_guardians_prod` bridge network. PostgreSQL and the backend are not externally reachable — only nginx is exposed.

---

## First-Time Server Setup

### Requirements

| Requirement | Version | Notes |
|-------------|---------|-------|
| OS | Ubuntu 22.04 LTS (recommended) | Any Linux distro with Docker support |
| Docker | 24.x+ | [Install guide](https://docs.docker.com/engine/install/ubuntu/) |
| Docker Compose | v2.x (plugin) | Included with Docker Desktop; `docker compose` (not `docker-compose`) |
| Open ports | 22, 80, 443 | 22 = SSH, 80 = HTTP redirect, 443 = HTTPS |
| DNS | A record → server IP | Must be configured BEFORE provisioning SSL |

### Step 1 — Create deploy user

```bash
# On the production server (as root or sudo user)
useradd -m -s /bin/bash deploy
usermod -aG docker deploy
mkdir -p /home/deploy/.ssh
# Paste your CI/CD or operator public key:
echo "YOUR_PUBLIC_KEY" >> /home/deploy/.ssh/authorized_keys
chmod 700 /home/deploy/.ssh && chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
```

### Step 2 — Clone the repository

```bash
su - deploy
mkdir -p /opt/plant-guardians
cd /opt/plant-guardians
git clone https://github.com/YOUR_ORG/plant_guardians.git .
```

### Step 3 — Create production env file

```bash
cp .env.production.example .env.production
# Fill in ALL values — see Environment Variable Reference section below
nano .env.production
```

**Critical values to set:**
- `POSTGRES_PASSWORD` — use `openssl rand -hex 32`
- `JWT_SECRET` — use `openssl rand -hex 64`
- `GEMINI_API_KEY` — from Google AI Studio
- `FRONTEND_URL` — your production HTTPS domain (e.g. `https://plantguardians.app`)
- `SSL_CERT_PATH` / `SSL_KEY_PATH` — see SSL section below

### Step 4 — Provision SSL certificates

See [SSL Certificate Provisioning](#ssl-certificate-provisioning) below.

### Step 5 — First deploy

Follow [Startup Sequence](#startup-sequence) below.

---

## SSL Certificate Provisioning

### Option A — Let's Encrypt (Recommended for production)

Let's Encrypt provides free, automatically-renewing SSL certificates.

**Prerequisites:** DNS A record for your domain must already point to the server IP.

```bash
# Install certbot (Ubuntu)
sudo apt update && sudo apt install -y certbot

# Obtain certificate (port 80 must be free — stop nginx if already running)
sudo certbot certonly --standalone -d plantguardians.app -d www.plantguardians.app

# Certs are stored at:
#   /etc/letsencrypt/live/plantguardians.app/fullchain.pem
#   /etc/letsencrypt/live/plantguardians.app/privkey.pem

# Set in .env.production:
# SSL_CERT_PATH=/etc/letsencrypt/live/plantguardians.app/fullchain.pem
# SSL_KEY_PATH=/etc/letsencrypt/live/plantguardians.app/privkey.pem
```

**Auto-renewal:** certbot installs a cron job / systemd timer. Verify with:
```bash
sudo systemctl status certbot.timer
```

**Certificate renewal with running nginx:**
The nginx.prod.conf is configured with an ACME challenge pass-through at `/.well-known/acme-challenge/`. Use the webroot renewer after initial setup:
```bash
sudo certbot renew --webroot -w /var/lib/docker/volumes/plant_guardians_certbot_webroot/_data
```

### Option B — Bring-Your-Own Certificate

```bash
# Place certificate files in infra/ssl/ (this directory is gitignored)
mkdir -p /opt/plant-guardians/infra/ssl
cp /path/to/your/fullchain.pem /opt/plant-guardians/infra/ssl/fullchain.pem
cp /path/to/your/privkey.pem   /opt/plant-guardians/infra/ssl/privkey.pem
chmod 600 /opt/plant-guardians/infra/ssl/privkey.pem

# Set in .env.production:
# SSL_CERT_PATH=/opt/plant-guardians/infra/ssl/fullchain.pem
# SSL_KEY_PATH=/opt/plant-guardians/infra/ssl/privkey.pem
```

---

## Pre-Deploy Checklist

**Every deployment to production must satisfy ALL items before proceeding.**

### Code Quality Gates

- [ ] All backend tests pass: `cd backend && npm test` → 44+ passing, 0 failing
- [ ] All frontend tests pass: `cd frontend && npm test` → 50+ passing, 0 failing
- [ ] `npm audit` shows 0 critical/high vulnerabilities (both frontend and backend)
- [ ] Code review approved by Manager Agent (status: In Review → Done in tracker)
- [ ] QA Engineer has signed off in `handoff-log.md` (Status: Complete)

### Staging Verification Gate

- [ ] Monitor Agent has verified staging: **Deploy Verified: Yes** in `qa-build-log.md`
- [ ] All 14 API endpoints return expected status codes on staging
- [ ] No unexpected 5xx errors on staging in the last 24 hours
- [ ] Database migrations have been tested and verified on staging

### Infrastructure Gate

- [ ] `.env.production` exists on the production server with all values filled in
- [ ] SSL certificates exist and are valid (not expired)
- [ ] Production database is reachable and healthy
- [ ] Sufficient disk space: `df -h` → at least 20% free on `/` and data volume
- [ ] Docker daemon is running: `systemctl is-active docker`

### Security Gate (from `security-checklist.md`)

- [ ] JWT_SECRET is a new, unique 64-byte hex value (never reused from staging)
- [ ] POSTGRES_PASSWORD is a strong, unique random value
- [ ] No secrets committed to git (`.env.production` is in `.gitignore`)
- [ ] FRONTEND_URL is set to the exact production HTTPS domain
- [ ] HTTPS is configured and certificate is valid

---

## Startup Sequence

### First deploy (initial production launch)

```bash
# On the production server as 'deploy' user
cd /opt/plant-guardians

# 1. Verify all pre-deploy checklist items are complete

# 2. Pull latest code
git fetch origin main
git checkout main
git reset --hard origin/main

# 3. Build images
docker compose -f infra/docker-compose.prod.yml --env-file .env.production build --no-cache

# 4. Start PostgreSQL first and wait for it to be healthy
docker compose -f infra/docker-compose.prod.yml --env-file .env.production up -d postgres
docker compose -f infra/docker-compose.prod.yml --env-file .env.production ps
# Wait until postgres shows "healthy"

# 5. Run migrations
docker compose -f infra/docker-compose.prod.yml --env-file .env.production run --rm migrate

# 6. Start all services
docker compose -f infra/docker-compose.prod.yml --env-file .env.production up -d

# 7. Verify health
curl -sk https://localhost/api/health
# Expected: {"status":"ok","timestamp":"..."}

curl -sk -o /dev/null -w "%{http_code}" https://localhost/
# Expected: 200
```

### Automated deploy (CI/CD or subsequent deploys)

```bash
# From your local machine or CI runner:
export PROD_HOST=your.production.server.ip
export PROD_USER=deploy
export PROD_SSH_KEY=~/.ssh/your_deploy_key
./infra/deploy-prod.sh
```

The script performs all 6 steps automatically and aborts if any step fails.

### Expected startup order

```
postgres  → healthy (10–30s)
     │
     ▼
migrate   → exits 0 (migrations applied)
     │
     ▼
backend   → healthy (20–40s after postgres)
     │
     ▼
nginx     → starts (depends on backend healthy)
```

Total expected startup time from `up -d`: **60–90 seconds**.

---

## Ongoing Deployments

For each new sprint release after initial setup:

```bash
# 1. Confirm pre-deploy checklist (especially QA + staging gates)

# 2. Run deploy script
export PROD_HOST=... && ./infra/deploy-prod.sh

# 3. After script completes, trigger Monitor Agent health check

# 4. Log the deployment in qa-build-log.md:
#    - Date, SHA, environment: Production
#    - Build Status: Success
#    - Migration status (if any)
#    - Link to Monitor Agent health check result
```

---

## Rollback Steps

Follow these steps if Monitor Agent or QA reports a critical issue post-deploy.

### Severity classification

| Level | Condition | Target resolution |
|-------|-----------|-------------------|
| P0 | App down or data corruption | Immediate rollback |
| P1 | Core feature broken | Rollback within 30 minutes |
| P2 | Non-critical regression | Consider hotfix-forward instead |

### Step 1 — Identify last known-good SHA

```bash
# On the production server
cd /opt/plant-guardians
git log --oneline -10
# Find the last commit that was verified healthy
# Check qa-build-log.md for the last "Deploy Verified: Yes" SHA
```

### Step 2 — Revert code

```bash
# On the production server
cd /opt/plant-guardians
git checkout <LAST_GOOD_SHA>
```

### Step 3 — Rebuild and restart services

```bash
docker compose -f infra/docker-compose.prod.yml --env-file .env.production build --no-cache
docker compose -f infra/docker-compose.prod.yml --env-file .env.production up -d --remove-orphans
```

### Step 4 — Verify rollback

```bash
curl -sk https://localhost/api/health
# Must return: {"status":"ok",...}
```

### Step 5 — Log the rollback

Update `qa-build-log.md` with:
- Build Status: **ROLLBACK**
- Environment: Production
- Rolled back from SHA: `<FAILED_SHA>`
- Rolled back to SHA: `<GOOD_SHA>`
- Error Summary: detailed description of the issue
- Timestamp

### Step 6 — Notify Manager Agent

Write a handoff to `handoff-log.md` requesting a Hotfix task in `dev-cycle-tracker.md`.

---

## Database Migration Rollback

**Only perform this if the issue is caused by a bad database migration.**

⚠️ **WARNING:** Migration rollbacks can cause data loss if records were inserted in the new schema. Consult with Manager Agent before proceeding.

```bash
# On the production server
cd /opt/plant-guardians

# Roll back the last migration
docker compose -f infra/docker-compose.prod.yml --env-file .env.production \
  run --rm migrate \
  node node_modules/.bin/knex migrate:rollback

# Verify the rollback was applied correctly
docker compose -f infra/docker-compose.prod.yml --env-file .env.production \
  run --rm migrate \
  node node_modules/.bin/knex migrate:list
```

After rolling back:
1. Restart the backend service: `docker compose ... restart backend`
2. Verify `/api/health` returns 200
3. Log the migration rollback in `technical-context.md` Migration Log
4. Write a handoff to `handoff-log.md` so Backend Engineer can investigate

---

## Environment Variable Reference

All variables are documented in `.env.production.example`. Critical variables:

| Variable | Description | How to generate |
|----------|-------------|-----------------|
| `POSTGRES_PASSWORD` | PostgreSQL password | `openssl rand -hex 32` |
| `JWT_SECRET` | JWT signing secret | `openssl rand -hex 64` |
| `GEMINI_API_KEY` | Google Gemini API key | Google AI Studio |
| `FRONTEND_URL` | Production HTTPS domain | Your registered domain |
| `SSL_CERT_PATH` | Path to TLS fullchain.pem | Let's Encrypt or BYO |
| `SSL_KEY_PATH` | Path to TLS privkey.pem | Let's Encrypt or BYO |

**Never commit `.env.production` to git.**
**Rotate `JWT_SECRET` every 90 days** (all active sessions will be invalidated).
**Rotate `POSTGRES_PASSWORD` every 180 days** (requires update in `.env.production` and container restart).

---

## Troubleshooting

### nginx fails to start: SSL certificate not found

```
Error: cannot load certificate "/etc/ssl/certs/plant-guardians/fullchain.pem"
```

**Fix:** SSL cert files not found at paths specified in `.env.production`. Verify:
```bash
source .env.production && ls -la "$SSL_CERT_PATH" "$SSL_KEY_PATH"
```

### Backend fails health check: database connection refused

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Fix:** postgres container isn't healthy yet, or DATABASE_URL is wrong.
```bash
docker compose -f infra/docker-compose.prod.yml --env-file .env.production logs postgres
docker compose -f infra/docker-compose.prod.yml --env-file .env.production ps
```

### Migrations fail: relation does not exist / already exists

```bash
# Check current migration state
docker compose -f infra/docker-compose.prod.yml --env-file .env.production \
  run --rm migrate node node_modules/.bin/knex migrate:list
```

### 502 Bad Gateway from nginx on /api/ routes

Nginx is running but the backend container is not healthy yet (still starting up). Wait 30–60 seconds and retry. If it persists:
```bash
docker compose -f infra/docker-compose.prod.yml --env-file .env.production logs backend
```

### View all container logs

```bash
cd /opt/plant-guardians
docker compose -f infra/docker-compose.prod.yml --env-file .env.production logs -f
# Or per service:
docker compose -f infra/docker-compose.prod.yml --env-file .env.production logs -f nginx
docker compose -f infra/docker-compose.prod.yml --env-file .env.production logs -f backend
docker compose -f infra/docker-compose.prod.yml --env-file .env.production logs -f postgres
```

---

*This runbook was written by the Deploy Engineer for Sprint #6 (T-032) on 2026-03-25.*
*Update this document whenever infrastructure changes are made.*
