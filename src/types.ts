export interface Address {
  street: string;
  city: string;
  country?: string | { de?: string; en?: string };
}

// E-invoice types (v2.0.0+)
// Countries with established e-invoicing standards
export type CountryCode =
  // European Union
  | 'DE'  // Germany - XRechnung, ZUGFeRD
  | 'RO'  // Romania - CIUS-RO
  | 'FR'  // France - Factur-X
  | 'IT'  // Italy - FatturaPA
  | 'ES'  // Spain - Facturae
  | 'PL'  // Poland - KSeF
  | 'BE'  // Belgium - PEPPOL BIS
  | 'NL'  // Netherlands - NLCIUS
  | 'AT'  // Austria - ebInterface
  | 'PT'  // Portugal - CIUS-PT
  | 'SE'  // Sweden - Svefaktura/PEPPOL
  | 'NO'  // Norway - EHF
  | 'DK'  // Denmark - OIOUBL
  | 'FI'  // Finland - Finvoice
  | 'GR'  // Greece - myDATA
  | 'HU'  // Hungary - NAV
  | 'SI'  // Slovenia - eSlog
  | 'SK'  // Slovakia - PEPPOL BIS
  | 'CZ'  // Czech Republic - ISDOC
  | 'LU'  // Luxembourg - PEPPOL BIS
  | 'IE'  // Ireland - PEPPOL BIS
  | 'LT'  // Lithuania - PEPPOL BIS
  | 'LV'  // Latvia - PEPPOL BIS
  | 'EE'  // Estonia - PEPPOL BIS
  | 'RS'  // Serbia - Serbian e-Faktura
  | 'HR'  // Croatia - PEPPOL BIS
  | 'BG'  // Bulgaria - PEPPOL BIS
  | 'MT'  // Malta - PEPPOL BIS
  | 'CY'  // Cyprus - PEPPOL BIS
  // Europe non-EU
  | 'GB'  // United Kingdom - PEPPOL BIS
  | 'CH'  // Switzerland - ZUGFeRD
  | 'IS'  // Iceland - PEPPOL BIS
  // Asia-Pacific
  | 'IN'  // India - GST e-Invoice
  | 'ID'  // Indonesia - e-Faktur
  | 'MY'  // Malaysia - MyInvois
  | 'SG'  // Singapore - InvoiceNow/PEPPOL
  | 'AU'  // Australia - PEPPOL BIS A-NZ
  | 'NZ'  // New Zealand - PEPPOL BIS A-NZ
  | 'KR'  // South Korea - e-Tax Invoice
  | 'JP'  // Japan - Peppol BIS JP
  | 'TW'  // Taiwan - e-GUI
  | 'VN'  // Vietnam - VAT e-Invoice
  | 'TH'  // Thailand - e-Tax Invoice
  | 'PH'  // Philippines - CAS e-Invoicing
  // Middle East
  | 'SA'  // Saudi Arabia - FATOORA/ZATCA
  | 'AE'  // UAE - PEPPOL BIS
  | 'IL'  // Israel - e-Invoice
  | 'TR'  // Turkey - e-Fatura
  | 'JO'  // Jordan - JoFotara
  | 'EG'  // Egypt - e-Receipt
  // Latin America
  | 'BR'  // Brazil - NF-e
  | 'MX'  // Mexico - CFDI
  | 'AR'  // Argentina - Factura Electrónica
  | 'CL'  // Chile - DTE
  | 'CO'  // Colombia - Factura Electrónica
  | 'PE'  // Peru - Factura Electrónica
  | 'EC'  // Ecuador - Factura Electrónica
  | 'CR'  // Costa Rica - Factura Electrónica
  | 'UY'  // Uruguay - CFE
  | 'PA'  // Panama - Factura Electrónica
  | 'GT'  // Guatemala - FEL
  | 'DO'  // Dominican Republic - e-CF
  | 'BO'  // Bolivia - Factura Electrónica
  // Africa
  | 'ZA'  // South Africa - PEPPOL BIS
  | 'KE'  // Kenya - TIMS
  | 'NG'  // Nigeria - e-Invoice
  | 'GH'  // Ghana - e-VAT
  | 'TZ'  // Tanzania - EFD
  | 'RW'  // Rwanda - EBM
  // North America
  | 'US'  // USA - UBL
  | 'CA'; // Canada - PEPPOL BIS

