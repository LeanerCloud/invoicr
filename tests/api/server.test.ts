/**
 * Server lifecycle tests
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { InvoicrApiServer } from '../../src/api/index.js';
import { httpRequest, TEST_PORT_BASE } from './test-utils.js';

describe('InvoicrApiServer - lifecycle', { sequential: true }, () => {
  it('should start and stop server', async () => {
    const localTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'invoicr-api-test-'));
    const localServer = new InvoicrApiServer(localTempDir);
    const port = TEST_PORT_BASE + 1;

    try {
      await localServer.start(port);

      const response = await httpRequest({
        method: 'GET',
        path: '/api/health',
        port
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    } finally {
      await localServer.stop();
      fs.rmSync(localTempDir, { recursive: true, force: true });
    }
  });

  it('should fail when port is already in use', async () => {
    const localTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'invoicr-api-test-'));
    const localServer = new InvoicrApiServer(localTempDir);
    const port = TEST_PORT_BASE + 2;

    try {
      await localServer.start(port);

      const server2 = new InvoicrApiServer(localTempDir);
      await expect(server2.start(port)).rejects.toThrow('already in use');
    } finally {
      await localServer.stop();
      fs.rmSync(localTempDir, { recursive: true, force: true });
    }
  });
});
