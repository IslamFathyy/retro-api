import assert from 'node:assert/strict';
import test from 'node:test';
import { validateAiAnalysisPayload } from '../../src/validators/analysis.validator.js';

const feedbackIds = ['FB-0001', 'FB-0002'];

const validPayload = {
  themes: [
    {
      name: 'Code Review',
      feedbackIds: ['FB-0001'],
      summary: 'The team mentioned review delays.',
    },
  ],
  strengths: [{ feedbackId: 'FB-0002', summary: 'Testing improved.' }],
  concerns: [{ feedbackId: 'FB-0001', summary: 'Reviews were slow.' }],
  opportunities: [{ feedbackId: 'FB-0002', summary: 'Earlier QA involvement.' }],
  suggestedActions: [
    {
      title: 'Set a PR review response target',
      reason: 'Multiple items cite review delays.',
      sourceFeedbackIds: ['FB-0001'],
      ownerTeams: ['dev-team'],
    },
  ],
  limitations: ['Suggested actions require human review before approval.'],
};

test('validateAiAnalysisPayload accepts valid AI output', () => {
  assert.deepEqual(validateAiAnalysisPayload(validPayload, feedbackIds), []);
});

test('validateAiAnalysisPayload rejects unknown feedback IDs', () => {
  const errors = validateAiAnalysisPayload(
    {
      ...validPayload,
      themes: [{ name: 'X', feedbackIds: ['FB-9999'], summary: 'Bad ref' }],
    },
    feedbackIds
  );
  assert.ok(errors.some((e) => e.includes('unknown feedback ID')));
});

test('validateAiAnalysisPayload requires ownerTeams on suggestions', () => {
  const errors = validateAiAnalysisPayload(
    {
      ...validPayload,
      suggestedActions: [
        {
          title: 'Missing teams',
          reason: 'No ownerTeams field',
          sourceFeedbackIds: ['FB-0001'],
        },
      ],
    },
    feedbackIds
  );
  assert.ok(errors.some((e) => e.includes('ownerTeams')));
});

test('validateAiAnalysisPayload requires human review limitation', () => {
  const errors = validateAiAnalysisPayload(
    { ...validPayload, limitations: ['AI only.'] },
    feedbackIds
  );
  assert.ok(errors.some((e) => e.includes('human review')));
});
