/**
 * E-invoice formats for African countries
 */
import type { FormatInfo } from './types.js';

export const AFRICA_FORMATS: Record<string, FormatInfo[]> = {
  // South Africa
  'ZA': [
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Kenya
  'KE': [
    {
      format: 'tims',
      description: 'TIMS (Tax Invoice Management System, mandatory)',
      fileExtension: 'json',
      mimeType: 'application/json'
    }
  ],

  // Nigeria
  'NG': [
    {
      format: 'ubl',
      description: 'UBL-based e-Invoice',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Ghana
  'GH': [
    {
      format: 'evat-gh',
      description: 'e-VAT (mandatory for VAT-registered)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Tanzania
  'TZ': [
    {
      format: 'efd-tz',
      description: 'EFD (Electronic Fiscal Device, mandatory)',
      fileExtension: 'json',
      mimeType: 'application/json'
    }
  ],

  // Rwanda
  'RW': [
    {
      format: 'ebm',
      description: 'EBM (Electronic Billing Machine, mandatory)',
      fileExtension: 'json',
      mimeType: 'application/json'
    }
  ]
};

// Country names for Africa
export const AFRICA_COUNTRY_NAMES: Record<string, string> = {
  'ZA': 'South Africa',
  'KE': 'Kenya',
  'NG': 'Nigeria',
  'GH': 'Ghana',
  'TZ': 'Tanzania',
  'RW': 'Rwanda'
};
