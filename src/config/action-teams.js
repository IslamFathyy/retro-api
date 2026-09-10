import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

const DEFAULT_TEAMS = [
  { id: 'dev-team', label: 'Dev Team' },
  { id: 'qa-team', label: 'QA Team' },
  { id: 'product-team', label: 'Product Team' },
  { id: 'ops-team', label: 'Ops Team' },
  { id: 'management-team', label: 'Management Team' },
];

let cachedConfig = null;

function resolveConfigPath() {
  if (process.env.ACTION_TEAMS_CONFIG) {
    return path.resolve(process.env.ACTION_TEAMS_CONFIG);
  }
  const candidates = [
    path.join(projectRoot, '../config/action-teams.json'),
    path.join(projectRoot, 'config/action-teams.json'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

export function loadActionTeamsConfig() {
  if (cachedConfig) return cachedConfig;

  const configPath = resolveConfigPath();
  if (!configPath) {
    cachedConfig = { version: 1, teams: DEFAULT_TEAMS };
    return cachedConfig;
  }

  const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  cachedConfig = { version: raw.version || 1, teams: raw.teams || DEFAULT_TEAMS };
  return cachedConfig;
}

export function resetActionTeamsConfigCache() {
  cachedConfig = null;
}

export function listActionTeams() {
  return loadActionTeamsConfig().teams;
}

export function getAllowedTeamIds() {
  return new Set(listActionTeams().map((team) => team.id));
}

export function getTeamLabel(teamId) {
  const team = listActionTeams().find((entry) => entry.id === teamId);
  return team?.label || teamId;
}

export function formatOwnerTeamLabels(ownerTeams = []) {
  if (!ownerTeams?.length) return 'Unassigned';
  return ownerTeams.map((id) => getTeamLabel(id)).join(', ');
}
