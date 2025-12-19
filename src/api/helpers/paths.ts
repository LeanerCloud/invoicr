/**
 * Path helpers for API server
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Get default base path (~/.invoicr/)
 */
export function getDefaultBasePath(): string {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  return path.join(home, '.invoicr');
}

/**
 * Ensure base directory exists
 */
export function ensureBaseDir(basePath: string): void {
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
    console.log(`Created base directory: ${basePath}`);
  }
}
