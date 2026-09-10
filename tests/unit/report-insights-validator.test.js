import assert from 'node:assert/strict';
import test from 'node:test';
import { validateReportInsightsPayload } from '../../src/validators/report-insights.validator.js';
import { normalizeInsights } from '../../src/services/report-insights.service.js';

const feedbackIds = ['FB-0001', 'FB-0002', 'FB-0003'];
const retroIds = ['RETRO-2026-001', 'RETRO-2026-002'];

const validPayload = {
  generatedBy: 'cursor-agent',
  participationMix: { wentWell: 1, didNotGoWell: 1, improvement: 1 },
  topicBreakdown: [
    {
      label: 'Code review delays',
      feedbackIds: ['FB-0001', 'FB-0002'],
      priority: 'high',
      summary: 'The team reported review turnaround issues.',
    },
  ],
  recurringTopics: [
    {
      label: 'Code review delays',
      retroIds: ['RETRO-2026-001', 'RETRO-2026-002'],
      priority: 'high',
      summary: 'Similar theme in two retrospectives.',
    },
  ],
  limitations: ['Counts reflect feedback items, not individuals.'],
};

test('validateReportInsightsPayload accepts valid payload', () => {
  assert.equal(validateReportInsightsPayload(validPayload, feedbackIds, retroIds).length, 0);
});

test('validateReportInsightsPayload rejects unknown feedback ID', () => {
  const errors = validateReportInsightsPayload(
    {
      ...validPayload,
      topicBreakdown: [
        { ...validPayload.topicBreakdown[0], feedbackIds: ['FB-9999'] },
      ],
    },
    feedbackIds,
    retroIds
  );
  assert.ok(errors.some((e) => /unknown feedback/i.test(e)));
});

test('validateReportInsightsPayload rejects people-count language', () => {
  const errors = validateReportInsightsPayload(
    {
      ...validPayload,
      topicBreakdown: [
        {
          ...validPayload.topicBreakdown[0],
          summary: '3 people mentioned review delays',
        },
      ],
    },
    feedbackIds,
    retroIds
  );
  assert.ok(errors.some((e) => /people-count/i.test(e)));
});

test('normalizeInsights recomputes percent from feedbackIds', () => {
  const feedbackItems = [
    { id: 'FB-0001', type: 'did-not-go-well', text: 'a' },
    { id: 'FB-0002', type: 'improvement', text: 'b' },
    { id: 'FB-0003', type: 'went-well', text: 'c' },
  ];
  const inflated = {
    ...validPayload,
    topicBreakdown: [
      {
        label: 'Code review delays',
        feedbackIds: ['FB-0001', 'FB-0002'],
        priority: 'high',
        summary: 'Review theme',
      },
    ],
  };
  const normalized = normalizeInsights(inflated, 'RETRO-2026-002', feedbackItems, retroIds);
  assert.equal(normalized.topicBreakdown[0].feedbackItems, 2);
  assert.equal(normalized.topicBreakdown[0].percent, 67);
  assert.equal(normalized.recurringTopics[0].retrosSeen, 2);
});
