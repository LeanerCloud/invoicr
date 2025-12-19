/**
 * E-invoice formats for Asia-Pacific countries
 */
import type { FormatInfo } from './types.js';

export const ASIA_PACIFIC_FORMATS: Record<string, FormatInfo[]> = {
  // India
  'IN': [
    {
      format: 'gst-einvoice',
      description: 'GST e-Invoice (mandatory for businesses > turnover threshold)',
      fileExtension: 'json',
      mimeType: 'application/json'
    }
  ],

  // Indonesia
  'ID': [
    {
      format: 'efaktur',
      description: 'e-Faktur (mandatory since 2015/2016)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Malaysia
  'MY': [
    {
      format: 'myinvois',
      description: 'MyInvois (mandatory rollout 2024-2025)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Singapore
  'SG': [
    {
      format: 'peppol-sg',
      description: 'InvoiceNow/PEPPOL (IMDA network)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Australia
  'AU': [
    {
      format: 'peppol-anz',
      description: 'PEPPOL BIS A-NZ (mandatory B2G from May 2025)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // New Zealand
  'NZ': [
    {
      format: 'peppol-anz',
      description: 'PEPPOL BIS A-NZ (mandatory B2G from May 2025)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // South Korea
  'KR': [
    {
      format: 'etax-kr',
      description: 'e-Tax Invoice (NTS system, mandatory)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Japan
  'JP': [
    {
      format: 'peppol-jp',
      description: 'PEPPOL BIS JP (Japan CIUS)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Taiwan
  'TW': [
    {
      format: 'egui',
      description: 'e-GUI (Government Uniform Invoice)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Vietnam
  'VN': [
    {
      format: 'vat-vn',
      description: 'VAT e-Invoice (mandatory since July 2022)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Thailand
  'TH': [
    {
      format: 'etax-th',
      description: 'e-Tax Invoice (RD system)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Philippines
  'PH': [
    {
      format: 'cas-ph',
      description: 'CAS e-Invoicing (BIR system)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ]
};

// Country names for Asia-Pacific
export const ASIA_PACIFIC_COUNTRY_NAMES: Record<string, string> = {
  'IN': 'India',
  'ID': 'Indonesia',
  'MY': 'Malaysia',
  'SG': 'Singapore',
  'AU': 'Australia',
  'NZ': 'New Zealand',
  'KR': 'South Korea',
  'JP': 'Japan',
  'TW': 'Taiwan',
  'VN': 'Vietnam',
  'TH': 'Thailand',
  'PH': 'Philippines'
};
