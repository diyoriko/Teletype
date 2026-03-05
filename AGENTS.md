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

Переменные окружения:

- `FIGMA_BASELINE_PATH` — путь до baseline PNG (по умолчанию `site/assets/figma/baselines/landing-ru-desktop.png`)
- `FIGMA_MAX_DIFF_RATIO` — максимальный допустимый процент отличий (по умолчанию `0.001` = 0.1%)
- `AGENT_TEST_PORT` — порт локального сервера (по умолчанию `4173`)

## Agent 2: Developer

Запуск:

```bash
npm run agent:developer
```

Что делает:

- читает `test-results/agent/tester-latest.json`
- формирует prompt по проваленным проверкам
- запускает `codex exec` в текущем репозитории для исправлений
- не запускается, если отчет уже `passed`

## Полный цикл

```bash
npm run agent:loop
```

`agent:loop` выполняет:

1. `Tester`
2. если есть ошибки — `Developer`
3. повторный `Tester`

## Baseline

Для 1:1 с Figma нужно один раз положить эталонный PNG в:

`site/assets/figma/baselines/landing-ru-desktop.png`

Эталон должен быть снят в desktop-варианте той же страницы/ноды Figma, что проверяется.
