import * as fs from 'fs';
import * as path from 'path';
import type { InvoiceContext, EInvoiceFormat, CountryCode } from '../types.js';
import { mapInvoiceContext, generateEInvoiceFilename, type EInvoiceData } from './mapper.js';
import { getDefaultFormat, type FormatInfo } from './formats.js';
import { validateForEInvoice, type ValidationResult } from './validator.js';

export interface EInvoiceResult {
  format: FormatInfo;
  data: Buffer;
  filename: string;
  validation: ValidationResult;
}

export interface GenerateOptions {
  format?: EInvoiceFormat;  // Override format selection
  outputDir?: string;
  pdfPath?: string;  // For ZUGFeRD: path to existing PDF to embed XML
  validate?: boolean;  // Run validation before generation
  skipValidation?: boolean;
}

/**
 * Generate an e-invoice from an InvoiceContext
 */
export async function generateEInvoice(
  ctx: InvoiceContext,
  providerCountryCode: CountryCode,
  clientCountryCode: CountryCode,
  options: GenerateOptions = {}
): Promise<EInvoiceResult> {
  // Get the format to use (options.format overrides client preference)
  const preferredFormat = options.format || ctx.client.eInvoice?.preferredFormat;
  const formatInfo = getDefaultFormat(clientCountryCode, preferredFormat);

  if (!formatInfo) {
    throw new Error(`No e-invoice format available for country: ${clientCountryCode}`);
  }

  // Validate before generation
  const validation = validateForEInvoice(
    ctx,
    formatInfo.format,
    providerCountryCode,
    clientCountryCode
  );

  if (!options.skipValidation && !validation.valid) {
    const errorMessages = validation.errors.join('; ');
    throw new Error(`E-invoice validation failed: ${errorMessages}`);
  }

  // Map invoice context to e-invoice data
  const invoiceData = mapInvoiceContext(
    ctx,
    formatInfo.format,
    providerCountryCode,
    clientCountryCode
  );

  // Generate the e-invoice
  let data: Buffer;

  try {
    data = await generateWithLibrary(invoiceData, formatInfo.format, options);
  } catch (error) {
    // Fallback to simple XML generation if library fails
    console.warn('E-invoice library failed, using fallback generator:', error);
    data = generateSimpleXML(invoiceData, formatInfo.format);
  }

  // Generate filename
  const filename = generateEInvoiceFilename(ctx, formatInfo.format, formatInfo.fileExtension);

  return {
    format: formatInfo,
    data,
    filename,
    validation
  };
}

/**
 * Generate e-invoice using @e-invoice-eu/core library
 */
async function generateWithLibrary(
  invoiceData: EInvoiceData,
  format: EInvoiceFormat,
  options: GenerateOptions
): Promise<Buffer> {
  // Try to import and use @e-invoice-eu/core
  try {
    const { InvoiceService } = await import('@e-invoice-eu/core');

    const invoiceService = new InvoiceService(console);

    // Map format to library format names (covers European formats, others fallback to UBL)
    const formatMapping: Partial<Record<EInvoiceFormat, string>> = {
      'xrechnung': 'XRechnung-UBL',
      'zugferd': 'Factur-X-Extended',
      'cius-ro': 'UBL',
      'ubl': 'UBL',
      'factur-x': 'Factur-X-Extended',
      'fatturapa': 'FatturaPA',
      'facturae': 'Facturae',
      'peppol-bis': 'PEPPOL-BIS',
      'nlcius': 'NLCIUS',
      'ehf': 'EHF',
      'oioubl': 'OIOUBL',
      'finvoice': 'Finvoice',
      'ebinterface': 'ebInterface',
      'isdoc': 'ISDOC',
      'ksef': 'KSeF',
      'sefaktura': 'UBL'
    };

    const libraryData = mapToLibraryFormat(invoiceData);
    const targetFormat = formatMapping[format] || 'UBL';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await invoiceService.generate(libraryData as any, {
      format: targetFormat,
      lang: 'en'  // Default language for validation messages
    } as any);

    // Handle different result types from the library
    if (result instanceof Uint8Array) {
      return Buffer.from(result);
    }
    if (typeof result === 'string') {
      return Buffer.from(result, 'utf-8');
    }
    if (result && typeof result === 'object' && 'data' in result) {
      const data = (result as { data: Uint8Array | string }).data;
      if (data instanceof Uint8Array) {
        return Buffer.from(data);
      }
      return Buffer.from(data as string, 'utf-8');
    }

    throw new Error('Unexpected result format from e-invoice library');
  } catch (error) {
    // Re-throw to allow fallback handling
    throw error;
  }
}

/**
 * Map our EInvoiceData to the library's expected UBL format
 * The library expects XML namespace prefixes (cbc:, cac:) in JSON keys
 */
