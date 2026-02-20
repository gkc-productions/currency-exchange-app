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

# Marketing runs with Next standalone output, so bundle runtime static and public assets.
mkdir -p apps/marketing/.next/standalone/.next
rm -rf apps/marketing/.next/standalone/.next/static
rm -rf apps/marketing/.next/standalone/public
cp -R apps/marketing/.next/static apps/marketing/.next/standalone/.next/static
cp -R apps/marketing/public apps/marketing/.next/standalone/public

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

chunk_file=$(find apps/marketing/.next/static/chunks -type f -name "*.js" | head -n 1 || true)
if [ -n "${chunk_file}" ]; then
  chunk_path="/_next/static/${chunk_file#apps/marketing/.next/static/}"
  echo "Verifying marketing chunk: ${chunk_path}"
  curl -fsS "http://127.0.0.1:3001${chunk_path}" >/dev/null
else
  echo "No marketing chunk file found to verify."
fi

pm2 save
pm2 ls
