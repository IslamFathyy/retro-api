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
import {
  validateExplicitApproval,
  validateNoBlameLanguage,
} from '../validators/guardrails.validator.js';
import { formatOwnerTeamLabels } from '../config/action-teams.js';
import { badRequest, notFound } from '../utils/errors.js';
import { nowIso, todayDate } from '../utils/dates.js';

function normalizeOwnerTeams(body, fallback = []) {
  if (Array.isArray(body.ownerTeams)) {
    return [...new Set(body.ownerTeams)];
  }
  return fallback;
}

export async function listActions(retroId) {
  await getRetrospective(retroId);
  return readActionsDoc(retroId);
}

function validateActionGuardrails(body) {
  return validateNoBlameLanguage({
    title: body.title,
    description: body.description,
  });
}

export async function createAction(retroId, body) {
  await assertEditable(retroId);
  const errors = [...validateAction(body), ...validateActionGuardrails(body)];
  if (errors.length) throw badRequest(errors.join('; '));

  const doc = await readActionsDoc(retroId);
  const ownerTeams = normalizeOwnerTeams(body);
  const action = {
    id: nextActionId(doc.actions),
    title: body.title.trim(),
    description: body.description?.trim() || '',
    ownerTeams,
    owner: formatOwnerTeamLabels(ownerTeams),
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
  const errors = [
    ...validateAction(body, true),
    ...validateNoBlameLanguage({
      title: body.title,
      description: body.description,
    }),
  ];
  if (errors.length) throw badRequest(errors.join('; '));

  const doc = await readActionsDoc(retroId);
  const index = doc.actions.findIndex((a) => a.id === actionId);
  if (index === -1) throw notFound('Action not found');

  const current = doc.actions[index];
  const ownerTeams = body.ownerTeams !== undefined
    ? normalizeOwnerTeams(body)
    : (current.ownerTeams || []);
  doc.actions[index] = {
    ...current,
    title: body.title?.trim() || current.title,
    description: body.description?.trim() ?? current.description,
    ownerTeams,
    owner: formatOwnerTeamLabels(ownerTeams),
    targetDate: body.targetDate || current.targetDate,
    status: body.status || current.status,
    updatedAt: nowIso(),
  };
  await writeActionsDoc(retroId, doc);
  await appendAudit(retroId, 'action.updated', { actionId });
  return doc.actions[index];
}

export async function createActionFromSuggestion(retroId, suggestionId, body = {}) {
  await assertEditable(retroId);
  const analysis = await readAnalysis(retroId);
  if (!analysis) throw badRequest('Generate analysis before approving suggestions');

  const suggestion = analysis.suggestedActions.find((s) => s.id === suggestionId);
  if (!suggestion) throw notFound('Suggestion not found');

  const ownerTeams = suggestion.ownerTeams || [];
  if (!ownerTeams.length) {
    throw badRequest(
      `Suggestion ${suggestionId} has no ownerTeams. Re-import analysis with team ids from config/action-teams.json.`
    );
  }

  const approvalErrors = validateExplicitApproval(suggestionId, body);
  if (approvalErrors.length) throw badRequest(approvalErrors.join('; '));

  const blameErrors = validateNoBlameLanguage({
    title: suggestion.title,
    description: suggestion.reason,
  });
  if (blameErrors.length) throw badRequest(blameErrors.join('; '));

  return createAction(retroId, {
    title: suggestion.title,
    description: suggestion.reason,
    ownerTeams,
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
