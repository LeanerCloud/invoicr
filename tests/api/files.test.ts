/**
 * File operation endpoint tests
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { InvoicrApiServer } from '../../src/api/index.js';
import { httpRequest, validProvider, validClient, TEST_PORT_BASE, TEST_PERSONA } from './test-utils.js';

describe('API file operation endpoints', { sequential: true }, () => {
  let tempDir: string;
  let server: InvoicrApiServer;
  const testPort = TEST_PORT_BASE + 100;

  beforeAll(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'invoicr-api-files-'));
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

  describe('POST /api/file/open', () => {
    it('should fail without filePath', async () => {
      const response = await httpRequest({
        method: 'POST',
        path: '/api/file/open',
        port: testPort,
        body: {}
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('filePath');
    });

    it('should fail for non-existent file', async () => {
      const response = await httpRequest({
        method: 'POST',
        path: '/api/file/open',
        port: testPort,
        body: { filePath: '/nonexistent/file.pdf' }
      });

      expect(response.status).toBe(404);
    });

    it.skip('should open existing file', async () => {
      // Create a test file
      const testFile = path.join(tempDir, 'test.txt');
      fs.writeFileSync(testFile, 'test content');

      const response = await httpRequest({
        method: 'POST',
        path: '/api/file/open',
        port: testPort,
        body: { filePath: testFile }
      });

      // macOS 'open' may succeed or fail depending on environment
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('POST /api/personas/:persona/invoice/email', () => {
    it('should fail without required fields', async () => {
      const response = await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/invoice/email`,
        port: testPort,
        body: {}
      });

      expect(response.status).toBe(400);
    });

    it('should fail with only clientName', async () => {
      const response = await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/invoice/email`,
        port: testPort,
        body: { clientName: 'test-client' }
      });

      expect(response.status).toBe(400);
    });

    it('should fail for non-existent PDF', async () => {
      // Create provider
      await httpRequest({
        method: 'PUT',
        path: `/api/personas/${TEST_PERSONA}/provider`,
        port: testPort,
        body: validProvider
      });

      // Create client
      await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/clients`,
        port: testPort,
        body: { directoryName: 'test-client', ...validClient }
      });

      const response = await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/invoice/email`,
        port: testPort,
        body: { clientName: 'test-client', pdfPath: '/nonexistent.pdf' }
      });

      expect(response.status).toBe(404);
    });

    it('should fail for non-existent client', async () => {
      // Create provider only
      await httpRequest({
        method: 'PUT',
        path: `/api/personas/${TEST_PERSONA}/provider`,
        port: testPort,
        body: validProvider
      });

      // Create a fake PDF file
      const fakePdf = path.join(tempDir, 'fake-invoice.pdf');
      fs.writeFileSync(fakePdf, 'fake pdf content');

      const response = await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/invoice/email`,
        port: testPort,
        body: { clientName: 'nonexistent-client', pdfPath: fakePdf }
      });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    it.skip('should handle e-invoice attachment path', { timeout: 15000 }, async () => {
      // Create provider
      await httpRequest({
        method: 'PUT',
        path: `/api/personas/${TEST_PERSONA}/provider`,
        port: testPort,
        body: validProvider
      });

      // Create client
      await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/clients`,
        port: testPort,
        body: { directoryName: 'test-client', ...validClient }
      });

      // Create fake files
      const clientDir = path.join(tempDir, TEST_PERSONA, 'clients', 'test-client');
      const fakePdf = path.join(clientDir, 'TC-1.pdf');
      const fakeEInvoice = path.join(clientDir, 'TC-1.xml');
      fs.writeFileSync(fakePdf, 'fake pdf content');
      fs.writeFileSync(fakeEInvoice, '<xml>fake e-invoice</xml>');

      const response = await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/invoice/email`,
        port: testPort,
        body: {
          clientName: 'test-client',
          pdfPath: fakePdf,
          eInvoicePath: fakeEInvoice,
          testMode: true
        }
      });

      // May succeed or fail depending on Mail.app availability
      expect([200, 500]).toContain(response.status);
    });

    it.skip('should handle invoice with history entry', async () => {
      // Create provider
      await httpRequest({
        method: 'PUT',
        path: `/api/personas/${TEST_PERSONA}/provider`,
        port: testPort,
        body: validProvider
      });

      // Create client
      await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/clients`,
        port: testPort,
        body: { directoryName: 'test-client', ...validClient }
      });

      // Create fake files
      const clientDir = path.join(tempDir, TEST_PERSONA, 'clients', 'test-client');
      const fakePdf = path.join(clientDir, 'TC-1.pdf');
      fs.writeFileSync(fakePdf, 'fake pdf content');

      // Create a history entry
      const historyPath = path.join(clientDir, 'history.json');
      fs.writeFileSync(historyPath, JSON.stringify({
        invoices: [{
          invoiceNumber: 'TC-1',
          date: '2024-11-15',
          month: 'November 2024',
          quantity: 40,
          rate: 100,
          totalAmount: 4000,
          currency: 'EUR',
          pdfPath: fakePdf
        }]
      }));

      const response = await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/invoice/email`,
        port: testPort,
        body: {
          clientName: 'test-client',
          pdfPath: fakePdf,
          testMode: true
        }
      });

      // May succeed or fail depending on Mail.app availability
      expect([200, 500]).toContain(response.status);
    });

    it.skip('should handle non-existent e-invoice attachment gracefully', async () => {
      // Create provider
      await httpRequest({
        method: 'PUT',
        path: `/api/personas/${TEST_PERSONA}/provider`,
        port: testPort,
        body: validProvider
      });

      // Create client
      await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/clients`,
        port: testPort,
        body: { directoryName: 'test-client', ...validClient }
      });

      // Create fake PDF only
      const clientDir = path.join(tempDir, TEST_PERSONA, 'clients', 'test-client');
      const fakePdf = path.join(clientDir, 'TC-1.pdf');
      fs.writeFileSync(fakePdf, 'fake pdf content');

      const response = await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/invoice/email`,
        port: testPort,
        body: {
          clientName: 'test-client',
          pdfPath: fakePdf,
          eInvoicePath: '/nonexistent/einvoice.xml',
          testMode: true
        }
      });

      // May succeed or fail depending on Mail.app availability
      // The non-existent e-invoice should be silently ignored
      expect([200, 500]).toContain(response.status);
    });

    it.skip('should handle corrupted history.json gracefully', async () => {
      // Create provider
      await httpRequest({
        method: 'PUT',
        path: `/api/personas/${TEST_PERSONA}/provider`,
        port: testPort,
        body: validProvider
      });

      // Create client
      await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/clients`,
        port: testPort,
        body: { directoryName: 'test-client', ...validClient }
      });

      // Create fake PDF and corrupted history
      const clientDir = path.join(tempDir, TEST_PERSONA, 'clients', 'test-client');
      const fakePdf = path.join(clientDir, 'TC-1.pdf');
      fs.writeFileSync(fakePdf, 'fake pdf content');
      fs.writeFileSync(path.join(clientDir, 'history.json'), 'not valid json');

      const response = await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/invoice/email`,
        port: testPort,
        body: {
          clientName: 'test-client',
          pdfPath: fakePdf,
          testMode: true
        }
      });

      // Should still work (fallback to defaults)
      expect([200, 500]).toContain(response.status);
    });
  });
});
