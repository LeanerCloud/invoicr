/**
 * Document Generator
 * Generates DOCX and PDF invoices using docxtemplater templates
 */
import * as fs from 'fs';
import * as path from 'path';
import { InvoiceContext } from '../types.js';
import {
  generateInvoiceFromTemplate,
  getBuiltInTemplates,
} from './template-generator.js';
import { sanitizeFilenamePart } from '../utils.js';
import { convertDocxToPdf } from './pdf-converter.js';

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
  const monthStr = ctx.filenameSuffix ? sanitizeFilenamePart(ctx.filenameSuffix) : sanitizeFilenamePart(ctx.monthName);
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
 * Convert DOCX to PDF using WordCraft or LibreOffice
 */
export async function convertToPdf(docxPath: string): Promise<string> {
  return convertDocxToPdf(docxPath);
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
  const pdfPath = await convertToPdf(docxPath);

  return {
    docxPath,
    docxBuffer,
    pdfPath
  };
}

/**
 * Generate output paths for invoice
 */
export function generateOutputPaths(
  ctx: InvoiceContext,
  outputDir: string
): { docxPath: string; pdfPath: string } {
  const monthStr = ctx.filenameSuffix ? sanitizeFilenamePart(ctx.filenameSuffix) : sanitizeFilenamePart(ctx.monthName);
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
