#!/usr/bin/env node
/**
 * Export reminder snapshot for weekly email automation.
 * Picks the most recently archived retro and writes docs/reminders/latest-reminder.json
 * in the orchestration repo (parent of retro-api).
 *
 * Usage: npm run export:reminder
 *        npm run export:reminder -- RETRO-2026-004
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  listRetroIds,
  readActionsDoc,
  readAnalysis,
  readReportInsights,
  readRetroMeta,
  retroPaths,
} from '../src/services/file-storage.service.js';
import { formatOwnerTeamLabels } from '../src/config/action-teams.js';
import { fileExists } from '../src/utils/json.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ORCHESTRATION_ROOT = path.resolve(__dirname, '..', '..');
const OUTPUT_PATH = path.join(ORCHESTRATION_ROOT, 'docs', 'reminders', 'latest-reminder.json');

function pickLatestArchived(retros) {
  const archived = retros.filter((r) => r.status === 'archived');
  if (!archived.length) return null;

  archived.sort((a, b) => {
    const aTime = a.archivedAt ? Date.parse(a.archivedAt) : 0;
    const bTime = b.archivedAt ? Date.parse(b.archivedAt) : 0;
    if (bTime !== aTime) return bTime - aTime;
    return b.id.localeCompare(a.id);
  });

  return archived[0];
}

function extractApprovedActionsSection(reportMd) {
  const match = reportMd.match(/## Approved Actions\r?\n([\s\S]*?)(?=\r?\n## |\r?\n*$)/);
  return match ? match[1].trim() : '';
}

function buildThemesSummary(analysis) {
  if (!analysis?.themes?.length) return '';
  return analysis.themes.map((t) => `${t.name}: ${t.summary}`).join(' ');
}

function buildInsightsExcerpt(insights) {
  if (!insights) return null;
  return {
    participationMix: insights.participationMix,
    topicBreakdown: (insights.topicBreakdown || []).map((t) => ({
      label: t.label,
      feedbackItems: t.feedbackItems,
      percent: t.percent,
      priority: t.priority,
      summary: t.summary,
    })),
    recurringTopics: (insights.recurringTopics || []).map((t) => ({
      label: t.label,
      retrosSeen: t.retrosSeen,
      retrosTotal: t.retrosTotal,
      priority: t.priority,
      summary: t.summary,
    })),
    limitations: insights.limitations || [],
  };
}

async function buildSnapshot(retroId) {
  const paths = retroPaths(retroId);
  if (!(await fileExists(paths.report))) {
    throw new Error(
      `report.md missing for ${retroId}. Run /generate-report with human approval first.`
    );
  }

  const retro = await readRetroMeta(retroId);
  const analysis = await readAnalysis(retroId);
  const insights = await readReportInsights(retroId);
  const actionsDoc = await readActionsDoc(retroId);
  const reportMd = await fs.readFile(retroPaths(retroId).report, 'utf8');

  const approvedActions = actionsDoc.actions.filter(
    (a) =>
      (a.source === 'approved-suggestion' || a.source === 'manual') && a.status === 'open'
  );

  return {
    retroId: retro.id,
    title: retro.title,
    period: retro.period,
    team: retro.team,
    archivedAt: retro.archivedAt || null,
    exportedAt: new Date().toISOString(),
    openActions: approvedActions.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      ownerTeams: a.ownerTeams || [],
      teams: a.ownerTeams?.length ? formatOwnerTeamLabels(a.ownerTeams) : (a.owner || 'Unassigned'),
      status: a.status,
      targetDate: a.targetDate || null,
    })),
    reportExcerpt: {
      themesSummary: buildThemesSummary(analysis),
      approvedActionsSection: extractApprovedActionsSection(reportMd),
    },
    reportInsights: buildInsightsExcerpt(insights),
  };
}

async function main() {
  const explicitId = process.argv[2];

  let retroId = explicitId;
  if (!retroId) {
    const ids = await listRetroIds();
    const retros = [];
    for (const id of ids) {
      const meta = await readRetroMeta(id);
      if (meta) retros.push(meta);
    }
    const latest = pickLatestArchived(retros);
    if (!latest) {
      console.error('No archived retrospective found. Archive a retro first.');
      process.exit(1);
    }
    retroId = latest.id;
  } else {
    const meta = await readRetroMeta(retroId);
    if (!meta) {
      console.error(`Retrospective not found: ${retroId}`);
      process.exit(1);
    }
    if (meta.status !== 'archived') {
      console.warn(`Warning: ${retroId} status is "${meta.status}", not archived.`);
    }
  }

  const snapshot = await buildSnapshot(retroId);
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({ ok: true, retroId, outputPath: OUTPUT_PATH, openActionCount: snapshot.openActions.length }, null, 2));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(2);
});
