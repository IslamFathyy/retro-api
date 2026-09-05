import fs from 'node:fs/promises';
import { THEME_DICTIONARY_FILE } from '../config/paths.js';
import {
  appendAudit,
  readAnalysis,
  readFeedbackItems,
  readRetroMeta,
  writeAnalysis,
} from './file-storage.service.js';
import { closeRetrospective, getRetrospective, markAnalyzed } from './retrospective.service.js';
import { nextSuggestionId } from './id.service.js';
import { readJsonFile } from '../utils/json.js';
import { badRequest, notFound } from '../utils/errors.js';
import { nowIso } from '../utils/dates.js';

function normalize(text) {
  return text.toLowerCase().replace(/\s+/g, ' ');
}

async function loadThemeDictionary() {
  try {
    return await readJsonFile(THEME_DICTIONARY_FILE);
  } catch {
    return {};
  }
}

function matchThemes(feedbackItems, dictionary) {
  const themes = [];
  for (const [name, keywords] of Object.entries(dictionary)) {
    const matched = feedbackItems.filter((item) => {
      const normalized = normalize(item.text);
      return keywords.some((kw) => normalized.includes(kw.toLowerCase()));
    });
    if (matched.length) {
      themes.push({
        name: name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        feedbackIds: matched.map((m) => m.id),
        summary: `${matched.length} feedback item(s) mention ${name.replace(/-/g, ' ')}.`,
      });
    }
  }
  return themes;
}

export async function getAnalysis(retroId) {
  await getRetrospective(retroId);
  return readAnalysis(retroId);
}

export async function generateBaselineAnalysis(retroId) {
  const retro = await readRetroMeta(retroId);
  if (!retro) throw notFound('Retrospective not found');
  if (!['closed', 'analyzed', 'actioned', 'archived'].includes(retro.status)) {
    throw badRequest('Analysis requires retrospective to be closed or later');
  }

  const feedbackItems = await readFeedbackItems(retroId);
  const dictionary = await loadThemeDictionary();
  const themes = matchThemes(feedbackItems, dictionary);

  const strengths = feedbackItems
    .filter((f) => f.type === 'went-well')
    .map((f) => ({ feedbackId: f.id, summary: f.text.slice(0, 120) }));

  const concerns = feedbackItems
    .filter((f) => f.type === 'did-not-go-well')
    .map((f) => ({ feedbackId: f.id, summary: f.text.slice(0, 120) }));

  const opportunities = feedbackItems
    .filter((f) => f.type === 'improvement')
    .map((f) => ({ feedbackId: f.id, summary: f.text.slice(0, 120) }));

  const suggestedActions = themes.slice(0, 5).map((theme, index) => ({
    id: nextSuggestionId(index),
    title: `Address recurring theme: ${theme.name}`,
    reason: theme.summary,
    sourceFeedbackIds: theme.feedbackIds,
  }));

  const analysis = {
    retroId,
    version: 1,
    generatedAt: nowIso(),
    generatedBy: 'deterministic-baseline',
    feedbackCount: feedbackItems.length,
    themes,
    strengths,
    concerns,
    opportunities,
    suggestedActions,
    limitations: [
      'Generated suggestions require human review.',
      'This baseline uses keyword matching only — not advanced AI.',
    ],
  };

  await writeAnalysis(retroId, analysis);
  await appendAudit(retroId, 'analysis.generated', { generatedBy: analysis.generatedBy });
  if (retro.status === 'closed') {
    await markAnalyzed(retroId);
  }
  return analysis;
}

export async function getHistoricalComparison() {
  const retros = [];
  const entries = await fs.readdir(
    (await import('../config/paths.js')).RETROSPECTIVES_DIR,
    { withFileTypes: true }
  ).catch(() => []);

  for (const entry of entries.filter((e) => e.isDirectory())) {
    const retro = await readRetroMeta(entry.name);
    if (!retro) continue;
    const analysis = await readAnalysis(entry.name);
    const feedback = await readFeedbackItems(entry.name);
    retros.push({ retro, analysis, feedback });
  }

  retros.sort((a, b) => a.retro.createdAt.localeCompare(b.retro.createdAt));

  const themeCounts = {};
  for (const { analysis } of retros) {
    for (const theme of analysis?.themes || []) {
      themeCounts[theme.name] = (themeCounts[theme.name] || 0) + 1;
    }
  }

  const recurringThemes = Object.entries(themeCounts)
    .filter(([, count]) => count >= 2)
    .map(([name, count]) => ({ name, retrospectiveCount: count }));

  let totalActions = 0;
  let completedActions = 0;
  const openActions = [];

  for (const { retro } of retros) {
    const { readActionsDoc } = await import('./file-storage.service.js');
    const doc = await readActionsDoc(retro.id);
    for (const action of doc.actions) {
      totalActions += 1;
      if (action.status === 'done') completedActions += 1;
      if (['open', 'in-progress'].includes(action.status)) {
        openActions.push({ ...action, retroId: retro.id, retroTitle: retro.title });
      }
    }
  }

  return {
    retrospectiveCount: retros.length,
    recurringThemes,
    actionStats: {
      total: totalActions,
      completed: completedActions,
      open: openActions.length,
    },
    openActions,
    observations: [
      'Comparisons are descriptive observations, not proof of causality.',
      recurringThemes.length
        ? `Themes appearing in multiple retrospectives: ${recurringThemes.map((t) => t.name).join(', ')}`
        : 'No recurring themes yet — need at least two retrospectives with matching themes.',
    ],
  };
}
