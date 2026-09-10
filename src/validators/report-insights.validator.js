const PRIORITIES = new Set(['high', 'medium', 'low']);
const PEOPLE_PATTERNS = [
  /\b\d+\s+people\b/i,
  /\bpeople\s+mentioned\b/i,
  /\bteam\s+members\b/i,
  /\bindividuals?\s+(said|reported|mentioned)\b/i,
  /\bheadcount\b/i,
];

function containsPeopleLanguage(text) {
  const value = String(text || '');
  return PEOPLE_PATTERNS.some((pattern) => pattern.test(value));
}

export function validateReportInsightsPayload(payload, feedbackIds, retroIds) {
  const errors = [];
  const feedbackSet = new Set(feedbackIds);
  const retroSet = new Set(retroIds);

  if (!payload || typeof payload !== 'object') {
    return ['Report insights payload must be a JSON object.'];
  }

  if (!payload.generatedBy) errors.push('generatedBy is required.');
  if (!payload.participationMix || typeof payload.participationMix !== 'object') {
    errors.push('participationMix is required.');
  }

  for (const field of ['topicBreakdown', 'recurringTopics', 'limitations']) {
    if (!Array.isArray(payload[field])) {
      errors.push(`${field} must be an array.`);
    }
  }

  if (errors.length) return errors;

  if (
    !payload.limitations.some((line) => /feedback items|not individuals/i.test(String(line)))
  ) {
    errors.push('limitations must state that counts are feedback items, not individuals.');
  }

  for (const topic of payload.topicBreakdown) {
    if (!topic?.label || !Array.isArray(topic.feedbackIds) || !topic.summary) {
      errors.push('Each topicBreakdown item requires label, feedbackIds, and summary.');
      continue;
    }
    if (!PRIORITIES.has(topic.priority)) {
      errors.push(`Invalid priority on topic "${topic.label}".`);
    }
    for (const id of topic.feedbackIds) {
      if (!feedbackSet.has(id)) errors.push(`topicBreakdown references unknown feedback ID: ${id}`);
    }
    if (containsPeopleLanguage(`${topic.label} ${topic.summary}`)) {
      errors.push(`topicBreakdown must not use people-count language: ${topic.label}`);
    }
  }

  for (const topic of payload.recurringTopics) {
    if (!topic?.label || !Array.isArray(topic.retroIds) || !topic.summary) {
      errors.push('Each recurringTopics item requires label, retroIds, and summary.');
      continue;
    }
    if (!PRIORITIES.has(topic.priority)) {
      errors.push(`Invalid priority on recurring topic "${topic.label}".`);
    }
    for (const id of topic.retroIds) {
      if (!retroSet.has(id)) errors.push(`recurringTopics references unknown retro ID: ${id}`);
    }
    if (containsPeopleLanguage(`${topic.label} ${topic.summary}`)) {
      errors.push(`recurringTopics must not use people-count language: ${topic.label}`);
    }
  }

  return errors;
}
