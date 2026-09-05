# retro-api — Agent Instructions

## Purpose
REST API for retrospective management. Local JSON/Markdown storage only.

## Stack
Node.js, Express, ES modules. No database.

## Architecture
`routes → controllers → services → file-storage`

## Rules
- All reads/writes under `data/` only
- Atomic JSON writes
- Never rewrite feedback `text`
- Anonymous feedback: `displayName` must be null
- Run `npm test` before finishing backend changes

## API base
`http://localhost:3001/api`

See `docs/` in PLAN.md for full API contract.
