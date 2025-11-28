import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { InvoiceContext, Translations } from './types';
import { formatCurrency } from './utils';

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

  // In test mode, send to provider's email instead of client
  const toAddresses = isTestMode ? [provider.email] : client.email?.to;
  const ccAddresses = isTestMode ? [] : client.email?.cc;

  if (!toAddresses?.length) {
    console.error('No email recipients configured in client JSON');
    return;
  }

  const totalAmountStr = formatCurrency(totalAmount, currency, emailLang);

  // Replace placeholders in email template
  let emailSubject = t.email.subject
    .replace('{{invoiceNumber}}', invoiceNumber)
    .replace('{{monthName}}', monthName)
    .replace('{{providerName}}', provider.name);

  if (isTestMode) {
    emailSubject = `[TEST] ${emailSubject}`;
  }

  const emailBody = t.email.body
    .replace('{{invoiceNumber}}', invoiceNumber)
    .replace('{{servicePeriod}}', servicePeriod)
    .replace('{{serviceDescription}}', emailServiceDescription)
    .replace('{{totalAmount}}', totalAmountStr)
    .replace(/\{\{providerName\}\}/g, provider.name);

  // Build AppleScript for Mail.app
  const toScript = toAddresses.map(e => `make new to recipient at end of to recipients with properties {address:"${e}"}`).join('\n        ');
  const ccScript = ccAddresses?.length
    ? ccAddresses.map(e => `make new cc recipient at end of cc recipients with properties {address:"${e}"}`).join('\n        ')
    : '';

  // Escape for AppleScript string (double quotes)
  const escapeAS = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  const appleScript = `tell application "Mail"
  set emailBody to "${escapeAS(emailBody.replace(/\n/g, '\r'))}"
  set newMessage to make new outgoing message with properties {subject:"${escapeAS(emailSubject)}", content:emailBody, sender:"${provider.email}"}
  tell newMessage
    ${toScript}
    ${ccScript}
    make new attachment with properties {file name:"${pdfFilePath}"} at after the last paragraph
  end tell
  activate
  set visible of newMessage to true
end tell
`;

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
