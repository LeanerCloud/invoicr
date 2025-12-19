/**
 * Error handling and edge case tests
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as http from 'http';
import { InvoicrApiServer } from '../../src/api/index.js';
import { httpRequest, TEST_PORT_BASE, TEST_PERSONA } from './test-utils.js';

describe('API error handling', { sequential: true }, () => {
  let tempDir: string;
  let server: InvoicrApiServer;
  const testPort = TEST_PORT_BASE + 60;

  beforeAll(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'invoicr-api-errors-'));
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
  });

  it('should return 404 for unknown routes', async () => {
    const response = await httpRequest({
      method: 'GET',
      path: '/api/unknown',
      port: testPort
    });

    expect(response.status).toBe(404);
  });

  it('should handle CORS preflight', async () => {
    const response = await new Promise<{ status: number; headers: http.IncomingHttpHeaders }>((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: testPort,
        path: `/api/personas/${TEST_PERSONA}/provider`,
        method: 'OPTIONS'
      }, (res) => {
        resolve({
          status: res.statusCode || 500,
          headers: res.headers
        });
      });
      req.on('error', reject);
      req.end();
    });

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('*');
  });

  it('should handle invalid JSON body', async () => {
    const response = await new Promise<{ status: number; body: any }>((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: testPort,
        path: `/api/personas/${TEST_PERSONA}/provider`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          resolve({
            status: res.statusCode || 500,
            body: JSON.parse(data)
          });
        });
      });
      req.on('error', reject);
      req.write('invalid json{');
      req.end();
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Invalid JSON');
  });
});
