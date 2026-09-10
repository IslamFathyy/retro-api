import assert from 'node:assert/strict';
import test from 'node:test';
import {
  validateExplicitApproval,
  validateMinFeedbackToClose,
  validateNoBlameLanguage,
} from '../../src/validators/guardrails.validator.js';

test('validateMinFeedbackToClose enforces configured minimum', () => {
  const errors = validateMinFeedbackToClose(2);
  assert.ok(errors.length > 0);
  assert.match(errors[0], /at least 3 feedback/i);
  assert.equal(validateMinFeedbackToClose(3).length, 0);
});

test('validateExplicitApproval requires matching phrase', () => {
  assert.ok(validateExplicitApproval('SUG-001', {}).length > 0);
  assert.ok(validateExplicitApproval('SUG-001', { approvalConfirmation: 'approve SUG-002' }).length > 0);
  assert.equal(
    validateExplicitApproval('SUG-001', { approvalConfirmation: 'approve SUG-001' }).length,
    0
  );
  assert.equal(
    validateExplicitApproval('SUG-001', { approvalConfirmation: 'Approve SUG-001' }).length,
    0
  );
});

test('validateNoBlameLanguage blocks blame phrases', () => {
  const errors = validateNoBlameLanguage({
    title: 'Blame the developer for the fault',
    description: 'Team process improvement',
  });
  assert.ok(errors.length > 0);
  assert.equal(
    validateNoBlameLanguage({
      title: 'Improve review turnaround',
      description: 'Set a 4-hour SLA for urgent PRs',
    }).length,
    0
  );
});
