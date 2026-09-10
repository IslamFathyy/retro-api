#!/usr/bin/env node
/**
 * Reset and seed four demo retrospectives (Sprint 1–4).
 * Usage: node scripts/seed-demo-retros.js
 */
import { createRetrospective, openRetrospective } from '../src/services/retrospective.service.js';
import { submitFeedback } from '../src/services/feedback.service.js';
import { clearAllRetrospectives } from './lib/clear-retrospectives.js';
import { SPRINT_SEED_DATA, DEMO_TEAM } from './seed-demo-data.js';

async function seedSprint(sprintData) {
  const retro = await createRetrospective({
    title: sprintData.title,
    team: DEMO_TEAM,
    period: sprintData.period,
  });
  await openRetrospective(retro.id);

  for (const item of sprintData.feedback) {
    await submitFeedback(retro.id, {
      type: item.type,
      text: item.text,
      anonymous: true,
      displayName: null,
    });
  }

  return retro.id;
}

async function main() {
  console.log('Clearing existing retrospective data...');
  await clearAllRetrospectives();

  const ids = [];
  for (const sprint of SPRINT_SEED_DATA) {
    const id = await seedSprint(sprint);
    ids.push({ sprint: sprint.sprint, id, feedback: sprint.feedback.length });
    console.log(`Seeded ${id} — ${sprint.title} (${sprint.feedback.length} feedback items)`);
  }

  console.log('\nDone. Created retrospectives:');
  for (const row of ids) {
    console.log(`  Sprint ${row.sprint}: ${row.id} (${row.feedback} feedback)`);
  }
  console.log('\nNext: /close-retro RETRO-2026-001 then run workflow per sprint, or pick any ID.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
