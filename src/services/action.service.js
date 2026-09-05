import {
  appendAudit,
  readActionsDoc,
  readAnalysis,
  writeActionsDoc,
} from './file-storage.service.js';
import {
  assertEditable,
  getRetrospective,
  markActioned,
} from './retrospective.service.js';
import { nextActionId } from './id.service.js';
import { validateAction } from '../validators/action.validator.js';
import { badRequest, notFound } from '../utils/errors.js';
import { nowIso, todayDate } from '../utils/dates.js';

export async function listActions(retroId) {
  await getRetrospective(retroId);
  return readActionsDoc(retroId);
}

export async function createAction(retroId, body) {
  await assertEditable(retroId);
  const errors = validateAction(body);
  if (errors.length) throw badRequest(errors.join('; '));

  const doc = await readActionsDoc(retroId);
  const action = {
    id: nextActionId(doc.actions),
    title: body.title.trim(),
    description: body.description?.trim() || '',
    owner: body.owner?.trim() || 'Team',
    targetDate: body.targetDate || todayDate(),
    status: body.status || 'open',
    source: body.source || 'manual',
    sourceSuggestionId: body.sourceSuggestionId || null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  doc.actions.push(action);
  await writeActionsDoc(retroId, doc);
  await appendAudit(retroId, 'action.created', { actionId: action.id });
  await markActioned(retroId);
  return action;
}

export async function updateAction(retroId, actionId, body) {
  await assertEditable(retroId);
  const errors = validateAction(body, true);
  if (errors.length) throw badRequest(errors.join('; '));

  const doc = await readActionsDoc(retroId);
  const index = doc.actions.findIndex((a) => a.id === actionId);
  if (index === -1) throw notFound('Action not found');

  const current = doc.actions[index];
  doc.actions[index] = {
    ...current,
    title: body.title?.trim() || current.title,
    description: body.description?.trim() ?? current.description,
    owner: body.owner?.trim() || current.owner,
    targetDate: body.targetDate || current.targetDate,
    status: body.status || current.status,
    updatedAt: nowIso(),
  };
  await writeActionsDoc(retroId, doc);
  await appendAudit(retroId, 'action.updated', { actionId });
  return doc.actions[index];
}

export async function createActionFromSuggestion(retroId, suggestionId) {
  await assertEditable(retroId);
  const analysis = await readAnalysis(retroId);
  if (!analysis) throw badRequest('Generate analysis before approving suggestions');

  const suggestion = analysis.suggestedActions.find((s) => s.id === suggestionId);
  if (!suggestion) throw notFound('Suggestion not found');

  return createAction(retroId, {
    title: suggestion.title,
    description: suggestion.reason,
    owner: 'Team',
    targetDate: todayDate(),
    status: 'open',
    source: 'approved-suggestion',
    sourceSuggestionId: suggestion.id,
  });
}

export async function getOpenActionsFromPrevious() {
  const { listRetrospectives } = await import('./retrospective.service.js');
  const retros = await listRetrospectives();
  const open = [];
  for (const retro of retros) {
    const doc = await readActionsDoc(retro.id);
    for (const action of doc.actions) {
      if (['open', 'in-progress'].includes(action.status)) {
        open.push({
          ...action,
          retroId: retro.id,
          retroTitle: retro.title,
          retroPeriod: retro.period,
        });
      }
    }
  }
  return open;
}
