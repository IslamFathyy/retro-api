import {
  appendAudit,
  listRetroIds,
  readFeedbackItems,
  readReportInsights,
  readRetroMeta,
  writeReportInsights,
} from './file-storage.service.js';
import { getRetrospective } from './retrospective.service.js';
import { validateReportInsightsPayload } from '../validators/report-insights.validator.js';
import { badRequest, notFound } from '../utils/errors.js';
import { nowIso } from '../utils/dates.js';

function percentOf(count, total) {
  if (!total) return 0;
  return Math.round((count / total) * 100);
}

export function normalizeInsights(payload, retroId, feedbackItems, allRetroIds) {
  const feedbackCount = feedbackItems.length;
  const feedbackIds = new Set(feedbackItems.map((f) => f.id));
  const uniqueIds = (ids) => [...new Set(ids)].filter((id) => feedbackIds.has(id));

  const topicBreakdown = payload.topicBreakdown.map((topic) => {
    const ids = uniqueIds(topic.feedbackIds);
    const itemCount = ids.length;
    return {
      label: topic.label.trim(),
      feedbackIds: ids,
      feedbackItems: itemCount,
      percent: percentOf(itemCount, feedbackCount),
      priority: topic.priority,
      summary: topic.summary.trim(),
    };
  });

  const retrosTotal = allRetroIds.length;
  const recurringTopics = payload.recurringTopics.map((topic) => {
    const retroIds = [...new Set(topic.retroIds)].filter((id) => allRetroIds.includes(id));
    return {
      label: topic.label.trim(),
      retroIds,
      retrosSeen: retroIds.length,
      retrosTotal,
      priority: topic.priority,
      summary: topic.summary.trim(),
    };
  });

  return {
    retroId,
    version: 1,
    generatedAt: nowIso(),
    generatedBy: payload.generatedBy || 'cursor-agent',
    feedbackCount,
    participationMix: {
      wentWell: Number(payload.participationMix.wentWell) || 0,
      didNotGoWell: Number(payload.participationMix.didNotGoWell) || 0,
      improvement: Number(payload.participationMix.improvement) || 0,
    },
    topicBreakdown,
    recurringTopics,
    limitations: payload.limitations.map((line) => String(line).trim()),
  };
}

export async function importCursorReportInsights(retroId, payload) {
  const retro = await readRetroMeta(retroId);
  if (!retro) throw notFound('Retrospective not found');

  const feedbackItems = await readFeedbackItems(retroId);
  const allRetroIds = await listRetroIds();

  const errors = validateReportInsightsPayload(
    payload,
    feedbackItems.map((f) => f.id),
    allRetroIds
  );
  if (errors.length) throw badRequest(`Report insights validation failed: ${errors.join(' ')}`);

  const insights = normalizeInsights(payload, retroId, feedbackItems, allRetroIds);
  await writeReportInsights(retroId, insights);
  await appendAudit(retroId, 'report.insights.imported', { generatedBy: insights.generatedBy });
  return insights;
}

export async function getReportInsights(retroId) {
  await getRetrospective(retroId);
  const insights = await readReportInsights(retroId);
  if (!insights) throw notFound('Report insights not found');
  return insights;
}

export function formatInsightsMarkdown(insights) {
  if (!insights) {
    return '## Insights at a Glance\n\n_Insights not generated — run /generate-report with Cursor._\n\n';
  }

  const lines = ['## Insights at a Glance', ''];
  const total = insights.feedbackCount || 0;
  const mix = insights.participationMix;

  lines.push('### Participation mix');
  lines.push('| Category | Feedback items | Share |');
  lines.push('| --- | ---: | ---: |');
  if (total) {
    lines.push(`| Went well | ${mix.wentWell} | ${percentOf(mix.wentWell, total)}% |`);
    lines.push(`| Did not go well | ${mix.didNotGoWell} | ${percentOf(mix.didNotGoWell, total)}% |`);
    lines.push(`| Improvement ideas | ${mix.improvement} | ${percentOf(mix.improvement, total)}% |`);
  } else {
    lines.push('| _No feedback items._ | | |');
  }
  lines.push('');

  lines.push('### Topic share (this retrospective)');
  lines.push('| Topic | Feedback items | Share | Priority |');
  lines.push('| --- | ---: | ---: | --- |');
  if (insights.topicBreakdown.length) {
    for (const row of insights.topicBreakdown) {
      const pri = row.priority.charAt(0).toUpperCase() + row.priority.slice(1);
      lines.push(`| ${row.label} | ${row.feedbackItems} | ${row.percent}% | ${pri} |`);
    }
  } else {
    lines.push('| _No topics in insights._ | | | |');
  }
  lines.push('');

  if (insights.topicBreakdown.length) {
    const labels = insights.topicBreakdown.map((t) => `"${t.label.replace(/"/g, "'")}"`);
    const counts = insights.topicBreakdown.map((t) => t.feedbackItems);
    const maxY = Math.max(...counts, total, 1);
    lines.push('```mermaid');
    lines.push('xychart-beta horizontal');
    lines.push('    title "Feedback items by topic (this retrospective)"');
    lines.push(`    x-axis [${labels.join(', ')}]`);
    lines.push(`    y-axis "Items" 0 --> ${maxY}`);
    lines.push(`    bar [${counts.join(', ')}]`);
    lines.push('```');
    lines.push('');
  }

  lines.push('### Recurring across retrospectives');
  lines.push('| Topic | Retros mentioned | Priority |');
  lines.push('| --- | ---: | --- |');
  if (insights.recurringTopics.length) {
    for (const row of insights.recurringTopics) {
      const pri = row.priority.charAt(0).toUpperCase() + row.priority.slice(1);
      lines.push(`| ${row.label} | ${row.retrosSeen} / ${row.retrosTotal} | ${pri} |`);
    }
  } else {
    lines.push('| _No recurring topics identified._ | | |');
  }
  lines.push('');

  if (insights.recurringTopics.length) {
    const labels = insights.recurringTopics.map((t) => `"${t.label.replace(/"/g, "'")}"`);
    const counts = insights.recurringTopics.map((t) => t.retrosSeen);
    const maxY = Math.max(...counts, insights.recurringTopics[0]?.retrosTotal || 1);
    lines.push('```mermaid');
    lines.push('xychart-beta horizontal');
    lines.push('    title "Retrospectives mentioning each topic"');
    lines.push(`    x-axis [${labels.join(', ')}]`);
    lines.push(`    y-axis "Retros" 0 --> ${maxY}`);
    lines.push(`    bar [${counts.join(', ')}]`);
    lines.push('```');
    lines.push('');
  }

  lines.push('_Disclaimer: Percentages are based on anonymous feedback items, not individuals._');
  lines.push('');
  return lines.join('\n');
}
