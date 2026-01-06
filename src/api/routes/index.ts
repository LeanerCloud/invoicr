/**
 * Route registration - aggregates all API routes
 */

import type { ServerContext, RouteHandler } from '../types.js';

// Import route handlers
import { healthCheck, libreOfficeStatus, getCountries } from './system.js';
import { getPersonas, createPersona, getPersona, updatePersona, deletePersona } from './personas.js';
import { getProvider, updateProvider } from './providers.js';
import { getClients, createNewClient, getClient, updateClient, deleteClient, getClientHistory, cloneClientHandler, deleteClientInvoice } from './clients.js';
import { previewInvoice, generateInvoice } from './invoices.js';
import { getEInvoiceFormats, getEInvoiceCountries, validateEInvoice, generateEInvoiceDoc } from './einvoices.js';
import { getTemplates, getTemplate, uploadTemplate, deleteTemplate, copyTemplate, openTemplate, renameTemplate, openTemplatesFolder } from './templates.js';
import { getAvailableTranslations, getTranslation } from './translations.js';
import { openFile, emailInvoice, batchEmailInvoices } from './files.js';
import { initDemo } from './demo.js';

export interface RouteDefinition {
  method: string;
  path: string;
  handler: RouteHandler;
}

/**
 * Get all route definitions for the API server
 */
export function getRouteDefinitions(ctx: ServerContext): RouteDefinition[] {
  return [
    // Health & system
    { method: 'GET', path: '/api/health', handler: healthCheck(ctx) },
    { method: 'GET', path: '/api/libreoffice', handler: libreOfficeStatus() },
    { method: 'GET', path: '/api/countries', handler: getCountries() },

    // Personas
    { method: 'GET', path: '/api/personas', handler: getPersonas(ctx) },
    { method: 'POST', path: '/api/personas', handler: createPersona(ctx) },
    { method: 'GET', path: '/api/personas/:persona', handler: getPersona(ctx) },
    { method: 'PUT', path: '/api/personas/:persona', handler: updatePersona(ctx) },
    { method: 'DELETE', path: '/api/personas/:persona', handler: deletePersona(ctx) },

    // Provider (per persona)
    { method: 'GET', path: '/api/personas/:persona/provider', handler: getProvider(ctx) },
    { method: 'PUT', path: '/api/personas/:persona/provider', handler: updateProvider(ctx) },

    // Clients (per persona)
    { method: 'GET', path: '/api/personas/:persona/clients', handler: getClients(ctx) },
    { method: 'POST', path: '/api/personas/:persona/clients', handler: createNewClient(ctx) },
    { method: 'GET', path: '/api/personas/:persona/clients/:name', handler: getClient(ctx) },
    { method: 'PUT', path: '/api/personas/:persona/clients/:name', handler: updateClient(ctx) },
    { method: 'DELETE', path: '/api/personas/:persona/clients/:name', handler: deleteClient(ctx) },

    // Client history (per persona)
    { method: 'GET', path: '/api/personas/:persona/clients/:name/history', handler: getClientHistory(ctx) },
    { method: 'DELETE', path: '/api/personas/:persona/clients/:name/history/:invoiceNumber', handler: deleteClientInvoice(ctx) },

    // Clone client (per persona)
    { method: 'POST', path: '/api/personas/:persona/clients/:name/clone', handler: cloneClientHandler(ctx) },

    // Invoice generation (per persona)
    { method: 'POST', path: '/api/personas/:persona/invoice/preview', handler: previewInvoice(ctx) },
    { method: 'POST', path: '/api/personas/:persona/invoice/generate', handler: generateInvoice(ctx) },

    // E-invoice (global format info)
    { method: 'GET', path: '/api/einvoice/formats', handler: getEInvoiceFormats() },
    { method: 'GET', path: '/api/einvoice/countries', handler: getEInvoiceCountries() },

    // E-invoice (per persona)
    { method: 'POST', path: '/api/personas/:persona/einvoice/validate', handler: validateEInvoice(ctx) },
    { method: 'POST', path: '/api/personas/:persona/einvoice/generate', handler: generateEInvoiceDoc(ctx) },

    // Translations
    { method: 'GET', path: '/api/translations', handler: getAvailableTranslations() },
    { method: 'GET', path: '/api/translations/:lang', handler: getTranslation() },

    // File operations
    { method: 'POST', path: '/api/file/open', handler: openFile() },
    { method: 'POST', path: '/api/personas/:persona/invoice/email', handler: emailInvoice(ctx) },
    { method: 'POST', path: '/api/personas/:persona/invoice/batch-email', handler: batchEmailInvoices(ctx) },

    // Invoice templates (per persona)
    { method: 'GET', path: '/api/personas/:persona/templates', handler: getTemplates(ctx) },
    { method: 'GET', path: '/api/personas/:persona/templates/:name', handler: getTemplate(ctx) },
    { method: 'POST', path: '/api/personas/:persona/templates', handler: uploadTemplate(ctx) },
    { method: 'DELETE', path: '/api/personas/:persona/templates/:name', handler: deleteTemplate(ctx) },
    { method: 'POST', path: '/api/personas/:persona/templates/:name/copy', handler: copyTemplate(ctx) },
    { method: 'POST', path: '/api/personas/:persona/templates/:name/open', handler: openTemplate(ctx) },
    { method: 'POST', path: '/api/personas/:persona/templates/:name/rename', handler: renameTemplate(ctx) },
    { method: 'POST', path: '/api/personas/:persona/templates/folder/open', handler: openTemplatesFolder(ctx) },

    // Demo data
    { method: 'POST', path: '/api/init-demo', handler: initDemo(ctx) },
  ];
}
