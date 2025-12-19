/**
 * Invoice routes - preview and generate invoices
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ApiRequest, ApiResponse, ServerContext } from '../types.js';
import {
  loadProvider,
  getClientInfo,
  buildInvoiceContext,
  generateDocx,
  generateDocuments,
  isLibreOfficeAvailable,
  addHistoryEntry,
  parseMonthArg,
  getDefaultBillingMonth,
  saveClient,
  type BuildInvoiceOptions
} from '../../lib/index.js';
import {
  canGenerateEInvoice,
  getFormatsForTransaction,
  generateEInvoice
} from '../../einvoice/index.js';
import type { EInvoiceFormat } from '../../types.js';
import { loadTranslations } from '../helpers/translations.js';

export function previewInvoice(ctx: ServerContext) {
  return async (req: ApiRequest, res: ApiResponse): Promise<void> => {
    const { persona } = req.params!;
    const paths = ctx.getPersonaPaths(persona);
    const { clientName, quantity, month } = req.body;

    if (!clientName) {
      res.error('clientName is required', 400);
      return;
    }

    // Load configs
    const provider = loadProvider(paths.provider);
    const clientInfo = getClientInfo(paths.clients, clientName);

    if (!clientInfo) {
      res.error(`Client '${clientName}' not found`, 404);
      return;
    }

    const translations = loadTranslations(clientInfo.client.language);

    // Build invoice context
    const billingMonth = month ? parseMonthArg(month) : getDefaultBillingMonth();
    const options: BuildInvoiceOptions = {
      quantity: quantity || 0,
      billingMonth
    };

    const context = buildInvoiceContext(provider, clientInfo.client, translations, options);

    // Only show e-invoice formats when provider and client countries match
    const eInvoiceFormats = getFormatsForTransaction(
      provider.countryCode,
      clientInfo.client.countryCode
    );

    res.json({
      context,
      canGenerateEInvoice: eInvoiceFormats.length > 0,
      availableEInvoiceFormats: eInvoiceFormats
    });
  };
}

export function generateInvoice(ctx: ServerContext) {
  return async (req: ApiRequest, res: ApiResponse): Promise<void> => {
    const { persona } = req.params!;
    const paths = ctx.getPersonaPaths(persona);
    const {
      clientName,
      quantity,
      month,
      template = 'default',
      generatePdf = true,
      generateEInvoice: shouldGenerateEInvoice = false,
      eInvoiceFormat
    } = req.body;

    if (!clientName) {
      res.error('clientName is required', 400);
      return;
    }

    if (!quantity || quantity <= 0) {
      res.error('quantity must be a positive number', 400);
      return;
    }

    // Load configs
    const provider = loadProvider(paths.provider);
    const clientInfo = getClientInfo(paths.clients, clientName);

    if (!clientInfo) {
      res.error(`Client '${clientName}' not found`, 404);
      return;
    }

    const translations = loadTranslations(clientInfo.client.language);

    // Build invoice context
    const billingMonth = month ? parseMonthArg(month) : getDefaultBillingMonth();
    const options: BuildInvoiceOptions = {
      quantity,
      billingMonth
    };

    const context = buildInvoiceContext(provider, clientInfo.client, translations, options);

    // Generate documents
    let result: {
      docxPath: string;
      pdfPath?: string;
      eInvoicePath?: string;
      invoiceNumber: string;
      totalAmount: number;
      currency: string;
    };

    if (generatePdf && isLibreOfficeAvailable()) {
      const docs = await generateDocuments(context, clientInfo.directory, template);
      result = {
        docxPath: docs.docxPath,
        pdfPath: docs.pdfPath,
        invoiceNumber: context.invoiceNumber,
        totalAmount: context.totalAmount,
        currency: context.currency
      };
    } else {
      const doc = await generateDocx(context, clientInfo.directory, template);
      result = {
        docxPath: doc.docxPath,
        invoiceNumber: context.invoiceNumber,
        totalAmount: context.totalAmount,
        currency: context.currency
      };
    }

    // Generate e-invoice if requested
    if (shouldGenerateEInvoice &&
        provider.countryCode &&
        clientInfo.client.countryCode &&
        canGenerateEInvoice(provider.countryCode, clientInfo.client.countryCode)) {
      try {
        const format = eInvoiceFormat as EInvoiceFormat | undefined;

        const eInvoiceResult = await generateEInvoice(
          context,
          provider.countryCode,
          clientInfo.client.countryCode,
          { format }
        );

        const eInvoicePath = path.join(clientInfo.directory, eInvoiceResult.filename);
        fs.writeFileSync(eInvoicePath, eInvoiceResult.data);
        result.eInvoicePath = eInvoicePath;
      } catch (err) {
        console.error('E-invoice generation failed:', err);
        // Don't fail the whole request, just log the error
      }
    }

    // Add to history
    addHistoryEntry(clientInfo.directory, {
      invoiceNumber: context.invoiceNumber,
      date: context.invoiceDate,
      month: context.monthName,
      quantity: context.quantity,
      rate: context.rate,
      totalAmount: context.totalAmount,
      currency: context.currency
    });

    // Update client's next invoice number
    const updatedClient = {
      ...clientInfo.client,
      nextInvoiceNumber: clientInfo.client.nextInvoiceNumber + 1
    };
    saveClient(updatedClient, clientInfo.configPath);

    res.json({
      success: true,
      ...result
    });
  };
}
