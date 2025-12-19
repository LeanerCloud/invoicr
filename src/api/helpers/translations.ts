/**
 * Translation loading helper for API server
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { Translations } from '../../types.js';

// Get __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load translations for a given language
 * Supports both unified format (with 'invoice' key) and legacy flat format
 */
export function loadTranslations(lang: string): Translations {
  // Check GUI translations first (unified format), then backend translations
  const guiPath = path.join(__dirname, '..', '..', '..', 'gui', 'src', 'translations', `${lang}.json`);
  const backendPath = path.join(__dirname, '..', '..', 'translations', `${lang}.json`);

  let translationsPath: string | null = null;
  if (fs.existsSync(guiPath)) {
    translationsPath = guiPath;
  } else if (fs.existsSync(backendPath)) {
    translationsPath = backendPath;
  }

  if (!translationsPath) {
    throw new Error(`Translations not found for language: ${lang}`);
  }

  const data = JSON.parse(fs.readFileSync(translationsPath, 'utf8'));

  // Handle unified format: extract 'invoice' section
  if (data.invoice) {
    return data.invoice as Translations;
  }

  // Handle legacy flat format (direct translation keys)
  return data as Translations;
}

/**
 * Get translation directory paths
 */
export function getTranslationPaths() {
  const backendDir = path.join(__dirname, '..', '..', 'translations');
  const guiDir = path.join(__dirname, '..', '..', '..', 'gui', 'src', 'translations');
  return { backendDir, guiDir };
}
