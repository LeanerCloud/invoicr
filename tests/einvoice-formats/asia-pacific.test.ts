/**
 * Tests for Asia-Pacific e-invoice formats
 */
import { describe, it, expect } from 'vitest';
import {
  getAvailableFormats,
  getDefaultFormat,
  isFormatValidForCountry,
  getCountryName
} from '../../src/einvoice/formats.js';

describe('Asia-Pacific e-invoice formats', () => {
  // India
  describe('India (IN)', () => {
    it('should support GST e-Invoice', () => {
      const formats = getAvailableFormats('IN');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('gst-einvoice');
      expect(formats[0].fileExtension).toBe('json');
    });

    it('should have correct country name', () => {
      expect(getCountryName('IN')).toBe('India');
    });
  });

  // Indonesia
  describe('Indonesia (ID)', () => {
    it('should support e-Faktur', () => {
      const formats = getAvailableFormats('ID');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('efaktur');
    });

    it('should have correct country name', () => {
      expect(getCountryName('ID')).toBe('Indonesia');
    });
  });

  // Malaysia
  describe('Malaysia (MY)', () => {
    it('should support MyInvois', () => {
      const formats = getAvailableFormats('MY');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('myinvois');
    });

    it('should have correct country name', () => {
      expect(getCountryName('MY')).toBe('Malaysia');
    });
  });

  // Singapore
  describe('Singapore (SG)', () => {
    it('should support InvoiceNow/PEPPOL', () => {
      const formats = getAvailableFormats('SG');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('peppol-sg');
    });

    it('should have correct country name', () => {
      expect(getCountryName('SG')).toBe('Singapore');
    });
  });

  // Australia
  describe('Australia (AU)', () => {
    it('should support PEPPOL A-NZ', () => {
      const formats = getAvailableFormats('AU');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('peppol-anz');
    });

    it('should have correct country name', () => {
      expect(getCountryName('AU')).toBe('Australia');
    });
  });

  // New Zealand
  describe('New Zealand (NZ)', () => {
    it('should support PEPPOL A-NZ', () => {
      const formats = getAvailableFormats('NZ');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('peppol-anz');
    });

    it('should have correct country name', () => {
      expect(getCountryName('NZ')).toBe('New Zealand');
    });
  });

  // South Korea
  describe('South Korea (KR)', () => {
    it('should support e-Tax Invoice', () => {
      const formats = getAvailableFormats('KR');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('etax-kr');
    });

    it('should have correct country name', () => {
      expect(getCountryName('KR')).toBe('South Korea');
    });
  });

  // Japan
  describe('Japan (JP)', () => {
    it('should support PEPPOL BIS JP', () => {
      const formats = getAvailableFormats('JP');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('peppol-jp');
    });

    it('should have correct country name', () => {
      expect(getCountryName('JP')).toBe('Japan');
    });
  });

  // Taiwan
  describe('Taiwan (TW)', () => {
    it('should support e-GUI', () => {
      const formats = getAvailableFormats('TW');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('egui');
    });

    it('should have correct country name', () => {
      expect(getCountryName('TW')).toBe('Taiwan');
    });
  });

  // Vietnam
  describe('Vietnam (VN)', () => {
    it('should support VAT e-Invoice', () => {
      const formats = getAvailableFormats('VN');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('vat-vn');
    });

    it('should have correct country name', () => {
      expect(getCountryName('VN')).toBe('Vietnam');
    });
  });

  // Thailand
  describe('Thailand (TH)', () => {
    it('should support e-Tax Invoice', () => {
      const formats = getAvailableFormats('TH');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('etax-th');
    });

    it('should have correct country name', () => {
      expect(getCountryName('TH')).toBe('Thailand');
    });
  });

  // Philippines
  describe('Philippines (PH)', () => {
    it('should support CAS e-Invoicing', () => {
      const formats = getAvailableFormats('PH');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('cas-ph');
    });

    it('should have correct country name', () => {
      expect(getCountryName('PH')).toBe('Philippines');
    });
  });
});

describe('Asia-Pacific format validation', () => {
  it('should validate GST e-Invoice only for India', () => {
    expect(isFormatValidForCountry('gst-einvoice', 'IN')).toBe(true);
    expect(isFormatValidForCountry('gst-einvoice', 'SG')).toBe(false);
  });

  it('should validate PEPPOL A-NZ for Australia and New Zealand', () => {
    expect(isFormatValidForCountry('peppol-anz', 'AU')).toBe(true);
    expect(isFormatValidForCountry('peppol-anz', 'NZ')).toBe(true);
    expect(isFormatValidForCountry('peppol-anz', 'SG')).toBe(false);
  });
});
