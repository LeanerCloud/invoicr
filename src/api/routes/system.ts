/**
 * System routes - health check, PDF converter status, and countries
 */

import type { ApiRequest, ApiResponse, ServerContext } from '../types.js';
import { detectPdfConverter } from '../../lib/index.js';
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
    const version = detectPdfConverter();
    res.json({ available: version !== null, version });
  };
}

export function getCountries() {
  return async (_req: ApiRequest, res: ApiResponse): Promise<void> => {
    res.json(getAllCountries());
  };
}
