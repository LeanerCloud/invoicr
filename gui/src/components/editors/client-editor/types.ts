import type { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import type { Client, EInvoiceFormatInfo } from '../../../services/api';

export interface FormSectionProps {
  register: UseFormRegister<Client>;
  errors: FieldErrors<Client>;
  watch?: UseFormWatch<Client>;
  setValue?: UseFormSetValue<Client>;
}

export interface BasicInfoSectionProps extends FormSectionProps {
  isEdit: boolean;
  directoryName: string;
  setDirectoryName: (name: string) => void;
  countries: Array<{ code: string; name: string }>;
}

export interface InvoiceSettingsSectionProps extends FormSectionProps {}

export interface TemplateSectionProps extends FormSectionProps {
  showTemplate: boolean;
  setShowTemplate: (show: boolean) => void;
  templates?: { builtIn: string[]; custom: string[] };
}

export interface ServiceSectionProps extends FormSectionProps {}

export interface EInvoiceSectionProps extends FormSectionProps {
  showEInvoice: boolean;
  setShowEInvoice: (show: boolean) => void;
  watchedCountryCode: string;
  eInvoiceFormats: EInvoiceFormatInfo[];
}

export interface EmailTemplateSectionProps extends FormSectionProps {
  showEmail: boolean;
  setShowEmail: (show: boolean) => void;
  loadEmailFromSettings: () => void;
}

export const EMAIL_PLACEHOLDERS = [
  { placeholder: '{{invoiceNumber}}', description: 'Invoice number (e.g., AC-001)' },
  { placeholder: '{{monthName}}', description: 'Billing month name (e.g., November 2024)' },
  { placeholder: '{{providerName}}', description: 'Your business name' },
  { placeholder: '{{servicePeriod}}', description: 'Service period description' },
  { placeholder: '{{serviceDescription}}', description: 'Service description' },
  { placeholder: '{{totalAmount}}', description: 'Total amount with currency' },
];

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'German' },
  { code: 'ro', name: 'Romanian' },
];

export const CURRENCIES = ['EUR', 'USD'] as const;
export const BILLING_TYPES = ['hourly', 'daily', 'fixed'] as const;