function mapToLibraryFormat(data: EInvoiceData): Record<string, unknown> {
  const invoice: Record<string, unknown> = {
    'cbc:ID': data['BT-1'],
    'cbc:IssueDate': data['BT-2'],
    'cbc:InvoiceTypeCode': data['BT-3'],
    'cbc:DocumentCurrencyCode': data['BT-5'],

    'cac:AccountingSupplierParty': {
      'cac:Party': {
        'cbc:EndpointID': data['BT-34'],
        'cbc:EndpointID@schemeID': 'EM',
        'cac:PartyName': {
          'cbc:Name': data['BT-27']
        },
        'cac:PostalAddress': {
          'cbc:StreetName': data['BT-35'],
          'cbc:CityName': data['BT-37'],
          'cac:Country': {
            'cbc:IdentificationCode': data['BT-40']
          }
        },
        'cac:PartyTaxScheme': data['BT-31'] ? [{
          'cbc:CompanyID': data['BT-31'],
          'cac:TaxScheme': {
            'cbc:ID': 'VAT'
          }
        }] : undefined,
        'cac:PartyLegalEntity': {
          'cbc:RegistrationName': data['BT-27'],
          'cbc:CompanyID': data['BT-32']
        }
      }
    },

    'cac:AccountingCustomerParty': {
      'cac:Party': {
        ...(data['BT-49'] ? {
          'cbc:EndpointID': data['BT-49'],
          'cbc:EndpointID@schemeID': 'EM'
        } : {}),
        'cac:PartyName': {
          'cbc:Name': data['BT-44']
        },
        'cac:PostalAddress': {
          'cbc:StreetName': data['BT-50'],
          'cbc:CityName': data['BT-52'],
          'cac:Country': {
            'cbc:IdentificationCode': data['BT-55']
          }
        },
        'cac:PartyLegalEntity': {
          'cbc:RegistrationName': data['BT-44']
        }
      }
    },

    'cac:TaxTotal': [{
      'cbc:TaxAmount': data['BT-110'],
      'cbc:TaxAmount@currencyID': data['BT-5'],
      'cac:TaxSubtotal': data.vatBreakdown.map(vat => ({
        'cbc:TaxableAmount': vat['BT-116'],
        'cbc:TaxableAmount@currencyID': data['BT-5'],
        'cbc:TaxAmount': vat['BT-117'],
        'cbc:TaxAmount@currencyID': data['BT-5'],
        'cac:TaxCategory': {
          'cbc:ID': vat['BT-118'],
          'cbc:Percent': vat['BT-119'],
          'cac:TaxScheme': {
            'cbc:ID': 'VAT'
          }
        }
      }))
    }],

    'cac:LegalMonetaryTotal': {
      'cbc:LineExtensionAmount': data['BT-106'],
      'cbc:LineExtensionAmount@currencyID': data['BT-5'],
      'cbc:TaxExclusiveAmount': data['BT-109'],
      'cbc:TaxExclusiveAmount@currencyID': data['BT-5'],
      'cbc:TaxInclusiveAmount': data['BT-112'],
      'cbc:TaxInclusiveAmount@currencyID': data['BT-5'],
      'cbc:PayableAmount': data['BT-115'],
      'cbc:PayableAmount@currencyID': data['BT-5']
    },

    'cac:InvoiceLine': data.lines.map(line => ({
      'cbc:ID': line['BT-126'],
      'cbc:InvoicedQuantity': line['BT-129'],
      'cbc:InvoicedQuantity@unitCode': line['BT-130'],
      'cbc:LineExtensionAmount': line['BT-131'],
      'cbc:LineExtensionAmount@currencyID': data['BT-5'],
      'cac:Item': {
        'cbc:Name': line['BT-153'],
        'cac:ClassifiedTaxCategory': {
          'cbc:ID': line['BT-151'],
          'cbc:Percent': line['BT-152'],
          'cac:TaxScheme': {
            'cbc:ID': 'VAT'
          }
        }
      },
      'cac:Price': {
        'cbc:PriceAmount': line['BT-146'],
        'cbc:PriceAmount@currencyID': data['BT-5']
      }
    }))
  };

  // Add optional fields
  if (data['BT-9']) {
    invoice['cbc:DueDate'] = data['BT-9'];
  }
  if (data['BT-10']) {
    invoice['cbc:BuyerReference'] = data['BT-10'];
  }
  if (data['BT-84']) {
    invoice['cac:PaymentMeans'] = [{
      'cbc:PaymentMeansCode': data['BT-81'],
      'cac:PayeeFinancialAccount': {
        'cbc:ID': data['BT-84'],
        ...(data['BT-83'] ? { 'cbc:Name': data['BT-83'] } : {}),
        ...(data['BT-86'] ? {
          'cac:FinancialInstitutionBranch': {
            'cbc:ID': data['BT-86']
          }
        } : {})
      }
    }];
  }

  return {
    'ubl:Invoice': invoice
  };
}

