import { buildCampusCache, createServices } from '../_shared/campus-cache.js';

export default async ({ req, res, error }) => {
  try {
    const result = await buildCampusCache(createServices(req));
    return res.json({ ok: true, ...result });
  } catch (exception) {
    error(`Campus cache build failed: ${exception?.message ?? exception}`);
    return res.json({ ok: false, error: 'Campus cache build failed' }, 500);
  }
};

