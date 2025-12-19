/**
 * E-invoice formats for Latin American countries
 * Latin America has one of the most developed e-invoicing systems in the world
 */
import type { FormatInfo } from './types.js';

export const LATIN_AMERICA_FORMATS: Record<string, FormatInfo[]> = {
  // Brazil
  'BR': [
    {
      format: 'nfe',
      description: 'NF-e (Nota Fiscal Eletronica, mandatory)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Mexico
  'MX': [
    {
      format: 'cfdi',
      description: 'CFDI 4.0 (Comprobante Fiscal Digital, mandatory)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Argentina
  'AR': [
    {
      format: 'fe-ar',
      description: 'Factura Electronica AFIP (mandatory)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Chile
  'CL': [
    {
      format: 'dte',
      description: 'DTE (Documento Tributario Electronico, mandatory)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Colombia
  'CO': [
    {
      format: 'fe-co',
      description: 'Factura Electronica DIAN (mandatory)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Peru
  'PE': [
    {
      format: 'fe-pe',
      description: 'Factura Electronica SUNAT (mandatory)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Ecuador
  'EC': [
    {
      format: 'fe-ec',
      description: 'Factura Electronica SRI (mandatory)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Costa Rica
  'CR': [
    {
      format: 'fe-cr',
      description: 'Factura Electronica Hacienda (mandatory)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Uruguay
  'UY': [
    {
      format: 'cfe',
      description: 'CFE (Comprobante Fiscal Electronico, mandatory)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Panama
  'PA': [
    {
      format: 'fe-pa',
      description: 'Factura Electronica DGI (mandatory)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Guatemala
  'GT': [
    {
      format: 'fel',
      description: 'FEL (Factura Electronica en Linea, mandatory)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Dominican Republic
  'DO': [
    {
      format: 'ecf',
      description: 'e-CF (Comprobante Fiscal Electronico)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ],

  // Bolivia
  'BO': [
    {
      format: 'fe-bo',
      description: 'Factura Electronica SIN (mandatory)',
      fileExtension: 'xml',
      mimeType: 'application/xml'
    }
  ]
};

// Country names for Latin America
export const LATIN_AMERICA_COUNTRY_NAMES: Record<string, string> = {
  'BR': 'Brazil',
  'MX': 'Mexico',
  'AR': 'Argentina',
  'CL': 'Chile',
  'CO': 'Colombia',
  'PE': 'Peru',
  'EC': 'Ecuador',
  'CR': 'Costa Rica',
  'UY': 'Uruguay',
  'PA': 'Panama',
  'GT': 'Guatemala',
  'DO': 'Dominican Republic',
  'BO': 'Bolivia'
};
