import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  getDefaultPaths,
  loadProvider,
  saveProvider,
  loadClient,
  saveClient,
  getClientPath,
  listClients,
  getClientInfo,
  getAllClients,
  clientExists,
  createClient
} from '../src/lib/config-manager.js';

describe('config-manager', () => {
  let tempDir: string;

  const validProvider = {
    name: 'Test Provider',
    address: { street: '123 Main St', city: 'Berlin 10115' },
    phone: '+49 123 456789',
    email: 'test@example.com',
    bank: { name: 'Test Bank', iban: 'DE12345678901234567890', bic: 'TESTBIC' },
    taxNumber: '123/456/789'
  };

  const validClient = {
    name: 'Acme Corp',
    address: { street: '456 Business Ave', city: 'New York, NY 10001' },
    language: 'en' as const,
    invoicePrefix: 'AC',
    nextInvoiceNumber: 1,
    service: {
      description: 'Consulting Services',
      billingType: 'hourly' as const,
      rate: 150,
      currency: 'USD' as const
    }
  };

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'invoicr-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('getDefaultPaths', () => {
    it('should return paths relative to provided base directory', () => {
      const paths = getDefaultPaths('/custom/path');
      expect(paths.provider).toBe('/custom/path/provider.json');
      expect(paths.clients).toBe('/custom/path/clients');
    });

    it('should default to current working directory', () => {
      const paths = getDefaultPaths();
      expect(paths.provider).toContain('provider.json');
      expect(paths.clients).toContain('clients');
    });
  });

  describe('loadProvider', () => {
    it('should load and validate provider config', () => {
      const providerPath = path.join(tempDir, 'provider.json');
      fs.writeFileSync(providerPath, JSON.stringify(validProvider));

      const result = loadProvider(providerPath);
      expect(result.name).toBe('Test Provider');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw error for missing file', () => {
      expect(() => loadProvider('/nonexistent/provider.json'))
        .toThrow('Provider config not found');
    });

    it('should throw error for invalid config', () => {
      const providerPath = path.join(tempDir, 'provider.json');
      fs.writeFileSync(providerPath, JSON.stringify({ name: '' }));

      expect(() => loadProvider(providerPath)).toThrow();
    });
  });

  describe('saveProvider', () => {
    it('should save provider config', () => {
      const providerPath = path.join(tempDir, 'provider.json');

      saveProvider(validProvider, providerPath);

      expect(fs.existsSync(providerPath)).toBe(true);
      const saved = JSON.parse(fs.readFileSync(providerPath, 'utf8'));
      expect(saved.name).toBe('Test Provider');
    });

    it('should validate before saving', () => {
      const providerPath = path.join(tempDir, 'provider.json');
      const invalidProvider = { name: '' };

      expect(() => saveProvider(invalidProvider as any, providerPath)).toThrow();
    });
  });

  describe('loadClient', () => {
    it('should load and validate client config', () => {
      const clientPath = path.join(tempDir, 'client.json');
      fs.writeFileSync(clientPath, JSON.stringify(validClient));

      const result = loadClient(clientPath);
      expect(result.name).toBe('Acme Corp');
      expect(result.invoicePrefix).toBe('AC');
    });

    it('should throw error for missing file', () => {
      expect(() => loadClient('/nonexistent/client.json'))
        .toThrow('Client config not found');
    });
  });

  describe('saveClient', () => {
    it('should save client config', () => {
      const clientPath = path.join(tempDir, 'client.json');

      saveClient(validClient, clientPath);

      expect(fs.existsSync(clientPath)).toBe(true);
      const saved = JSON.parse(fs.readFileSync(clientPath, 'utf8'));
      expect(saved.name).toBe('Acme Corp');
    });
  });

  describe('listClients', () => {
    it('should list all clients in directory', () => {
      const clientsDir = path.join(tempDir, 'clients');
      fs.mkdirSync(path.join(clientsDir, 'acme'), { recursive: true });
      fs.mkdirSync(path.join(clientsDir, 'beta'), { recursive: true });
      fs.writeFileSync(
        path.join(clientsDir, 'acme', 'acme.json'),
        JSON.stringify(validClient)
      );
      fs.writeFileSync(
        path.join(clientsDir, 'beta', 'beta.json'),
        JSON.stringify({ ...validClient, name: 'Beta Corp' })
      );

      const clients = listClients(clientsDir);
      expect(clients).toEqual(['acme', 'beta']);
    });

    it('should return empty array for nonexistent directory', () => {
      const clients = listClients('/nonexistent/clients');
      expect(clients).toEqual([]);
    });

    it('should ignore directories without config files', () => {
      const clientsDir = path.join(tempDir, 'clients');
      fs.mkdirSync(path.join(clientsDir, 'acme'), { recursive: true });
      fs.mkdirSync(path.join(clientsDir, 'empty'), { recursive: true });
      fs.writeFileSync(
        path.join(clientsDir, 'acme', 'acme.json'),
        JSON.stringify(validClient)
      );

      const clients = listClients(clientsDir);
      expect(clients).toEqual(['acme']);
    });
  });

  describe('getClientPath', () => {
    it('should return new-style path when it exists', () => {
      const clientsDir = path.join(tempDir, 'clients');
      const clientDir = path.join(clientsDir, 'acme');
      fs.mkdirSync(clientDir, { recursive: true });
      fs.writeFileSync(
        path.join(clientDir, 'acme.json'),
        JSON.stringify(validClient)
      );

      const result = getClientPath(clientsDir, 'acme');
      expect(result).toBe(path.join(clientsDir, 'acme', 'acme.json'));
    });

    it('should return new-style path as default for new clients', () => {
      const clientsDir = path.join(tempDir, 'clients');
      const result = getClientPath(clientsDir, 'newclient');
      expect(result).toBe(path.join(clientsDir, 'newclient', 'customer_data.json'));
    });
  });

  describe('clientExists', () => {
    it('should return true for existing client', () => {
      const clientsDir = path.join(tempDir, 'clients');
      fs.mkdirSync(path.join(clientsDir, 'acme'), { recursive: true });
      fs.writeFileSync(
        path.join(clientsDir, 'acme', 'acme.json'),
        JSON.stringify(validClient)
      );

      expect(clientExists(clientsDir, 'acme')).toBe(true);
    });

    it('should return false for non-existing client', () => {
      const clientsDir = path.join(tempDir, 'clients');
      expect(clientExists(clientsDir, 'nonexistent')).toBe(false);
    });
  });

  describe('getClientInfo', () => {
    it('should return client info for existing client', () => {
      const clientsDir = path.join(tempDir, 'clients');
      fs.mkdirSync(path.join(clientsDir, 'acme'), { recursive: true });
      fs.writeFileSync(
        path.join(clientsDir, 'acme', 'acme.json'),
        JSON.stringify(validClient)
      );

      const info = getClientInfo(clientsDir, 'acme');
      expect(info).not.toBeNull();
      expect(info?.name).toBe('acme');
      expect(info?.client.name).toBe('Acme Corp');
    });

    it('should return null for non-existing client', () => {
      const clientsDir = path.join(tempDir, 'clients');
      const info = getClientInfo(clientsDir, 'nonexistent');
      expect(info).toBeNull();
    });
  });

  describe('getAllClients', () => {
    it('should return all clients with their info', () => {
      const clientsDir = path.join(tempDir, 'clients');
      fs.mkdirSync(path.join(clientsDir, 'acme'), { recursive: true });
      fs.mkdirSync(path.join(clientsDir, 'beta'), { recursive: true });
      fs.writeFileSync(
        path.join(clientsDir, 'acme', 'acme.json'),
        JSON.stringify(validClient)
      );
      fs.writeFileSync(
        path.join(clientsDir, 'beta', 'beta.json'),
        JSON.stringify({ ...validClient, name: 'Beta Corp', invoicePrefix: 'BC' })
      );

      const clients = getAllClients(clientsDir);
      expect(clients).toHaveLength(2);
      expect(clients.map(c => c.name)).toEqual(['acme', 'beta']);
    });
  });

  describe('createClient', () => {
    it('should create client directory and config file', () => {
      const clientsDir = path.join(tempDir, 'clients');

      const clientPath = createClient(clientsDir, 'newclient', validClient);

      expect(fs.existsSync(clientPath)).toBe(true);
      const saved = JSON.parse(fs.readFileSync(clientPath, 'utf8'));
      expect(saved.name).toBe('Acme Corp');
    });

    it('should create parent directories if needed', () => {
      const clientsDir = path.join(tempDir, 'nested', 'clients');

      const clientPath = createClient(clientsDir, 'newclient', validClient);

      expect(fs.existsSync(clientPath)).toBe(true);
    });
  });
});
