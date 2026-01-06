/**
 * Configuration Manager
 * Handles loading and saving provider and client configurations
 */
import * as fs from 'fs';
import * as path from 'path';
import { Provider, Client } from '../types.js';
import { validateProvider, validateClient } from '../schemas/index.js';

export interface ConfigPaths {
  provider: string;
  clients: string;
}

/**
 * Get default configuration paths based on working directory
 */
export function getDefaultPaths(baseDir: string = process.cwd()): ConfigPaths {
  return {
    provider: path.join(baseDir, 'provider.json'),
    clients: path.join(baseDir, 'clients')
  };
}

/**
 * Load and validate provider configuration
 */
export function loadProvider(providerPath: string): Provider {
  if (!fs.existsSync(providerPath)) {
    throw new Error(`Provider config not found: ${providerPath}`);
  }

  const data = JSON.parse(fs.readFileSync(providerPath, 'utf8'));
  return validateProvider(data);
}

/**
 * Save provider configuration
 */
export function saveProvider(provider: Provider, providerPath: string): void {
  const data = validateProvider(provider);
  fs.writeFileSync(providerPath, JSON.stringify(data, null, 2));
}

/**
 * Load and validate client configuration
 */
export function loadClient(clientPath: string): Client {
  if (!fs.existsSync(clientPath)) {
    throw new Error(`Client config not found: ${clientPath}`);
  }

  const data = JSON.parse(fs.readFileSync(clientPath, 'utf8'));
  return validateClient(data);
}

/**
 * Save client configuration
 */
export function saveClient(client: Client, clientPath: string): void {
  const data = validateClient(client);
  fs.writeFileSync(clientPath, JSON.stringify(data, null, 2));
}

/**
 * Get the path to a client configuration file
 */
export function getClientPath(clientsDir: string, clientName: string): string {
  // Check new structure first: clients/<name>/customer_data.json
  const newPath = path.join(clientsDir, clientName, 'customer_data.json');
  if (fs.existsSync(newPath)) {
    return newPath;
  }

  // Check legacy structure: <name>/<name>.json
  const legacyPath = path.join(clientsDir, clientName, `${clientName}.json`);
  if (fs.existsSync(legacyPath)) {
    return legacyPath;
  }

  // Return new path as default (for creation)
  return newPath;
}

/**
 * List all available clients
 */
export function listClients(clientsDir: string): string[] {
  if (!fs.existsSync(clientsDir)) {
    return [];
  }

  const entries = fs.readdirSync(clientsDir, { withFileTypes: true });
  const clients: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      // Check for customer_data.json (new) or <name>.json (legacy)
      const newConfigPath = path.join(clientsDir, entry.name, 'customer_data.json');
      const legacyConfigPath = path.join(clientsDir, entry.name, `${entry.name}.json`);
      if (fs.existsSync(newConfigPath) || fs.existsSync(legacyConfigPath)) {
        clients.push(entry.name);
      }
    }
  }

  return clients.sort();
}

/**
 * Get detailed client information
 */
export interface ClientInfo {
  name: string;
  directory: string;
  configPath: string;
  client: Client;
}

export function getClientInfo(clientsDir: string, clientName: string): ClientInfo | null {
  const clientPath = getClientPath(clientsDir, clientName);

  try {
    const client = loadClient(clientPath);
    return {
      name: clientName,
      directory: path.dirname(clientPath),
      configPath: clientPath,
      client
    };
  } catch {
    return null;
  }
}

/**
 * Get all clients with their information
 */
export function getAllClients(clientsDir: string): ClientInfo[] {
  const clientNames = listClients(clientsDir);
  const clients: ClientInfo[] = [];

  for (const name of clientNames) {
    const info = getClientInfo(clientsDir, name);
    if (info) {
      clients.push(info);
    }
  }

  return clients;
}

/**
 * Check if a client exists
 */
export function clientExists(clientsDir: string, clientName: string): boolean {
  const clientPath = getClientPath(clientsDir, clientName);
  return fs.existsSync(clientPath);
}

/**
 * Create a new client directory and config file
 */
export function createClient(
  clientsDir: string,
  clientName: string,
  config: Client
): string {
  const clientDir = path.join(clientsDir, clientName);
  const clientPath = path.join(clientDir, 'customer_data.json');

  // Create directory if it doesn't exist
  if (!fs.existsSync(clientDir)) {
    fs.mkdirSync(clientDir, { recursive: true });
  }

  // Validate and save
  saveClient(config, clientPath);

  return clientPath;
}

/**
 * Clone an existing client to a new directory
 */
export interface CloneClientOptions {
  resetCounter?: boolean;
  newDisplayName?: string;
  newInvoicePrefix?: string;
}

export function cloneClient(
  clientsDir: string,
  sourceName: string,
  newDirectoryName: string,
  options: CloneClientOptions = {}
): string {
  const { resetCounter = true, newDisplayName, newInvoicePrefix } = options;

  // Load source client
  const sourceInfo = getClientInfo(clientsDir, sourceName);
  if (!sourceInfo) {
    throw new Error(`Source client '${sourceName}' not found`);
  }

  // Check target doesn't exist
  if (clientExists(clientsDir, newDirectoryName)) {
    throw new Error(`Client '${newDirectoryName}' already exists`);
  }

  // Deep clone the config
  const clonedConfig: Client = JSON.parse(JSON.stringify(sourceInfo.client));

  // Apply options
  if (resetCounter) {
    clonedConfig.nextInvoiceNumber = 1;
  }
  if (newDisplayName) {
    clonedConfig.name = newDisplayName;
  }
  if (newInvoicePrefix) {
    clonedConfig.invoicePrefix = newInvoicePrefix;
  }

  // Create new client with cloned config
  return createClient(clientsDir, newDirectoryName, clonedConfig);
}
