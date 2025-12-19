/**
 * Translation endpoint tests
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { InvoicrApiServer } from '../../src/api/index.js';
import { httpRequest, TEST_PORT_BASE } from './test-utils.js';

describe('API translation endpoints', { sequential: true }, () => {
  let tempDir: string;
  let server: InvoicrApiServer;
  const testPort = TEST_PORT_BASE + 90;

  beforeAll(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'invoicr-api-translations-'));
    server = new InvoicrApiServer(tempDir);
    await server.start(testPort);
  });

  afterAll(async () => {
    await server.stop();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('GET /api/translations', () => {
    it('should return object with languages array', async () => {
      const response = await httpRequest({
        method: 'GET',
        path: '/api/translations',
        port: testPort
      });

      expect(response.status).toBe(200);
      expect(response.body.languages).toBeDefined();
      expect(Array.isArray(response.body.languages)).toBe(true);
    });

    it('should include common languages', async () => {
      const response = await httpRequest({
        method: 'GET',
        path: '/api/translations',
        port: testPort
      });

      expect(response.status).toBe(200);
      expect(response.body.languages).toContain('en');
      expect(response.body.languages).toContain('de');
    });

    it('should return sorted languages', async () => {
      const response = await httpRequest({
        method: 'GET',
        path: '/api/translations',
        port: testPort
      });

      expect(response.status).toBe(200);
      const languages = response.body.languages;
      const sorted = [...languages].sort();
      expect(languages).toEqual(sorted);
    });
  });

  describe('GET /api/translations/:lang', () => {
    it('should return English translations', async () => {
      const response = await httpRequest({
        method: 'GET',
        path: '/api/translations/en',
        port: testPort
      });

      expect(response.status).toBe(200);
      expect(response.body.language).toBe('en');
      expect(response.body.translation).toBeDefined();
    });

    it('should return German translations', async () => {
      const response = await httpRequest({
        method: 'GET',
        path: '/api/translations/de',
        port: testPort
      });

      expect(response.status).toBe(200);
      expect(response.body.language).toBe('de');
      expect(response.body.translation).toBeDefined();
    });

    it('should return fallback for unsupported language', async () => {
      const response = await httpRequest({
        method: 'GET',
        path: '/api/translations/xyz',
        port: testPort
      });

      // Returns 200 with fallback to English and exists: false
      expect(response.status).toBe(200);
      expect(response.body.exists).toBe(false);
    });

    it('should return exists: true for valid language', async () => {
      const response = await httpRequest({
        method: 'GET',
        path: '/api/translations/en',
        port: testPort
      });

      expect(response.status).toBe(200);
      expect(response.body.exists).toBe(true);
    });

    it('should return Romanian translations', async () => {
      const response = await httpRequest({
        method: 'GET',
        path: '/api/translations/ro',
        port: testPort
      });

      expect(response.status).toBe(200);
      expect(response.body.language).toBe('ro');
      expect(response.body.exists).toBe(true);
    });

    it('should return French translations', async () => {
      const response = await httpRequest({
        method: 'GET',
        path: '/api/translations/fr',
        port: testPort
      });

      expect(response.status).toBe(200);
      expect(response.body.language).toBe('fr');
      expect(response.body.exists).toBe(true);
    });
  });
});
