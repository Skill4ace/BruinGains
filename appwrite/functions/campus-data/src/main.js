import {
  CACHE_FILES,
  buildCampusCache,
  createServices,
  enforceCampusDataRateLimit,
  readCacheFile,
} from '../_shared/campus-cache.js';
import { Account, Client } from 'node-appwrite';

function parseRequestBody(req) {
  try {
    return req.bodyJson && typeof req.bodyJson === 'object' ? req.bodyJson : {};
  } catch {
    return {};
  }
}

async function readOrBuildCache(services, fileId) {
  try {
    return await readCacheFile(services.storage, fileId);
  } catch (error) {
    if (error?.code !== 404) {
      throw error;
    }

    await buildCampusCache(services);
    return readCacheFile(services.storage, fileId);
  }
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
    const ipAddress = req.headers['x-appwrite-client-ip'] || null;
    const rateLimit = await enforceCampusDataRateLimit(
      services.tables,
      auth.userId,
      ipAddress,
    );

    if (!rateLimit.allowed) {
      return res.json({ error: rateLimit.error }, 429);
    }

    const body = parseRequestBody(req);
    const includeDiningMenuItems = body.includeDiningMenuItems ?? true;
    const fileId = includeDiningMenuItems ? CACHE_FILES.full : CACHE_FILES.summary;
    const payload = await readOrBuildCache(services, fileId);

    if (body.knownVersion && body.knownVersion === payload.version) {
      return res.text('', 304, {
        'x-bruingains-cache-version': payload.version,
        'x-bruingains-cache-generated-at': payload.generatedAt,
      });
    }

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
