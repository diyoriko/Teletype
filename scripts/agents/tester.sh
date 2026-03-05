#!/usr/bin/env bash
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_DIR="$ROOT_DIR/test-results/agent"
mkdir -p "$REPORT_DIR"

REPORT_PATH="$REPORT_DIR/tester-latest.json"
VISUAL_JSON="$REPORT_DIR/visual-latest.json"
ACTUAL_PNG="$REPORT_DIR/current.png"
LOG_PATH="$REPORT_DIR/tester.log"

BASELINE_PATH="${FIGMA_BASELINE_PATH:-$ROOT_DIR/site/assets/figma/baselines/landing-ru-desktop.png}"
MAX_DIFF_RATIO="${FIGMA_MAX_DIFF_RATIO:-0.001}"
FIGMA_FILE_KEY="${FIGMA_FILE_KEY:-052jml4BX3L4zHulq0mJT8}"
FIGMA_NODE_ID="${FIGMA_NODE_ID:-1390:5395}"
if [[ -n "${AGENT_TEST_PORT:-}" ]]; then
  PORT="${AGENT_TEST_PORT}"
else
  PORT="$(( (RANDOM % 20000) + 40000 ))"
fi
if [[ -z "${PORT}" ]]; then
  PORT="4173"
fi
URL="http://127.0.0.1:${PORT}/site/index.html"

TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

echo "[tester] start: $TIMESTAMP" | tee "$LOG_PATH"
echo "[tester] root: $ROOT_DIR" | tee -a "$LOG_PATH"
echo "[tester] baseline: $BASELINE_PATH" | tee -a "$LOG_PATH"
echo "[tester] url: $URL" | tee -a "$LOG_PATH"

LINT_STATUS="failed"
BUILD_STATUS="failed"
VISUAL_STATUS="failed"
VISUAL_SUMMARY='{"status":"failed","reason":"not_run"}'
SCREENSHOT_BROWSER=""

run_step() {
  local step_name="$1"
  shift
  echo "[tester] step: $step_name" | tee -a "$LOG_PATH"
  if (cd "$ROOT_DIR" && "$@") >>"$LOG_PATH" 2>&1; then
    echo "[tester] step_ok: $step_name" | tee -a "$LOG_PATH"
    return 0
  fi
  echo "[tester] step_fail: $step_name" | tee -a "$LOG_PATH"
  return 1
}

if run_step lint npm run lint; then
  LINT_STATUS="passed"
fi

if run_step build npm run build; then
  BUILD_STATUS="passed"
fi

if [[ -f "$BASELINE_PATH" ]]; then
  SERVER_LOG="$REPORT_DIR/server.log"
  python3 -m http.server "$PORT" --directory "$ROOT_DIR" >"$SERVER_LOG" 2>&1 &
  SERVER_PID=$!

  cleanup() {
    if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" >/dev/null 2>&1; then
      kill "$SERVER_PID" >/dev/null 2>&1 || true
      wait "$SERVER_PID" 2>/dev/null || true
    fi
  }
  trap cleanup EXIT

  sleep 1

  screenshot_ok=0
  for browser in chromium webkit firefox; do
    for attempt in 1 2; do
      echo "[tester] screenshot try: browser=$browser attempt=$attempt" | tee -a "$LOG_PATH"
      if run_step "screenshot_${browser}_${attempt}" npx playwright screenshot --browser "$browser" --full-page --wait-for-timeout 1200 --viewport-size "1512,982" "$URL" "$ACTUAL_PNG"; then
        screenshot_ok=1
        SCREENSHOT_BROWSER="$browser"
        break 2
      fi
      sleep 1
    done
  done

  if [[ "$screenshot_ok" == "1" ]]; then
    if VISUAL_SUMMARY="$(python3 "$ROOT_DIR/scripts/agents/png_diff.py" --expected "$BASELINE_PATH" --actual "$ACTUAL_PNG" --max-diff-ratio "$MAX_DIFF_RATIO" --json-out "$VISUAL_JSON")"; then
      VISUAL_STATUS="passed"
    else
      VISUAL_STATUS="failed"
    fi
  else
    VISUAL_STATUS="failed"
    VISUAL_SUMMARY='{"status":"failed","reason":"screenshot_failed"}'
  fi

  cleanup
  trap - EXIT
else
  VISUAL_STATUS="failed"
  VISUAL_SUMMARY='{"status":"failed","reason":"missing_baseline","message":"Provide FIGMA baseline PNG"}'
fi

OVERALL="passed"
if [[ "$LINT_STATUS" != "passed" || "$BUILD_STATUS" != "passed" || "$VISUAL_STATUS" != "passed" ]]; then
  OVERALL="failed"
fi

SCREENSHOT_BROWSER="${SCREENSHOT_BROWSER}" FIGMA_FILE_KEY="${FIGMA_FILE_KEY}" FIGMA_NODE_ID="${FIGMA_NODE_ID}" python3 - "$REPORT_PATH" "$TIMESTAMP" "$OVERALL" "$LINT_STATUS" "$BUILD_STATUS" "$VISUAL_STATUS" "$BASELINE_PATH" "$ACTUAL_PNG" "$LOG_PATH" "$VISUAL_SUMMARY" <<'PY'
import json
import os
import sys
from pathlib import Path

(
    report_path,
    timestamp,
    overall,
    lint_status,
    build_status,
    visual_status,
    baseline_path,
    actual_png,
    log_path,
    visual_summary,
) = sys.argv[1:]

report = {
    "timestamp": timestamp,
    "status": overall,
    "checks": [
        {"name": "lint", "status": lint_status},
        {"name": "build", "status": build_status},
        {"name": "visual_parity", "status": visual_status},
    ],
    "artifacts": {
        "baseline": baseline_path,
        "actual": actual_png,
        "log": log_path,
    },
    "runtime": {
        "screenshot_browser": os.environ.get("SCREENSHOT_BROWSER", ""),
    },
    "figma": {
        "file_key": os.environ.get("FIGMA_FILE_KEY", ""),
        "node_id": os.environ.get("FIGMA_NODE_ID", ""),
    },
    "visual": json.loads(visual_summary),
}

recommended_fixes = []
visual = report["visual"]
if visual.get("reason") == "dimension_mismatch":
    exp = visual.get("expected", {})
    act = visual.get("actual", {})
    if exp and act:
        height_delta = int(exp.get("height", 0)) - int(act.get("height", 0))
        if height_delta > 0:
            recommended_fixes.append(
                f"Страница короче baseline на {height_delta}px. Проверь пропущенные секции или вертикальные отступы."
            )
        elif height_delta < 0:
            recommended_fixes.append(
                f"Страница длиннее baseline на {abs(height_delta)}px. Проверь лишние блоки или завышенные отступы."
            )
if visual.get("reason") == "screenshot_failed":
    recommended_fixes.append(
        "Screenshot не снят. Перезапусти tester; если повторяется, проверь доступность headless браузера."
    )
if visual.get("diff_ratio") is not None:
    recommended_fixes.append(
        f"Pixel diff: {visual['diff_ratio']:.4%} при лимите {visual.get('max_diff_ratio', 0):.4%}."
    )

report["recommended_fixes"] = recommended_fixes

Path(report_path).write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(report, ensure_ascii=False))
PY

if [[ "$OVERALL" == "passed" ]]; then
  echo "[tester] result: passed" | tee -a "$LOG_PATH"
  exit 0
fi

echo "[tester] result: failed" | tee -a "$LOG_PATH"
exit 1
