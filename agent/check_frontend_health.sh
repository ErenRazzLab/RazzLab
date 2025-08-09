#!/usr/bin/env bash
set -euo pipefail
URL="http://127.0.0.1:3000/health"
echo "Checking frontend health page: $URL"
code=$(curl -s -o /tmp/fhealth.html -w "%{http_code}" "$URL")
echo "HTTP $code"
if [ "$code" != "200" ]; then
  echo "Frontend /health not reachable" >&2
  exit 1
fi
grep -qi "healthy" /tmp/fhealth.html && echo "Frontend health shows healthy" && exit 0
echo "Frontend health not healthy:"
sed -n '1,120p' /tmp/fhealth.html
exit 2
