#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_PATH="${1:-$ROOT_DIR/test-results/agent/tester-latest.json}"
PROMPT_PATH="$ROOT_DIR/test-results/agent/developer-prompt.txt"

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
  echo "[developer] dry-run enabled, codex exec skipped."
  exit 0
fi

echo "[developer] running codex exec..."

codex exec --cd "$ROOT_DIR" --full-auto - < "$PROMPT_PATH"
