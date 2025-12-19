/**
 * Translation routes - get available translations and translation data
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ApiRequest, ApiResponse } from '../types.js';
import { getTranslationPaths } from '../helpers/translations.js';

export function getAvailableTranslations() {
  return async (_req: ApiRequest, res: ApiResponse): Promise<void> => {
    const { backendDir, guiDir } = getTranslationPaths();
    const languages = new Set<string>();

    try {
      // Read from backend translations
      if (fs.existsSync(backendDir)) {
        fs.readdirSync(backendDir)
          .filter(f => f.endsWith('.json'))
          .forEach(f => languages.add(f.replace('.json', '')));
      }

      // Read from GUI translations (100 languages)
      if (fs.existsSync(guiDir)) {
        fs.readdirSync(guiDir)
          .filter(f => f.endsWith('.json'))
          .forEach(f => languages.add(f.replace('.json', '')));
      }

      res.json({ languages: Array.from(languages).sort() });
    } catch (err) {
      res.json({ languages: ['en', 'de'] }); // Fallback
    }
  };
}

export function getTranslation() {
  return async (req: ApiRequest, res: ApiResponse): Promise<void> => {
    const { lang } = req.params!;
    const { backendDir, guiDir } = getTranslationPaths();

    // Check backend first, then GUI translations
    const backendPath = path.join(backendDir, `${lang}.json`);
    const guiPath = path.join(guiDir, `${lang}.json`);

    try {
      let translationPath: string | null = null;

      if (fs.existsSync(backendPath)) {
        translationPath = backendPath;
      } else if (fs.existsSync(guiPath)) {
        translationPath = guiPath;
      }

      if (translationPath) {
        const translation = JSON.parse(fs.readFileSync(translationPath, 'utf8'));
        res.json({ language: lang, translation, exists: true });
      } else {
        // Return English as fallback with exists: false
        const enPath = fs.existsSync(path.join(backendDir, 'en.json'))
          ? path.join(backendDir, 'en.json')
          : path.join(guiDir, 'en.json');
        const enTranslation = JSON.parse(fs.readFileSync(enPath, 'utf8'));
        res.json({ language: lang, translation: enTranslation, exists: false });
      }
    } catch (err) {
      res.error('Failed to load translation', 500);
    }
  };
}
