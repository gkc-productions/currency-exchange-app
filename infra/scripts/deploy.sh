#!/usr/bin/env bash
set -euo pipefail

cd /var/www/clarisend

git pull

if [ -f package.json ]; then
  npm ci
fi

(
  cd apps/web
  npm ci
  npm run build
)

(
  cd apps/marketing
  npm ci
  npm run build
)

if ! command -v pm2 >/dev/null 2>&1; then
  echo "pm2 is not installed globally. Install PM2 to run deployment process management."
  exit 1
fi

if ! pm2 describe clarisend-web >/dev/null 2>&1; then
  pm2 start infra/pm2/ecosystem.config.cjs --only clarisend-web --update-env
fi

if ! pm2 describe clarisend-marketing >/dev/null 2>&1; then
  pm2 start infra/pm2/ecosystem.config.cjs --only clarisend-marketing --update-env
fi

pm2 reload infra/pm2/ecosystem.config.cjs --update-env
pm2 save
pm2 ls
