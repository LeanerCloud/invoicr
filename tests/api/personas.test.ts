/**
 * Persona endpoint tests
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { InvoicrApiServer } from '../../src/api/index.js';
import { httpRequest, validProvider, TEST_PORT_BASE } from './test-utils.js';

describe('API persona endpoints', { sequential: true }, () => {
  let tempDir: string;
  let server: InvoicrApiServer;
  const testPort = TEST_PORT_BASE + 70;

  beforeAll(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'invoicr-api-personas-'));
    server = new InvoicrApiServer(tempDir);
    await server.start(testPort);
  });

  afterAll(async () => {
    await server.stop();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    // Clean up any existing personas
    const entries = fs.readdirSync(tempDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        fs.rmSync(path.join(tempDir, entry.name), { recursive: true, force: true });
      }
    }
  });

  describe('GET /api/personas', () => {
    it('should return empty list when no personas exist', async () => {
      const response = await httpRequest({
        method: 'GET',
        path: '/api/personas',
        port: testPort
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should list all personas with details', async () => {
      // Create a persona manually
      const personaDir = path.join(tempDir, 'test-persona');
      fs.mkdirSync(personaDir, { recursive: true });
      fs.mkdirSync(path.join(personaDir, 'clients'), { recursive: true });
      fs.writeFileSync(path.join(personaDir, 'provider.json'), JSON.stringify(validProvider));

      const response = await httpRequest({
        method: 'GET',
        path: '/api/personas',
        port: testPort
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('test-persona');
      expect(response.body[0].hasProvider).toBe(true);
      expect(response.body[0].clientCount).toBe(0);
    });
  });

  describe('POST /api/personas', () => {
    it('should create a new persona', async () => {
      const response = await httpRequest({
        method: 'POST',
        path: '/api/personas',
        port: testPort,
        body: { name: 'new-persona' }
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.persona.name).toBe('new-persona');
      expect(fs.existsSync(path.join(tempDir, 'new-persona'))).toBe(true);
    });

    it('should fail without name', async () => {
      const response = await httpRequest({
        method: 'POST',
        path: '/api/personas',
        port: testPort,
        body: {}
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('name');
    });

    it('should fail if persona already exists', async () => {
      fs.mkdirSync(path.join(tempDir, 'existing-persona'), { recursive: true });

      const response = await httpRequest({
        method: 'POST',
        path: '/api/personas',
        port: testPort,
        body: { name: 'existing-persona' }
      });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('exists');
    });
  });

  describe('GET /api/personas/:persona', () => {
    it('should get persona details', async () => {
      const personaDir = path.join(tempDir, 'test-persona');
      fs.mkdirSync(personaDir, { recursive: true });
      fs.mkdirSync(path.join(personaDir, 'clients', 'test-client'), { recursive: true });
      fs.writeFileSync(path.join(personaDir, 'provider.json'), JSON.stringify(validProvider));

      const response = await httpRequest({
        method: 'GET',
        path: '/api/personas/test-persona',
        port: testPort
      });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('test-persona');
      expect(response.body.hasProvider).toBe(true);
      expect(response.body.clientCount).toBe(1);
    });

    it('should return 404 for non-existent persona', async () => {
      const response = await httpRequest({
        method: 'GET',
        path: '/api/personas/nonexistent',
        port: testPort
      });

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/personas/:persona', () => {
    it('should rename a persona', async () => {
      fs.mkdirSync(path.join(tempDir, 'old-name'), { recursive: true });

      const response = await httpRequest({
        method: 'PUT',
        path: '/api/personas/old-name',
        port: testPort,
        body: { name: 'new-name' }
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'new-name'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'old-name'))).toBe(false);
    });

    it('should fail to rename non-existent persona', async () => {
      const response = await httpRequest({
        method: 'PUT',
        path: '/api/personas/nonexistent',
        port: testPort,
        body: { name: 'new-name' }
      });

      expect(response.status).toBe(404);
    });

    it('should fail without name', async () => {
      fs.mkdirSync(path.join(tempDir, 'test-persona'), { recursive: true });

      const response = await httpRequest({
        method: 'PUT',
        path: '/api/personas/test-persona',
        port: testPort,
        body: {}
      });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/personas/:persona', () => {
    it('should delete a persona', async () => {
      fs.mkdirSync(path.join(tempDir, 'to-delete'), { recursive: true });

      const response = await httpRequest({
        method: 'DELETE',
        path: '/api/personas/to-delete',
        port: testPort
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'to-delete'))).toBe(false);
    });

    it('should return 404 for non-existent persona', async () => {
      const response = await httpRequest({
        method: 'DELETE',
        path: '/api/personas/nonexistent',
        port: testPort
      });

      expect(response.status).toBe(404);
    });
  });
});
