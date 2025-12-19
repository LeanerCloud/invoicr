import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { InvoiceContext, Translations, EmailTranslations } from './types.js';
import { formatCurrency } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get recipient addresses based on test mode
 */
export function getRecipients(
  ctx: InvoiceContext,
  isTestMode: boolean
): { to: string[] | undefined; cc: string[] | undefined } {
  const { provider, client } = ctx;
  const toAddresses = isTestMode ? [provider.email] : client.email?.to;
  const ccAddresses = isTestMode ? [] : client.email?.cc;
  return { to: toAddresses, cc: ccAddresses };
}

/**
 * Build email subject with placeholders replaced
 */
export function buildEmailSubject(
  template: string,
  invoiceNumber: string,
  monthName: string,
  providerName: string,
  isTestMode: boolean
): string {
  let subject = template
    .replace('{{invoiceNumber}}', invoiceNumber)
    .replace('{{monthName}}', monthName)
    .replace('{{providerName}}', providerName);

  if (isTestMode) {
    subject = `[TEST] ${subject}`;
  }
  return subject;
}

/**
 * Build email body with placeholders replaced
 */
export function buildEmailBody(
  template: string,
  invoiceNumber: string,
  servicePeriod: string,
  serviceDescription: string,
  totalAmount: string,
  providerName: string
): string {
  return template
    .replace('{{invoiceNumber}}', invoiceNumber)
    .replace('{{servicePeriod}}', servicePeriod)
    .replace('{{serviceDescription}}', serviceDescription)
    .replace('{{totalAmount}}', totalAmount)
    .replace(/\{\{providerName\}\}/g, providerName);
}

/**
 * Build AppleScript recipient lines for Mail.app
 */
export function buildRecipientScript(addresses: string[], type: 'to' | 'cc'): string {
  const recipientType = type === 'to' ? 'to recipients' : 'cc recipients';
  return addresses
    .map(e => `make new ${type} recipient at end of ${recipientType} with properties {address:"${e}"}`)
    .join('\n        ');
}

/**
 * Escape string for AppleScript (double quotes and backslashes)
 */
export function escapeAppleScript(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Build complete AppleScript for Mail.app email draft
 */
export function buildAppleScript(
  emailSubject: string,
  emailBody: string,
  senderEmail: string,
  toScript: string,
  ccScript: string,
  attachments: string[]
): string {
  const attachmentScript = attachments
    .map(filePath => `make new attachment with properties {file name:"${filePath}"} at after the last paragraph`)
    .join('\n    ');

  return `tell application "Mail"
  set emailBody to "${escapeAppleScript(emailBody.replace(/\n/g, '\r'))}"
  set newMessage to make new outgoing message with properties {subject:"${escapeAppleScript(emailSubject)}", content:emailBody, sender:"${senderEmail}"}
  tell newMessage
    ${toScript}
    ${ccScript}
    ${attachmentScript}
  end tell
  activate
  set visible of newMessage to true
end tell
`;
}

/**
 * Resolve the language to use for email (client's emailLanguage or invoice language)
 */
export function resolveEmailLanguage(client: InvoiceContext['client'], invoiceLang: string): string {
  return client.emailLanguage || invoiceLang;
}

/**
 * Load email translations for a given language
 * Checks GUI translations first (unified format), then backend translations
 */
export function loadEmailTranslations(lang: string): Translations {
  // Check GUI translations first (unified format), then backend translations
  const guiPath = path.join(__dirname, '..', 'gui', 'src', 'translations', `${lang}.json`);
  const backendPath = path.join(__dirname, 'translations', `${lang}.json`);

  let translationsPath: string | null = null;
  if (fs.existsSync(guiPath)) {
    translationsPath = guiPath;
  } else if (fs.existsSync(backendPath)) {
    translationsPath = backendPath;
  }

  if (!translationsPath) {
    throw new Error(`Translations not found for language: ${lang}`);
  }

  const data = JSON.parse(fs.readFileSync(translationsPath, 'utf8'));

  // Handle unified format: extract 'invoice' section
  if (data.invoice) {
    return data.invoice as Translations;
  }

  return data as Translations;
}

/**
 * Get email templates (subject and body) from client config or translations
 */
export function getEmailTemplates(
  client: InvoiceContext['client'],
  translations: Translations
): { subject: string; body: string } {
  return {
    subject: client.email?.subject || translations.email.subject,
    body: client.email?.body || translations.email.body
  };
}

/**
 * Prepared email data ready for sending
 */
export interface PreparedEmail {
  subject: string;
  body: string;
  senderEmail: string;
  toAddresses: string[];
  ccAddresses: string[];
  appleScript: string;
}

/**
 * Prepare all email content for sending
 * Returns null if no recipients configured
 */
export function prepareEmail(
  ctx: InvoiceContext,
  attachments: string[],
  isTestMode: boolean
): PreparedEmail | null {
  const { provider, client, invoiceNumber, servicePeriod, monthName, emailServiceDescription, totalAmount, currency, lang } = ctx;

  // Get recipients based on test mode
  const { to: toAddresses, cc: ccAddresses } = getRecipients(ctx, isTestMode);

  if (!toAddresses?.length) {
    return null;
  }

  // Resolve language and load translations
  const emailLang = resolveEmailLanguage(client, lang);
  const translations = loadEmailTranslations(emailLang);

  // Get templates
  const templates = getEmailTemplates(client, translations);

  // Format currency
  const totalAmountStr = formatCurrency(totalAmount, currency, emailLang);

  // Build email content
  const emailSubject = buildEmailSubject(
    templates.subject,
    invoiceNumber,
    monthName,
    provider.name,
    isTestMode
  );

  const emailBody = buildEmailBody(
    templates.body,
    invoiceNumber,
    servicePeriod,
    emailServiceDescription,
    totalAmountStr,
    provider.name
  );

  // Build AppleScript recipient lines
  const toScript = buildRecipientScript(toAddresses, 'to');
  const ccScript = (ccAddresses?.length) ? buildRecipientScript(ccAddresses, 'cc') : '';

  // Build complete AppleScript
  const appleScript = buildAppleScript(
    emailSubject,
    emailBody,
    provider.email,
    toScript,
    ccScript,
    attachments
  );

  return {
    subject: emailSubject,
    body: emailBody,
    senderEmail: provider.email,
    toAddresses,
    ccAddresses: ccAddresses || [],
    appleScript
  };
}

/**
 * Execute AppleScript to create email draft in Mail.app
 * This is the only OS-specific, non-testable part
 */
export function executeAppleScript(script: string): boolean {
  const tempScript = path.join(__dirname, '..', 'temp_email.scpt');
  try {
    fs.writeFileSync(tempScript, script);
    execSync(`osascript "${tempScript}"`);
    fs.unlinkSync(tempScript);
    return true;
  } catch (err) {
    if (fs.existsSync(tempScript)) fs.unlinkSync(tempScript);
    return false;
  }
}

/**
 * Create email draft in Mail.app with invoice attached
 */
export function createEmail(
  ctx: InvoiceContext,
  attachments: string[],
  isTestMode: boolean
): void {
  const prepared = prepareEmail(ctx, attachments, isTestMode);

  if (!prepared) {
    console.error('No email recipients configured in client JSON');
    return;
  }

  const success = executeAppleScript(prepared.appleScript);

  if (success) {
    console.log(`Email draft created in Mail.app${isTestMode ? ' (TEST MODE - sent to provider)' : ''}`);
  } else {
    console.error('Failed to create email. Make sure Mail.app is configured.');
  }
}
