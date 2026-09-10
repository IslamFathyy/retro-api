import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
test('clearAllRetrospectives removes RETRO-* folders only', async () => {
  const tmpData = await fs.mkdtemp(path.join(os.tmpdir(), 'retro-clear-'));
  const retroDir = path.join(tmpData, 'retrospectives');
  process.env.DATA_ROOT = tmpData;
  const { clearAllRetrospectives } = await import('../../scripts/lib/clear-retrospectives.js');

  await fs.mkdir(path.join(retroDir, 'RETRO-2026-001'), { recursive: true });
  await fs.mkdir(path.join(retroDir, 'RETRO-2026-002'), { recursive: true });
  await fs.mkdir(path.join(retroDir, 'notes'), { recursive: true });

  const deleted = await clearAllRetrospectives();
  assert.deepEqual(deleted, ['RETRO-2026-001', 'RETRO-2026-002']);

  const remaining = await fs.readdir(retroDir);
  assert.deepEqual(remaining, ['notes']);

  delete process.env.DATA_ROOT;
  await fs.rm(tmpData, { recursive: true, force: true });
});
