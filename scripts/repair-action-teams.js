#!/usr/bin/env node
/**
 * Backfill ownerTeams on analysis suggestions and approved actions.
 * Use after imports that omitted team ids (legacy owner: "Team").
 *
 * Usage: npm run repair:action-teams
 */
import {
  listRetroIds,
  readActionsDoc,
  readAnalysis,
  writeActionsDoc,
  writeAnalysis,
} from '../src/services/file-storage.service.js';
import { formatOwnerTeamLabels } from '../src/config/action-teams.js';
import { generateReport } from '../src/services/report.service.js';

const SUGGESTION_TEAMS = {
  'RETRO-2026-001': {
    'SUG-001': ['dev-team', 'qa-team', 'product-team'],
    'SUG-002': ['dev-team', 'qa-team'],
    'SUG-003': ['management-team', 'dev-team'],
    'SUG-004': ['dev-team', 'ops-team'],
  },
  'RETRO-2026-002': {
    'SUG-001': ['dev-team', 'management-team'],
    'SUG-002': ['product-team', 'dev-team'],
    'SUG-003': ['ops-team', 'dev-team'],
    'SUG-004': ['dev-team'],
  },
  'RETRO-2026-003': {
    'SUG-001': ['dev-team', 'management-team'],
    'SUG-002': ['qa-team', 'dev-team'],
    'SUG-003': ['ops-team', 'dev-team'],
    'SUG-004': ['qa-team', 'product-team'],
  },
  'RETRO-2026-004': {
    'SUG-001': ['dev-team'],
    'SUG-002': ['product-team', 'dev-team'],
    'SUG-003': ['ops-team', 'dev-team'],
    'SUG-004': ['ops-team', 'management-team'],
  },
};

async function repairRetro(retroId) {
  const mapping = SUGGESTION_TEAMS[retroId];
  if (!mapping) {
    return { retroId, skipped: true, reason: 'no mapping' };
  }

  const analysis = await readAnalysis(retroId);
  if (!analysis) {
    return { retroId, skipped: true, reason: 'no analysis' };
  }

  let suggestionsPatched = 0;
  for (const suggestion of analysis.suggestedActions) {
    if (!suggestion.ownerTeams?.length && mapping[suggestion.id]) {
      suggestion.ownerTeams = mapping[suggestion.id];
      suggestionsPatched += 1;
    }
  }
  if (suggestionsPatched) {
    await writeAnalysis(retroId, analysis);
  }

  const actionsDoc = await readActionsDoc(retroId);
  let actionsPatched = 0;
  for (const action of actionsDoc.actions) {
    const teams =
      action.ownerTeams?.length
        ? action.ownerTeams
        : mapping[action.sourceSuggestionId];
    if (!teams?.length) continue;
    action.ownerTeams = teams;
    action.owner = formatOwnerTeamLabels(teams);
    actionsPatched += 1;
  }
  if (actionsPatched) {
    await writeActionsDoc(retroId, actionsDoc);
  }

  await generateReport(retroId);

  return {
    retroId,
    suggestionsPatched,
    actionsPatched,
    ok: true,
  };
}

async function main() {
  const ids = await listRetroIds();
  const results = [];
  for (const retroId of ids) {
    results.push(await repairRetro(retroId));
  }
  console.log(JSON.stringify({ ok: true, results }, null, 2));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(2);
});
