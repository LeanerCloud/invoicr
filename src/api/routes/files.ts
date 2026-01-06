/**
 * File operation routes - open file, email invoice
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import type { ApiRequest, ApiResponse, ServerContext } from '../types.js';
import {
  loadProvider,
  getClientInfo,
  buildInvoiceContext,
  getDefaultBillingMonth,
  getPrimaryEmail
} from '../../lib/index.js';
import { createEmail, createBatchEmail, type BatchInvoiceInfo } from '../../email.js';
import { loadTranslations } from '../helpers/translations.js';

export function openFile() {
  return async (req: ApiRequest, res: ApiResponse): Promise<void> => {
    const { filePath } = req.body;

    if (!filePath) {
      res.error('filePath is required', 400);
      return;
    }

    if (!fs.existsSync(filePath)) {
      res.error('File not found', 404);
      return;
    }

    try {
      // Use macOS 'open' command to open in default app (Preview for PDF)
      execSync(`open "${filePath}"`);
      res.json({ success: true });
    } catch (err) {
      res.error('Failed to open file', 500);
    }
  };
}

export function emailInvoice(ctx: ServerContext) {
  return async (req: ApiRequest, res: ApiResponse): Promise<void> => {
    const { persona } = req.params!;
    const paths = ctx.getPersonaPaths(persona);
    const { clientName, pdfPath, eInvoicePath, testMode = false } = req.body;

    if (!clientName || !pdfPath) {
      res.error('clientName and pdfPath are required', 400);
      return;
    }

    if (!fs.existsSync(pdfPath)) {
      res.error('PDF file not found', 404);
      return;
    }

    // Build attachments array
    const attachments = [pdfPath];
    if (eInvoicePath && fs.existsSync(eInvoicePath)) {
      attachments.push(eInvoicePath);
    }

    // Load configs
    const provider = loadProvider(paths.provider);
    const clientInfo = getClientInfo(paths.clients, clientName);

    if (!clientInfo) {
      res.error(`Client '${clientName}' not found`, 404);
      return;
    }

    // Look up invoice in history to get accurate month data
    const historyPath = path.join(clientInfo.directory, 'history.json');
    let historicalInvoice: { invoiceNumber: string; month: string; quantity: number; rate: number; totalAmount: number } | undefined;

    if (fs.existsSync(historyPath)) {
      try {
        const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
        // Find invoice by pdfPath or invoice number extracted from filename
        historicalInvoice = history.invoices?.find((inv: { pdfPath?: string; invoiceNumber: string }) =>
          inv.pdfPath === pdfPath || pdfPath.includes(inv.invoiceNumber)
        );
      } catch (err) {
        // History parsing failed, continue with defaults
      }
    }

    // Build invoice context for email
    const translations = loadTranslations(clientInfo.client.language);

    // Use historical month if available, otherwise default to current
    let billingMonth: Date;
    if (historicalInvoice?.month) {
      // Parse month string like "November 2025" back to Date
      const parsedDate = new Date(historicalInvoice.month + ' 1');
      if (!isNaN(parsedDate.getTime())) {
        billingMonth = parsedDate;
      } else {
        billingMonth = getDefaultBillingMonth();
      }
    } else {
      billingMonth = getDefaultBillingMonth();
    }

    const context = buildInvoiceContext(provider, clientInfo.client, translations, {
      quantity: historicalInvoice?.quantity || 1,
      billingMonth
    });

    // Override with actual invoice data if available
    if (historicalInvoice) {
      context.invoiceNumber = historicalInvoice.invoiceNumber;
      context.monthName = historicalInvoice.month;
      context.totalAmount = historicalInvoice.totalAmount;
      context.quantity = historicalInvoice.quantity;
      context.rate = historicalInvoice.rate;
    } else {
      // Fallback to extracting invoice number from filename
      context.invoiceNumber = path.basename(pdfPath, '.pdf');
    }

    try {
      createEmail(context, attachments, testMode);
      res.json({ success: true, message: 'Email draft created in Mail.app' });
    } catch (err) {
      res.error('Failed to create email draft', 500);
    }
  };
}

/**
 * Send batch email with multiple invoices attached
 * Automatically groups invoices by recipient email if not already grouped
 */
