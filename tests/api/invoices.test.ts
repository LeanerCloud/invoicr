/**
 * Invoice endpoint tests
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { InvoicrApiServer } from '../../src/api/index.js';
import { httpRequest, validProvider, validClient, TEST_PORT_BASE, TEST_PERSONA } from './test-utils.js';

describe('API invoice endpoints', { sequential: true }, () => {
  let tempDir: string;
  let server: InvoicrApiServer;
  const testPort = TEST_PORT_BASE + 40;

  beforeAll(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'invoicr-api-invoices-'));
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

  it('should preview invoice', async () => {
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
      path: `/api/personas/${TEST_PERSONA}/invoice/preview`,
      port: testPort,
      body: { clientName: 'test-client', quantity: 40, month: '11-2024' }
    });

    expect(response.status).toBe(200);
    expect(response.body.context).toBeDefined();
    expect(response.body.context.invoiceNumber).toBe('TC-1');
    expect(response.body.context.quantity).toBe(40);
    expect(response.body.canGenerateEInvoice).toBe(true);
  });

  it('should fail preview without clientName', async () => {
    const response = await httpRequest({
      method: 'POST',
      path: `/api/personas/${TEST_PERSONA}/invoice/preview`,
      port: testPort,
      body: { quantity: 40 }
    });

    expect(response.status).toBe(400);
  });

  it('should fail generate without quantity', async () => {
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
      path: `/api/personas/${TEST_PERSONA}/invoice/generate`,
      port: testPort,
      body: { clientName: 'test-client' }
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('quantity');
  });

  it('should generate invoice', async () => {
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
      path: `/api/personas/${TEST_PERSONA}/invoice/generate`,
      port: testPort,
      body: {
        clientName: 'test-client',
        quantity: 40,
        month: '11-2024',
        generatePdf: false
      }
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.docxPath).toBeDefined();
    expect(response.body.invoiceNumber).toBe('TC-1');

    // Verify file was created
    expect(fs.existsSync(response.body.docxPath)).toBe(true);

    // Verify history was updated
    const historyResponse = await httpRequest({
      method: 'GET',
      path: `/api/personas/${TEST_PERSONA}/clients/test-client/history`,
      port: testPort
    });

    expect(historyResponse.body.invoices).toHaveLength(1);
    expect(historyResponse.body.invoices[0].invoiceNumber).toBe('TC-1');
  });

  it('should fail generate with zero quantity', async () => {
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
      path: `/api/personas/${TEST_PERSONA}/invoice/generate`,
      port: testPort,
      body: { clientName: 'test-client', quantity: 0 }
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('quantity');
  });

  it('should fail generate with negative quantity', async () => {
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
      path: `/api/personas/${TEST_PERSONA}/invoice/generate`,
      port: testPort,
      body: { clientName: 'test-client', quantity: -5 }
    });

    expect(response.status).toBe(400);
  });

  it('should fail generate for non-existent client', async () => {
    await httpRequest({
      method: 'PUT',
      path: `/api/personas/${TEST_PERSONA}/provider`,
      port: testPort,
      body: validProvider
    });

    const response = await httpRequest({
      method: 'POST',
      path: `/api/personas/${TEST_PERSONA}/invoice/generate`,
      port: testPort,
      body: { clientName: 'nonexistent', quantity: 40 }
    });

    expect(response.status).toBe(404);
  });

  it('should generate invoice without month (use default)', async () => {
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
      path: `/api/personas/${TEST_PERSONA}/invoice/generate`,
      port: testPort,
      body: {
        clientName: 'test-client',
        quantity: 40,
        generatePdf: false
      }
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should preview with e-invoice info when both have country codes', async () => {
    // Create provider with country code
    await httpRequest({
      method: 'PUT',
      path: `/api/personas/${TEST_PERSONA}/provider`,
      port: testPort,
      body: validProvider
    });

    // Create client with country code
    await httpRequest({
      method: 'POST',
      path: `/api/personas/${TEST_PERSONA}/clients`,
      port: testPort,
      body: { directoryName: 'test-client', ...validClient }
    });

    const response = await httpRequest({
      method: 'POST',
      path: `/api/personas/${TEST_PERSONA}/invoice/preview`,
      port: testPort,
      body: { clientName: 'test-client', quantity: 40 }
    });

    expect(response.status).toBe(200);
    expect(response.body.canGenerateEInvoice).toBe(true);
    expect(Array.isArray(response.body.availableEInvoiceFormats)).toBe(true);
  });

  it('should preview without e-invoice when provider has no country code', async () => {
    // Create provider without country code
    const providerWithoutCountry = { ...validProvider };
    delete (providerWithoutCountry as any).countryCode;

    await httpRequest({
      method: 'PUT',
      path: `/api/personas/${TEST_PERSONA}/provider`,
      port: testPort,
      body: providerWithoutCountry
    });

    await httpRequest({
      method: 'POST',
      path: `/api/personas/${TEST_PERSONA}/clients`,
      port: testPort,
      body: { directoryName: 'test-client', ...validClient }
    });

    const response = await httpRequest({
      method: 'POST',
      path: `/api/personas/${TEST_PERSONA}/invoice/preview`,
      port: testPort,
      body: { clientName: 'test-client' }
    });

    expect(response.status).toBe(200);
    expect(response.body.availableEInvoiceFormats).toEqual([]);
  });

  it('should generate invoice with e-invoice', { timeout: 30000 }, async () => {
    // Create provider with country code
    await httpRequest({
      method: 'PUT',
      path: `/api/personas/${TEST_PERSONA}/provider`,
      port: testPort,
      body: validProvider
    });

    // Create client with country code
    await httpRequest({
      method: 'POST',
      path: `/api/personas/${TEST_PERSONA}/clients`,
      port: testPort,
      body: { directoryName: 'test-client', ...validClient }
    });

    const response = await httpRequest({
      method: 'POST',
      path: `/api/personas/${TEST_PERSONA}/invoice/generate`,
      port: testPort,
      body: {
        clientName: 'test-client',
        quantity: 40,
        month: '11-2024',
        generatePdf: false,
        generateEInvoice: true,
        eInvoiceFormat: 'xrechnung'
      }
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.docxPath).toBeDefined();
    // E-invoice generation may succeed or fail depending on validation
  });

  it('should fail preview for non-existent client', async () => {
    await httpRequest({
      method: 'PUT',
      path: `/api/personas/${TEST_PERSONA}/provider`,
      port: testPort,
      body: validProvider
    });

    const response = await httpRequest({
      method: 'POST',
      path: `/api/personas/${TEST_PERSONA}/invoice/preview`,
      port: testPort,
      body: { clientName: 'nonexistent' }
    });

    expect(response.status).toBe(404);
  });

  it('should not return e-invoice formats when provider and client countries differ', async () => {
    // Create provider with DE country code
    await httpRequest({
      method: 'PUT',
      path: `/api/personas/${TEST_PERSONA}/provider`,
      port: testPort,
      body: validProvider // DE country
    });

    // Create client with US country code (different from provider)
    const usClient = {
      ...validClient,
      countryCode: 'US'
    };

    await httpRequest({
      method: 'POST',
      path: `/api/personas/${TEST_PERSONA}/clients`,
      port: testPort,
      body: { directoryName: 'us-client', ...usClient }
    });

    const response = await httpRequest({
      method: 'POST',
      path: `/api/personas/${TEST_PERSONA}/invoice/preview`,
      port: testPort,
      body: { clientName: 'us-client', quantity: 40 }
    });

    expect(response.status).toBe(200);
    // E-invoice should NOT be available when countries differ
    expect(response.body.canGenerateEInvoice).toBe(false);
    expect(response.body.availableEInvoiceFormats).toEqual([]);
  });

  it('should return e-invoice formats when provider and client countries match', async () => {
    // Create provider with DE country code
    await httpRequest({
      method: 'PUT',
      path: `/api/personas/${TEST_PERSONA}/provider`,
      port: testPort,
      body: validProvider // DE country
    });

    // Create client with DE country code (same as provider)
    await httpRequest({
      method: 'POST',
      path: `/api/personas/${TEST_PERSONA}/clients`,
      port: testPort,
      body: { directoryName: 'de-client', ...validClient } // DE country
    });

    const response = await httpRequest({
      method: 'POST',
      path: `/api/personas/${TEST_PERSONA}/invoice/preview`,
      port: testPort,
      body: { clientName: 'de-client', quantity: 40 }
    });

    expect(response.status).toBe(200);
    // E-invoice should be available when countries match
    expect(response.body.canGenerateEInvoice).toBe(true);
    expect(Array.isArray(response.body.availableEInvoiceFormats)).toBe(true);
    expect(response.body.availableEInvoiceFormats.length).toBeGreaterThan(0);
    // DE should have XRechnung and ZUGFeRD formats
    const formatIds = response.body.availableEInvoiceFormats.map((f: { format: string }) => f.format);
    expect(formatIds).toContain('xrechnung');
    expect(formatIds).toContain('zugferd');
  });
});
