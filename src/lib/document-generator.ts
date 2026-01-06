/**
 * Document Generator
 * Generates DOCX and PDF invoices using docxtemplater templates
 */
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { InvoiceContext } from '../types.js';
import {
  generateInvoiceFromTemplate,
  getBuiltInTemplates,
} from './template-generator.js';

export interface GeneratedDocument {
  docxPath: string;
  docxBuffer: Buffer;
}

export interface GeneratedPDF extends GeneratedDocument {
  pdfPath: string;
}

export interface GenerateOptions {
  /** Template name (default, minimal, detailed, or custom) */
  template?: string;
  /** Persona directory for custom templates */
  personaDir?: string;
}

/** Built-in template names for backwards compatibility */
export type TemplateName = 'default' | 'minimal' | 'detailed';

/**
 * Generate a DOCX document from invoice context using docxtemplater
 */
export async function generateDocx(
  ctx: InvoiceContext,
  outputDir: string,
  options: GenerateOptions | string = 'default'
): Promise<GeneratedDocument> {
  // Handle legacy call with just template name
  const opts: GenerateOptions = typeof options === 'string'
    ? { template: options }
    : options;

  const templateName = opts.template || 'default';

  // Generate DOCX using docxtemplater
  const buffer = await generateInvoiceFromTemplate(ctx, templateName, opts.personaDir);

  // Generate filename
  const monthStr = ctx.monthName.replace(' ', '_');
  const baseFilename = `${ctx.translations.filePrefix}_${ctx.invoiceNumber}_${monthStr}`;
  const docxPath = path.join(outputDir, `${baseFilename}.docx`);

  // Write file
  fs.writeFileSync(docxPath, buffer);

  return {
    docxPath,
    docxBuffer: buffer
  };
}

/**
 * Convert DOCX to PDF using LibreOffice
 */
export function convertToPdf(docxPath: string): string {
  const outputDir = path.dirname(docxPath);
  const baseName = path.basename(docxPath, '.docx');
  const pdfPath = path.join(outputDir, `${baseName}.pdf`);

  try {
    execSync(
      `soffice --headless --convert-to pdf --outdir "${outputDir}" "${docxPath}"`,
      { stdio: 'pipe' }
    );

    if (!fs.existsSync(pdfPath)) {
      throw new Error('PDF file was not created');
    }

    return pdfPath;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(
      `PDF conversion failed: ${message}\n` +
      'Make sure LibreOffice is installed:\n' +
      '  macOS: brew install --cask libreoffice\n' +
      '  Linux: sudo apt install libreoffice\n' +
      '  Windows: https://www.libreoffice.org/download/'
    );
  }
}

/**
 * Generate both DOCX and PDF
 */
export async function generateDocuments(
  ctx: InvoiceContext,
  outputDir: string,
  options: GenerateOptions | string = 'default'
): Promise<GeneratedPDF> {
  // Handle legacy call with just template name
  const opts: GenerateOptions = typeof options === 'string'
    ? { template: options }
    : options;

  // Generate DOCX
  const { docxPath, docxBuffer } = await generateDocx(ctx, outputDir, opts);

  // Convert to PDF
  const pdfPath = convertToPdf(docxPath);

  return {
    docxPath,
    docxBuffer,
    pdfPath
  };
}

/**
 * Check if LibreOffice is available
 */
export function isLibreOfficeAvailable(): boolean {
  try {
    execSync('which soffice', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get LibreOffice version if available
 */
export function getLibreOfficeVersion(): string | null {
  try {
    const output = execSync('soffice --version', { encoding: 'utf8' });
    return output.trim();
  } catch {
    return null;
  }
}

/**
 * Generate output paths for invoice
 */
export function generateOutputPaths(
  ctx: InvoiceContext,
  outputDir: string
): { docxPath: string; pdfPath: string } {
  const monthStr = ctx.monthName.replace(' ', '_');
  const baseFilename = `${ctx.translations.filePrefix}_${ctx.invoiceNumber}_${monthStr}`;

  return {
    docxPath: path.join(outputDir, `${baseFilename}.docx`),
    pdfPath: path.join(outputDir, `${baseFilename}.pdf`)
  };
}

/**
 * Get list of available built-in templates
 */
export function getAvailableTemplates(): string[] {
  return getBuiltInTemplates();
}
