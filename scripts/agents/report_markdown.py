#!/usr/bin/env python3
"""Build markdown report from tester/developer JSON outputs."""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path


def load_json(path: Path):
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def fmt_pct(value):
    if value is None:
        return "n/a"
    return f"{value * 100:.4f}%"


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    tester_path = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "test-results/agent/tester-latest.json"
    developer_path = Path(sys.argv[2]) if len(sys.argv) > 2 else root / "test-results/agent/developer-latest.json"

    tester = load_json(tester_path)
    developer = load_json(developer_path)

    now = time.strftime("%Y-%m-%d %H:%M:%SZ", time.gmtime())
    run_url = os.environ.get("GITHUB_SERVER_URL", "")
    repo = os.environ.get("GITHUB_REPOSITORY", "")
    run_id = os.environ.get("GITHUB_RUN_ID", "")

    run_link = ""
    if run_url and repo and run_id:
        run_link = f"{run_url}/{repo}/actions/runs/{run_id}"

    lines = []
    lines.append(f"# Codex Agents Report ({now})")
    if run_link:
        lines.append(f"Run: {run_link}")
    lines.append("")

    if not tester:
        lines.append("## Tester")
        lines.append("Status: `missing`")
    else:
        lines.append("## Tester")
        lines.append(f"Status: `{tester.get('status', 'unknown')}`")
        ts = tester.get("timestamp")
        if ts:
            lines.append(f"Timestamp: `{ts}`")

        checks = tester.get("checks", [])
        if checks:
            lines.append("")
            lines.append("| Check | Status |")
            lines.append("|---|---|")
            for c in checks:
                lines.append(f"| {c.get('name', 'unknown')} | `{c.get('status', 'unknown')}` |")

        visual = tester.get("visual", {})
        if visual:
            lines.append("")
            lines.append("### Visual")
            lines.append(f"- status: `{visual.get('status', 'unknown')}`")
            if visual.get("reason"):
                lines.append(f"- reason: `{visual.get('reason')}`")
            lines.append(f"- diff_ratio: `{fmt_pct(visual.get('diff_ratio'))}`")
            max_ratio = visual.get("max_diff_ratio")
            if max_ratio is not None:
                lines.append(f"- max_diff_ratio: `{fmt_pct(max_ratio)}`")
            if visual.get("expected"):
                exp = visual["expected"]
                lines.append(f"- expected: `{exp.get('width')}x{exp.get('height')}`")
            if visual.get("actual"):
                act = visual["actual"]
                lines.append(f"- actual: `{act.get('width')}x{act.get('height')}`")

        figma = tester.get("figma", {})
        if figma:
            lines.append("")
            lines.append("### Figma")
            if figma.get("file_key"):
                lines.append(f"- file_key: `{figma['file_key']}`")
            if figma.get("node_id"):
                lines.append(f"- node_id: `{figma['node_id']}`")

        recommended = tester.get("recommended_fixes") or []
        if recommended:
            lines.append("")
            lines.append("### Recommended Fixes")
            for item in recommended:
                lines.append(f"- {item}")

        artifacts = tester.get("artifacts", {})
        if artifacts:
            lines.append("")
            lines.append("### Artifacts")
            for key in ("baseline", "actual", "log"):
                if artifacts.get(key):
                    lines.append(f"- {key}: `{artifacts[key]}`")

    lines.append("")
    lines.append("## Developer")
    if not developer:
        lines.append("Status: `missing`")
    else:
        lines.append(f"Status: `{developer.get('status', 'unknown')}`")
        if developer.get("timestamp"):
            lines.append(f"- timestamp: `{developer.get('timestamp')}`")
        if developer.get("reason"):
            lines.append(f"- reason: `{developer.get('reason')}`")
        if developer.get("exit_code") is not None:
            lines.append(f"- exit_code: `{developer.get('exit_code')}`")
        if "committed" in developer:
            lines.append(f"- committed: `{developer.get('committed')}`")
        if "pushed" in developer:
            lines.append(f"- pushed: `{developer.get('pushed')}`")
        if developer.get("commit_sha"):
            lines.append(f"- commit_sha: `{developer.get('commit_sha')}`")
        changed = developer.get("changed_files") or []
        if changed:
            lines.append("- changed_files:")
            for file in changed[:40]:
                lines.append(f"  - `{file}`")

    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
