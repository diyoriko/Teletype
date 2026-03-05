#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$ROOT_DIR"

echo "[loop] 1/3 tester"
if npm run agent:tester; then
  echo "[loop] tester passed on first run"
  exit 0
fi

echo "[loop] 2/3 developer"
npm run agent:developer

echo "[loop] 3/3 tester (re-check)"
npm run agent:tester
