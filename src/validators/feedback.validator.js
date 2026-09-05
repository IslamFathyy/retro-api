const FEEDBACK_TYPES = ['went-well', 'did-not-go-well', 'improvement'];
const MAX_TEXT_LENGTH = 2000;

export function validateCreateRetro(body) {
  const errors = [];
  if (!body.title?.trim()) errors.push('title is required');
  if (!body.team?.trim()) errors.push('team is required');
  if (!body.period?.trim()) errors.push('period is required');
  return errors;
}

export function validateFeedback(body, retroStatus) {
  const errors = [];
  if (retroStatus !== 'open') {
    errors.push('feedback can only be submitted when retrospective is open');
  }
  if (!FEEDBACK_TYPES.includes(body.type)) {
    errors.push('type must be went-well, did-not-go-well, or improvement');
  }
  if (!body.text?.trim()) {
    errors.push('text is required');
  } else if (body.text.length > MAX_TEXT_LENGTH) {
    errors.push(`text must be at most ${MAX_TEXT_LENGTH} characters`);
  }
  if (body.anonymous === true) {
    if (body.displayName != null && body.displayName !== '') {
      errors.push('displayName must be null for anonymous feedback');
    }
  } else if (!body.displayName?.trim()) {
    errors.push('displayName is required for named feedback');
  }
  return errors;
}

export function validateAction(body, isUpdate = false) {
  const errors = [];
  const statuses = ['open', 'in-progress', 'done', 'cancelled'];
  if (!isUpdate && !body.title?.trim()) errors.push('title is required');
  if (body.status && !statuses.includes(body.status)) {
    errors.push('invalid status');
  }
  return errors;
}

export { FEEDBACK_TYPES, MAX_TEXT_LENGTH };
