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
DEV_EXIT=0
set +e
npm run agent:developer
DEV_EXIT=$?
set -e
if [[ "$DEV_EXIT" != "0" ]]; then
  echo "[loop] developer failed with exit code: $DEV_EXIT"
fi

echo "[loop] 3/3 tester (re-check)"
if npm run agent:tester; then
  bash "$ROOT_DIR/scripts/agents/notify.sh" "$TESTER_REPORT" "$DEVELOPER_REPORT" || true
  if [[ "$DEV_EXIT" != "0" ]]; then
    exit "$DEV_EXIT"
  fi
  exit 0
fi

bash "$ROOT_DIR/scripts/agents/notify.sh" "$TESTER_REPORT" "$DEVELOPER_REPORT" || true
if [[ "$DEV_EXIT" != "0" ]]; then
  exit "$DEV_EXIT"
fi
exit 1
