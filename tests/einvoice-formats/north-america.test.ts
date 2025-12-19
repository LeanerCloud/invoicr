/**
 * Tests for North American e-invoice formats
 */
import { describe, it, expect } from 'vitest';
import {
  getAvailableFormats,
  getDefaultFormat,
  isFormatValidForCountry,
  getCountryName
} from '../../src/einvoice/formats.js';

describe('North American e-invoice formats', () => {
  // USA
  describe('USA (US)', () => {
    it('should support UBL', () => {
      const formats = getAvailableFormats('US');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('ubl');
    });

    it('should have correct country name', () => {
      expect(getCountryName('US')).toBe('United States');
    });
  });

  // Canada
  describe('Canada (CA)', () => {
    it('should support PEPPOL BIS', () => {
      const formats = getAvailableFormats('CA');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('peppol-bis');
    });

    it('should have correct country name', () => {
      expect(getCountryName('CA')).toBe('Canada');
    });
  });
});

describe('North American format validation', () => {
  it('should validate UBL for USA', () => {
    expect(isFormatValidForCountry('ubl', 'US')).toBe(true);
  });

  it('should validate PEPPOL for Canada', () => {
    expect(isFormatValidForCountry('peppol-bis', 'CA')).toBe(true);
  });
});
