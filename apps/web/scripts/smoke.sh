#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://127.0.0.1:3000}
FAIL=0

check_status_allowed() {
  local path=$1
  local allowed=$2
  local status

  if ! status=$(curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 2 --max-time 5 "$BASE_URL$path"); then
    echo "FAIL $path (unreachable)"
    FAIL=1
    return
  fi

  for code in $allowed; do
    if [[ "$status" == "$code" ]]; then
      echo "PASS $path ($status)"
      return
    fi
  done

  echo "FAIL $path ($status)"
  FAIL=1
}

check_status_exact() {
  local path=$1
  local status

  if ! status=$(curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 2 --max-time 5 "$BASE_URL$path"); then
    echo "FAIL $path (unreachable)"
    FAIL=1
    return
  fi

  if [[ "$status" != "200" ]]; then
    echo "FAIL $path ($status)"
    FAIL=1
    return
  fi

  echo "PASS $path ($status)"
}

check_status_json() {
  local path=$1
  local tmpfile
  local status

  tmpfile=$(mktemp)
  if ! status=$(curl -sS -o "$tmpfile" -w "%{http_code}" --connect-timeout 2 --max-time 5 "$BASE_URL$path"); then
    echo "FAIL $path (unreachable)"
    rm -f "$tmpfile"
    FAIL=1
    return
  fi

  if [[ "$status" != "200" ]]; then
    echo "FAIL $path ($status)"
    rm -f "$tmpfile"
    FAIL=1
    return
  fi

  if ! python3 -c 'import sys,json; json.load(sys.stdin)' < "$tmpfile" >/dev/null 2>&1; then
    echo "FAIL $path (invalid JSON)"
    rm -f "$tmpfile"
    FAIL=1
    return
  fi

  echo "PASS $path ($status, JSON)"
  rm -f "$tmpfile"
}

check_status_allowed "/en" "200 307"
check_status_allowed "/fr" "200 307"
check_status_exact "/api/assets"
check_status_json "/api/status"

if [[ "$FAIL" -eq 0 ]]; then
  echo "SMOKE: PASS"
  exit 0
fi

echo "SMOKE: FAIL"
exit 1
