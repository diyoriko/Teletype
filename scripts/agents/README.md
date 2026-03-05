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

Dry run (only build prompt, no auto-fix):

```bash
DEVELOPER_DRY_RUN=1 npm run agent:developer
```

## Loop

```bash
npm run agent:loop
```
