/**
 * Provider routes - get and update provider config
 */

import type { ApiRequest, ApiResponse, ServerContext } from '../types.js';
import { loadProvider, saveProvider } from '../../lib/index.js';
import type { Provider } from '../../types.js';

export function getProvider(ctx: ServerContext) {
  return async (req: ApiRequest, res: ApiResponse): Promise<void> => {
    const { persona } = req.params!;
    const paths = ctx.getPersonaPaths(persona);

    try {
      const provider = loadProvider(paths.provider);
      res.json(provider);
    } catch (err) {
      if ((err as Error).message.includes('not found')) {
        res.json(null, 200);
      } else {
        throw err;
      }
    }
  };
}

export function updateProvider(ctx: ServerContext) {
  return async (req: ApiRequest, res: ApiResponse): Promise<void> => {
    const { persona } = req.params!;
    const paths = ctx.getPersonaPaths(persona);
    const provider = req.body as Provider;
    saveProvider(provider, paths.provider);
    res.json({ success: true, provider });
  };
}
