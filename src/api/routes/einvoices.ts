/**
 * E-Invoice routes - format info, validation, and generation
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ApiRequest, ApiResponse, ServerContext } from '../types.js';
import {
  loadProvider,
  getClientInfo,
  buildInvoiceContext,
  loadHistory,
  parseMonthArg,
  getDefaultBillingMonth
} from '../../lib/index.js';
import {
  getAvailableFormats,
  getFormatsForTransaction,
  canGenerateEInvoice,
  getDefaultFormat,
  getSupportedCountries,
  getCountryName,
  validateForEInvoice,
  generateEInvoice
} from '../../einvoice/index.js';
import type { CountryCode, EInvoiceFormat } from '../../types.js';
import { loadTranslations } from '../helpers/translations.js';

export function getEInvoiceFormats() {
  return async (req: ApiRequest, res: ApiResponse): Promise<void> => {
    const countryCode = req.query?.country as CountryCode | undefined;
    const providerCountry = req.query?.providerCountry as CountryCode | undefined;
    const clientCountry = req.query?.clientCountry as CountryCode | undefined;

    // If both provider and client countries are specified, return formats for the transaction
    if (providerCountry || clientCountry) {
      const formats = getFormatsForTransaction(providerCountry, clientCountry);
      const matchingCountry = providerCountry === clientCountry ? providerCountry : undefined;
      res.json({
        providerCountry,
        clientCountry,
        countriesMatch: providerCountry === clientCountry,
        country: matchingCountry,
        countryName: matchingCountry ? getCountryName(matchingCountry) : undefined,
        formats
      });
      return;
    }

    if (countryCode) {
      const formats = getAvailableFormats(countryCode);
      res.json({
        country: countryCode,
        countryName: getCountryName(countryCode),
        formats
      });
    } else {
      // Return all countries and their formats
      const countries = getSupportedCountries();
      const result = countries.map(code => ({
        country: code,
        countryName: getCountryName(code),
        formats: getAvailableFormats(code)
      }));
      res.json(result);
    }
  };
}

export function getEInvoiceCountries() {
  return async (_req: ApiRequest, res: ApiResponse): Promise<void> => {
    const countries = getSupportedCountries();
    res.json(countries.map(code => ({
      code,
      name: getCountryName(code)
    })));
  };
}

export function validateEInvoice(ctx: ServerContext) {
  return async (req: ApiRequest, res: ApiResponse): Promise<void> => {
    const { persona } = req.params!;
    const paths = ctx.getPersonaPaths(persona);
    const { clientName, format } = req.body;

    if (!clientName) {
      res.error('clientName is required', 400);
      return;
    }

    const provider = loadProvider(paths.provider);
    const clientInfo = getClientInfo(paths.clients, clientName);

    if (!clientInfo) {
      res.error(`Client '${clientName}' not found`, 404);
      return;
    }

    // Check if e-invoice is possible
    if (!provider.countryCode || !clientInfo.client.countryCode ||
        !canGenerateEInvoice(provider.countryCode, clientInfo.client.countryCode)) {
      res.json({
        valid: false,
        canGenerate: false,
        errors: ['Provider and client must be in the same supported country for e-invoice generation'],
        warnings: []
      });
      return;
    }

    // Build a sample context for validation
    const translations = loadTranslations(clientInfo.client.language);
    const context = buildInvoiceContext(provider, clientInfo.client, translations, {
      quantity: 1,
      billingMonth: getDefaultBillingMonth()
    });

    // Validate configuration
    const formatInfo = getDefaultFormat(provider.countryCode, format);
    const selectedFormat = formatInfo?.format || 'ubl';

    const validation = validateForEInvoice(
      context,
      selectedFormat,
      provider.countryCode,
      clientInfo.client.countryCode
    );

    res.json({
      valid: validation.valid,
      canGenerate: true,
      format: selectedFormat,
      errors: validation.errors,
      warnings: validation.warnings
    });
  };
}

export function generateEInvoiceDoc(ctx: ServerContext) {
  return async (req: ApiRequest, res: ApiResponse): Promise<void> => {
    const { persona } = req.params!;
    const paths = ctx.getPersonaPaths(persona);
    const { clientName, invoiceNumber, format } = req.body;

    if (!clientName || !invoiceNumber) {
      res.error('clientName and invoiceNumber are required', 400);
      return;
    }

    const provider = loadProvider(paths.provider);
    const clientInfo = getClientInfo(paths.clients, clientName);

    if (!clientInfo) {
      res.error(`Client '${clientName}' not found`, 404);
      return;
    }

    // Find invoice in history
    const history = loadHistory(clientInfo.directory);
    const invoice = history.invoices.find(i => i.invoiceNumber === invoiceNumber);

    if (!invoice) {
      res.error(`Invoice '${invoiceNumber}' not found in history`, 404);
      return;
    }

    // Validate e-invoice capability
    if (!provider.countryCode || !clientInfo.client.countryCode ||
        !canGenerateEInvoice(provider.countryCode, clientInfo.client.countryCode)) {
      res.error('E-invoice generation not available for this provider/client combination', 400);
      return;
    }

    // Build context from history
    const translations = loadTranslations(clientInfo.client.language);

    // Parse month string like "November 2024" to "11-2024" format
    const monthParts = invoice.month.split(' ');
    const monthNames: Record<string, string> = {
      'January': '1', 'February': '2', 'March': '3', 'April': '4',
      'May': '5', 'June': '6', 'July': '7', 'August': '8',
      'September': '9', 'October': '10', 'November': '11', 'December': '12'
    };
    const monthNum = monthNames[monthParts[0]] || '1';
    const billingMonth = parseMonthArg(`${monthNum}-${monthParts[1]}`);

    const context = buildInvoiceContext(provider, clientInfo.client, translations, {
      quantity: invoice.quantity,
      billingMonth
    });

    // Override with historical values
    context.invoiceNumber = invoice.invoiceNumber;
    context.invoiceDate = invoice.date;
    context.totalAmount = invoice.totalAmount;

    // Generate e-invoice
    const eInvoiceResult = await generateEInvoice(
      context,
      provider.countryCode,
      clientInfo.client.countryCode,
      { format: format as EInvoiceFormat | undefined }
    );

    const eInvoicePath = path.join(clientInfo.directory, eInvoiceResult.filename);
    fs.writeFileSync(eInvoicePath, eInvoiceResult.data);

    res.json({
      success: true,
      path: eInvoicePath,
      format: eInvoiceResult.format.format,
      fileName: eInvoiceResult.filename
    });
  };
}