// E-invoice formats supported
export type EInvoiceFormat =
  // Europe
  | 'xrechnung'   // Germany: UBL-based XML for B2G
  | 'zugferd'     // Germany/Switzerland/Austria: PDF/A-3 with embedded XML
  | 'cius-ro'     // Romania: UBL with ANAF requirements
  | 'ubl'         // Generic: OASIS Universal Business Language
  | 'factur-x'    // France: Hybrid PDF with embedded XML
  | 'fatturapa'   // Italy: FatturaPA XML for SDI
  | 'facturae'    // Spain: Spanish e-invoice format
  | 'peppol-bis'  // EU/Global: PEPPOL BIS Billing 3.0
  | 'nlcius'      // Netherlands: Dutch CIUS
  | 'ehf'         // Norway: EHF (Elektronisk Handelsformat)
  | 'oioubl'      // Denmark: OIOUBL format
  | 'finvoice'    // Finland: Finvoice format
  | 'ebinterface' // Austria: ebInterface format
  | 'isdoc'       // Czech Republic: ISDOC format
  | 'ksef'        // Poland: KSeF format
  | 'sefaktura'   // Serbia: Serbian e-Faktura
  // Asia-Pacific
  | 'gst-einvoice' // India: GST e-Invoice
  | 'efaktur'      // Indonesia: e-Faktur
  | 'myinvois'     // Malaysia: MyInvois
  | 'peppol-sg'    // Singapore: InvoiceNow/PEPPOL
  | 'peppol-anz'   // Australia/NZ: PEPPOL BIS A-NZ
  | 'etax-kr'      // South Korea: e-Tax Invoice
  | 'peppol-jp'    // Japan: PEPPOL BIS JP
  | 'egui'         // Taiwan: e-GUI
  | 'vat-vn'       // Vietnam: VAT e-Invoice
  | 'etax-th'      // Thailand: e-Tax Invoice
  | 'cas-ph'       // Philippines: CAS e-Invoicing
  // Middle East
  | 'fatoora'      // Saudi Arabia: FATOORA/ZATCA
  | 'efatura-tr'   // Turkey: e-Fatura
  | 'jofotara'     // Jordan: JoFotara
  | 'ereceipt-eg'  // Egypt: e-Receipt
  // Latin America
  | 'nfe'          // Brazil: NF-e (Nota Fiscal Eletrônica)
  | 'cfdi'         // Mexico: CFDI (Comprobante Fiscal Digital por Internet)
  | 'fe-ar'        // Argentina: Factura Electrónica AFIP
  | 'dte'          // Chile: DTE (Documento Tributario Electrónico)
  | 'fe-co'        // Colombia: Factura Electrónica DIAN
  | 'fe-pe'        // Peru: Factura Electrónica SUNAT
  | 'fe-ec'        // Ecuador: Factura Electrónica SRI
  | 'fe-cr'        // Costa Rica: Factura Electrónica Hacienda
  | 'cfe'          // Uruguay: CFE (Comprobante Fiscal Electrónico)
  | 'fe-pa'        // Panama: Factura Electrónica DGI
  | 'fel'          // Guatemala: FEL (Factura Electrónica en Línea)
  | 'ecf'          // Dominican Republic: e-CF
  | 'fe-bo'        // Bolivia: Factura Electrónica SIN
  // Africa
  | 'tims'         // Kenya: TIMS (Tax Invoice Management System)
  | 'evat-gh'      // Ghana: e-VAT
  | 'efd-tz'       // Tanzania: EFD (Electronic Fiscal Device)
  | 'ebm';         // Rwanda: EBM (Electronic Billing Machine)

export interface EInvoiceConfig {
  leitwegId?: string;      // Germany B2G: Leitweg-ID
  buyerReference?: string; // General: Buyer reference (BT-10)
  preferredFormat?: EInvoiceFormat;
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
  countryCode?: CountryCode;  // E-invoice support (v2.0.0+)
}

export interface EmailConfig {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  body?: string;
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
  // Template name: 'default', 'minimal', 'detailed', or custom template name
  templateName?: string;
  // E-invoice support (v2.0.0+)
  countryCode?: CountryCode;
  eInvoice?: EInvoiceConfig;
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

// Resolved line item with calculated total (for rendering)
export interface ResolvedLineItem {
  description: string;
  quantity: number;
  rate: number;
  billingType: 'hourly' | 'daily' | 'fixed';
  total: number;
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
  // Line items (1.3.0+)
  lineItems: ResolvedLineItem[];
  subtotal: number;
  taxAmount: number;
  taxRate: number;
}
