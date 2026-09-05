import {
  appendAudit,
  readFeedbackItems,
  writeFeedbackItem,
} from './file-storage.service.js';
import { assertEditable, getRetrospective } from './retrospective.service.js';
import { nextFeedbackId } from './id.service.js';
import { validateFeedback } from '../validators/feedback.validator.js';
import { badRequest } from '../utils/errors.js';
import { nowIso } from '../utils/dates.js';

export async function listFeedback(retroId) {
  await getRetrospective(retroId);
  return readFeedbackItems(retroId);
}

export async function submitFeedback(retroId, body) {
  const retro = await assertEditable(retroId);
  const errors = validateFeedback(body, retro.status);
  if (errors.length) throw badRequest(errors.join('; '));

  const existing = await readFeedbackItems(retroId);
  const item = {
    id: nextFeedbackId(existing),
    retroId,
    type: body.type,
    text: body.text,
    anonymous: body.anonymous === true,
    displayName: body.anonymous === true ? null : body.displayName.trim(),
    createdAt: nowIso(),
  };

  await writeFeedbackItem(retroId, item);
  await appendAudit(retroId, 'feedback.submitted', { feedbackId: item.id, type: item.type });
  return item;
}
