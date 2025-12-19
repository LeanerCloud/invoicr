// E-Invoice Module
// Provides support for generating e-invoices in various formats:
// - XRechnung (Germany)
// - ZUGFeRD (Germany)
// - CIUS-RO (Romania)
// - UBL (USA/Generic)

export {
  getAvailableFormats,
  getFormatsForTransaction,
  canGenerateEInvoice,
  getDefaultFormat,
  getFormatInfo,
  getCountryForFormat,
  getCountriesForFormat,
  isFormatValidForCountry,
  getSupportedCountries,
  getAllFormats,
  getCountryName,
  type FormatInfo
} from './formats.js';

export {
  validateForEInvoice,
  hasRequiredFields,
  type ValidationResult
} from './validator.js';

export {
  mapInvoiceContext,
  getUnitCode,
  getVATCategoryCode,
  formatDateToISO,
  generateEInvoiceFilename,
  type EInvoiceData,
  type VATBreakdown,
  type InvoiceLine
} from './mapper.js';

export {
  generateEInvoice,
  saveEInvoice,
  type EInvoiceResult,
  type GenerateOptions
} from './generator.js';
