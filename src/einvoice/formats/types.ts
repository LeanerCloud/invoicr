import type { CountryCode, EInvoiceFormat } from '../../types.js';

export interface FormatInfo {
  format: EInvoiceFormat;
  description: string;
  fileExtension: string;
  mimeType: string;
}

export type CountryFormats = Record<CountryCode, FormatInfo[]>;
