import { loadGuardrailsConfig } from '../config/guardrails.js';

function blameRegexes() {
  const { actions } = loadGuardrailsConfig();
  const patterns = actions?.blamePatterns || [];
  return patterns.map((pattern) => new RegExp(pattern, 'i'));
}

export function validateMinFeedbackToClose(feedbackCount) {
  const { close } = loadGuardrailsConfig();
  const min = close?.minFeedbackCount ?? 0;
  if (feedbackCount < min) {
    return [
      `Cannot close retrospective: at least ${min} feedback item(s) required (found ${feedbackCount}). Adjust config/guardrails.json → close.minFeedbackCount.`,
    ];
  }
  return [];
}

export function validateExplicitApproval(suggestionId, body = {}) {
  const { approval } = loadGuardrailsConfig();
  if (!approval?.requireExplicitConfirmation) return [];

  const phrase = String(body.approvalConfirmation || '').trim();
  if (!phrase) {
    return [
      `approvalConfirmation is required. User must confirm with: approve ${suggestionId}`,
    ];
  }

  const prefix = approval.confirmationPrefix || 'approve';
  const expected = new RegExp(`^${prefix}\\s+${suggestionId}$`, 'i');
  if (!expected.test(phrase)) {
    return [
      `approvalConfirmation must match "${prefix} ${suggestionId}" (received: "${phrase}")`,
    ];
  }
  return [];
}

export function validateNoBlameLanguage(fields) {
  const errors = [];
  const regexes = blameRegexes();
  for (const [field, value] of Object.entries(fields)) {
    if (!value) continue;
    const text = String(value);
    for (const regex of regexes) {
      if (regex.test(text)) {
        errors.push(
          `${field} contains blame or individual performance language (matched: ${regex}). Use team/process wording instead.`
        );
        break;
      }
    }
  }
  return errors;
}
