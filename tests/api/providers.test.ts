/**
 * Provider endpoint tests
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { InvoicrApiServer } from '../../src/api/index.js';
import { httpRequest, validProvider, TEST_PORT_BASE, TEST_PERSONA } from './test-utils.js';

describe('API provider endpoints', { sequential: true }, () => {
  let tempDir: string;
  let server: InvoicrApiServer;
  const testPort = TEST_PORT_BASE + 20;

  beforeAll(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'invoicr-api-provider-'));
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

  it('should return null when provider does not exist', async () => {
    const response = await httpRequest({
      method: 'GET',
      path: `/api/personas/${TEST_PERSONA}/provider`,
      port: testPort
    });

    expect(response.status).toBe(200);
    expect(response.body).toBeNull();
  });

  it('should save and retrieve provider', async () => {
    // Save provider
    const saveResponse = await httpRequest({
      method: 'PUT',
      path: `/api/personas/${TEST_PERSONA}/provider`,
      port: testPort,
      body: validProvider
    });

    expect(saveResponse.status).toBe(200);
    expect(saveResponse.body.success).toBe(true);

    // Get provider
    const getResponse = await httpRequest({
      method: 'GET',
      path: `/api/personas/${TEST_PERSONA}/provider`,
      port: testPort
    });

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.name).toBe('Test Provider GmbH');
  });
});
