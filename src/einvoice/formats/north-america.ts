/**
 * E-invoice formats for North American countries
 */
import type { FormatInfo } from './types.js';

export const NORTH_AMERICA_FORMATS: Record<string, FormatInfo[]> = {
  // USA
  'US': [
    {
      format: 'ubl',
      description: 'UBL 2.1 (OASIS Universal Business Language)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Canada
  'CA': [
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ]
};

// Country names for North America
export const NORTH_AMERICA_COUNTRY_NAMES: Record<string, string> = {
  'US': 'United States',
  'CA': 'Canada'
};
