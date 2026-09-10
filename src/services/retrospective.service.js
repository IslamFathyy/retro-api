import {
  appendAudit,
  listRetroIds,
  readActionsDoc,
  readFeedbackItems,
  readRetroMeta,
  writeRetroMeta,
} from './file-storage.service.js';
import {
  ANALYSIS_ALLOWED,
  assertTransition,
  nextRetroId,
} from './id.service.js';
import { validateCreateRetro } from '../validators/retrospective.validator.js';
import { validateMinFeedbackToClose } from '../validators/guardrails.validator.js';
import { badRequest, notFound } from '../utils/errors.js';
import { nowIso } from '../utils/dates.js';

async function withCounts(retro) {
  const feedback = await readFeedbackItems(retro.id);
  const actionsDoc = await readActionsDoc(retro.id);
  return {
    ...retro,
    feedbackCount: feedback.length,
    actionCount: actionsDoc.actions.length,
  };
}

export async function listRetrospectives() {
  const ids = await listRetroIds();
  const items = [];
  for (const id of ids.sort().reverse()) {
    const retro = await readRetroMeta(id);
    if (retro) items.push(await withCounts(retro));
  }
  return items;
}

export async function getRetrospective(retroId) {
  const retro = await readRetroMeta(retroId);
  if (!retro) throw notFound('Retrospective not found');
  return withCounts(retro);
}

export async function createRetrospective(body) {
  const errors = validateCreateRetro(body);
  if (errors.length) throw badRequest(errors.join('; '));

  const ids = await listRetroIds();
  const id = nextRetroId(ids);
  const retro = {
    id,
    title: body.title.trim(),
    team: body.team.trim(),
    period: body.period.trim(),
    status: 'draft',
    createdAt: nowIso(),
    openedAt: null,
    closedAt: null,
    archivedAt: null,
  };
  await writeRetroMeta(retro);
  await appendAudit(id, 'retro.created');
  return retro;
}

async function updateStatus(retroId, toStatus, auditEvent) {
  const retro = await readRetroMeta(retroId);
  if (!retro) throw notFound('Retrospective not found');
  try {
    assertTransition(retro.status, toStatus);
  } catch (err) {
    throw badRequest(err.message);
  }
  retro.status = toStatus;
  if (toStatus === 'open') retro.openedAt = nowIso();
  if (toStatus === 'closed') retro.closedAt = nowIso();
  if (toStatus === 'archived') retro.archivedAt = nowIso();
  await writeRetroMeta(retro);
  await appendAudit(retroId, auditEvent);
  return retro;
}

export async function openRetrospective(retroId) {
  return updateStatus(retroId, 'open', 'retro.opened');
}

export async function closeRetrospective(retroId) {
  const feedback = await readFeedbackItems(retroId);
  const closeErrors = validateMinFeedbackToClose(feedback.length);
  if (closeErrors.length) throw badRequest(closeErrors.join('; '));
  return updateStatus(retroId, 'closed', 'retro.closed');
}

export async function markAnalyzed(retroId) {
  const retro = await readRetroMeta(retroId);
  if (!retro) throw notFound('Retrospective not found');
  if (retro.status === 'closed') {
    return updateStatus(retroId, 'analyzed', 'retro.analyzed');
  }
  if (ANALYSIS_ALLOWED.includes(retro.status)) return retro;
  throw badRequest('Retrospective must be closed before analysis');
}

export async function markActioned(retroId) {
  const retro = await readRetroMeta(retroId);
  if (!retro) throw notFound('Retrospective not found');
  if (['analyzed', 'actioned'].includes(retro.status)) {
    if (retro.status === 'analyzed') {
      return updateStatus(retroId, 'actioned', 'retro.actioned');
    }
    return retro;
  }
  throw badRequest('Retrospective must be analyzed first');
}

export async function archiveRetrospective(retroId) {
  const retro = await readRetroMeta(retroId);
  if (!retro) throw notFound('Retrospective not found');
  if (!['actioned', 'analyzed'].includes(retro.status)) {
    throw badRequest('Retrospective should be analyzed or actioned before archive');
  }

  const { readReport } = await import('./file-storage.service.js');
  const report = await readReport(retroId);
  if (!report?.trim()) {
    throw badRequest(
      'Generate and approve the report before archiving (report.md is missing).'
    );
  }

  const actionsDoc = await readActionsDoc(retroId);
  const approved = actionsDoc.actions.filter(
    (a) => a.source === 'approved-suggestion' || a.source === 'manual'
  );
  if (!approved.length) {
    throw badRequest('Approve at least one action before archiving.');
  }

  return updateStatus(retroId, 'archived', 'retro.archived');
}

export async function getDashboardSummary() {
  const retros = await listRetrospectives();
  const openRetro = retros.find((r) => r.status === 'open') || null;
  let openActions = 0;
  for (const retro of retros) {
    const doc = await readActionsDoc(retro.id);
    openActions += doc.actions.filter((a) =>
      ['open', 'in-progress'].includes(a.status)
    ).length;
  }
  return {
    totalRetrospectives: retros.length,
    openRetrospective: openRetro,
    openActionsCount: openActions,
    latestRetrospective: retros[0] || null,
  };
}

export async function assertEditable(retroId) {
  const retro = await readRetroMeta(retroId);
  if (!retro) throw notFound('Retrospective not found');
  if (retro.status === 'archived') {
    throw badRequest('Archived retrospectives are read-only');
  }
  return retro;
}
