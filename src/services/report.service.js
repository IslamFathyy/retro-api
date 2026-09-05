import {
  appendAudit,
  readActionsDoc,
  readAnalysis,
  readFeedbackItems,
  readReport,
  readRetroMeta,
  writeReport,
} from './file-storage.service.js';
import { getRetrospective } from './retrospective.service.js';
import { getOpenActionsFromPrevious } from './action.service.js';
import { getHistoricalComparison } from './analysis.service.js';
import { badRequest } from '../utils/errors.js';
import { nowIso } from '../utils/dates.js';

function countByType(feedback) {
  return {
    total: feedback.length,
    wentWell: feedback.filter((f) => f.type === 'went-well').length,
    didNotGoWell: feedback.filter((f) => f.type === 'did-not-go-well').length,
    improvement: feedback.filter((f) => f.type === 'improvement').length,
  };
}

function formatFeedbackSection(items, label) {
  if (!items.length) return `_No items._\n`;
  return items.map((f) => `- (${f.id}) ${f.text}`).join('\n') + '\n';
}

export async function getReport(retroId) {
  await getRetrospective(retroId);
  return readReport(retroId);
}

export async function generateReport(retroId) {
  const retro = await readRetroMeta(retroId);
  if (!retro) throw badRequest('Retrospective not found');

  const feedback = await readFeedbackItems(retroId);
  const analysis = await readAnalysis(retroId);
  const actionsDoc = await readActionsDoc(retroId);
  const counts = countByType(feedback);
  const previousOpen = await getOpenActionsFromPrevious();
  const comparison = await getHistoricalComparison();

  const approvedActions = actionsDoc.actions.filter(
    (a) => a.source === 'approved-suggestion' || a.source === 'manual'
  );

  const md = `# ${retro.title} Report

## Overview
- **Team:** ${retro.team}
- **Period:** ${retro.period}
- **Status:** ${retro.status}
- **Generated:** ${nowIso()}

## Participation
- Total feedback: ${counts.total}
- Went well: ${counts.wentWell}
- Did not go well: ${counts.didNotGoWell}
- Improvement ideas: ${counts.improvement}

## What Went Well
${formatFeedbackSection(feedback.filter((f) => f.type === 'went-well'))}

## Main Themes
${analysis?.themes?.length
    ? analysis.themes.map((t) => `- **${t.name}** (${t.feedbackIds.join(', ')}): ${t.summary}`).join('\n')
    : '_No analysis themes yet._'}

## Concerns
${analysis?.concerns?.length
    ? analysis.concerns.map((c) => `- (${c.feedbackId}) ${c.summary}`).join('\n')
    : formatFeedbackSection(feedback.filter((f) => f.type === 'did-not-go-well'))}

## Improvement Opportunities
${analysis?.opportunities?.length
    ? analysis.opportunities.map((o) => `- (${o.feedbackId}) ${o.summary}`).join('\n')
    : formatFeedbackSection(feedback.filter((f) => f.type === 'improvement'))}

## Approved Actions
${approvedActions.length
    ? approvedActions.map((a) => `- **${a.title}** (${a.id}) — Owner: ${a.owner}, Status: ${a.status}`).join('\n')
    : '_No approved actions yet._'}

## Previous Actions Follow-up
${previousOpen.length
    ? previousOpen.map((a) => `- ${a.title} (${a.id}) from ${a.retroTitle} — ${a.status}`).join('\n')
    : '_No open actions from previous retrospectives._'}

## Observations Across Retrospectives
${comparison.observations.map((o) => `- ${o}`).join('\n')}

## Limitations
- Anonymous feedback authors are never named in this report.
- Summaries are generated from stored feedback; they are not performance evaluations.
${analysis?.limitations?.map((l) => `- ${l}`).join('\n') || ''}

## Generated Information
- Report generated deterministically from local files.
- Analysis source: ${analysis?.generatedBy || 'none'}
`;

  await writeReport(retroId, md);
  await appendAudit(retroId, 'report.generated');
  return md;
}
