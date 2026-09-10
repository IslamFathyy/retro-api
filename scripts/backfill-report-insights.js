#!/usr/bin/env node
/**
 * Backfill AI-style report insights for demo retros (RETRO-2026-001..004).
 * Simulates insights-visualizer output for local demo validation.
 *
 * Usage: npm run backfill:insights
 */
import { listRetroIds } from '../src/services/file-storage.service.js';
import { importCursorReportInsights } from '../src/services/report-insights.service.js';
import { generateReport } from '../src/services/report.service.js';

const DEMO_INSIGHTS = {
  'RETRO-2026-001': {
    generatedBy: 'cursor-agent',
    participationMix: { wentWell: 2, didNotGoWell: 2, improvement: 2 },
    topicBreakdown: [
      {
        label: 'QA / testing gaps',
        feedbackIds: ['FB-0003', 'FB-0005'],
        priority: 'high',
        summary: 'Late QA defects and test-scope alignment appeared in multiple feedback items.',
      },
      {
        label: 'Long meetings / planning',
        feedbackIds: ['FB-0004'],
        priority: 'medium',
        summary: 'Daily sync meetings ran over scheduled time.',
      },
      {
        label: 'Code review delays',
        feedbackIds: ['FB-0006'],
        priority: 'medium',
        summary: 'The team proposed two reviewers before merge.',
      },
    ],
    recurringTopics: [
      {
        label: 'QA / testing gaps',
        retroIds: ['RETRO-2026-001', 'RETRO-2026-003'],
        priority: 'medium',
        summary: 'Testing and QA scope themes across early sprints.',
      },
    ],
    limitations: [
      'Counts reflect feedback items, not individuals.',
      'Cross-retro matching is interpretive, not proof of causality.',
    ],
  },
  'RETRO-2026-002': {
    generatedBy: 'cursor-agent',
    participationMix: { wentWell: 2, didNotGoWell: 2, improvement: 2 },
    topicBreakdown: [
      {
        label: 'Code review delays',
        feedbackIds: ['FB-0003', 'FB-0005'],
        priority: 'high',
        summary: 'Reviews sat idle; team suggested a first-response target.',
      },
      {
        label: 'Sprint readiness',
        feedbackIds: ['FB-0004', 'FB-0006'],
        priority: 'high',
        summary: 'Stories lacked acceptance criteria; readiness checklist proposed.',
      },
      {
        label: 'Deployment reliability',
        feedbackIds: ['FB-0001'],
        priority: 'low',
        summary: 'Stable deployment pipeline across releases.',
      },
    ],
    recurringTopics: [
      {
        label: 'Code review delays',
        retroIds: ['RETRO-2026-001', 'RETRO-2026-002', 'RETRO-2026-003', 'RETRO-2026-004'],
        priority: 'high',
        summary: 'Review turnaround surfaced in all four demo sprints with different wording.',
      },
      {
        label: 'Sprint readiness',
        retroIds: ['RETRO-2026-002', 'RETRO-2026-003'],
        priority: 'medium',
        summary: 'Acceptance criteria and readiness themes in sprints 2 and 3.',
      },
    ],
    limitations: [
      'Counts reflect feedback items, not individuals.',
      'Cross-retro matching is interpretive, not proof of causality.',
    ],
  },
  'RETRO-2026-003': {
    generatedBy: 'cursor-agent',
    participationMix: { wentWell: 2, didNotGoWell: 2, improvement: 2 },
    topicBreakdown: [
      {
        label: 'Code review delays',
        feedbackIds: ['FB-0003'],
        priority: 'high',
        summary: 'Code review queue grew mid-sprint.',
      },
      {
        label: 'QA / testing gaps',
        feedbackIds: ['FB-0004', 'FB-0005'],
        priority: 'high',
        summary: 'Regression from integration test gap; payment flow coverage proposed.',
      },
      {
        label: 'Sprint readiness',
        feedbackIds: ['FB-0001'],
        priority: 'medium',
        summary: 'QA in refinement caught missing acceptance criteria early.',
      },
    ],
    recurringTopics: [
      {
        label: 'Code review delays',
        retroIds: ['RETRO-2026-001', 'RETRO-2026-002', 'RETRO-2026-003', 'RETRO-2026-004'],
        priority: 'high',
        summary: 'Review queue and turnaround concerns recur across sprints.',
      },
      {
        label: 'QA / testing gaps',
        retroIds: ['RETRO-2026-001', 'RETRO-2026-003'],
        priority: 'high',
        summary: 'QA scope and testing gaps in sprints 1 and 3.',
      },
    ],
    limitations: [
      'Counts reflect feedback items, not individuals.',
      'Cross-retro matching is interpretive, not proof of causality.',
    ],
  },
  'RETRO-2026-004': {
    generatedBy: 'cursor-agent',
    participationMix: { wentWell: 2, didNotGoWell: 2, improvement: 2 },
    topicBreakdown: [
      {
        label: 'Code review delays',
        feedbackIds: ['FB-0003', 'FB-0005'],
        priority: 'high',
        summary: 'Slow urgent reviews; two-reviewer policy not consistently followed.',
      },
      {
        label: 'Long meetings / planning',
        feedbackIds: ['FB-0004', 'FB-0006'],
        priority: 'high',
        summary: 'Planning exceeds ninety minutes; async updates suggested.',
      },
      {
        label: 'Deployment reliability',
        feedbackIds: ['FB-0001'],
        priority: 'low',
        summary: 'No production rollbacks this sprint.',
      },
    ],
    recurringTopics: [
      {
        label: 'Code review delays',
        retroIds: ['RETRO-2026-001', 'RETRO-2026-002', 'RETRO-2026-003', 'RETRO-2026-004'],
        priority: 'high',
        summary: 'Code review delays are the strongest cross-sprint theme in the demo dataset.',
      },
      {
        label: 'Long meetings / planning',
        retroIds: ['RETRO-2026-001', 'RETRO-2026-004'],
        priority: 'medium',
        summary: 'Meeting and planning length in sprints 1 and 4.',
      },
    ],
    limitations: [
      'Counts reflect feedback items, not individuals.',
      'Cross-retro matching is interpretive, not proof of causality.',
    ],
  },
};

async function main() {
  const ids = await listRetroIds();
  const results = [];

  for (const retroId of ids) {
    const payload = DEMO_INSIGHTS[retroId];
    if (!payload) {
      results.push({ retroId, skipped: true });
      continue;
    }
    await importCursorReportInsights(retroId, payload);
    await generateReport(retroId);
    results.push({ retroId, ok: true });
  }

  console.log(JSON.stringify({ ok: true, results }, null, 2));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(2);
});
