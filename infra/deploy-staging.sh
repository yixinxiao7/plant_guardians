#!/usr/bin/env bash
# deploy-staging.sh — Deploy Plant Guardians to the staging server
#
# Usage (run from project root on CI or locally):
#   ./infra/deploy-staging.sh
#
# Required environment variables:
#   STAGING_HOST     — IP or hostname of the staging server
#   STAGING_USER     — SSH user (default: deploy)
#   STAGING_SSH_KEY  — Path to SSH private key (or use SSH agent)
#   DEPLOY_DIR       — Absolute path on the server (default: /opt/plant-guardians)
#
# The staging server must have Docker + Docker Compose v2 installed.
# The .env.staging file must already exist at $DEPLOY_DIR/backend/.env.staging
# (provisioned separately; never committed to git).

set -euo pipefail

# ─── Config ───────────────────────────────────────────────────────────────────
STAGING_HOST="${STAGING_HOST:?STAGING_HOST is required}"
STAGING_USER="${STAGING_USER:-deploy}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/plant-guardians}"
GIT_SHA="${GITHUB_SHA:-$(git rev-parse HEAD)}"

echo "=== Plant Guardians — Staging Deploy ==="
echo "Host:   ${STAGING_HOST}"
echo "User:   ${STAGING_USER}"
echo "Dir:    ${DEPLOY_DIR}"
echo "SHA:    ${GIT_SHA}"
echo ""

# ─── SSH helper ───────────────────────────────────────────────────────────────
ssh_run() {
  ssh -o StrictHostKeyChecking=no \
      -o BatchMode=yes \
      "${STAGING_USER}@${STAGING_HOST}" "$@"
}

# ─── 1. Pull latest code ──────────────────────────────────────────────────────
echo "--- [1/5] Pulling latest code ---"
ssh_run "
  set -euo pipefail
  cd ${DEPLOY_DIR}
  git fetch origin main
  git checkout main
  git reset --hard origin/main
"

# ─── 2. Build Docker images ───────────────────────────────────────────────────
echo "--- [2/5] Building Docker images ---"
ssh_run "
  set -euo pipefail
  cd ${DEPLOY_DIR}
  docker compose -f infra/docker-compose.staging.yml build --no-cache
"

# ─── 3. Run database migrations ───────────────────────────────────────────────
# Migration service exits after running; errors fail the deploy.
echo "--- [3/5] Running database migrations ---"
ssh_run "
  set -euo pipefail
  cd ${DEPLOY_DIR}
  docker compose -f infra/docker-compose.staging.yml run --rm migrate
"

# ─── 4. Restart services ──────────────────────────────────────────────────────
echo "--- [4/5] Restarting services ---"
ssh_run "
  set -euo pipefail
  cd ${DEPLOY_DIR}
  docker compose -f infra/docker-compose.staging.yml up -d --remove-orphans
"

# ─── 5. Health check ──────────────────────────────────────────────────────────
echo "--- [5/5] Health check ---"
MAX_RETRIES=10
RETRY_DELAY=5
for i in $(seq 1 $MAX_RETRIES); do
  STATUS=$(ssh_run "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health" 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    echo "Health check passed (HTTP 200)"
    break
  fi
  echo "Attempt $i/$MAX_RETRIES: got HTTP $STATUS, retrying in ${RETRY_DELAY}s..."
  sleep "$RETRY_DELAY"
  if [ "$i" -eq "$MAX_RETRIES" ]; then
    echo "ERROR: Health check failed after $MAX_RETRIES attempts. Rolling back."
    ssh_run "cd ${DEPLOY_DIR} && docker compose -f infra/docker-compose.staging.yml down" || true
    exit 1
  fi
done

echo ""
echo "=== Staging deploy complete — SHA: ${GIT_SHA} ==="
echo "Monitor Agent: please run post-deploy health checks on staging."
