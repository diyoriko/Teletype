#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TESTER_REPORT="$ROOT_DIR/test-results/agent/tester-latest.json"
DEVELOPER_REPORT="$ROOT_DIR/test-results/agent/developer-latest.json"

cd "$ROOT_DIR"

echo "[loop] 1/3 tester"
if npm run agent:tester; then
  echo "[loop] tester passed on first run"
  bash "$ROOT_DIR/scripts/agents/notify.sh" "$TESTER_REPORT" "$DEVELOPER_REPORT" || true
  exit 0
fi

echo "[loop] 2/3 developer"
npm run agent:developer

echo "[loop] 3/3 tester (re-check)"
if npm run agent:tester; then
  bash "$ROOT_DIR/scripts/agents/notify.sh" "$TESTER_REPORT" "$DEVELOPER_REPORT" || true
  exit 0
fi

bash "$ROOT_DIR/scripts/agents/notify.sh" "$TESTER_REPORT" "$DEVELOPER_REPORT" || true
exit 1
