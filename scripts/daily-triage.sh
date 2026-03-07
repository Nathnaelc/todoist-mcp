#!/usr/bin/env bash
set -euo pipefail

PROJECT_FILTER="${1:-today}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/logs"
TIMESTAMP="$(date +"%Y-%m-%d_%H-%M-%S")"
OUT_FILE="$LOG_DIR/triage-$TIMESTAMP.json"

if [[ -z "${TODOIST_API_TOKEN:-}" ]]; then
  echo "ERROR: TODOIST_API_TOKEN is not set. Export it before running this script."
  exit 1
fi

mkdir -p "$LOG_DIR"

cd "$ROOT_DIR"
npm run mcp:call -- --tool get_tasks --args "{\"filter\":\"${PROJECT_FILTER}\"}" > "$OUT_FILE"

echo "Saved triage output to: $OUT_FILE"
