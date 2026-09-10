# retro-api

Node.js + Express REST API for the Retrospective Lab.

## Setup

```bash
npm install
cp .env.example .env
npm start
```

API: http://localhost:3001/api/health

## Analysis model

| Source | How |
|--------|-----|
| **Cursor agent** (primary) | `/analyze-retro` → `POST /api/retrospectives/:id/analysis/import` |
| **Baseline** (tests only) | `POST /api/retrospectives/:id/analysis/generate/baseline` |

No external LLM API keys required. AI analysis uses the Cursor agent model.

See `docs/cursor-test-workflow.md` in the parent repo.

## Scripts

- `npm start` — run server
- `npm dev` — watch mode
- `npm test` — unit + integration tests

## Data

Stored in `data/retrospectives/{retroId}/` as JSON and Markdown files.
