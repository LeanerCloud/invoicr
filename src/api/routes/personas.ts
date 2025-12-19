/**
 * Persona routes - CRUD operations for personas
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ApiRequest, ApiResponse, ServerContext } from '../types.js';

export function getPersonas(ctx: ServerContext) {
  return async (_req: ApiRequest, res: ApiResponse): Promise<void> => {
    const personas = ctx.listPersonas();
    res.json(personas);
  };
}

export function createPersona(ctx: ServerContext) {
  return async (req: ApiRequest, res: ApiResponse): Promise<void> => {
    const { name } = req.body;

    if (!name) {
      res.error('name is required', 400);
      return;
    }

    // Validate name (no special characters except dash and underscore)
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      res.error('Persona name can only contain letters, numbers, dashes and underscores', 400);
      return;
    }

    const personaDir = path.join(ctx.basePath, name);

    if (fs.existsSync(personaDir)) {
      res.error(`Persona '${name}' already exists`, 409);
      return;
    }

    // Create persona directory structure
    fs.mkdirSync(personaDir, { recursive: true });
    fs.mkdirSync(path.join(personaDir, 'clients'), { recursive: true });

    res.json({
      success: true,
      persona: {
        name,
        directory: personaDir,
        hasProvider: false,
        clientCount: 0
      }
    }, 201);
  };
}

export function getPersona(ctx: ServerContext) {
  return async (req: ApiRequest, res: ApiResponse): Promise<void> => {
    const { persona } = req.params!;
    const personaDir = path.join(ctx.basePath, persona);

    if (!fs.existsSync(personaDir)) {
      res.error(`Persona '${persona}' not found`, 404);
      return;
    }

    const providerPath = path.join(personaDir, 'provider.json');
    const clientsDir = path.join(personaDir, 'clients');

    let clientCount = 0;
    if (fs.existsSync(clientsDir)) {
      const entries = fs.readdirSync(clientsDir, { withFileTypes: true });
      clientCount = entries.filter(e => e.isDirectory()).length;
    }

    res.json({
      name: persona,
      directory: personaDir,
      hasProvider: fs.existsSync(providerPath),
      clientCount
    });
  };
}

export function updatePersona(ctx: ServerContext) {
  return async (req: ApiRequest, res: ApiResponse): Promise<void> => {
    const { persona } = req.params!;
    const { name: newName } = req.body;

    if (!newName) {
      res.error('name is required', 400);
      return;
    }

    const oldDir = path.join(ctx.basePath, persona);
    const newDir = path.join(ctx.basePath, newName);

    if (!fs.existsSync(oldDir)) {
      res.error(`Persona '${persona}' not found`, 404);
      return;
    }

    if (persona !== newName && fs.existsSync(newDir)) {
      res.error(`Persona '${newName}' already exists`, 409);
      return;
    }

    if (persona !== newName) {
      fs.renameSync(oldDir, newDir);
    }

    res.json({
      success: true,
      persona: {
        name: newName,
        directory: newDir
      }
    });
  };
}

export function deletePersona(ctx: ServerContext) {
  return async (req: ApiRequest, res: ApiResponse): Promise<void> => {
    const { persona } = req.params!;
    const personaDir = path.join(ctx.basePath, persona);

    if (!fs.existsSync(personaDir)) {
      res.error(`Persona '${persona}' not found`, 404);
      return;
    }

    fs.rmSync(personaDir, { recursive: true, force: true });
    res.json({ success: true, deleted: persona });
  };
}
