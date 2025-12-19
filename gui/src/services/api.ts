const API_BASE = 'http://localhost:3847';

// Types matching the API server
export interface PersonaInfo {
  name: string;
  directory: string;
  hasProvider: boolean;
  clientCount: number;
}

export interface Provider {
  name: string;
  address: { street: string; city: string };
  phone?: string;
  email: string;
  bank: { name: string; iban: string; bic?: string };
  taxNumber?: string;
  vatId?: string;
  countryCode?: string;
  logoPath?: string;
}

export interface Client {
  name: string;
  address: { street: string; city: string };
  language: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  service: {
    description: string;
    billingType: 'hourly' | 'daily' | 'fixed';
    rate: number;
    currency: 'EUR' | 'USD';
  };
  email?: { to: string[]; cc?: string[]; bcc?: string[]; subject?: string; body?: string };
  taxRate?: number;
  countryCode?: string;
  paymentTermsDays?: number;
  projectReference?: string;
  templateName?: string; // Template name: 'default', 'minimal', 'detailed', or custom
  lineItems?: Array<{
    description: string;
    quantity: number;
    rate: number;
    billingType: 'hourly' | 'daily' | 'fixed';
  }>;
  eInvoice?: {
    leitwegId?: string;
    buyerReference?: string;
    preferredFormat?: string;
  };
}

export interface ClientSummary {
  name: string;
  displayName: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  language: string;
  currency: string;
  countryCode?: string;
  hasHistory: boolean;
}

export interface InvoiceHistoryEntry {
  invoiceNumber: string;
  date: string;
  month: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  currency: string;
  pdfPath?: string;
}

export interface InvoiceContext {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  monthName: string;
  quantity: number;
  rate: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
}

