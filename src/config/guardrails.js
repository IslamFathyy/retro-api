import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

const DEFAULT_GUARDRAILS = {
  version: 1,
  close: { minFeedbackCount: 3 },
  approval: { requireExplicitConfirmation: true, confirmationPrefix: 'approve' },
  actions: {
    blamePatterns: [
      '\\bfault\\b',
      '\\bblame\\b',
      '\\bunderperform',
    ],
  },
};

let cachedConfig = null;

function resolveConfigPath() {
  if (process.env.GUARDRAILS_CONFIG) {
    return path.resolve(process.env.GUARDRAILS_CONFIG);
  }
  const candidates = [
    path.join(projectRoot, '../config/guardrails.json'),
    path.join(projectRoot, 'config/guardrails.json'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

export function loadGuardrailsConfig() {
  if (cachedConfig) return cachedConfig;

  const configPath = resolveConfigPath();
  if (!configPath) {
    cachedConfig = DEFAULT_GUARDRAILS;
    return cachedConfig;
  }

  const raw = fs.readFileSync(configPath, 'utf8');
  cachedConfig = { ...DEFAULT_GUARDRAILS, ...JSON.parse(raw) };
  return cachedConfig;
}

export function resetGuardrailsConfigCache() {
  cachedConfig = null;
}
