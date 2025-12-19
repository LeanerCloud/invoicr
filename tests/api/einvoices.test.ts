/**
 * E-invoice endpoint tests
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { InvoicrApiServer } from '../../src/api/index.js';
import { httpRequest, validProvider, validClient, TEST_PORT_BASE, TEST_PERSONA } from './test-utils.js';

describe('API e-invoice endpoints', { sequential: true }, () => {
  let tempDir: string;
  let server: InvoicrApiServer;
  const testPort = TEST_PORT_BASE + 50;

  beforeAll(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'invoicr-api-einvoices-'));
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

  it('should list all e-invoice formats', async () => {
    const response = await httpRequest({
      method: 'GET',
      path: '/api/einvoice/formats',
      port: testPort
    });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].country).toBeDefined();
    expect(response.body[0].formats).toBeDefined();
  });

  it('should list formats for specific country', async () => {
    const response = await httpRequest({
      method: 'GET',
      path: '/api/einvoice/formats?country=DE',
      port: testPort
    });

    expect(response.status).toBe(200);
    expect(response.body.country).toBe('DE');
    expect(response.body.countryName).toBe('Germany');
    expect(Array.isArray(response.body.formats)).toBe(true);
  });

  it('should list supported countries', async () => {
    const response = await httpRequest({
      method: 'GET',
      path: '/api/einvoice/countries',
      port: testPort
    });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.some((c: { code: string }) => c.code === 'DE')).toBe(true);
  });

  it('should validate e-invoice configuration', async () => {
    // Create provider and client first
    await httpRequest({
      method: 'PUT',
      path: `/api/personas/${TEST_PERSONA}/provider`,
      port: testPort,
      body: validProvider
    });

    await httpRequest({
      method: 'POST',
      path: `/api/personas/${TEST_PERSONA}/clients`,
      port: testPort,
      body: { directoryName: 'test-client', ...validClient }
    });

    const response = await httpRequest({
      method: 'POST',
      path: `/api/personas/${TEST_PERSONA}/einvoice/validate`,
      port: testPort,
      body: { clientName: 'test-client' }
    });

    expect(response.status).toBe(200);
    expect(response.body.canGenerate).toBe(true);
  });

  it('should allow cross-border e-invoicing when both countries have formats', async () => {
    // Provider in DE
    await httpRequest({
      method: 'PUT',
      path: `/api/personas/${TEST_PERSONA}/provider`,
      port: testPort,
      body: validProvider
    });

    // Client in US - cross-border PEPPOL e-invoicing is supported
    await httpRequest({
      method: 'POST',
      path: `/api/personas/${TEST_PERSONA}/clients`,
      port: testPort,
      body: { directoryName: 'test-client', ...validClient, countryCode: 'US' }
    });

    const response = await httpRequest({
      method: 'POST',
      path: `/api/personas/${TEST_PERSONA}/einvoice/validate`,
      port: testPort,
      body: { clientName: 'test-client' }
    });

    expect(response.status).toBe(200);
    expect(response.body.canGenerate).toBe(true);
  });

  describe('POST /api/personas/:persona/einvoice/generate', () => {
    it('should fail without clientName and invoiceNumber', async () => {
      const response = await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/einvoice/generate`,
        port: testPort,
        body: {}
      });

      expect(response.status).toBe(400);
    });

    it('should fail for non-existent client', async () => {
      // Need provider first
      await httpRequest({
        method: 'PUT',
        path: `/api/personas/${TEST_PERSONA}/provider`,
        port: testPort,
        body: validProvider
      });

      const response = await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/einvoice/generate`,
        port: testPort,
        body: { clientName: 'nonexistent', invoiceNumber: 'TC-1' }
      });

      expect(response.status).toBe(404);
    });

    it('should fail for non-existent invoice', async () => {
      // Create provider and client
      await httpRequest({
        method: 'PUT',
        path: `/api/personas/${TEST_PERSONA}/provider`,
        port: testPort,
        body: validProvider
      });

      await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/clients`,
        port: testPort,
        body: { directoryName: 'test-client', ...validClient }
      });

      const response = await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/einvoice/generate`,
        port: testPort,
        body: { clientName: 'test-client', invoiceNumber: 'NONEXISTENT-1' }
      });

      expect(response.status).toBe(404);
    });

    it('should generate e-invoice from history', { timeout: 30000 }, async () => {
      // Create provider and client
      await httpRequest({
        method: 'PUT',
        path: `/api/personas/${TEST_PERSONA}/provider`,
        port: testPort,
        body: validProvider
      });

      await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/clients`,
        port: testPort,
        body: { directoryName: 'test-client', ...validClient }
      });

      // Generate an invoice first
      const generateResponse = await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/invoice/generate`,
        port: testPort,
        body: {
          clientName: 'test-client',
          quantity: 40,
          month: '11-2024',
          generatePdf: false
        }
      });

      expect(generateResponse.status).toBe(200);
      const invoiceNumber = generateResponse.body.invoiceNumber;

      // Now generate e-invoice
      const eInvoiceResponse = await httpRequest({
        method: 'POST',
        path: `/api/personas/${TEST_PERSONA}/einvoice/generate`,
        port: testPort,
        body: {
          clientName: 'test-client',
          invoiceNumber,
          format: 'xrechnung'
        }
      });

      expect(eInvoiceResponse.status).toBe(200);
      expect(eInvoiceResponse.body.success).toBe(true);
      expect(eInvoiceResponse.body.format).toBeDefined();
    });
  });
});
