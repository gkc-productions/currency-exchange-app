#!/usr/bin/env bash
set -euo pipefail

PORT=3000

if output=$(lsof -i :"$PORT" -n -P 2>/dev/null); then
  echo "Port $PORT is already in use. Refusing to start."
  line=$(echo "$output" | awk 'NR==2 {print}')
  if [[ -n "$line" ]]; then
    cmd=$(echo "$line" | awk '{print $1}')
    pid=$(echo "$line" | awk '{print $2}')
    echo "COMMAND: $cmd"
    echo "PID: $pid"
  fi
  echo "$output"
  exit 1
fi

exit 0
