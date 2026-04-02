#!/usr/bin/env bash
# deploy-prod.sh — Deploy Plant Guardians to the production server
#
# Usage (run from project root, on CI or locally):
#   ./infra/deploy-prod.sh
#
# Required environment variables:
#   PROD_HOST        — IP or hostname of the production server
#   PROD_USER        — SSH user (default: deploy)
#   PROD_SSH_KEY     — Path to SSH private key (or use SSH agent)
#   DEPLOY_DIR       — Absolute path on the server (default: /opt/plant-guardians)
#
# Pre-conditions that MUST be met before running this script:
#   1. QA Engineer has confirmed all tests pass (see qa-build-log.md)
#   2. Monitor Agent has confirmed staging is healthy (Deploy Verified: Yes)
#   3. .env.production exists at $DEPLOY_DIR/.env.production on the server
#   4. SSL certificates exist at paths referenced in .env.production
#   5. Docker + Docker Compose v2 is installed on the production server
#
# Safety: this script will ABORT rather than rollback automatically.
# If any step fails, investigate and re-run. See deploy-runbook.md for details.

set -euo pipefail

# ─── Configuration ─────────────────────────────────────────────────────────────
PROD_HOST="${PROD_HOST:?PROD_HOST is required}"
PROD_USER="${PROD_USER:-deploy}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/plant-guardians}"
GIT_SHA="${GITHUB_SHA:-$(git rev-parse HEAD)}"
COMPOSE_FILE="infra/docker-compose.prod.yml"
ENV_FILE=".env.production"

echo "╔══════════════════════════════════════════════╗"
echo "║   Plant Guardians — PRODUCTION Deploy        ║"
echo "╠══════════════════════════════════════════════╣"
echo "  Host:   ${PROD_HOST}"
echo "  User:   ${PROD_USER}"
echo "  Dir:    ${DEPLOY_DIR}"
echo "  SHA:    ${GIT_SHA}"
echo "  Compose: ${COMPOSE_FILE}"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ─── SSH helper ────────────────────────────────────────────────────────────────
ssh_run() {
  local opts=(-o StrictHostKeyChecking=no -o BatchMode=yes)
  if [[ -n "${PROD_SSH_KEY:-}" ]]; then
    opts+=(-i "${PROD_SSH_KEY}")
  fi
  ssh "${opts[@]}" "${PROD_USER}@${PROD_HOST}" "$@"
}

# ─── Pre-deploy safety check ───────────────────────────────────────────────────
echo "--- [0/6] Pre-deploy safety checks ---"
ssh_run "
  set -euo pipefail
  cd ${DEPLOY_DIR}

  # Verify .env.production exists
  if [[ ! -f '${ENV_FILE}' ]]; then
    echo 'ERROR: ${ENV_FILE} not found on server. Aborting.'
    exit 1
  fi

  # Verify SSL cert and key paths are set in .env.production
  source '${ENV_FILE}'
  if [[ -z \"\${SSL_CERT_PATH:-}\" || -z \"\${SSL_KEY_PATH:-}\" ]]; then
    echo 'ERROR: SSL_CERT_PATH or SSL_KEY_PATH not set in ${ENV_FILE}. Aborting.'
    exit 1
  fi
  if [[ ! -f \"\$SSL_CERT_PATH\" ]]; then
    echo \"ERROR: SSL cert not found at \$SSL_CERT_PATH. Aborting.\"
    exit 1
  fi
  if [[ ! -f \"\$SSL_KEY_PATH\" ]]; then
    echo \"ERROR: SSL key not found at \$SSL_KEY_PATH. Aborting.\"
    exit 1
  fi

  echo 'Pre-deploy checks passed.'
"

# ─── 1. Pull latest code ───────────────────────────────────────────────────────
echo "--- [1/6] Pulling latest code ---"
ssh_run "
  set -euo pipefail
  cd ${DEPLOY_DIR}
  git fetch origin main
  git checkout main
  git reset --hard origin/main
  echo 'Code at SHA: \$(git rev-parse HEAD)'
"

# ─── 2. Build Docker images ────────────────────────────────────────────────────
echo "--- [2/6] Building Docker images ---"
ssh_run "
  set -euo pipefail
  cd ${DEPLOY_DIR}
  docker compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} build --no-cache
"

# ─── 3. Run database migrations ───────────────────────────────────────────────
# Migration service exits after completion; a non-zero exit here aborts the deploy.
echo "--- [3/6] Running database migrations ---"
ssh_run "
  set -euo pipefail
  cd ${DEPLOY_DIR}
  docker compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} run --rm migrate
"

# ─── 4. Start / restart services ──────────────────────────────────────────────
echo "--- [4/6] Starting production services ---"
ssh_run "
  set -euo pipefail
  cd ${DEPLOY_DIR}
  docker compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} up -d --remove-orphans
"

# ─── 5. Backend health check ───────────────────────────────────────────────────
echo "--- [5/6] Backend health check ---"
MAX_RETRIES=15
RETRY_DELAY=6
for i in $(seq 1 $MAX_RETRIES); do
  STATUS=$(ssh_run "curl -sk -o /dev/null -w '%{http_code}' https://localhost/api/health" 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    echo "Backend health check passed (HTTP 200)"
    break
  fi
  echo "Attempt $i/$MAX_RETRIES: got HTTP $STATUS — retrying in ${RETRY_DELAY}s..."
  sleep "$RETRY_DELAY"
  if [ "$i" -eq "$MAX_RETRIES" ]; then
    echo "ERROR: Backend health check failed after $MAX_RETRIES attempts."
    echo "Review container logs: docker compose -f ${COMPOSE_FILE} logs backend nginx"
    echo "Refer to deploy-runbook.md for rollback instructions."
    exit 1
  fi
done

# ─── 6. Nginx / HTTPS check ────────────────────────────────────────────────────
echo "--- [6/6] Frontend HTTPS check ---"
FRONTEND_STATUS=$(ssh_run "curl -sk -o /dev/null -w '%{http_code}' https://localhost/" 2>/dev/null || echo "000")
if [ "$FRONTEND_STATUS" = "200" ]; then
  echo "Frontend HTTPS check passed (HTTP 200)"
else
  echo "WARNING: Frontend returned HTTP $FRONTEND_STATUS — check nginx logs."
  echo "  docker compose -f ${COMPOSE_FILE} logs nginx"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Production deploy complete — SHA: ${GIT_SHA}"
echo "║  Trigger Monitor Agent to run post-deploy health checks.     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