// API functions
async function fetchApi<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// Personas API
export const personasApi = {
  list: () => fetchApi<PersonaInfo[]>('/api/personas'),
  get: (name: string) =>
    fetchApi<PersonaInfo>(`/api/personas/${encodeURIComponent(name)}`),
  create: (name: string) =>
    fetchApi<{ success: boolean; persona: PersonaInfo }>('/api/personas', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  update: (name: string, newName: string) =>
    fetchApi<{ success: boolean; persona: PersonaInfo }>(
      `/api/personas/${encodeURIComponent(name)}`,
      {
        method: 'PUT',
        body: JSON.stringify({ name: newName }),
      }
    ),
  delete: (name: string) =>
    fetchApi<{ success: boolean }>(`/api/personas/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    }),
};

// Provider API (per persona)
export const providerApi = {
  get: (persona: string) =>
    fetchApi<Provider | null>(`/api/personas/${encodeURIComponent(persona)}/provider`),
  save: (persona: string, provider: Provider) =>
    fetchApi<{ success: boolean }>(`/api/personas/${encodeURIComponent(persona)}/provider`, {
      method: 'PUT',
      body: JSON.stringify(provider),
    }),
};

// Clients API (per persona)
export const clientsApi = {
  list: (persona: string) =>
    fetchApi<ClientSummary[]>(`/api/personas/${encodeURIComponent(persona)}/clients`),
  get: (persona: string, name: string) =>
    fetchApi<{ name: string; directory: string; configPath: string; client: Client }>(
      `/api/personas/${encodeURIComponent(persona)}/clients/${encodeURIComponent(name)}`
    ),
  create: (persona: string, directoryName: string, client: Client) =>
    fetchApi<{ success: boolean }>(`/api/personas/${encodeURIComponent(persona)}/clients`, {
      method: 'POST',
      body: JSON.stringify({ directoryName, ...client }),
    }),
  update: (persona: string, name: string, client: Client) =>
    fetchApi<{ success: boolean }>(
      `/api/personas/${encodeURIComponent(persona)}/clients/${encodeURIComponent(name)}`,
      {
        method: 'PUT',
        body: JSON.stringify(client),
      }
    ),
  delete: (persona: string, name: string) =>
    fetchApi<{ success: boolean }>(
      `/api/personas/${encodeURIComponent(persona)}/clients/${encodeURIComponent(name)}`,
      {
        method: 'DELETE',
      }
    ),
  getHistory: (persona: string, name: string) =>
    fetchApi<{ invoices: InvoiceHistoryEntry[] }>(
      `/api/personas/${encodeURIComponent(persona)}/clients/${encodeURIComponent(name)}/history`
    ),
};

// Invoice API (per persona)
export const invoiceApi = {
  preview: (persona: string, clientName: string, quantity: number, month?: string) =>
    fetchApi<{
      context: InvoiceContext;
      canGenerateEInvoice: boolean;
      availableEInvoiceFormats: Array<{ format: string; description: string; fileExtension?: string; mimeType?: string }>;
    }>(`/api/personas/${encodeURIComponent(persona)}/invoice/preview`, {
      method: 'POST',
      body: JSON.stringify({ clientName, quantity, month }),
    }),
  generate: (
    persona: string,
    params: {
      clientName: string;
      quantity: number;
      month?: string;
      template?: string;
      generatePdf?: boolean;
      generateEInvoice?: boolean;
      eInvoiceFormat?: string;
    }
  ) =>
    fetchApi<{
      success: boolean;
      docxPath: string;
      pdfPath?: string;
      eInvoicePath?: string;
      invoiceNumber: string;
      totalAmount: number;
      currency: string;
    }>(`/api/personas/${encodeURIComponent(persona)}/invoice/generate`, {
      method: 'POST',
      body: JSON.stringify(params),
    }),
};

// E-Invoice format info type
export interface EInvoiceFormatInfo {
  format: string;
  description: string;
  fileExtension: string;
  mimeType: string;
}

// E-Invoice API (global format info, per-persona validation/generation)
export const eInvoiceApi = {
  getFormats: (country?: string) =>
    fetchApi<
      | { country: string; countryName: string; formats: Array<{ format: string; name: string }> }
      | Array<{ country: string; countryName: string; formats: Array<{ format: string; name: string }> }>
    >(`/api/einvoice/formats${country ? `?country=${country}` : ''}`),
  getFormatsForTransaction: (providerCountry: string, clientCountry: string) =>
    fetchApi<{
      providerCountry: string;
      clientCountry: string;
      countriesMatch: boolean;
      country?: string;
      countryName?: string;
      formats: EInvoiceFormatInfo[];
    }>(`/api/einvoice/formats?providerCountry=${providerCountry}&clientCountry=${clientCountry}`),
  getCountries: () =>
    fetchApi<Array<{ code: string; name: string }>>('/api/einvoice/countries'),
  validate: (persona: string, clientName: string, format?: string) =>
    fetchApi<{
      valid: boolean;
      canGenerate: boolean;
      format?: string;
      errors: string[];
      warnings: string[];
    }>(`/api/personas/${encodeURIComponent(persona)}/einvoice/validate`, {
      method: 'POST',
      body: JSON.stringify({ clientName, format }),
    }),
};

// Health API
export const healthApi = {
  check: () => fetchApi<{ status: string; version: string }>('/api/health'),
  libreOffice: () =>
    fetchApi<{ available: boolean; version?: string }>('/api/libreoffice'),
};

// Countries API
export const countriesApi = {
  getAll: () => fetchApi<Array<{ code: string; name: string }>>('/api/countries'),
};

// Demo data API
export const demoApi = {
  initDemo: () =>
    fetchApi<{ success: boolean; message: string; created: boolean; persona?: string }>('/api/init-demo', {
      method: 'POST',
    }),
};

// File operations API
export const fileApi = {
  open: (filePath: string) =>
    fetchApi<{ success: boolean }>('/api/file/open', {
      method: 'POST',
      body: JSON.stringify({ filePath }),
    }),
  emailInvoice: (persona: string, clientName: string, pdfPath: string, eInvoicePath?: string, testMode?: boolean) =>
    fetchApi<{ success: boolean; message: string }>(
      `/api/personas/${encodeURIComponent(persona)}/invoice/email`,
      {
        method: 'POST',
        body: JSON.stringify({ clientName, pdfPath, eInvoicePath, testMode }),
      }
    ),
};

// Translations API
export interface TranslationData {
  language: string;
  translation: Record<string, string | Record<string, string>>;
  exists: boolean;
}

export const translationsApi = {
  getAvailable: () =>
    fetchApi<{ languages: string[] }>('/api/translations'),
  get: (lang: string) =>
    fetchApi<TranslationData>(`/api/translations/${encodeURIComponent(lang)}`),
};

// Invoice Templates API (per persona)
export interface TemplateList {
  builtIn: string[];
  custom: string[];
}

export const templatesApi = {
  list: (persona: string) =>
    fetchApi<TemplateList>(`/api/personas/${encodeURIComponent(persona)}/templates`),
  download: async (persona: string, name: string): Promise<Blob> => {
    const response = await fetch(
      `${API_BASE}/api/personas/${encodeURIComponent(persona)}/templates/${encodeURIComponent(name)}`
    );
    if (!response.ok) {
      throw new Error(`Failed to download template: ${response.status}`);
    }
    return response.blob();
  },
  upload: (persona: string, name: string, data: string) =>
    fetchApi<{ success: boolean; path: string; name: string }>(
      `/api/personas/${encodeURIComponent(persona)}/templates`,
      {
        method: 'POST',
        body: JSON.stringify({ name, data }),
      }
    ),
  delete: (persona: string, name: string) =>
    fetchApi<{ success: boolean; deleted: string }>(
      `/api/personas/${encodeURIComponent(persona)}/templates/${encodeURIComponent(name)}`,
      {
        method: 'DELETE',
      }
    ),
  copy: (persona: string, name: string, newName?: string) =>
    fetchApi<{ success: boolean; path: string; name: string; message: string }>(
      `/api/personas/${encodeURIComponent(persona)}/templates/${encodeURIComponent(name)}/copy`,
      {
        method: 'POST',
        body: JSON.stringify({ newName }),
      }
    ),
  open: (persona: string, name: string) =>
    fetchApi<{ success: boolean; path: string; message: string }>(
      `/api/personas/${encodeURIComponent(persona)}/templates/${encodeURIComponent(name)}/open`,
      {
        method: 'POST',
      }
    ),
};
