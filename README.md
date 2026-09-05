# retro-api

Node.js + Express REST API for the Retrospective Lab.

## Setup

```bash
npm install
cp .env.example .env
npm start
```

API: http://localhost:3001/api/health

## Scripts

- `npm start` — run server
- `npm dev` — watch mode
- `npm test` — unit + integration tests

## Data

Stored in `data/retrospectives/{retroId}/` as JSON and Markdown files.
