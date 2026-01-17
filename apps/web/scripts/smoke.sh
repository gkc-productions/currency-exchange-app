#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3000}

curl -fsS "$BASE_URL/api/assets" > /dev/null
curl -fsS "$BASE_URL/api/quote?from=USD&to=GHS&rail=MOBILE_MONEY&sendAmount=250" > /dev/null
curl -fsS "$BASE_URL/api/recommendations?from=USD&to=GHS&sendAmount=250" > /dev/null

echo "Smoke checks passed for $BASE_URL"
