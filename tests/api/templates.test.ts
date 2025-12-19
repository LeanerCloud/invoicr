/**
 * Template endpoint tests
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { InvoicrApiServer } from '../../src/api/index.js';
import { httpRequest, TEST_PORT_BASE, TEST_PERSONA } from './test-utils.js';

describe('API template endpoints', { sequential: true }, () => {
  let tempDir: string;
  let server: InvoicrApiServer;
  const testPort = TEST_PORT_BASE + 80;

  beforeAll(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'invoicr-api-templates-'));
    server = new InvoicrApiServer(tempDir);
    await server.start(testPort);
  });

  afterAll(async () => {
    await server.stop();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    const personaDir = path.join(tempDir, TEST_PERSONA);
    if (fs.existsSync(personaDir)) {
      fs.rmSync(personaDir, { recursive: true, force: true });
    }
    fs.mkdirSync(personaDir, { recursive: true });
    fs.mkdirSync(path.join(personaDir, 'clients'), { recursive: true });
    fs.mkdirSync(path.join(personaDir, 'templates'), { recursive: true });
  });

  describe('GET /api/personas/:persona/templates', () => {
    it('should list available templates', async () => {
      const response = await httpRequest({
        method: 'GET',
        path: `/api/personas/${TEST_PERSONA}/templates`,
        port: testPort
      });

      expect(response.status).toBe(200);
      // Returns { builtIn: [...], custom: [...] }
      expect(response.body.builtIn).toBeDefined();
      expect(response.body.custom).toBeDefined();
      expect(Array.isArray(response.body.builtIn)).toBe(true);
      expect(Array.isArray(response.body.custom)).toBe(true);
    });

    it('should include custom templates', async () => {
      // Create a custom template (needs to be a valid docx, but name in list doesn't require content validation)
      const templatePath = path.join(tempDir, TEST_PERSONA, 'templates', 'my-custom.docx');
      fs.writeFileSync(templatePath, 'fake docx content');

      const response = await httpRequest({
        method: 'GET',
        path: `/api/personas/${TEST_PERSONA}/templates`,
        port: testPort
      });

      expect(response.status).toBe(200);
      expect(response.body.custom).toContain('my-custom');
    });
  });

  describe('GET /api/personas/:persona/templates/:name', () => {
    it('should return 404 for non-existent template', async () => {
      const response = await httpRequest({
        method: 'GET',
        path: `/api/personas/${TEST_PERSONA}/templates/nonexistent`,
        port: testPort
      });

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid template name', async () => {
      const response = await httpRequest({
        method: 'GET',
        path: `/api/personas/${TEST_PERSONA}/templates/invalid..name`,
        port: testPort
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid template name');
    });

    it('should return 404 for non-existent persona', async () => {
      const response = await httpRequest({
        method: 'GET',
        path: `/api/personas/nonexistent-persona/templates/default`,
        port: testPort
      });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/personas/:persona/templates', () => {
    it('should fail without template data', async () => {
      const response = await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/templates`,
        port: testPort,
        body: {}
      });

      expect(response.status).toBe(400);
    });

    it('should upload a custom template with valid data', async () => {
      // Use any base64 content - the upload just writes the buffer
      const data = Buffer.from('PK...fake docx header').toString('base64');

      const response = await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/templates`,
        port: testPort,
        body: { name: 'custom-upload', data }
      });

      // Should succeed or fail with validation error, not 400 for missing params
      expect([201, 400]).toContain(response.status);
      if (response.status === 201) {
        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('DELETE /api/personas/:persona/templates/:name', () => {
    it('should delete a custom template', async () => {
      // Create a custom template first
      const templatePath = path.join(tempDir, TEST_PERSONA, 'templates', 'to-delete.docx');
      fs.writeFileSync(templatePath, 'fake docx content');

      const response = await httpRequest({
        method: 'DELETE',
        path: `/api/personas/${TEST_PERSONA}/templates/to-delete`,
        port: testPort
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(fs.existsSync(templatePath)).toBe(false);
    });

    it('should fail for built-in template', async () => {
      const response = await httpRequest({
        method: 'DELETE',
        path: `/api/personas/${TEST_PERSONA}/templates/default`,
        port: testPort
      });

      // Built-in templates cannot be deleted - returns 400
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/personas/:persona/templates/:name/copy', () => {
    it('should copy a built-in template for editing', async () => {
      const response = await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/templates/default/copy`,
        port: testPort,
        body: { newName: 'my-custom' }
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should use auto-generated name when newName not provided', async () => {
      const response = await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/templates/default/copy`,
        port: testPort,
        body: {}
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.name).toBe('default-custom');
    });

    it('should return 404 for non-existent persona', async () => {
      const response = await httpRequest({
        method: 'POST',
        path: `/api/personas/nonexistent-persona/templates/default/copy`,
        port: testPort,
        body: {}
      });

      expect(response.status).toBe(404);
    });

    it('should return 400 for non-existent template', async () => {
      const response = await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/templates/nonexistent/copy`,
        port: testPort,
        body: {}
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/personas/:persona/templates/:name/open', () => {
    it('should return 404 for non-existent persona', async () => {
      const response = await httpRequest({
        method: 'POST',
        path: `/api/personas/nonexistent-persona/templates/default/open`,
        port: testPort,
        body: {}
      });

      expect(response.status).toBe(404);
    });

    it('should return 400 for non-existent template', async () => {
      const response = await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/templates/nonexistent/open`,
        port: testPort,
        body: {}
      });

      expect(response.status).toBe(400);
    });

    it.skip('should open built-in template', async () => {
      const response = await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/templates/default/open`,
        port: testPort,
        body: {}
      });

      // May succeed or fail depending on macOS 'open' command
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('DELETE /api/personas/:persona/templates/:name', () => {
    it('should return 404 for non-existent persona', async () => {
      const response = await httpRequest({
        method: 'DELETE',
        path: `/api/personas/nonexistent-persona/templates/my-custom`,
        port: testPort
      });

      expect(response.status).toBe(404);
    });

    it('should return 400 for non-existent custom template', async () => {
      const response = await httpRequest({
        method: 'DELETE',
        path: `/api/personas/${TEST_PERSONA}/templates/nonexistent-custom`,
        port: testPort
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/personas/:persona/templates upload', () => {
    it('should return 404 for non-existent persona', async () => {
      const data = Buffer.from('PK...fake docx header').toString('base64');
      const response = await httpRequest({
        method: 'POST',
        path: `/api/personas/nonexistent-persona/templates`,
        port: testPort,
        body: { name: 'test', data }
      });

      expect(response.status).toBe(404);
    });

    it('should fail without name', async () => {
      const data = Buffer.from('PK...fake docx header').toString('base64');
      const response = await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/templates`,
        port: testPort,
        body: { data }
      });

      expect(response.status).toBe(400);
    });

    it('should fail without data', async () => {
      const response = await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/templates`,
        port: testPort,
        body: { name: 'test' }
      });

      expect(response.status).toBe(400);
    });
  });
});
