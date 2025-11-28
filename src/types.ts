export interface Address {
  street: string;
  city: string;
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
}

export interface EmailConfig {
  to: string[];
  cc?: string[];
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
  servicePeriod: string;
  projectReference: string;
  serviceChargesIntro: string;
  description: string;
  quantity: string;
  days: string;
  hours: string;
  unitPrice: string;
  total: string;
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
}
