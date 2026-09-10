#!/usr/bin/env node
/**
 * List retrospective folders and suggest workflow target.
 * Usage: node scripts/list-retro-state.js
 * Exit 0 when at least one retro has feedback (seed data present).
 */
import {
  listRetroIds,
  readFeedbackItems,
  readRetroMeta,
  retroPaths,
} from '../src/services/file-storage.service.js';

async function hasAnalysis(retroId) {
  try {
    await fs.access(retroPaths(retroId).analysis);
    return true;
  } catch {
    return false;
  }
}

function pickWorkflowTarget(rows) {
  const open = rows.find((r) => r.status === 'open');
  if (open) return open.id;
  const noAnalysis = rows.find((r) => !r.hasAnalysis && r.feedbackCount > 0);
  if (noAnalysis) return noAnalysis.id;
  if (rows.length) return rows[rows.length - 1].id;
  return null;
}

async function main() {
  const ids = await listRetroIds();
  const retrospectives = [];

  for (const id of ids.sort()) {
    const retro = await readRetroMeta(id);
    if (!retro) continue;
    const feedback = await readFeedbackItems(id);
    retrospectives.push({
      id: retro.id,
      title: retro.title,
      period: retro.period,
      status: retro.status,
      feedbackCount: feedback.length,
      hasAnalysis: await hasAnalysis(id),
    });
  }

  const hasData = retrospectives.some((r) => r.feedbackCount > 0);
  const result = {
    hasData,
    retrospectiveCount: retrospectives.length,
    retrospectives,
    suggestedWorkflowTarget: pickWorkflowTarget(retrospectives),
    skipSeed: hasData,
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(hasData ? 0 : 1);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(2);
});