export function batchEmailInvoices(ctx: ServerContext) {
  return async (req: ApiRequest, res: ApiResponse): Promise<void> => {
    const { persona } = req.params!;
    const paths = ctx.getPersonaPaths(persona);
    const { invoices, testMode = false } = req.body;

    if (!invoices || !Array.isArray(invoices) || invoices.length === 0) {
      res.error('invoices array is required and must not be empty', 400);
      return;
    }

    // Validate and load all invoice data
    const provider = loadProvider(paths.provider);
    const batchInfoByEmail = new Map<string, BatchInvoiceInfo[]>();

    for (const invoice of invoices) {
      const { clientName, pdfPath, eInvoicePath } = invoice;

      if (!clientName || !pdfPath) {
        res.error(`Each invoice must have clientName and pdfPath`, 400);
        return;
      }

      if (!fs.existsSync(pdfPath)) {
        res.error(`PDF file not found: ${pdfPath}`, 404);
        return;
      }

      const clientInfo = getClientInfo(paths.clients, clientName);
      if (!clientInfo) {
        res.error(`Client '${clientName}' not found`, 404);
        return;
      }

      // Get primary email for grouping
      const primaryEmail = getPrimaryEmail(clientInfo.client);
      if (!primaryEmail) {
        res.error(`Client '${clientName}' has no email configured`, 400);
        return;
      }

      // Look up invoice in history to get accurate data
      const historyPath = path.join(clientInfo.directory, 'history.json');
      let invoiceData = {
        invoiceNumber: path.basename(pdfPath, '.pdf'),
        month: '',
        totalAmount: 0,
        currency: clientInfo.client.service.currency
      };

      if (fs.existsSync(historyPath)) {
        try {
          const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
          const historicalInvoice = history.invoices?.find((inv: { pdfPath?: string; invoiceNumber: string }) =>
            inv.pdfPath === pdfPath || pdfPath.includes(inv.invoiceNumber)
          );
          if (historicalInvoice) {
            invoiceData = {
              invoiceNumber: historicalInvoice.invoiceNumber,
              month: historicalInvoice.month,
              totalAmount: historicalInvoice.totalAmount,
              currency: historicalInvoice.currency || clientInfo.client.service.currency
            };
          }
        } catch {
          // History parsing failed, use defaults
        }
      }

      const batchInfo: BatchInvoiceInfo = {
        client: clientInfo.client,
        invoiceNumber: invoiceData.invoiceNumber,
        monthName: invoiceData.month || 'Unknown',
        totalAmount: invoiceData.totalAmount,
        currency: invoiceData.currency,
        pdfPath,
        eInvoicePath: eInvoicePath && fs.existsSync(eInvoicePath) ? eInvoicePath : undefined
      };

      // Group by email
      const existing = batchInfoByEmail.get(primaryEmail) || [];
      existing.push(batchInfo);
      batchInfoByEmail.set(primaryEmail, existing);
    }

    // Send batch emails (one per unique email address)
    const results: { email: string; count: number; success: boolean }[] = [];

    for (const [email, batchInvoices] of batchInfoByEmail) {
      try {
        const success = createBatchEmail(batchInvoices, provider, testMode);
        results.push({ email, count: batchInvoices.length, success });
      } catch (err) {
        results.push({ email, count: batchInvoices.length, success: false });
      }
    }

    const allSuccess = results.every(r => r.success);
    const totalEmails = results.length;
    const totalInvoices = invoices.length;

    res.json({
      success: allSuccess,
      message: `Created ${totalEmails} email draft(s) with ${totalInvoices} invoice(s)`,
      results
    });
  };
}
