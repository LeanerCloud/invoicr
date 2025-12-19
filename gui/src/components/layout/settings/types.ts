export interface SettingsModalProps {
  onClose: () => void;
}

export type Language = string;

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export interface EmailContent {
  subject: string;
  body: string;
}

export interface InvoiceEmailContent {
  subject: string;
  body: string;
}

export type EmailTranslations = Record<string, EmailContent>;
export type InvoiceEmailTranslations = Record<string, InvoiceEmailContent>;

export interface UITranslations {
  // Invoice Form
  generateInvoice: string;
  billingMonth: string;
  quantity: string;
  outputOptions: string;
  generatePdf: string;
  generateEInvoice: string;
  preview: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: string;
  tax: string;
  total: string;
  // Success messages
  invoiceGenerated: string;
  openPdf: string;
  emailInvoice: string;
  openEInvoice: string;
  // Client
  clients: string;
  newClient: string;
  editClient: string;
  provider: string;
  // General
  save: string;
  cancel: string;
  back: string;
  loading: string;
}

export const uiTranslationLabels: Record<keyof UITranslations, string> = {
  generateInvoice: 'Generate Invoice button',
  billingMonth: 'Billing Month label',
  quantity: 'Quantity label',
  outputOptions: 'Output Options header',
  generatePdf: 'Generate PDF checkbox',
  generateEInvoice: 'Generate E-Invoice checkbox',
  preview: 'Preview button',
  invoiceDate: 'Invoice Date label',
  dueDate: 'Due Date label',
  subtotal: 'Subtotal label',
  tax: 'Tax label',
  total: 'Total label',
  invoiceGenerated: 'Invoice Generated message',
  openPdf: 'Open PDF button',
  emailInvoice: 'Email Invoice button',
  openEInvoice: 'Open E-Invoice button',
  clients: 'Clients header',
  newClient: 'New Client button',
  editClient: 'Edit Client header',
  provider: 'Provider label',
  save: 'Save button',
  cancel: 'Cancel button',
  back: 'Back button',
  loading: 'Loading message',
};
