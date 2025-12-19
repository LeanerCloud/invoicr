/**
 * Demo endpoint tests
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { InvoicrApiServer } from '../../src/api/index.js';
import { httpRequest, TEST_PORT_BASE } from './test-utils.js';

describe('API demo endpoints', { sequential: true }, () => {
  let tempDir: string;
  let server: InvoicrApiServer;
  const testPort = TEST_PORT_BASE + 110;

  beforeAll(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'invoicr-api-demo-'));
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

  describe('POST /api/init-demo', () => {
    it('should initialize demo data', async () => {
      const response = await httpRequest({
        method: 'POST',
        path: '/api/init-demo',
        port: testPort,
        body: {}
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.created).toBe(true);
    });

    it('should create demo persona with provider and clients', async () => {
      await httpRequest({
        method: 'POST',
        path: '/api/init-demo',
        port: testPort,
        body: {}
      });

      // Check personas were created
      const personasResponse = await httpRequest({
        method: 'GET',
        path: '/api/personas',
        port: testPort
      });

      expect(personasResponse.status).toBe(200);
      expect(personasResponse.body.length).toBeGreaterThan(0);

      // ACME should have a provider and clients
      const acme = personasResponse.body.find((p: any) => p.name === 'ACME');
      expect(acme).toBeDefined();
      expect(acme.hasProvider).toBe(true);
      expect(acme.clientCount).toBeGreaterThan(0);
    });

    it('should not recreate if demo already exists', async () => {
      // Create first
      await httpRequest({
        method: 'POST',
        path: '/api/init-demo',
        port: testPort,
        body: {}
      });

      // Try to create again
      const response = await httpRequest({
        method: 'POST',
        path: '/api/init-demo',
        port: testPort,
        body: {}
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.created).toBe(false);
    });
  });
});
