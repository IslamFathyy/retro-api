import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

export const DATA_ROOT = path.resolve(
  projectRoot,
  process.env.DATA_ROOT || './data'
);

export const RETROSPECTIVES_DIR = path.join(DATA_ROOT, 'retrospectives');
export const TEAMS_FILE = path.join(DATA_ROOT, 'teams.json');
export const THEME_DICTIONARY_FILE = path.join(DATA_ROOT, 'theme-dictionary.json');
