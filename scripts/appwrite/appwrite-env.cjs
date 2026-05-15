const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local', override: false, quiet: true });
dotenv.config({ path: '.env', override: false, quiet: true });

function readCodexAppwriteEnv() {
  const configPath = path.join(os.homedir(), '.codex', 'config.toml');

  if (!fs.existsSync(configPath)) {
    return {};
  }

  const rawConfig = fs.readFileSync(configPath, 'utf8');
  const env = {};
  let inAppwriteEnv = false;

  for (const line of rawConfig.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    if (trimmed.startsWith('[')) {
      inAppwriteEnv = trimmed === '[mcp_servers.appwrite.env]';
      continue;
    }

    if (!inAppwriteEnv) {
      continue;
    }

    const match = trimmed.match(/^([A-Z0-9_]+)\s*=\s*"([^"]*)"$/);

    if (match) {
      env[match[1]] = match[2];
    }
  }

  return env;
}

function getAppwriteConfig() {
  const codexEnv = readCodexAppwriteEnv();
  const endpoint =
    process.env.APPWRITE_ENDPOINT ??
    process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ??
    codexEnv.APPWRITE_ENDPOINT;
  const projectId =
    process.env.APPWRITE_PROJECT_ID ??
    process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID ??
    codexEnv.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY ?? codexEnv.APPWRITE_API_KEY;

  if (!endpoint || !projectId || !apiKey) {
    throw new Error(
      'Missing Appwrite config. Set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, and APPWRITE_API_KEY.',
    );
  }

  return { endpoint, projectId, apiKey };
}

function isAppwriteMissing(error) {
  return error?.code === 404 || error?.type === 'general_not_found';
}

function isAppwriteConflict(error) {
  return error?.code === 409 || String(error?.type ?? '').includes('already_exists');
}

module.exports = {
  getAppwriteConfig,
  isAppwriteConflict,
  isAppwriteMissing,
};
