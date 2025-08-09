#!/usr/bin/env bash
set -euo pipefail
PORT="${1:-3000}"
TIMEOUT="${2:-60}"
echo "Waiting for port $PORT up to $TIMEOUT seconds"
for i in $(seq 1 "$TIMEOUT"); do
  if (echo > /dev/tcp/127.0.0.1/$PORT) >/dev/null 2>&1; then
    echo "Port $PORT is open"
    exit 0
  fi
  sleep 1
done
echo "Timeout waiting for port $PORT" >&2
exit 1
