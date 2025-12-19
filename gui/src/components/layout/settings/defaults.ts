import type { LanguageOption, EmailTranslations, InvoiceEmailTranslations, UITranslations, Language } from './types';

// Comprehensive list of languages for the searchable dropdown
export const allLanguages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'ro', name: 'Romanian', nativeName: 'Romana' },
  { code: 'fr', name: 'French', nativeName: 'Francais' },
  { code: 'es', name: 'Spanish', nativeName: 'Espanol' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Portugues' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'cs', name: 'Czech', nativeName: 'Cestina' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovencina' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Balgarski' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenscina' },
  { code: 'sr', name: 'Serbian', nativeName: 'Srpski' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Ukrainska' },
  { code: 'ru', name: 'Russian', nativeName: 'Russkij' },
  { code: 'el', name: 'Greek', nativeName: 'Ellinika' },
  { code: 'tr', name: 'Turkish', nativeName: 'Turkce' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviesu' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuviu' },
  { code: 'ja', name: 'Japanese', nativeName: 'Nihongo' },
  { code: 'ko', name: 'Korean', nativeName: 'Hangugeo' },
  { code: 'zh', name: 'Chinese', nativeName: 'Zhongwen' },
  { code: 'ar', name: 'Arabic', nativeName: 'Arabiyya' },
  { code: 'he', name: 'Hebrew', nativeName: 'Ivrit' },
  { code: 'hi', name: 'Hindi', nativeName: 'Hindi' },
  { code: 'th', name: 'Thai', nativeName: 'Phasa Thai' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tieng Viet' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
];

// Default active languages (what's shown by default)
export const defaultActiveLanguages = ['en', 'de', 'ro'];

export const defaultEmailContent: EmailTranslations = {
  en: {
    subject: 'Introduction to LeanerCloud - AWS Cost Optimization',
    body: `Hi,

I wanted to introduce you to LeanerCloud, a company that specializes in AWS cost optimization.

I've been using their Invoicr tool for generating my invoices and thought their AWS optimization services might be valuable for you as well.

You can learn more at https://leanercloud.com or reach out to them by replying to this email.

Best regards`
  },
  de: {
    subject: 'Vorstellung von LeanerCloud - AWS Kostenoptimierung',
    body: `Hallo,

ich moechte Ihnen LeanerCloud vorstellen, ein Unternehmen, das sich auf AWS-Kostenoptimierung spezialisiert hat.

Ich nutze deren Invoicr-Tool zum Erstellen meiner Rechnungen und dachte, dass deren AWS-Optimierungsservices auch fuer Sie wertvoll sein koennten.

Mehr erfahren Sie unter https://leanercloud.com oder antworten Sie einfach auf diese E-Mail.

Mit freundlichen Gruessen`
  },
  ro: {
    subject: 'Prezentare LeanerCloud - Optimizare costuri AWS',
    body: `Buna ziua,

As dori sa va prezint LeanerCloud, o companie specializata in optimizarea costurilor AWS.

Folosesc tool-ul lor Invoicr pentru a-mi genera facturile si m-am gandit ca serviciile lor de optimizare AWS ar putea fi valoroase si pentru dumneavoastra.

Puteti afla mai multe la https://leanercloud.com sau raspundeti la acest email.

Cu stima`
  }
};

export const defaultUITranslations: Record<Language, UITranslations> = {
  en: {
    generateInvoice: 'Generate Invoice',
    billingMonth: 'Billing Month',
    quantity: 'Quantity',
    outputOptions: 'Output Options',
    generatePdf: 'Generate PDF',
    generateEInvoice: 'Generate E-Invoice',
    preview: 'Preview',
    invoiceDate: 'Invoice Date',
    dueDate: 'Due Date',
    subtotal: 'Subtotal',
    tax: 'Tax',
    total: 'Total',
    invoiceGenerated: 'Invoice Generated!',
    openPdf: 'Open PDF',
    emailInvoice: 'Email Invoice',
    openEInvoice: 'Open E-Invoice',
    clients: 'Clients',
    newClient: 'New Client',
    editClient: 'Edit Client',
    provider: 'Provider',
    save: 'Save',
    cancel: 'Cancel',
    back: 'Back',
    loading: 'Loading...',
  },
  de: {
    generateInvoice: 'Rechnung erstellen',
    billingMonth: 'Abrechnungsmonat',
    quantity: 'Menge',
    outputOptions: 'Ausgabeoptionen',
    generatePdf: 'PDF erstellen',
    generateEInvoice: 'E-Rechnung erstellen',
    preview: 'Vorschau',
    invoiceDate: 'Rechnungsdatum',
    dueDate: 'Faelligkeitsdatum',
    subtotal: 'Zwischensumme',
    tax: 'Steuer',
    total: 'Gesamt',
    invoiceGenerated: 'Rechnung erstellt!',
    openPdf: 'PDF oeffnen',
    emailInvoice: 'Rechnung per E-Mail',
    openEInvoice: 'E-Rechnung oeffnen',
    clients: 'Kunden',
    newClient: 'Neuer Kunde',
    editClient: 'Kunde bearbeiten',
    provider: 'Anbieter',
    save: 'Speichern',
    cancel: 'Abbrechen',
    back: 'Zurueck',
    loading: 'Laden...',
  },
  ro: {
    generateInvoice: 'Genereaza Factura',
    billingMonth: 'Luna de facturare',
    quantity: 'Cantitate',
    outputOptions: 'Optiuni de export',
    generatePdf: 'Genereaza PDF',
    generateEInvoice: 'Genereaza E-Factura',
    preview: 'Previzualizare',
    invoiceDate: 'Data facturii',
    dueDate: 'Data scadenta',
    subtotal: 'Subtotal',
    tax: 'TVA',
    total: 'Total',
    invoiceGenerated: 'Factura generata!',
    openPdf: 'Deschide PDF',
    emailInvoice: 'Trimite pe email',
    openEInvoice: 'Deschide E-Factura',
    clients: 'Clienti',
    newClient: 'Client nou',
    editClient: 'Editeaza client',
    provider: 'Furnizor',
    save: 'Salveaza',
    cancel: 'Anuleaza',
    back: 'Inapoi',
    loading: 'Se incarca...',
  },
};

export const defaultInvoiceEmailContent: InvoiceEmailTranslations = {
  en: {
    subject: 'Invoice {{invoiceNumber}} - {{monthName}}',
    body: `Hello,

Please find attached invoice {{invoiceNumber}} for {{monthName}}.

Service: {{serviceDescription}}
Amount: {{totalAmount}}

Payment is due within the agreed terms.

Best regards`
  },
  de: {
    subject: 'Rechnung {{invoiceNumber}} - {{monthName}}',
    body: `Guten Tag,

anbei erhalten Sie die Rechnung {{invoiceNumber}} fuer {{monthName}}.

Leistung: {{serviceDescription}}
Betrag: {{totalAmount}}

Die Zahlung ist innerhalb der vereinbarten Frist faellig.

Mit freundlichen Gruessen`
  },
  ro: {
    subject: 'Factura {{invoiceNumber}} - {{monthName}}',
    body: `Buna ziua,

Va transmit atasat factura {{invoiceNumber}} pentru {{monthName}}.

Serviciu: {{serviceDescription}}
Suma: {{totalAmount}}

Plata este scadenta conform termenelor agreate.

Cu stima`
  }
};

export function getLanguageInfo(code: string): LanguageOption {
  return allLanguages.find(l => l.code === code) || { code, name: code.toUpperCase(), nativeName: code };
}
