#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { cloneClient, clientExists, getClientInfo } from '../lib/config-manager.js';

const cwd = process.cwd();
const args = process.argv.slice(2);

// Check for help
if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  console.log('Usage: invoicr-clone <source-client> <new-directory-name> [options]');
  console.log('');
  console.log('Clone an existing client configuration');
  console.log('');
  console.log('Options:');
  console.log('  --name=<name>      Set display name for the cloned client');
  console.log('                     (defaults to source client name)');
  console.log('  --prefix=<prefix>  Set invoice prefix for the cloned client');
  console.log('                     (defaults to source client prefix)');
  console.log('  --keep-counter     Keep invoice counter from source');
  console.log('                     (default: reset to 1)');
  console.log('  --help, -h         Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  invoicr-clone acme-daily acme-monthly');
  console.log('  invoicr-clone acme-daily acme-new --name="Acme New Project"');
  console.log('  invoicr-clone acme-daily acme-new --name="Acme New" --prefix=ANP');
  console.log('  invoicr-clone acme-daily acme-copy --keep-counter');
  process.exit(args.length === 0 ? 1 : 0);
}

// Parse positional arguments
const positionalArgs = args.filter(a => !a.startsWith('--'));
const sourceClient = positionalArgs[0];
const newDirectoryName = positionalArgs[1];

if (!sourceClient || !newDirectoryName) {
  console.error('Error: Both source client and new directory name are required.');
  console.error('Run "invoicr-clone --help" for usage information.');
  process.exit(1);
}

// Parse options
const nameArg = args.find(a => a.startsWith('--name='));
const prefixArg = args.find(a => a.startsWith('--prefix='));
const keepCounter = args.includes('--keep-counter');

const newDisplayName = nameArg?.replace('--name=', '');
const newInvoicePrefix = prefixArg?.replace('--prefix=', '').toUpperCase();

// Check if provider.json exists
const providerPath = path.join(cwd, 'provider.json');
if (!fs.existsSync(providerPath)) {
  console.error('No provider.json found in current directory.');
  console.error('Run "invoicr-init" to set up your invoicing workspace.');
  process.exit(1);
}

const clientsDir = path.join(cwd, 'clients');

// Check if source client exists
if (!clientExists(clientsDir, sourceClient)) {
  console.error(`Error: Source client '${sourceClient}' not found.`);
  console.error('Run "invoicr-list" to see available clients.');
  process.exit(1);
}

// Check if target already exists
if (clientExists(clientsDir, newDirectoryName)) {
  console.error(`Error: Client '${newDirectoryName}' already exists.`);
  process.exit(1);
}

// Clone the client
try {
  const newClientPath = cloneClient(clientsDir, sourceClient, newDirectoryName, {
    resetCounter: !keepCounter,
    newDisplayName,
    newInvoicePrefix,
  });

  const sourceInfo = getClientInfo(clientsDir, sourceClient);
  const newInfo = getClientInfo(clientsDir, newDirectoryName);

  console.log(`✓ Cloned client '${sourceClient}' to '${newDirectoryName}'`);
  console.log('');
  console.log('New client details:');
  console.log(`  Name: ${newInfo?.client.name || newDisplayName || sourceInfo?.client.name}`);
  console.log(`  Directory: ${newDirectoryName}`);
  console.log(`  Invoice prefix: ${newInfo?.client.invoicePrefix}`);
  console.log(`  Next invoice: ${newInfo?.client.nextInvoiceNumber}`);
  console.log(`  Config: ${newClientPath}`);
} catch (err) {
  const message = err instanceof Error ? err.message : 'Unknown error';
  console.error(`Error: ${message}`);
  process.exit(1);
}
