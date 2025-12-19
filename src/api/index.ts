#!/usr/bin/env node
/**
 * Invoicr API Server - Main Entry Point
 *
 * HTTP server that exposes the invoicr core library for GUI applications.
 * This server is designed to run as a sidecar process for the Tauri desktop app.
 *
 * Supports multiple provider personas, each with its own clients and invoices.
 *
 * Endpoints:
 * - GET  /api/health                         - Health check
 * - GET  /api/libreoffice                    - LibreOffice status
 * - GET  /api/personas                       - List all personas
 * - POST /api/personas                       - Create a new persona
 * - GET  /api/personas/:persona              - Get persona details
 * - PUT  /api/personas/:persona              - Update persona (rename)
 * - DELETE /api/personas/:persona            - Delete persona
 * - GET  /api/personas/:persona/provider     - Load provider config
 * - PUT  /api/personas/:persona/provider     - Save provider config
 * - GET  /api/personas/:persona/clients      - List all clients
 * - POST /api/personas/:persona/clients      - Create a new client
 * - GET  /api/personas/:persona/clients/:name  - Get client config
 * - PUT  /api/personas/:persona/clients/:name  - Update client config
 * - DELETE /api/personas/:persona/clients/:name - Delete client
 * - GET  /api/personas/:persona/clients/:name/history - Get invoice history
 * - POST /api/personas/:persona/invoice/preview    - Generate invoice preview
 * - POST /api/personas/:persona/invoice/generate   - Generate invoice documents
 * - GET  /api/einvoice/formats               - List available e-invoice formats
 * - GET  /api/einvoice/countries             - List supported countries
 * - POST /api/personas/:persona/einvoice/validate  - Validate e-invoice config
 * - POST /api/personas/:persona/einvoice/generate  - Generate e-invoice
 * - GET  /api/personas/:persona/templates    - List available templates
 * - GET  /api/personas/:persona/templates/:name - Download template
 * - POST /api/personas/:persona/templates    - Upload custom template
 * - DELETE /api/personas/:persona/templates/:name - Delete custom template
 * - POST /api/personas/:persona/templates/:name/copy - Copy template for editing
 * - POST /api/personas/:persona/templates/:name/open - Open template in Word/Pages
 */

import { InvoicrApiServer } from './server.js';
import { DEFAULT_PORT } from './types.js';
import { getDefaultBasePath, ensureBaseDir } from './helpers/paths.js';

// Re-export for programmatic use
export { InvoicrApiServer } from './server.js';
export { DEFAULT_PORT } from './types.js';
export type { ApiRequest, ApiResponse, ServerContext, PersonaInfo } from './types.js';

// CLI entry point
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let port = DEFAULT_PORT;
  let basePath = getDefaultBasePath();

  for (const arg of args) {
    if (arg.startsWith('--port=')) {
      port = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--base=')) {
      basePath = arg.split('=')[1];
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Invoicr API Server

Usage: invoicr-server [options]

Options:
  --port=PORT   Port to listen on (default: ${DEFAULT_PORT})
  --base=PATH   Base path for config files (default: ~/.invoicr)
  --help, -h    Show this help message

Endpoints:
  GET  /api/health                - Health check
  GET  /api/libreoffice           - LibreOffice status
  GET  /api/personas              - List all personas
  POST /api/personas              - Create a new persona
  GET  /api/personas/:persona     - Get persona details
  PUT  /api/personas/:persona     - Update persona (rename)
  DELETE /api/personas/:persona   - Delete persona
  GET  /api/personas/:persona/provider - Get provider config
  PUT  /api/personas/:persona/provider - Update provider config
  GET  /api/personas/:persona/clients - List all clients
  POST /api/personas/:persona/clients - Create a new client
  GET  /api/personas/:persona/clients/:name - Get client config
  PUT  /api/personas/:persona/clients/:name - Update client config
  DELETE /api/personas/:persona/clients/:name - Delete a client
  GET  /api/personas/:persona/clients/:name/history - Get invoice history
  POST /api/personas/:persona/invoice/preview - Preview invoice (generate context)
  POST /api/personas/:persona/invoice/generate - Generate invoice documents
  GET  /api/einvoice/formats      - List e-invoice formats
  GET  /api/einvoice/countries    - List supported countries
  POST /api/personas/:persona/einvoice/validate - Validate e-invoice config
  POST /api/personas/:persona/einvoice/generate - Generate e-invoice from history
`);
      process.exit(0);
    }
  }

  // Ensure base directory structure exists
  ensureBaseDir(basePath);

  const server = new InvoicrApiServer(basePath);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.stop();
    process.exit(0);
  });

  try {
    await server.start(port);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Run if executed directly (not when imported as a module)
const isMainModule = process.argv[1]?.endsWith('api/index.js') ||
                     process.argv[1]?.endsWith('api/index.ts') ||
                     process.argv[1]?.endsWith('api-server.js') ||
                     process.argv[1]?.endsWith('api-server.ts');
if (isMainModule) {
  main().catch(console.error);
}
