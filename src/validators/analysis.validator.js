import { validateOwnerTeams } from './action-teams.validator.js';

export function validateAiAnalysisPayload(payload, feedbackIds) {
  const errors = [];
  const idSet = new Set(feedbackIds);

  if (!payload || typeof payload !== 'object') {
    return ['AI analysis payload must be a JSON object.'];
  }

  const listFields = ['themes', 'strengths', 'concerns', 'opportunities', 'suggestedActions', 'limitations'];
  for (const field of listFields) {
    if (!Array.isArray(payload[field])) {
      errors.push(`${field} must be an array.`);
    }
  }

  if (errors.length) return errors;

  for (const theme of payload.themes) {
    if (!theme?.name || !Array.isArray(theme.feedbackIds) || !theme.summary) {
      errors.push('Each theme requires name, feedbackIds, and summary.');
      continue;
    }
    for (const id of theme.feedbackIds) {
      if (!idSet.has(id)) errors.push(`Theme references unknown feedback ID: ${id}`);
    }
  }

  for (const field of ['strengths', 'concerns', 'opportunities']) {
    for (const item of payload[field]) {
      if (!item?.feedbackId || !item?.summary) {
        errors.push(`Each ${field} item requires feedbackId and summary.`);
        continue;
      }
      if (!idSet.has(item.feedbackId)) {
        errors.push(`${field} references unknown feedback ID: ${item.feedbackId}`);
      }
    }
  }

  for (const action of payload.suggestedActions) {
    if (!action?.title || !action?.reason || !Array.isArray(action.sourceFeedbackIds)) {
      errors.push('Each suggested action requires title, reason, and sourceFeedbackIds.');
      continue;
    }
    for (const id of action.sourceFeedbackIds) {
      if (!idSet.has(id)) errors.push(`Suggested action references unknown feedback ID: ${id}`);
    }
    errors.push(...validateOwnerTeams(action.ownerTeams, { required: true }));
  }

  if (!payload.limitations.some((line) => /human review/i.test(String(line)))) {
    errors.push('limitations must mention that human review is required.');
  }

  return errors;
}