/**
 * Generate a simple UBL XML as fallback
 */
function generateSimpleXML(data: EInvoiceData, format: EInvoiceFormat): Buffer {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017</cbc:CustomizationID>
  <cbc:ID>${escapeXml(data['BT-1'])}</cbc:ID>
  <cbc:IssueDate>${escapeXml(data['BT-2'])}</cbc:IssueDate>
  ${data['BT-9'] ? `<cbc:DueDate>${escapeXml(data['BT-9'])}</cbc:DueDate>` : ''}
  <cbc:InvoiceTypeCode>${escapeXml(data['BT-3'])}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${escapeXml(data['BT-5'])}</cbc:DocumentCurrencyCode>
  ${data['BT-10'] ? `<cbc:BuyerReference>${escapeXml(data['BT-10'])}</cbc:BuyerReference>` : ''}

  <cac:AccountingSupplierParty>
    <cac:Party>
      <cbc:EndpointID schemeID="EM">${escapeXml(data['BT-34'])}</cbc:EndpointID>
      <cac:PartyName>
        <cbc:Name>${escapeXml(data['BT-27'])}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(data['BT-35'])}</cbc:StreetName>
        <cbc:CityName>${escapeXml(data['BT-37'])}</cbc:CityName>
        <cac:Country>
          <cbc:IdentificationCode>${escapeXml(data['BT-40'])}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      ${data['BT-31'] ? `<cac:PartyTaxScheme>
        <cbc:CompanyID>${escapeXml(data['BT-31'])}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>` : ''}
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(data['BT-27'])}</cbc:RegistrationName>
        ${data['BT-32'] ? `<cbc:CompanyID>${escapeXml(data['BT-32'])}</cbc:CompanyID>` : ''}
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <cac:AccountingCustomerParty>
    <cac:Party>
      ${data['BT-49'] ? `<cbc:EndpointID schemeID="EM">${escapeXml(data['BT-49'])}</cbc:EndpointID>` : ''}
      <cac:PartyName>
        <cbc:Name>${escapeXml(data['BT-44'])}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(data['BT-50'])}</cbc:StreetName>
        <cbc:CityName>${escapeXml(data['BT-52'])}</cbc:CityName>
        <cac:Country>
          <cbc:IdentificationCode>${escapeXml(data['BT-55'])}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(data['BT-44'])}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>

  ${data['BT-84'] ? `<cac:PaymentMeans>
    <cbc:PaymentMeansCode>${escapeXml(data['BT-81'])}</cbc:PaymentMeansCode>
    <cac:PayeeFinancialAccount>
      <cbc:ID>${escapeXml(data['BT-84'])}</cbc:ID>
      ${data['BT-83'] ? `<cbc:Name>${escapeXml(data['BT-83'])}</cbc:Name>` : ''}
      ${data['BT-86'] ? `<cac:FinancialInstitutionBranch>
        <cbc:ID>${escapeXml(data['BT-86'])}</cbc:ID>
      </cac:FinancialInstitutionBranch>` : ''}
    </cac:PayeeFinancialAccount>
  </cac:PaymentMeans>` : ''}

  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${escapeXml(data['BT-5'])}">${data['BT-110'].toFixed(2)}</cbc:TaxAmount>
    ${data.vatBreakdown.map(vat => `<cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${escapeXml(data['BT-5'])}">${vat['BT-116'].toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${escapeXml(data['BT-5'])}">${vat['BT-117'].toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>${escapeXml(vat['BT-118'])}</cbc:ID>
        <cbc:Percent>${vat['BT-119']}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`).join('\n    ')}
  </cac:TaxTotal>

  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${escapeXml(data['BT-5'])}">${data['BT-106'].toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${escapeXml(data['BT-5'])}">${data['BT-109'].toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${escapeXml(data['BT-5'])}">${data['BT-112'].toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${escapeXml(data['BT-5'])}">${data['BT-115'].toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

  ${data.lines.map(line => `<cac:InvoiceLine>
    <cbc:ID>${escapeXml(line['BT-126'])}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${escapeXml(line['BT-130'])}">${line['BT-129']}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${escapeXml(data['BT-5'])}">${line['BT-131'].toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${escapeXml(line['BT-153'])}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>${escapeXml(line['BT-151'])}</cbc:ID>
        <cbc:Percent>${line['BT-152']}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${escapeXml(data['BT-5'])}">${line['BT-146'].toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`).join('\n  ')}
</Invoice>`;

  return Buffer.from(xml, 'utf-8');
}

/**
 * Escape special XML characters
 */
function escapeXml(str: string | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Save e-invoice to file
 */
export async function saveEInvoice(
  result: EInvoiceResult,
  outputDir: string
): Promise<string> {
  const outputPath = path.join(outputDir, result.filename);
  await fs.promises.writeFile(outputPath, result.data);
  return outputPath;
}
