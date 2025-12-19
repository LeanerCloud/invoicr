/**
 * E-invoice formats for European countries
 */
import type { FormatInfo } from './types.js';

// European Union countries
export const EU_FORMATS: Record<string, FormatInfo[]> = {
  // Germany
  'DE': [
    {
      format: 'xrechnung',
      description: 'XRechnung (UBL-based XML, mandatory for B2G)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    },
    {
      format: 'zugferd',
      description: 'ZUGFeRD (PDF/A-3 with embedded XML)',
      fileExtension: 'pdf',
      mimeType: 'application/pdf'
    }
  ],

  // Romania
  'RO': [
    {
      format: 'cius-ro',
      description: 'CIUS-RO (UBL with ANAF requirements, mandatory B2B)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // France
  'FR': [
    {
      format: 'factur-x',
      description: 'Factur-X (PDF/A-3 with embedded XML)',
      fileExtension: 'pdf',
      mimeType: 'application/pdf'
    },
    {
      format: 'ubl',
      description: 'UBL (for Chorus Pro)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Italy
  'IT': [
    {
      format: 'fatturapa',
      description: 'FatturaPA (XML for SDI, mandatory for all)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Spain
  'ES': [
    {
      format: 'facturae',
      description: 'Facturae 3.2.2 (Spanish e-invoice format)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    },
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Poland
  'PL': [
    {
      format: 'ksef',
      description: 'KSeF (Krajowy System e-Faktur)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    },
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Belgium
  'BE': [
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    },
    {
      format: 'ubl',
      description: 'UBL 2.1 (Belgium e-FFF)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Netherlands
  'NL': [
    {
      format: 'nlcius',
      description: 'NLCIUS (Dutch Core Invoice Usage Specification)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    },
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Austria
  'AT': [
    {
      format: 'ebinterface',
      description: 'ebInterface 6.1 (Austrian e-invoice standard)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    },
    {
      format: 'zugferd',
      description: 'ZUGFeRD (PDF/A-3 with embedded XML)',
      fileExtension: 'pdf',
      mimeType: 'application/pdf'
    },
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Portugal
  'PT': [
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0 (CIUS-PT)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Sweden
  'SE': [
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0 (Svefaktura)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Norway
  'NO': [
    {
      format: 'ehf',
      description: 'EHF (Elektronisk Handelsformat)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    },
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Denmark
  'DK': [
    {
      format: 'oioubl',
      description: 'OIOUBL (Danish public sector e-invoice)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    },
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Finland
  'FI': [
    {
      format: 'finvoice',
      description: 'Finvoice 3.0 (Finnish e-invoice standard)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    },
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Greece
  'GR': [
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0 (myDATA compatible)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Hungary
  'HU': [
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0 (NAV Online compatible)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Slovenia
  'SI': [
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0 (eSlog compatible)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Slovakia
  'SK': [
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Czech Republic
  'CZ': [
    {
      format: 'isdoc',
      description: 'ISDOC (Information System Document)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    },
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Luxembourg
  'LU': [
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Ireland
  'IE': [
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Lithuania
  'LT': [
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Latvia
  'LV': [
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0 (mandatory B2G from 2025)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Estonia
  'EE': [
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0 (mandatory from July 2025)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Serbia
  'RS': [
    {
      format: 'sefaktura',
      description: 'Serbian e-Faktura (mandatory B2B since 2023)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Croatia
  'HR': [
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Bulgaria
  'BG': [
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Malta
  'MT': [
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Cyprus
  'CY': [
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ]
};

// Non-EU European countries
export const NON_EU_EUROPE_FORMATS: Record<string, FormatInfo[]> = {
  // United Kingdom
  'GB': [
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    },
    {
      format: 'ubl',
      description: 'UBL 2.1',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Switzerland
  'CH': [
    {
      format: 'zugferd',
      description: 'ZUGFeRD/Factur-X (PDF/A-3 with embedded XML)',
      fileExtension: 'pdf',
      mimeType: 'application/pdf'
    },
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Iceland
  'IS': [
    {
      format: 'peppol-bis',
      description: 'PEPPOL BIS Billing 3.0',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ]
};

// All European formats combined
export const EUROPE_FORMATS: Record<string, FormatInfo[]> = {
  ...EU_FORMATS,
  ...NON_EU_EUROPE_FORMATS
};

// Country names for Europe
export const EUROPE_COUNTRY_NAMES: Record<string, string> = {
  // EU
  'DE': 'Germany',
  'RO': 'Romania',
  'FR': 'France',
  'IT': 'Italy',
  'ES': 'Spain',
  'PL': 'Poland',
  'BE': 'Belgium',
  'NL': 'Netherlands',
  'AT': 'Austria',
  'PT': 'Portugal',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'GR': 'Greece',
  'HU': 'Hungary',
  'SI': 'Slovenia',
  'SK': 'Slovakia',
  'CZ': 'Czech Republic',
  'LU': 'Luxembourg',
  'IE': 'Ireland',
  'LT': 'Lithuania',
  'LV': 'Latvia',
  'EE': 'Estonia',
  'RS': 'Serbia',
  'HR': 'Croatia',
  'BG': 'Bulgaria',
  'MT': 'Malta',
  'CY': 'Cyprus',
  // Non-EU
  'GB': 'United Kingdom',
  'CH': 'Switzerland',
  'IS': 'Iceland'
};
