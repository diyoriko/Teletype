#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TESTER_REPORT="${1:-$ROOT_DIR/test-results/agent/tester-latest.json}"
DEVELOPER_REPORT="${2:-$ROOT_DIR/test-results/agent/developer-latest.json}"

if [[ ! -f "$TESTER_REPORT" ]]; then
  echo "[notify] tester report not found: $TESTER_REPORT"
  exit 1
fi

python3 - "$TESTER_REPORT" "$DEVELOPER_REPORT" <<'PY'
import json
import subprocess
import sys
from pathlib import Path


def safe_read(path: Path):
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


tester = safe_read(Path(sys.argv[1])) or {}
developer = safe_read(Path(sys.argv[2])) or {}

overall = tester.get("status", "failed")
visual = tester.get("visual", {})

title = "Codex Agents: PASS" if overall == "passed" else "Codex Agents: FAIL"
subtitle = f"Tester: {overall}"

parts = []
checks = tester.get("checks", [])
for c in checks:
    parts.append(f"{c.get('name')}={c.get('status')}")

if visual.get("diff_ratio") is not None:
    parts.append(f"diff={visual['diff_ratio']:.4%}")

if developer:
    if developer.get("committed"):
        sha = developer.get("commit_sha", "")[:7]
        parts.append(f"dev_commit={sha}")
    elif developer.get("status") == "skipped":
        parts.append("dev=skipped")

message = " | ".join(parts)[:220]

print(f"[notify] {title} | {message}")

applescript = r'''
on run argv
  set t to item 1 of argv
  set s to item 2 of argv
  set m to item 3 of argv
  display notification m with title t subtitle s
end run
'''
subprocess.run(["osascript", "-", title, subtitle, message], input=applescript, text=True, check=False)
PY
