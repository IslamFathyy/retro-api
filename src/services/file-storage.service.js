import fs from 'node:fs/promises';
import path from 'node:path';
import { RETROSPECTIVES_DIR } from '../config/paths.js';
import { assertNoTraversal, assertSafeId } from '../utils/ids.js';
import {
  appendJsonl,
  fileExists,
  listJsonFiles,
  readJsonFile,
  readTextFile,
  writeJsonAtomic,
  writeTextAtomic,
} from '../utils/json.js';
import { nowIso } from '../utils/dates.js';

export function getRetroDir(retroId) {
  assertSafeId(retroId, 'retro');
  assertNoTraversal(retroId);
  const dir = path.join(RETROSPECTIVES_DIR, retroId);
  const resolved = path.resolve(dir);
  if (!resolved.startsWith(path.resolve(RETROSPECTIVES_DIR))) {
    throw new Error('Path traversal blocked');
  }
  return resolved;
}

export function retroPaths(retroId) {
  const dir = getRetroDir(retroId);
  return {
    dir,
    meta: path.join(dir, 'retro.json'),
    feedbackDir: path.join(dir, 'feedback'),
    analysis: path.join(dir, 'analysis.json'),
    actions: path.join(dir, 'actions.json'),
    report: path.join(dir, 'report.md'),
    audit: path.join(dir, 'audit.jsonl'),
  };
}

export async function ensureRetroFolder(retroId) {
  const paths = retroPaths(retroId);
  await fs.mkdir(paths.feedbackDir, { recursive: true });
  return paths;
}

export async function listRetroIds() {
  try {
    const entries = await fs.readdir(RETROSPECTIVES_DIR, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  } catch {
    return [];
  }
}

export async function readRetroMeta(retroId) {
  const { meta } = retroPaths(retroId);
  if (!(await fileExists(meta))) return null;
  return readJsonFile(meta);
}

export async function writeRetroMeta(retro) {
  const paths = await ensureRetroFolder(retro.id);
  await writeJsonAtomic(paths.meta, retro);
}

export async function readFeedbackItems(retroId) {
  const { feedbackDir } = retroPaths(retroId);
  const files = await listJsonFiles(feedbackDir);
  const items = [];
  for (const file of files.sort()) {
    items.push(await readJsonFile(path.join(feedbackDir, file)));
  }
  return items;
}

export async function writeFeedbackItem(retroId, item) {
  assertSafeId(item.id, 'feedback');
  const { feedbackDir } = retroPaths(retroId);
  await fs.mkdir(feedbackDir, { recursive: true });
  await writeJsonAtomic(path.join(feedbackDir, `${item.id}.json`), item);
}

export async function readAnalysis(retroId) {
  const { analysis } = retroPaths(retroId);
  if (!(await fileExists(analysis))) return null;
  return readJsonFile(analysis);
}

export async function writeAnalysis(retroId, analysis) {
  const paths = retroPaths(retroId);
  await writeJsonAtomic(paths.analysis, analysis);
}

export async function readActionsDoc(retroId) {
  const { actions } = retroPaths(retroId);
  if (!(await fileExists(actions))) {
    return { retroId, actions: [] };
  }
  return readJsonFile(actions);
}

export async function writeActionsDoc(retroId, doc) {
  const paths = retroPaths(retroId);
  await writeJsonAtomic(paths.actions, doc);
}

export async function readReport(retroId) {
  const { report } = retroPaths(retroId);
  if (!(await fileExists(report))) return null;
  return readTextFile(report);
}

export async function writeReport(retroId, markdown) {
  const paths = retroPaths(retroId);
  await writeTextAtomic(paths.report, markdown);
}

export async function appendAudit(retroId, event, details = {}) {
  const { audit } = retroPaths(retroId);
  await appendJsonl(audit, {
    timestamp: nowIso(),
    event,
    retroId,
    ...details,
  });
}
