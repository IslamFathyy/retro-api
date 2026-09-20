# retro-api — Backend Agent

Node.js + Express REST API. Local JSON/Markdown storage under `data/`. Port **3001**.

## Architecture

```text
routes → controllers → services → file-storage
```

- No business logic in route files.
- Validators in `src/validators/`; shared config in `src/config/`.
- AI analysis is **imported** via `POST .../analysis/import` — no external LLM calls in this repo.

## Before editing

1. Read parent [`../AGENTS.md`](../AGENTS.md) for multi-repo routing.
2. Apply root rules: [`../.cursor/rules/privacy.mdc`](../.cursor/rules/privacy.mdc), [`development.mdc`](../.cursor/rules/development.mdc).
3. Apply this repo’s rules in [`.cursor/rules/`](.cursor/rules/).

## Data boundaries

- Read/write only under `data/retrospectives/{retroId}/` via `file-storage.service.js`.
- Never rewrite original feedback `text` (API + privacy rule).
- Atomic writes; safe IDs; no arbitrary path access.

## Tests

```bash
npm test
```

Run after API, validator, or service changes. Required before finishing backend work.

**CI:** GitHub Actions runs `npm test` on push/PR — [`.github/workflows/test.yml`](.github/workflows/test.yml). See root [`docs/automation-tiers.md`](../docs/automation-tiers.md).

## Commands that touch this repo

| Parent command | API surface |
|----------------|-------------|
| `/seed-demo-retro` | Creates demo data |
| `/close-retro` | `POST .../close` |
| `/analyze-retro` | `POST .../analysis/import` |
| `/approve-suggestions` | `POST .../actions/from-suggestion/:id` |
| `/generate-report` | `POST .../report/generate` |

Full workflow: [`../docs/cursor-test-workflow.md`](../docs/cursor-test-workflow.md).
