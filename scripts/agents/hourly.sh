#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_DIR="$ROOT_DIR/test-results/agent"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/hourly.log"

{
  echo "==== $(date -u +%Y-%m-%dT%H:%M:%SZ) ===="
  cd "$ROOT_DIR"
  npm run agent:loop
  echo "hourly run completed"
} >>"$LOG_FILE" 2>&1
