#!/usr/bin/env bash
set -euo pipefail
: "${NEXT_PUBLIC_API_BASE:?Set NEXT_PUBLIC_API_BASE env var}"
URL="${NEXT_PUBLIC_API_BASE%/}/health"
echo "Checking backend: $URL"
code=$(curl -s -o /tmp/health.json -w "%{http_code}" "$URL")
echo "HTTP $code"
cat /tmp/health.json
echo
if [ "$code" != "200" ]; then
  echo "Backend not healthy: HTTP $code" >&2
  exit 1
fi
ok=$(jq -r '.ok // empty' /tmp/health.json 2>/dev/null || echo "")
if [ "$ok" != "true" ]; then
  echo "Backend /health did not return {ok:true}" >&2
  exit 2
fi
echo "Backend healthy"
