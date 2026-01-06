/**
 * Email Grouper Utility
 * Groups clients by their email recipient for batch email sending
 */

import { Client } from '../types.js';
import { ClientInfo } from './config-manager.js';

/**
 * Extract the primary email address from a client's email config
 * Normalizes the email by extracting just the email address if it's in "Name <email>" format
 */
export function getPrimaryEmail(client: Client): string | null {
  if (!client.email?.to?.length) {
    return null;
  }

  const firstRecipient = client.email.to[0];

  // Handle "Name <email@example.com>" format
  const emailMatch = firstRecipient.match(/<([^>]+)>/);
  if (emailMatch) {
    return emailMatch[1].toLowerCase().trim();
  }

  // Plain email address
  return firstRecipient.toLowerCase().trim();
}

/**
 * Group clients by their primary email recipient
 * Returns a Map where keys are normalized email addresses and values are arrays of ClientInfo
 */
export function groupClientsByEmail(clients: ClientInfo[]): Map<string, ClientInfo[]> {
  const groups = new Map<string, ClientInfo[]>();

  for (const clientInfo of clients) {
    const email = getPrimaryEmail(clientInfo.client);

    if (!email) {
      continue; // Skip clients without email config
    }

    const existing = groups.get(email) || [];
    existing.push(clientInfo);
    groups.set(email, existing);
  }

  return groups;
}

/**
 * Information about a generated invoice for batch emailing
 */
export interface GeneratedInvoiceInfo {
  clientName: string;
  clientDisplayName: string;
  invoiceNumber: string;
  monthName: string;
  totalAmount: number;
  currency: string;
  pdfPath: string;
  eInvoicePath?: string;
}

/**
 * Group generated invoices by their client's primary email
 */
export function groupInvoicesByEmail(
  invoices: GeneratedInvoiceInfo[],
  clients: ClientInfo[]
): Map<string, GeneratedInvoiceInfo[]> {
  // Build a map of client name to ClientInfo
  const clientMap = new Map<string, ClientInfo>();
  for (const clientInfo of clients) {
    clientMap.set(clientInfo.name, clientInfo);
  }

  // Group invoices by email
  const groups = new Map<string, GeneratedInvoiceInfo[]>();

  for (const invoice of invoices) {
    const clientInfo = clientMap.get(invoice.clientName);
    if (!clientInfo) {
      continue;
    }

    const email = getPrimaryEmail(clientInfo.client);
    if (!email) {
      continue;
    }

    const existing = groups.get(email) || [];
    existing.push(invoice);
    groups.set(email, existing);
  }

  return groups;
}

/**
 * Check if any clients share the same email address
 */
export function hasSharedEmails(clients: ClientInfo[]): boolean {
  const groups = groupClientsByEmail(clients);

  for (const [, clientList] of groups) {
    if (clientList.length > 1) {
      return true;
    }
  }

  return false;
}

/**
 * Get clients that share emails with other clients
 */
export function getClientsWithSharedEmails(clients: ClientInfo[]): ClientInfo[] {
  const groups = groupClientsByEmail(clients);
  const sharedClients: ClientInfo[] = [];

  for (const [, clientList] of groups) {
    if (clientList.length > 1) {
      sharedClients.push(...clientList);
    }
  }

  return sharedClients;
}
