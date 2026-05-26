import {
  buildCampusCache,
  buildManifestFromCacheFiles,
  createServices,
} from '../_shared/campus-cache.js';

function parseRequestBody(req) {
  try {
    return req.bodyJson && typeof req.bodyJson === 'object' ? req.bodyJson : {};
  } catch {
    return {};
  }
}

export default async ({ req, res, error }) => {
  try {
    const body = parseRequestBody(req);
    const services = createServices(req);

    if (body.storageOnly === true) {
      const manifest = await buildManifestFromCacheFiles(services.storage);

      return res.json({
        ok: true,
        manifest,
        storageOnly: true,
      });
    }

    const result = await buildCampusCache(services);
    return res.json({ ok: true, storageOnly: false, ...result });
  } catch (exception) {
    error(`Campus cache build failed: ${exception?.message ?? exception}`);
    return res.json({ ok: false, error: 'Campus cache build failed' }, 500);
  }
};
