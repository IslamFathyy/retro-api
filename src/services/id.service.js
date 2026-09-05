import { listRetroIds } from './file-storage.service.js';

const STATUS_ORDER = ['draft', 'open', 'closed', 'analyzed', 'actioned', 'archived'];

const TRANSITIONS = {
  draft: ['open'],
  open: ['closed'],
  closed: ['analyzed'],
  analyzed: ['actioned'],
  actioned: ['archived'],
  archived: [],
};

export function canTransition(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

export function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    throw new Error(`Cannot change status from "${from}" to "${to}"`);
  }
}

export function nextRetroId(existingIds) {
  const year = new Date().getFullYear();
  const prefix = `RETRO-${year}-`;
  const numbers = existingIds
    .filter((id) => id.startsWith(prefix))
    .map((id) => Number(id.slice(prefix.length)))
    .filter((n) => !Number.isNaN(n));
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
}

export function nextFeedbackId(existing) {
  const numbers = existing
    .map((item) => Number(item.id.replace('FB-', '')))
    .filter((n) => !Number.isNaN(n));
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `FB-${String(next).padStart(4, '0')}`;
}

export function nextActionId(existing) {
  const numbers = existing
    .map((item) => Number(item.id.replace('ACT-', '')))
    .filter((n) => !Number.isNaN(n));
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `ACT-${String(next).padStart(4, '0')}`;
}

export function nextSuggestionId(count) {
  return `SUG-${String(count + 1).padStart(3, '0')}`;
}

export async function getAllRetroIdsSorted() {
  const ids = await listRetroIds();
  return ids.sort((a, b) => {
    const ai = STATUS_ORDER.indexOf(a.split('-').pop());
    return a.localeCompare(b);
  });
}

export const VALID_STATUSES = STATUS_ORDER;
export const ANALYSIS_ALLOWED = ['closed', 'analyzed', 'actioned', 'archived'];
