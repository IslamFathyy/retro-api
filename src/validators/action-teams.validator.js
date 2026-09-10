import { getAllowedTeamIds } from '../config/action-teams.js';

export function validateOwnerTeams(ownerTeams, { required = true } = {}) {
  const errors = [];
  if (!Array.isArray(ownerTeams)) {
    if (required) errors.push('ownerTeams must be a non-empty array of team ids.');
    return errors;
  }

  const unique = [...new Set(ownerTeams)];
  if (required && unique.length === 0) {
    errors.push('ownerTeams must include at least one team.');
    return errors;
  }

  const allowed = getAllowedTeamIds();
  for (const teamId of unique) {
    if (!allowed.has(teamId)) {
      errors.push(`Unknown action team id: ${teamId}. Use ids from config/action-teams.json.`);
    }
  }

  return errors;
}
