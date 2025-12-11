import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatCurrency,
  formatQuantity,
  getServiceDescription,
  getTranslatedCountry,
  calculateDueDate,
  formatDueDate
} from '../src/utils.js';

describe('formatDate', () => {
  it('should format date in German style', () => {
    const date = new Date(2025, 10, 15); // November 15, 2025
    const result = formatDate(date, 'de');
    expect(result).toBe('15.11.2025');
  });

  it('should format date in English style', () => {
    const date = new Date(2025, 10, 15); // November 15, 2025
    const result = formatDate(date, 'en');
    expect(result).toBe('15 Nov 2025');
  });
});

describe('formatCurrency', () => {
  it('should format USD amounts', () => {
    expect(formatCurrency(1500, 'USD', 'en')).toBe('$1,500.00');
    expect(formatCurrency(1500.5, 'USD', 'de')).toBe('$1,500.50');
  });

  it('should format EUR amounts in English', () => {
    expect(formatCurrency(1500, 'EUR', 'en')).toBe('1,500.00 €');
  });

  it('should format EUR amounts in German', () => {
    expect(formatCurrency(1500, 'EUR', 'de')).toBe('1.500,00 €');
  });

  it('should handle decimal amounts', () => {
    expect(formatCurrency(1234.56, 'USD', 'en')).toBe('$1,234.56');
    expect(formatCurrency(1234.56, 'EUR', 'de')).toBe('1.234,56 €');
  });
});

describe('formatQuantity', () => {
  it('should format quantity in English (uses dot)', () => {
    expect(formatQuantity(10.5, 'en')).toBe('10.5');
  });

  it('should format quantity in German (uses comma)', () => {
    expect(formatQuantity(10.5, 'de')).toBe('10,5');
  });

  it('should handle whole numbers', () => {
    expect(formatQuantity(10, 'en')).toBe('10');
    expect(formatQuantity(10, 'de')).toBe('10');
  });
});

describe('getServiceDescription', () => {
  it('should return string description as-is', () => {
    expect(getServiceDescription('Consulting Services', 'en')).toBe('Consulting Services');
    expect(getServiceDescription('Consulting Services', 'de')).toBe('Consulting Services');
  });

  it('should return language-specific description from object', () => {
    const description = { de: 'Beratung', en: 'Consulting' };
    expect(getServiceDescription(description, 'en')).toBe('Consulting');
    expect(getServiceDescription(description, 'de')).toBe('Beratung');
  });

  it('should fallback to German if language not found', () => {
    const description = { de: 'Beratung' };
    expect(getServiceDescription(description, 'en')).toBe('Beratung');
  });

  it('should fallback to English if German not found', () => {
    const description = { en: 'Consulting' };
    expect(getServiceDescription(description, 'de')).toBe('Consulting');
  });

  it('should return empty string if no translations', () => {
    expect(getServiceDescription({}, 'en')).toBe('');
  });
});

describe('getTranslatedCountry', () => {
  it('should return undefined for undefined input', () => {
    expect(getTranslatedCountry(undefined, 'en')).toBeUndefined();
  });

  it('should return string country as-is', () => {
    expect(getTranslatedCountry('Germany', 'en')).toBe('Germany');
    expect(getTranslatedCountry('Germany', 'de')).toBe('Germany');
  });

  it('should return language-specific country from object', () => {
    const country = { de: 'Deutschland', en: 'Germany' };
    expect(getTranslatedCountry(country, 'en')).toBe('Germany');
    expect(getTranslatedCountry(country, 'de')).toBe('Deutschland');
  });
});

describe('calculateDueDate', () => {
  it('should add days to base date', () => {
    const baseDate = new Date(2025, 10, 1); // November 1, 2025
    const dueDate = calculateDueDate(baseDate, 30);
    expect(dueDate.getFullYear()).toBe(2025);
    expect(dueDate.getMonth()).toBe(11); // December
    expect(dueDate.getDate()).toBe(1);
  });

  it('should handle year boundary', () => {
    const baseDate = new Date(2025, 11, 15); // December 15, 2025
    const dueDate = calculateDueDate(baseDate, 30);
    expect(dueDate.getFullYear()).toBe(2026);
    expect(dueDate.getMonth()).toBe(0); // January
    expect(dueDate.getDate()).toBe(14);
  });

  it('should handle short payment terms', () => {
    const baseDate = new Date(2025, 10, 15);
    const dueDate = calculateDueDate(baseDate, 7);
    expect(dueDate.getDate()).toBe(22);
  });
});

describe('formatDueDate', () => {
  it('should format due date using formatDate', () => {
    const date = new Date(2025, 10, 15);
    expect(formatDueDate(date, 'de')).toBe('15.11.2025');
    expect(formatDueDate(date, 'en')).toBe('15 Nov 2025');
  });
});
