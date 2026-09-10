#!/usr/bin/env node
/**
 * Clear all local RETRO-* data and the committed reminder snapshot.
 * Does not touch Google Drive — use /reset-demo-retro skill for Drive cleanup.
 *
 * Usage: npm run reset:demo
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clearAllRetrospectives } from './lib/clear-retrospectives.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ORCHESTRATION_ROOT = path.resolve(__dirname, '..', '..');
const REMINDER_SNAPSHOT = path.join(ORCHESTRATION_ROOT, 'docs', 'reminders', 'latest-reminder.json');

async function clearReminderSnapshot() {
  try {
    await fs.unlink(REMINDER_SNAPSHOT);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
}

async function main() {
  const deletedRetroIds = await clearAllRetrospectives();
  const reminderRemoved = await clearReminderSnapshot();

  const result = {
    ok: true,
    deletedRetroIds,
    deletedRetroCount: deletedRetroIds.length,
    reminderSnapshotRemoved: reminderRemoved,
    nextStep: 'Run /seed-demo-retro or npm run seed:demo to create fresh Sprint 1–4 data.',
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(2);
});
