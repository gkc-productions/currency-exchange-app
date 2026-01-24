#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
LIB_DIR="$ROOT_DIR/.playwright-libs"

if [ ! -d "$LIB_DIR/usr" ]; then
  "$ROOT_DIR/scripts/install-playwright-libs.sh"
fi

LIB_PATHS=(
  "$LIB_DIR/usr/lib/x86_64-linux-gnu"
  "$LIB_DIR/lib/x86_64-linux-gnu"
  "$LIB_DIR/usr/lib"
  "$LIB_DIR/lib"
)

EXTRA_PATH=""
for path in "${LIB_PATHS[@]}"; do
  if [ -d "$path" ]; then
    EXTRA_PATH+="${path}:"
  fi
done

export LD_LIBRARY_PATH="${EXTRA_PATH}${LD_LIBRARY_PATH:-}"

exec npx playwright "$@"
