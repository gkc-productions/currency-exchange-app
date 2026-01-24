#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$WEB_DIR/../.." && pwd)"
ENV_FILE="${ENV_FILE:-/etc/clarisend/clarisend-web.env}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  . "$ENV_FILE"
  set +a
fi

echo "Updating repo at $REPO_ROOT"
git -C "$REPO_ROOT" pull origin main

cd "$WEB_DIR"

if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

npx prisma generate

if [[ -n "${DATABASE_URL:-}" ]]; then
  npx prisma migrate deploy
else
  echo "DATABASE_URL not set; skipping prisma migrate deploy"
fi

npm run build

if ! command -v pm2 >/dev/null 2>&1; then
  echo "pm2 not found; install it with: npm install -g pm2" >&2
  exit 1
fi

if pm2 describe clarisend-web >/dev/null 2>&1; then
  pm2 restart clarisend-web --update-env
else
  pm2 start ops/ecosystem.config.cjs --env production
fi

pm2 save

echo "Deploy complete."
