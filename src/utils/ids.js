export const ID_PATTERNS = {
  retro: /^RETRO-\d{4}-\d{3}$/,
  feedback: /^FB-\d{4}$/,
  action: /^ACT-\d{4}$/,
  suggestion: /^SUG-\d{3}$/,
};

export function assertSafeId(id, kind) {
  const pattern = ID_PATTERNS[kind];
  if (!pattern || !pattern.test(id)) {
    throw new Error(`Invalid ${kind} ID: ${id}`);
  }
}

export function assertNoTraversal(segment) {
  if (
    !segment ||
    segment.includes('..') ||
    segment.includes('/') ||
    segment.includes('\\')
  ) {
    throw new Error('Invalid path segment');
  }
}
