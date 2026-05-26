import {
  CACHE_FILES,
  buildManifestFromCacheFiles,
  createServices,
  readCacheFile,
  readOptionalCacheFile,
} from '../_shared/campus-cache.js';
import { Account, Client } from 'node-appwrite';

function parseRequestBody(req) {
  try {
    return req.bodyJson && typeof req.bodyJson === 'object' ? req.bodyJson : {};
  } catch {
    return {};
  }
}

async function readManifest(storage) {
  try {
    return await readCacheFile(storage, CACHE_FILES.manifest);
  } catch (error) {
    if (error?.code !== 404) {
      throw error;
    }

    return buildManifestFromCacheFiles(storage);
  }
}

function getManifestFile(manifest, key) {
  return manifest?.files?.[key] ?? null;
}

function getCacheSelection(manifest, includeDiningMenuItems) {
  if (includeDiningMenuItems) {
    const diningLatest = getManifestFile(manifest, 'diningLatest');
    const full = getManifestFile(manifest, 'full');

    return {
      generatedAt: diningLatest?.generatedAt ?? full?.generatedAt ?? manifest?.generatedAt ?? null,
      version: diningLatest?.version ?? full?.version ?? manifest?.version ?? null,
    };
  }

  const summary = getManifestFile(manifest, 'summary');

  return {
    generatedAt: summary?.generatedAt ?? manifest?.generatedAt ?? null,
    version: summary?.version ?? manifest?.version ?? null,
  };
}

async function readSummaryPayload(storage) {
  const summary = await readOptionalCacheFile(storage, CACHE_FILES.summary);

  if (summary) {
    return summary;
  }

  const full = await readOptionalCacheFile(storage, CACHE_FILES.full);

  if (full) {
    return {
      diningHalls: full.diningHalls ?? [],
      diningMenuItems: [],
      generatedAt: full.generatedAt,
      gymCapacities: full.gymCapacities ?? [],
      version: full.version,
    };
  }

  throw new Error('Campus summary cache is not available');
}

async function composeCampusPayload(storage, includeDiningMenuItems, selection) {
  const summary = await readSummaryPayload(storage);

  if (!includeDiningMenuItems) {
    return {
      diningHalls: summary.diningHalls ?? [],
      diningMenuItems: [],
      generatedAt: selection.generatedAt ?? summary.generatedAt,
      gymCapacities: summary.gymCapacities ?? [],
      version: selection.version ?? summary.version,
    };
  }

  const diningLatest = await readOptionalCacheFile(storage, CACHE_FILES.diningLatest);
  const gymsCurrent = await readOptionalCacheFile(storage, CACHE_FILES.gymsCurrent);

  if (diningLatest || gymsCurrent) {
    return {
      diningHalls: summary.diningHalls ?? [],
      diningMenuItems: diningLatest?.diningMenuItems ?? [],
      generatedAt:
        selection.generatedAt ??
        diningLatest?.generatedAt ??
        gymsCurrent?.generatedAt ??
        summary.generatedAt,
      gymCapacities: gymsCurrent?.gymCapacities ?? summary.gymCapacities ?? [],
      version: selection.version ?? diningLatest?.version ?? summary.version,
    };
  }

  const full = await readOptionalCacheFile(storage, CACHE_FILES.full);

  if (!full) {
    throw new Error('Campus full cache is not available');
  }

  return {
    diningHalls: full.diningHalls ?? [],
    diningMenuItems: full.diningMenuItems ?? [],
    generatedAt: selection.generatedAt ?? full.generatedAt,
    gymCapacities: full.gymCapacities ?? [],
    version: selection.version ?? full.version,
  };
}

function createUserAccount(req) {
  const endpoint =
    process.env.APPWRITE_FUNCTION_API_ENDPOINT ??
    process.env.APPWRITE_ENDPOINT ??
    'https://sfo.cloud.appwrite.io/v1';
  const projectId =
    process.env.APPWRITE_FUNCTION_PROJECT_ID ??
    process.env.APPWRITE_PROJECT_ID ??
    '6a067d46002856bc7794';
  const jwt = req.headers['x-appwrite-user-jwt'];

  if (!jwt) {
    return null;
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setJWT(jwt);

  return new Account(client);
}

async function authenticateRequest(req) {
  const account = createUserAccount(req);

  if (!account) {
    return { error: 'Unauthorized', userId: null };
  }

  try {
    const user = await account.get();
    return { error: null, userId: user.$id };
  } catch {
    return { error: 'Unauthorized', userId: null };
  }
}

export default async ({ req, res, error }) => {
  if (req.method !== 'POST') {
    return res.json({ error: 'Method not allowed' }, 405);
  }

  try {
    const auth = await authenticateRequest(req);

    if (auth.error || !auth.userId) {
      return res.json({ error: auth.error ?? 'Unauthorized' }, 401);
    }

    const services = createServices(req);
    const body = parseRequestBody(req);
    const includeDiningMenuItems = body.includeDiningMenuItems ?? true;
    const manifest = await readManifest(services.storage);
    const selection = getCacheSelection(manifest, includeDiningMenuItems);

    if (body.knownVersion && selection.version && body.knownVersion === selection.version) {
      return res.text('', 304, {
        'x-bruingains-cache-version': selection.version,
        'x-bruingains-cache-generated-at': selection.generatedAt ?? '',
      });
    }

    const payload = await composeCampusPayload(
      services.storage,
      includeDiningMenuItems,
      selection,
    );

    return res.json(payload, 200, {
      'cache-control': 'private, max-age=60',
      'x-bruingains-cache-version': payload.version,
      'x-bruingains-cache-generated-at': payload.generatedAt,
    });
  } catch (exception) {
    error(`Campus data request failed: ${exception?.message ?? exception}`);
    return res.json({ error: 'Campus data request failed' }, 500);
  }
};
