#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${TODOIST_API_TOKEN:-}" ]]; then
  echo "TODOIST_API_TOKEN is required" >&2
  exit 1
fi

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

mkdir -p logs
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUT_FILE="logs/salesforce-quick-triage-${TIMESTAMP}.json"

npm run mcp:call -- --tool get_tasks --args '{"filter":"#Salesforce_quick & (overdue | today)"}' > "$OUT_FILE"

echo "Saved triage snapshot to $OUT_FILE"
