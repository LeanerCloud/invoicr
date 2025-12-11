import { Document } from 'docx';
import { InvoiceContext } from '../types';
import { buildDefaultDocument } from './default';
import { buildMinimalDocument } from './minimal';
import { buildDetailedDocument } from './detailed';

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
