#!/usr/bin/env bash
set -euo pipefail
TITLE="${1:-RazzLab wiring + CI}"
BODY="${2:-This PR wires API client, health page, and CI.}"
BRANCH="agent/wire-health-$(date +%s)"

git checkout -b "$BRANCH"
git add -A
git commit -m "$TITLE"
git push -u origin "$BRANCH"

if command -v gh >/dev/null 2>&1; then
  gh pr create --title "$TITLE" --body "$BODY"
  gh pr merge --squash --auto
else
  echo "Install GitHub CLI 'gh' to auto-open and merge the PR." >&2
fi
