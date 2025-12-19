/**
 * System routes - health check, LibreOffice status, and countries
 */

import type { ApiRequest, ApiResponse, ServerContext } from '../types.js';
import { isLibreOfficeAvailable, getLibreOfficeVersion } from '../../lib/index.js';
import { getAllCountries } from '../../data/countries.js';

export function healthCheck(ctx: ServerContext) {
  return async (_req: ApiRequest, res: ApiResponse): Promise<void> => {
    res.json({
      status: 'ok',
      version: '1.6.1',
      basePath: ctx.basePath,
      timestamp: new Date().toISOString()
    });
  };
}

export function libreOfficeStatus() {
  return async (_req: ApiRequest, res: ApiResponse): Promise<void> => {
    const available = isLibreOfficeAvailable();
    const version = available ? getLibreOfficeVersion() : null;
    res.json({ available, version });
  };
}

export function getCountries() {
  return async (_req: ApiRequest, res: ApiResponse): Promise<void> => {
    res.json(getAllCountries());
  };
}
