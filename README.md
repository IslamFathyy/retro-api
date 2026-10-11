# retro-api

> Retrospective Management REST API — local JSON storage

## Table of contents

- [Quick start](#quick-start)
- [5-minute setup](#5-minute-setup)
- [Prerequisites](#prerequisites)
- [Repository structure](#repository-structure)
- [Development ports](#development-ports)
- [Features](#features)
- [AI Agent Integration](#ai-agent-integration)
- [AI concepts in this repo](#ai-concepts-in-this-repo)
- [Security](#security)
- [Links](#links)

---

## Quick start

```bash
npm install

cp .env.example .env   # if present

npm start
```

---

## 5-minute setup

```bash
npm install
cp .env.example .env
npm start
npm test
```

Skim this README and project docs before changing production data.

---

## Prerequisites

- **Git**
- **Node.js 18+** and **npm**
- **Cursor** (commands, skills, MCP) when using agentic workflows

---

## Repository structure

```text
retro-api/
├── .cursor/    # Cursor IDE rules, agents, and workflow assets
├── .github/    # GitHub Actions and repository automation
├── config/    # Runtime configuration (JSON/YAML)
├── data/    # Local data / file storage
├── scripts/    # Maintenance and utility scripts
├── src/    # Application source code
├── tests/    # Automated tests
```

### Directory tree

- `.cursor/` — Cursor IDE rules, agents, and workflow assets
  - `.cursor/rules/`
    - `.cursor/rules/architecture.mdc`
    - `.cursor/rules/security.mdc`
    - `.cursor/rules/storage.mdc`
    - `.cursor/rules/testing.mdc`
- `.github/` — GitHub Actions and repository automation
  - `.github/workflows/`
    - `.github/workflows/test.yml`
- `config/` — Runtime configuration (JSON/YAML)
  - `config/action-teams.json`
  - `config/guardrails.json`
- `data/` — Local data / file storage
  - `data/retrospectives/`
    - `data/retrospectives/RETRO-2026-001/`
      - `data/retrospectives/RETRO-2026-001/feedback/`
    - `data/retrospectives/RETRO-2026-002/`
      - `data/retrospectives/RETRO-2026-002/feedback/`
    - `data/retrospectives/RETRO-2026-003/`
      - `data/retrospectives/RETRO-2026-003/feedback/`
    - `data/retrospectives/RETRO-2026-004/`
      - `data/retrospectives/RETRO-2026-004/feedback/`
  - `data/teams.json`
  - `data/theme-dictionary.json`
- `package-lock.json`
- `package.json`
- `README.md.backup`
- `scripts/` — Maintenance and utility scripts
  - `scripts/backfill-report-insights.js`
  - `scripts/export-reminder-snapshot.js`
  - `scripts/lib/`
    - `scripts/lib/clear-retrospectives.js`
  - `scripts/list-retro-state.js`
  - `scripts/repair-action-teams.js`
  - `scripts/reset-demo-data.js`
  - `scripts/seed-demo-data.js`
  - `scripts/seed-demo-retros.js`
- `src/` — Application source code
  - `src/app.js`
  - `src/config/` — Runtime configuration (JSON/YAML)
    - `src/config/action-teams.js`
    - `src/config/guardrails.js`
    - `src/config/paths.js`
  - `src/controllers/` — Request/response handlers
    - `src/controllers/feedback.controller.js`
    - `src/controllers/retrospectives.controller.js`
  - `src/routes/` — HTTP route definitions
    - `src/routes/retrospectives.routes.js`
  - `src/server.js`
  - `src/services/` — Business logic layer
    - `src/services/action.service.js`
    - `src/services/analysis.service.js`
    - `src/services/feedback.service.js`
    - `src/services/file-storage.service.js`
    - `src/services/id.service.js`
    - `src/services/report-insights.service.js`
    - `src/services/report.service.js`
    - `src/services/retrospective.service.js`
  - `src/utils/` — Shared utilities
    - `src/utils/dates.js`
    - `src/utils/errors.js`
    - `src/utils/ids.js`
    - `src/utils/json.js`
  - `src/validators/` — Input validation
    - `src/validators/action-teams.validator.js`
    - `src/validators/action.validator.js`
    - `src/validators/analysis.validator.js`
    - `src/validators/feedback.validator.js`
    - `src/validators/guardrails.validator.js`
    - `src/validators/report-insights.validator.js`
    - `src/validators/retrospective.validator.js`
- `tests/` — Automated tests
  - `tests/integration/`
    - `tests/integration/api.test.js`
    - `tests/integration/guardrails-api.test.js`
    - `tests/integration/report-insights-api.test.js`
  - `tests/unit/`
    - `tests/unit/action-teams-validator.test.js`
    - `tests/unit/analysis-validator.test.js`
    - `tests/unit/basics.test.js`
    - `tests/unit/clear-retrospectives.test.js`
    - `tests/unit/guardrails-validator.test.js`
    - `tests/unit/report-insights-validator.test.js`

### API surface

24 endpoints under `/api` (detected from route files). Details in [Features](#features).

---

## Development ports

| Service | URL | Notes |
| --- | --- | --- |
| Application | http://localhost:3001/api/api/health | `npm start` (PORT) |

Environment variables (from `.env.example` names only):

- `PORT` — example: `3001`
- `DATA_ROOT` — example: `./data`

---

## Features

Retrospective Management REST API — local JSON storage

### HTTP API capabilities

- **api** — exposes GET, POST, PUT on /api/api/action-teams, /api/api/actions/open, /api/api/comparison, /api/api/dashboard, … (detected from route files).

### Operational scripts

- `npm run seed:demo` — `node scripts/seed-demo-retros.js`
- `npm run export:reminder` — `node scripts/export-reminder-snapshot.js`
- `npm run reset:demo` — `node scripts/reset-demo-data.js`

### Local data

- File-backed storage under `data/` (no database detected).

### Automation

- CI runs on push/PR via GitHub Actions (`test`).

---

## AI Agent Integration

Cursor agents may use commands, skills, and sub-agents in this repository. Application runtime should not call MCP unless explicitly designed to — check `AGENTS.md` when present.

---

## AI concepts in this repo

| Concept | Location |
| --- | --- |
| **rule** | `.cursor/rules/` (4 detected) |

---

## Security

- Do not commit `.env`, local MCP config with secrets, or OAuth key files.
- Validate all external input in application code.
- Treat local `data/` as sensitive; exclude from git unless policy allows.

---

## Links

| Resource | URL |
| --- | --- |
| Repository | https://github.com/IslamFathyy/retro-api.git |

---
