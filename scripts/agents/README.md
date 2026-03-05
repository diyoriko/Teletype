# Agents Scripts

## Tester

```bash
npm run agent:tester
```

Outputs:

- `test-results/agent/tester-latest.json`
- `test-results/agent/current.png`
- `test-results/agent/tester.log`

## Developer

```bash
npm run agent:developer
```

By default Developer:

- runs `codex exec` to implement tester findings
- uses full-access codex mode (`--dangerously-bypass-approvals-and-sandbox`)
- commits changes
- pushes to `origin/Codex`

Dry run (only build prompt, no auto-fix):

```bash
DEVELOPER_DRY_RUN=1 npm run agent:developer
```

Disable auto commit/push:

```bash
DEVELOPER_AUTO_COMMIT=0 npm run agent:developer
DEVELOPER_AUTO_PUSH=0 npm run agent:developer
```

Disable full-access mode (fallback to sandboxed full-auto):

```bash
DEVELOPER_FULL_ACCESS_MODE=0 npm run agent:developer
```

Override codex exec timeout (seconds):

```bash
DEVELOPER_EXEC_TIMEOUT_SEC=300 npm run agent:developer
```

## Loop

```bash
npm run agent:loop
```

`agent:loop` also triggers a macOS notification with run summary.

## Hourly schedule (macOS)

Install:

```bash
npm run agent:hourly:install
```

Uninstall:

```bash
npm run agent:hourly:uninstall
```

## GitHub hourly reports

See workflow:

- `.github/workflows/agents-hourly-report.yml`

It publishes:

- run summary in Actions UI
- latest consolidated report into issue `Codex Agents: Latest Hourly Report`
