/**
 * Client endpoint tests
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { InvoicrApiServer } from '../../src/api/index.js';
import { httpRequest, validClient, TEST_PORT_BASE, TEST_PERSONA } from './test-utils.js';

describe('API client endpoints', { sequential: true }, () => {
  let tempDir: string;
  let server: InvoicrApiServer;
  const testPort = TEST_PORT_BASE + 30;

  beforeAll(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'invoicr-api-clients-'));
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

  it('should return empty list when no clients', async () => {
    const response = await httpRequest({
      method: 'GET',
      path: `/api/personas/${TEST_PERSONA}/clients`,
      port: testPort
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('should create and list clients', async () => {
    // Create client
    const createResponse = await httpRequest({
      method: 'POST',
      path: `/api/personas/${TEST_PERSONA}/clients`,
      port: testPort,
      body: { directoryName: 'test-client', ...validClient }
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);

    // List clients
    const listResponse = await httpRequest({
      method: 'GET',
      path: `/api/personas/${TEST_PERSONA}/clients`,
      port: testPort
    });

    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].name).toBe('test-client');
    expect(listResponse.body[0].displayName).toBe('Test Client GmbH');
  });

  it('should get client details', async () => {
    // Create client first
    await httpRequest({
      method: 'POST',
      path: `/api/personas/${TEST_PERSONA}/clients`,
      port: testPort,
      body: { directoryName: 'test-client', ...validClient }
    });

    // Get client
    const response = await httpRequest({
      method: 'GET',
      path: `/api/personas/${TEST_PERSONA}/clients/test-client`,
      port: testPort
    });

    expect(response.status).toBe(200);
    expect(response.body.client.name).toBe('Test Client GmbH');
    expect(response.body.directory).toBeDefined();
    expect(response.body.configPath).toBeDefined();
  });

  it('should return 404 for non-existent client', async () => {
    const response = await httpRequest({
      method: 'GET',
      path: `/api/personas/${TEST_PERSONA}/clients/nonexistent`,
      port: testPort
    });

    expect(response.status).toBe(404);
    expect(response.body.error).toContain('not found');
  });

  it('should update client', async () => {
    // Create client first
    await httpRequest({
      method: 'POST',
      path: `/api/personas/${TEST_PERSONA}/clients`,
      port: testPort,
      body: { directoryName: 'test-client', ...validClient }
    });

    // Update client
    const updatedClient = { ...validClient, name: 'Updated Client Name' };
    const response = await httpRequest({
      method: 'PUT',
      path: `/api/personas/${TEST_PERSONA}/clients/test-client`,
      port: testPort,
      body: updatedClient
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Verify update
    const getResponse = await httpRequest({
      method: 'GET',
      path: `/api/personas/${TEST_PERSONA}/clients/test-client`,
      port: testPort
    });

    expect(getResponse.body.client.name).toBe('Updated Client Name');
  });

  it('should delete client', async () => {
    // Create client first
    await httpRequest({
      method: 'POST',
      path: `/api/personas/${TEST_PERSONA}/clients`,
      port: testPort,
      body: { directoryName: 'test-client', ...validClient }
    });

    // Delete client
    const response = await httpRequest({
      method: 'DELETE',
      path: `/api/personas/${TEST_PERSONA}/clients/test-client`,
      port: testPort
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Verify deletion
    const listResponse = await httpRequest({
      method: 'GET',
      path: `/api/personas/${TEST_PERSONA}/clients`,
      port: testPort
    });

    expect(listResponse.body).toEqual([]);
  });

  it('should fail to create client without directoryName', async () => {
    const response = await httpRequest({
      method: 'POST',
      path: `/api/personas/${TEST_PERSONA}/clients`,
      port: testPort,
      body: { ...validClient }
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('directoryName');
  });

  it('should return empty history for new client', async () => {
    // Create a client
    await httpRequest({
      method: 'POST',
      path: `/api/personas/${TEST_PERSONA}/clients`,
      port: testPort,
      body: { directoryName: 'test-client', ...validClient }
    });

    const response = await httpRequest({
      method: 'GET',
      path: `/api/personas/${TEST_PERSONA}/clients/test-client/history`,
      port: testPort
    });

    expect(response.status).toBe(200);
    expect(response.body.invoices).toEqual([]);
  });

  it('should return 404 for non-existent client history', async () => {
    const response = await httpRequest({
      method: 'GET',
      path: `/api/personas/${TEST_PERSONA}/clients/nonexistent/history`,
      port: testPort
    });

    expect(response.status).toBe(404);
  });
});
