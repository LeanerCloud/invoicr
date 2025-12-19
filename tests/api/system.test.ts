/**
 * System endpoint tests (health, libreoffice)
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { InvoicrApiServer } from '../../src/api/index.js';
import { httpRequest, TEST_PORT_BASE } from './test-utils.js';

describe('API system endpoints', { sequential: true }, () => {
  let tempDir: string;
  let server: InvoicrApiServer;
  const testPort = TEST_PORT_BASE + 10;

  beforeAll(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'invoicr-api-system-'));
    server = new InvoicrApiServer(tempDir);
    await server.start(testPort);
  });

  afterAll(async () => {
    await server.stop();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should return health status', async () => {
    const response = await httpRequest({
      method: 'GET',
      path: '/api/health',
      port: testPort
    });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.version).toBeDefined();
    expect(response.body.basePath).toBe(tempDir);
  });

  it('should return LibreOffice status', async () => {
    const response = await httpRequest({
      method: 'GET',
      path: '/api/libreoffice',
      port: testPort
    });

    expect(response.status).toBe(200);
    expect(typeof response.body.available).toBe('boolean');
  });

  it('should return all countries', async () => {
    const response = await httpRequest({
      method: 'GET',
      path: '/api/countries',
      port: testPort
    });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(100);

    // Check structure of country objects
    expect(response.body[0]).toHaveProperty('code');
    expect(response.body[0]).toHaveProperty('name');

    // Check that common countries are present
    const codes = response.body.map((c: { code: string }) => c.code);
    expect(codes).toContain('DE');
    expect(codes).toContain('US');
    expect(codes).toContain('RO');
    expect(codes).toContain('FR');
    expect(codes).toContain('GB');
  });

  it('should return countries sorted by name', async () => {
    const response = await httpRequest({
      method: 'GET',
      path: '/api/countries',
      port: testPort
    });

    expect(response.status).toBe(200);

    const names = response.body.map((c: { name: string }) => c.name);
    const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sortedNames);
  });
});
