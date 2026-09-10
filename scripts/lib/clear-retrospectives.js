import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function retrospectivesDir() {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const dataRoot = path.resolve(projectRoot, process.env.DATA_ROOT || './data');
  return path.join(dataRoot, 'retrospectives');
}

/**
 * Remove all RETRO-* retrospective folders under data/retrospectives.
 * @returns {Promise<string[]>} deleted retrospective ids
 */
export async function clearAllRetrospectives() {
  const dir = retrospectivesDir();
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    await fs.mkdir(dir, { recursive: true });
    return [];
  }

  const deleted = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith('RETRO-')) continue;
    await fs.rm(path.join(dir, entry.name), { recursive: true, force: true });
    deleted.push(entry.name);
  }
  return deleted.sort();
}
