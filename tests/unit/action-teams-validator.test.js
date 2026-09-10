import assert from 'node:assert/strict';
import test from 'node:test';
import { validateOwnerTeams } from '../../src/validators/action-teams.validator.js';

test('validateOwnerTeams accepts known team ids', () => {
  assert.deepEqual(validateOwnerTeams(['dev-team', 'qa-team']), []);
});

test('validateOwnerTeams rejects unknown ids', () => {
  const errors = validateOwnerTeams(['dev-team', 'intern-team']);
  assert.ok(errors.some((e) => e.includes('intern-team')));
});

test('validateOwnerTeams requires at least one team when required', () => {
  assert.ok(validateOwnerTeams([], { required: true }).length > 0);
});
