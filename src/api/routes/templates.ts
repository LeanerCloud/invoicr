/**
 * Template routes - CRUD operations for invoice templates
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import type { ApiRequest, ApiResponse, ServerContext } from '../types.js';
import { CORS_HEADERS } from '../types.js';
import {
  listTemplates,
  getTemplatePath,
  isBuiltInTemplate,
  copyTemplateForEditing,
  deleteCustomTemplate,
  uploadCustomTemplate
} from '../../lib/template-generator.js';

export function getTemplates(ctx: ServerContext) {
  return async (req: ApiRequest, res: ApiResponse): Promise<void> => {
    const { persona } = req.params!;
    const personaDir = path.join(ctx.basePath, persona);

    if (!fs.existsSync(personaDir)) {
      res.error(`Persona '${persona}' not found`, 404);
      return;
    }

    const templates = listTemplates(personaDir);
    res.json(templates);
  };
}

export function getTemplate(ctx: ServerContext) {
  return async (req: ApiRequest, res: ApiResponse): Promise<void> => {
    const { persona, name } = req.params!;
    const personaDir = path.join(ctx.basePath, persona);

    if (!fs.existsSync(personaDir)) {
      res.error(`Persona '${persona}' not found`, 404);
      return;
    }

    // Sanitize template name
    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '');
    if (safeName !== name) {
      res.error('Invalid template name', 400);
      return;
    }

    try {
      const templatePath = getTemplatePath(safeName, personaDir);
      const buffer = fs.readFileSync(templatePath);

      res.writeHead(200, {
        ...CORS_HEADERS,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${safeName}.docx"`,
        'Content-Length': buffer.length.toString(),
      });
      res.end(buffer);
    } catch (err) {
      res.error(`Template '${safeName}' not found`, 404);
    }
  };
}

export function uploadTemplate(ctx: ServerContext) {
  return async (req: ApiRequest, res: ApiResponse): Promise<void> => {
    const { persona } = req.params!;
    const personaDir = path.join(ctx.basePath, persona);

    if (!fs.existsSync(personaDir)) {
      res.error(`Persona '${persona}' not found`, 404);
      return;
    }

    const { name, data } = req.body;

    if (!name || !data) {
      res.error('name and data (base64 encoded DOCX) are required', 400);
      return;
    }

    try {
      const buffer = Buffer.from(data, 'base64');
      const templatePath = uploadCustomTemplate(personaDir, name, buffer);
      res.json({ success: true, path: templatePath, name }, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload template';
      res.error(message, 400);
    }
  };
}

export function deleteTemplate(ctx: ServerContext) {
  return async (req: ApiRequest, res: ApiResponse): Promise<void> => {
    const { persona, name } = req.params!;
    const personaDir = path.join(ctx.basePath, persona);

    if (!fs.existsSync(personaDir)) {
      res.error(`Persona '${persona}' not found`, 404);
      return;
    }

    // Cannot delete built-in templates
    if (isBuiltInTemplate(name)) {
      res.error(`Cannot delete built-in template '${name}'`, 400);
      return;
    }

    try {
      deleteCustomTemplate(name, personaDir);
      res.json({ success: true, deleted: name });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete template';
      res.error(message, 400);
    }
  };
}

export function copyTemplate(ctx: ServerContext) {
  return async (req: ApiRequest, res: ApiResponse): Promise<void> => {
    const { persona, name } = req.params!;
    const personaDir = path.join(ctx.basePath, persona);

    if (!fs.existsSync(personaDir)) {
      res.error(`Persona '${persona}' not found`, 404);
      return;
    }

    const { newName } = req.body;

    try {
      const templatePath = copyTemplateForEditing(name, personaDir, newName);
      res.json({
        success: true,
        path: templatePath,
        name: newName || `${name}-custom`,
        message: 'Template copied for editing. Open in Word or Pages to customize.',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to copy template';
      res.error(message, 400);
    }
  };
}

export function openTemplate(ctx: ServerContext) {
  return async (req: ApiRequest, res: ApiResponse): Promise<void> => {
    const { persona, name } = req.params!;
    const personaDir = path.join(ctx.basePath, persona);

    if (!fs.existsSync(personaDir)) {
      res.error(`Persona '${persona}' not found`, 404);
      return;
    }

    try {
      const templatePath = getTemplatePath(name, personaDir);

      // Use macOS 'open' command to open in default app (Word/Pages)
      execSync(`open "${templatePath}"`);
      res.json({
        success: true,
        path: templatePath,
        message: `Template '${name}' opened in default application`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to open template';
      res.error(message, 400);
    }
  };
}
