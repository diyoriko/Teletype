# Agents Workflow

В проекте работают два агента с фиксированным циклом:

1. `Tester` проверяет качество и визуальную точность относительно Figma baseline.
2. `Developer` читает отчет `Tester` и исправляет только зафиксированные проблемы.

## Agent 1: Tester

Запуск:

```bash
npm run agent:tester
```

Что делает:

- запускает `npm run lint`
- запускает `npm run build`
- поднимает локальный сервер для `site/`
- делает screenshot страницы через Playwright CLI
- считает пиксельный diff с baseline PNG
- сохраняет отчет:
  - `test-results/agent/tester-latest.json`
  - `test-results/agent/current.png`
  - `test-results/agent/tester.log`

Переменные окружения:

- `FIGMA_BASELINE_PATH` — путь до baseline PNG (по умолчанию `site/assets/figma/baselines/landing-ru-desktop.png`)
- `FIGMA_MAX_DIFF_RATIO` — максимальный допустимый процент отличий (по умолчанию `0.001` = 0.1%)
- `AGENT_TEST_PORT` — порт локального сервера (если не указан, выбирается автоматически)

## Agent 2: Developer

Запуск:

```bash
npm run agent:developer
```

Что делает:

- читает `test-results/agent/tester-latest.json`
- формирует prompt по проваленным проверкам
- запускает `codex exec` в текущем репозитории для исправлений
- если есть изменения — автоматически коммитит и пушит в ветку `Codex`
- сохраняет отчет: `test-results/agent/developer-latest.json`
- не запускается, если отчет уже `passed`

Переменные окружения:

- `DEVELOPER_TARGET_BRANCH` — целевая ветка (по умолчанию `Codex`)
- `DEVELOPER_AUTO_COMMIT` — автокоммит (`1`/`0`, по умолчанию `1`)
- `DEVELOPER_AUTO_PUSH` — автопуш (`1`/`0`, по умолчанию `1`)
- `DEVELOPER_DRY_RUN` — dry-run (`1`/`0`)

## Полный цикл

```bash
npm run agent:loop
```

`agent:loop` выполняет:

1. `Tester`
2. если есть ошибки — `Developer`
3. повторный `Tester`
4. системное уведомление в macOS с итогом прогона

## Уведомления

Запуск ручного уведомления:

```bash
npm run agent:notify
```

Уведомление показывает итог проверок и, если был коммит, короткий SHA.

## Почасовой запуск (macOS)

Установить hourly-расписание:

```bash
npm run agent:hourly:install
```

Удалить расписание:

```bash
npm run agent:hourly:uninstall
```

## Почасовые репорты в GitHub UI

В репозитории добавлен workflow:

- `.github/workflows/agents-hourly-report.yml`

Он запускается каждый час и:

1. прогоняет `Tester`
2. прогоняет `Developer` в `dry-run` режиме (без авто-фиксов)
3. публикует summary в GitHub Actions UI
4. обновляет issue `Codex Agents: Latest Hourly Report` с последним отчетом

## Baseline

Для 1:1 с Figma нужно один раз положить эталонный PNG в:

`site/assets/figma/baselines/landing-ru-desktop.png`

Эталон должен быть снят в desktop-варианте той же страницы/ноды Figma, что проверяется.
