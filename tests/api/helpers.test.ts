/**
 * API helper tests - paths.ts and translations.ts
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { getDefaultBasePath, ensureBaseDir } from '../../src/api/helpers/paths.js';
import { loadTranslations, getTranslationPaths } from '../../src/api/helpers/translations.js';

describe('paths helper', () => {
  describe('getDefaultBasePath', () => {
    const originalHome = process.env.HOME;
    const originalUserProfile = process.env.USERPROFILE;

    afterEach(() => {
      // Restore original values
      if (originalHome !== undefined) {
        process.env.HOME = originalHome;
      }
      if (originalUserProfile !== undefined) {
        process.env.USERPROFILE = originalUserProfile;
      }
    });

    it('should return path based on HOME env variable', () => {
      process.env.HOME = '/Users/testuser';
      const result = getDefaultBasePath();
      expect(result).toBe('/Users/testuser/.invoicr');
    });

    it('should use USERPROFILE if HOME is not set', () => {
      delete process.env.HOME;
      process.env.USERPROFILE = 'C:\\Users\\testuser';
      const result = getDefaultBasePath();
      expect(result).toBe(path.join('C:\\Users\\testuser', '.invoicr'));
    });

    it('should return .invoicr if no home env is set', () => {
      delete process.env.HOME;
      delete process.env.USERPROFILE;
      const result = getDefaultBasePath();
      expect(result).toBe('.invoicr');
    });
  });

  describe('ensureBaseDir', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'invoicr-paths-test-'));
    });

    afterEach(() => {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('should create directory if it does not exist', () => {
      const newDir = path.join(tempDir, 'new-invoicr-dir');
      expect(fs.existsSync(newDir)).toBe(false);

      ensureBaseDir(newDir);

      expect(fs.existsSync(newDir)).toBe(true);
    });

    it('should not throw if directory already exists', () => {
      const existingDir = path.join(tempDir, 'existing-dir');
      fs.mkdirSync(existingDir);

      expect(() => ensureBaseDir(existingDir)).not.toThrow();
      expect(fs.existsSync(existingDir)).toBe(true);
    });

    it('should create nested directories', () => {
      const nestedDir = path.join(tempDir, 'level1', 'level2', 'level3');
      expect(fs.existsSync(nestedDir)).toBe(false);

      ensureBaseDir(nestedDir);

      expect(fs.existsSync(nestedDir)).toBe(true);
    });
  });
});

describe('translations helper', () => {
  describe('loadTranslations', () => {
    it('should load English translations', () => {
      const translations = loadTranslations('en');
      expect(translations).toBeDefined();
      expect(translations.invoice).toBeDefined();
    });

    it('should load German translations', () => {
      const translations = loadTranslations('de');
      expect(translations).toBeDefined();
    });

    it('should load Romanian translations', () => {
      const translations = loadTranslations('ro');
      expect(translations).toBeDefined();
    });

    it('should throw for non-existent language', () => {
      expect(() => loadTranslations('xyz-invalid')).toThrow('Translations not found for language: xyz-invalid');
    });
  });

  describe('getTranslationPaths', () => {
    it('should return both backend and gui paths', () => {
      const paths = getTranslationPaths();
      expect(paths.backendDir).toBeDefined();
      expect(paths.guiDir).toBeDefined();
      expect(paths.backendDir).toContain('translations');
      expect(paths.guiDir).toContain('translations');
    });
  });
});
