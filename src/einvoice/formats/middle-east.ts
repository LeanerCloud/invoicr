/**
 * E-invoice formats for Middle East countries
 */
import type { FormatInfo } from './types.js';

export const MIDDLE_EAST_FORMATS: Record<string, FormatInfo[]> = {
  // Saudi Arabia
  'SA': [
    {
      format: 'fatoora',
      description: 'FATOORA/ZATCA (mandatory for all, Phase 2)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // UAE
  'AE': [
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Israel
  'IL': [
    {
      format: 'ubl',
      description: 'UBL-based e-Invoice',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Turkey
  'TR': [
    {
      format: 'efatura-tr',
      description: 'e-Fatura (GIB system, mandatory)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Jordan
  'JO': [
    {
      format: 'jofotara',
      description: 'JoFotara (ISTD system)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Egypt
  'EG': [
    {
      format: 'ereceipt-eg',
      description: 'e-Receipt (ETA system)',
      fileExtension: 'json',
      mimeType: 'application/json'
    }
  ]
};

// Country names for Middle East
export const MIDDLE_EAST_COUNTRY_NAMES: Record<string, string> = {
  'SA': 'Saudi Arabia',
  'AE': 'United Arab Emirates',
  'IL': 'Israel',
  'TR': 'Turkey',
  'JO': 'Jordan',
  'EG': 'Egypt'
};
