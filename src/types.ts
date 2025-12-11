export interface Address {
  street: string;
  city: string;
  country?: string | { de?: string; en?: string };
}

export interface BankDetails {
  name: string;
  iban: string;
  bic: string;
}

export interface ServiceDescription {
  de?: string;
  en?: string;
}

export interface Service {
  description: string | ServiceDescription;
  billingType: 'hourly' | 'daily' | 'fixed';
  rate?: number;
  dailyRate?: number;
  currency: 'EUR' | 'USD';
}

export interface Provider {
  name: string;
  address: Address;
  phone: string;
  email: string;
  bank: BankDetails;
  taxNumber: string;
  vatId?: string;
  logoPath?: string;  // Path to logo image (1.3.0+)
}

export interface EmailConfig {
  to: string[];
  cc?: string[];
}

export interface LineItem {
  description: string | ServiceDescription;
  quantity: number;
  rate: number;
  billingType: 'hourly' | 'daily' | 'fixed';
}

export interface Client {
  name: string;
  address: Address;
  language: 'de' | 'en';
  emailLanguage?: 'de' | 'en';
  invoicePrefix: string;
  nextInvoiceNumber: number;
  projectReference?: string;
  service: Service;
  bank?: BankDetails;
  paymentTermsDays?: number | null;
  email?: EmailConfig;
  // Future fields (1.3.0+)
  lineItems?: LineItem[];
  taxRate?: number;  // 0-1, e.g., 0.19 for 19%
  template?: 'default' | 'minimal' | 'detailed';
}

export interface EmailTranslations {
  subject: string;
  body: string;
}

export interface Translations {
  invoice: string;
  serviceProvider: string;
  client: string;
  invoiceNr: string;
  invoiceDate: string;
  dueDate: string;
  servicePeriod: string;
  projectReference: string;
  serviceChargesIntro: string;
  description: string;
  quantity: string;
  days: string;
  hours: string;
  unitPrice: string;
  total: string;
  subtotal: string;
  tax: string;
  taxNote: string;
  paymentTerms: string;
  paymentImmediate: string;
  thankYou: string;
  bankDetails: string;
  bank: string;
  iban: string;
  bic: string;
  taxNumber: string;
  vatId: string;
  country: string;
  filePrefix: string;
  email: EmailTranslations;
}

export interface InvoiceContext {
  provider: Provider;
  client: Client;
  translations: Translations;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;  // Calculated due date (if paymentTermsDays set)
  servicePeriod: string;
  monthName: string;
  totalAmount: number;
  quantity: number;
  rate: number;
  billingType: 'hourly' | 'daily' | 'fixed';
  currency: 'EUR' | 'USD';
  lang: 'de' | 'en';
  serviceDescription: string;
  emailServiceDescription: string;
  bankDetails: BankDetails;
  // Future fields (1.3.0+)
  lineItems?: LineItem[];
  subtotal?: number;
  taxAmount?: number;
  taxRate?: number;
}
