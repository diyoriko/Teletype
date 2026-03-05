#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_PATH="${1:-$ROOT_DIR/test-results/agent/tester-latest.json}"
PROMPT_PATH="$ROOT_DIR/test-results/agent/developer-prompt.txt"
DEV_REPORT_PATH="$ROOT_DIR/test-results/agent/developer-latest.json"
TARGET_BRANCH="${DEVELOPER_TARGET_BRANCH:-Codex}"
AUTO_COMMIT="${DEVELOPER_AUTO_COMMIT:-1}"
AUTO_PUSH="${DEVELOPER_AUTO_PUSH:-1}"

cd "$ROOT_DIR"

CURRENT_BRANCH="$(git -C "$ROOT_DIR" rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]]; then
  echo "[developer] switching branch: $CURRENT_BRANCH -> $TARGET_BRANCH"
  git -C "$ROOT_DIR" checkout "$TARGET_BRANCH"
fi

if [[ ! -f "$REPORT_PATH" ]]; then
  echo "[developer] tester report not found: $REPORT_PATH"
  echo "[developer] run: npm run agent:tester"
  exit 1
fi

STATUS="$(python3 - "$REPORT_PATH" <<'PY'
import json, sys
from pathlib import Path
p = Path(sys.argv[1])
obj = json.loads(p.read_text(encoding='utf-8'))
print(obj.get('status', 'failed'))
PY
)"

if [[ "$STATUS" == "passed" ]]; then
  echo "[developer] tester report already passed. Nothing to implement."
  exit 0
fi

python3 - "$REPORT_PATH" "$PROMPT_PATH" <<'PY'
import json
import sys
from pathlib import Path

report = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
out = Path(sys.argv[2])

failed = [c for c in report.get('checks', []) if c.get('status') != 'passed']
failed_names = ', '.join(c.get('name', 'unknown') for c in failed) if failed else 'unknown'
visual = report.get('visual', {})

prompt = f"""Ты агент Developer для этого репозитория.

Контекст:
- Нужно исправить всё, что вернул Tester.
- Не трогай лишние файлы.
- Работай в первую очередь с site/index.html, site/styles.css, site/script.js.

Текущий отчет Tester:
- Общий статус: {report.get('status')}
- Проваленные проверки: {failed_names}
- Visual summary: {json.dumps(visual, ensure_ascii=False)}
- Baseline: {report.get('artifacts', {}).get('baseline')}
- Actual screenshot: {report.get('artifacts', {}).get('actual')}

Задача:
1) Исправь причины падения.
2) Сохрани изменения в файлы.
3) В конце кратко перечисли, что исправлено.

Важно:
- Цель: 1:1 визуальное соответствие Figma baseline.
- Не добавляй новых зависимостей без необходимости.
"""

out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(prompt, encoding='utf-8')
print(str(out))
PY

echo "[developer] prompt prepared: $PROMPT_PATH"
if [[ "${DEVELOPER_DRY_RUN:-0}" == "1" ]]; then
  python3 - "$DEV_REPORT_PATH" <<'PY'
import json
import time
import sys
from pathlib import Path

Path(sys.argv[1]).write_text(
    json.dumps(
        {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "status": "skipped",
            "reason": "dry_run",
            "committed": False,
            "pushed": False,
        },
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)
PY
  echo "[developer] dry-run enabled, codex exec skipped."
  exit 0
fi

echo "[developer] running codex exec..."

codex exec --cd "$ROOT_DIR" --full-auto - < "$PROMPT_PATH"

if [[ "$AUTO_COMMIT" != "1" ]]; then
  echo "[developer] auto-commit disabled."
  python3 - "$DEV_REPORT_PATH" <<'PY'
import json
import subprocess
import sys
import time
from pathlib import Path

repo = Path.cwd()
status = subprocess.run(
    ["git", "-C", str(repo), "status", "--short"],
    capture_output=True,
    text=True,
    check=False,
).stdout.strip().splitlines()

Path(sys.argv[1]).write_text(
    json.dumps(
        {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "status": "completed",
            "committed": False,
            "pushed": False,
            "changed_files": [line[3:] for line in status if len(line) > 3],
        },
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)
PY
  exit 0
fi

if [[ -z "$(git -C "$ROOT_DIR" status --short)" ]]; then
  echo "[developer] no changes to commit."
  python3 - "$DEV_REPORT_PATH" <<'PY'
import json
import time
import sys
from pathlib import Path

Path(sys.argv[1]).write_text(
    json.dumps(
        {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "status": "completed",
            "committed": False,
            "pushed": False,
            "changed_files": [],
        },
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)
PY
  exit 0
fi

git -C "$ROOT_DIR" add -A
if git -C "$ROOT_DIR" diff --cached --quiet; then
  echo "[developer] nothing staged after add."
else
  COMMIT_MSG="agent(developer): apply tester fixes $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  git -C "$ROOT_DIR" commit -m "$COMMIT_MSG"
fi

COMMIT_SHA="$(git -C "$ROOT_DIR" rev-parse HEAD)"
PUSHED="false"
if [[ "$AUTO_PUSH" == "1" ]]; then
  if git -C "$ROOT_DIR" push origin "$TARGET_BRANCH"; then
    PUSHED="true"
  fi
fi

python3 - "$DEV_REPORT_PATH" "$COMMIT_SHA" "$PUSHED" <<'PY'
import json
import subprocess
import sys
import time
from pathlib import Path

repo = Path.cwd()
commit_sha = sys.argv[2]
pushed = sys.argv[3] == "true"
status = subprocess.run(
    ["git", "-C", str(repo), "show", "--name-only", "--pretty=format:", "HEAD"],
    capture_output=True,
    text=True,
    check=False,
).stdout.strip().splitlines()

Path(sys.argv[1]).write_text(
    json.dumps(
        {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "status": "completed",
            "committed": True,
            "pushed": pushed,
            "commit_sha": commit_sha,
            "changed_files": [line for line in status if line.strip()],
        },
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)
PY

echo "[developer] commit: $COMMIT_SHA"
echo "[developer] pushed: $PUSHED"
