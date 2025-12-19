/**
 * Invoicr Core Library
 *
 * This module provides reusable functions for invoice generation
 * that can be used by both the CLI and GUI applications.
 */

// Configuration Management
export {
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
  createClient,
  type ConfigPaths,
  type ClientInfo
} from './config-manager.js';

// Invoice Building
export {
  calculateTotals,
  buildLineItems,
  buildServiceDescription,
  generateInvoiceNumber,
  getServicePeriod,
  buildInvoiceContext,
  getDefaultBillingMonth,
  parseMonthArg,
  incrementInvoiceNumber,
  type BuildInvoiceOptions
} from './invoice-builder.js';

// Document Generation
export {
  generateDocx,
  convertToPdf,
  generateDocuments,
  isLibreOfficeAvailable,
  getLibreOfficeVersion,
  generateOutputPaths,
  type GeneratedDocument,
  type GeneratedPDF
} from './document-generator.js';

// History Management
export {
  getHistoryPath,
  loadHistory,
  saveHistory,
  addHistoryEntry,
  getLastInvoice,
  getInvoiceByNumber,
  getInvoicesByMonth,
  getInvoicesByYear,
  getTotalRevenue,
  getInvoiceCount,
  hasHistory,
  deleteInvoice,
  clearHistory,
  type InvoiceHistoryEntry,
  type InvoiceHistory
} from './history-manager.js';

// Re-export commonly used types and utilities
export type {
  Provider,
  Client,
  Translations,
  InvoiceContext,
  ResolvedLineItem,
  CountryCode,
  EInvoiceFormat,
  EInvoiceConfig
} from '../types.js';

export {
  formatDate,
  formatCurrency,
  getServiceDescription,
  calculateDueDate
} from '../utils.js';

// Template Generation
export {
  generateInvoiceFromTemplate,
  generateFromTemplate,
  getTemplatePath,
  getBuiltInTemplates,
  isBuiltInTemplate,
  listTemplates,
  contextToTemplateData,
  copyTemplateForEditing,
  deleteCustomTemplate,
  uploadCustomTemplate,
  type TemplateData
} from './template-generator.js';

export { type TemplateName } from './document-generator.js';
export { createEmail } from '../email.js';

// E-invoice support
export * from '../einvoice/index.js';
