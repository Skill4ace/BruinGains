const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { Client, Functions } = require('node-appwrite');
const { InputFile } = require('node-appwrite/file');

const { getAppwriteConfig } = require('./appwrite-env.cjs');
const { FUNCTION_DEFINITIONS } = require('./schema.cjs');

const FUNCTIONS_ROOT = path.resolve(__dirname, '..', '..', 'appwrite', 'functions');

function createFunctions() {
  const { endpoint, projectId, apiKey } = getAppwriteConfig();
  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  return new Functions(client);
}

function packageFunction(functionId) {
  const functionDir = path.join(FUNCTIONS_ROOT, functionId);
  const sharedDir = path.join(FUNCTIONS_ROOT, '_shared');

  if (!fs.existsSync(functionDir)) {
    throw new Error(`Missing function source directory: ${functionDir}`);
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `bruingains-${functionId}-`));
  const packageDir = path.join(tmpDir, 'package');
  const archivePath = path.join(tmpDir, `${functionId}.tar.gz`);

  fs.cpSync(functionDir, packageDir, { recursive: true });
  fs.cpSync(sharedDir, path.join(packageDir, '_shared'), { recursive: true });
  execFileSync('tar', ['-czf', archivePath, '-C', packageDir, '.']);

  return archivePath;
}

async function main() {
  const functions = createFunctions();

  for (const definition of FUNCTION_DEFINITIONS) {
    const archivePath = packageFunction(definition.id);
    console.log(`deploy ${definition.id}`);
    await functions.createDeployment({
      functionId: definition.id,
      code: InputFile.fromPath(archivePath, `${definition.id}.tar.gz`),
      activate: true,
      entrypoint: 'src/main.js',
      commands: 'npm install',
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
