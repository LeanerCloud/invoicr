import type { EmailTranslations, InvoiceEmailTranslations, UITranslations } from './types';
import {
  defaultActiveLanguages,
  defaultEmailContent,
  defaultInvoiceEmailContent,
  defaultUITranslations
} from './defaults';

export function getStoredLanguage(): string {
  const stored = localStorage.getItem('invoicr_language');
  if (stored) {
    return stored;
  }
  return 'en';
}

export function getStoredActiveLanguages(): string[] {
  const stored = localStorage.getItem('invoicr_active_languages');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultActiveLanguages;
    }
  }
  return defaultActiveLanguages;
}

export function getStoredEmailContent(): EmailTranslations {
  const stored = localStorage.getItem('invoicr_email_translations');
  if (stored) {
    try {
      return { ...defaultEmailContent, ...JSON.parse(stored) };
    } catch {
      return defaultEmailContent;
    }
  }
  return defaultEmailContent;
}

export function getStoredInvoiceEmailContent(): InvoiceEmailTranslations {
  const stored = localStorage.getItem('invoicr_invoice_email_translations');
  if (stored) {
    try {
      return { ...defaultInvoiceEmailContent, ...JSON.parse(stored) };
    } catch {
      return defaultInvoiceEmailContent;
    }
  }
  return defaultInvoiceEmailContent;
}

export function getStoredUITranslations(): Record<string, UITranslations> {
  const stored = localStorage.getItem('invoicr_ui_translations');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Deep merge for each language
      const result: Record<string, UITranslations> = {};
      const allKeys = new Set([...Object.keys(defaultUITranslations), ...Object.keys(parsed)]);
      for (const lang of allKeys) {
        const defaultForLang = defaultUITranslations[lang] || defaultUITranslations.en;
        result[lang] = { ...defaultForLang, ...parsed[lang] };
      }
      return result;
    } catch {
      return defaultUITranslations;
    }
  }
  return defaultUITranslations;
}

export function getStoredPlaceholderLanguages(): string[] {
  const stored = localStorage.getItem('invoicr_placeholder_languages');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}
