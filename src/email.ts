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
  pdfFilePath: string
): string {
  return `tell application "Mail"
  set emailBody to "${escapeAppleScript(emailBody.replace(/\n/g, '\r'))}"
  set newMessage to make new outgoing message with properties {subject:"${escapeAppleScript(emailSubject)}", content:emailBody, sender:"${senderEmail}"}
  tell newMessage
    ${toScript}
    ${ccScript}
    make new attachment with properties {file name:"${pdfFilePath}"} at after the last paragraph
  end tell
  activate
  set visible of newMessage to true
end tell
`;
}

/**
 * Create email draft in Mail.app with invoice attached
 */
export function createEmail(
  ctx: InvoiceContext,
  pdfFilePath: string,
  isTestMode: boolean
): void {
  const { provider, client, invoiceNumber, servicePeriod, monthName, emailServiceDescription, totalAmount, currency, lang } = ctx;

  // Use emailLanguage if specified, otherwise fall back to invoice language
  const emailLang = client.emailLanguage || lang;
  const translationsPath = path.join(__dirname, 'translations', `${emailLang}.json`);
  const emailTranslations: Translations = JSON.parse(fs.readFileSync(translationsPath, 'utf8'));
  const t = emailTranslations;

  // Get recipients based on test mode
  const { to: toAddresses, cc: ccAddresses } = getRecipients(ctx, isTestMode);

  if (!toAddresses?.length) {
    console.error('No email recipients configured in client JSON');
    return;
  }

  const totalAmountStr = formatCurrency(totalAmount, currency, emailLang);

  // Build email content
  const emailSubject = buildEmailSubject(
    t.email.subject,
    invoiceNumber,
    monthName,
    provider.name,
    isTestMode
  );

  const emailBody = buildEmailBody(
    t.email.body,
    invoiceNumber,
    servicePeriod,
    emailServiceDescription,
    totalAmountStr,
    provider.name
  );

  // Build AppleScript recipient lines
  const toScript = buildRecipientScript(toAddresses, 'to');
  const ccScript = ccAddresses?.length ? buildRecipientScript(ccAddresses, 'cc') : '';

  // Build complete AppleScript
  const appleScript = buildAppleScript(
    emailSubject,
    emailBody,
    provider.email,
    toScript,
    ccScript,
    pdfFilePath
  );

  // Write AppleScript to temp file to avoid shell escaping issues
  const tempScript = path.join(__dirname, '..', 'temp_email.scpt');
  try {
    fs.writeFileSync(tempScript, appleScript);
    execSync(`osascript "${tempScript}"`);
    fs.unlinkSync(tempScript);
    console.log(`Email draft created in Mail.app${isTestMode ? ' (TEST MODE - sent to provider)' : ''}`);
  } catch (err) {
    console.error('Failed to create email. Make sure Mail.app is configured.');
    if (fs.existsSync(tempScript)) fs.unlinkSync(tempScript);
  }
}
