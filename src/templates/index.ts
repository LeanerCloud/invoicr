import { Document } from 'docx';
import { InvoiceContext } from '../types.js';
import { buildDefaultDocument } from './default.js';
import { buildMinimalDocument } from './minimal.js';
import { buildDetailedDocument } from './detailed.js';

export type TemplateName = 'default' | 'minimal' | 'detailed';

export function buildDocument(ctx: InvoiceContext, template: TemplateName = 'default'): Document {
  switch (template) {
    case 'minimal':
      return buildMinimalDocument(ctx);
    case 'detailed':
      return buildDetailedDocument(ctx);
    case 'default':
    default:
      return buildDefaultDocument(ctx);
  }
}

export { buildDefaultDocument, buildMinimalDocument, buildDetailedDocument };
