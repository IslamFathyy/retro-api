import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { assertNoTraversal, assertSafeId } from '../../src/utils/ids.js';
import { writeJsonAtomic, readJsonFile } from '../../src/utils/json.js';
import { validateFeedback } from '../../src/validators/feedback.validator.js';
import { nextRetroId, canTransition } from '../../src/services/id.service.js';

test('ID validation rejects invalid IDs', () => {
  assert.throws(() => assertSafeId('bad', 'retro'));
  assert.doesNotThrow(() => assertSafeId('RETRO-2026-001', 'retro'));
});

test('path traversal is blocked', () => {
  assert.throws(() => assertNoTraversal('../etc'));
  assert.throws(() => assertNoTraversal('a/b'));
});

test('atomic JSON write and read', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'retro-test-'));
  const file = path.join(dir, 'sample.json');
  await writeJsonAtomic(file, { ok: true });
  const data = await readJsonFile(file);
  assert.equal(data.ok, true);
  await fs.rm(dir, { recursive: true, force: true });
});

test('anonymous feedback validation', () => {
  const errors = validateFeedback(
    { type: 'went-well', text: 'Good sprint', anonymous: true, displayName: 'Bob' },
    'open'
  );
  assert.ok(errors.some((e) => e.includes('displayName')));
});

test('retro lifecycle transitions', () => {
  assert.equal(canTransition('draft', 'open'), true);
  assert.equal(canTransition('open', 'closed'), true);
  assert.equal(canTransition('draft', 'closed'), false);
});

test('next retro id increments', () => {
  const year = new Date().getFullYear();
  assert.equal(nextRetroId([]), `RETRO-${year}-001`);
  assert.equal(nextRetroId([`RETRO-${year}-001`]), `RETRO-${year}-002`);
});
