/**
 * Client routes - CRUD operations for clients and history
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ApiRequest, ApiResponse, ServerContext } from '../types.js';
import {
  getAllClients,
  getClientInfo,
  createClient,
  saveClient,
  loadHistory
} from '../../lib/index.js';
import type { Client } from '../../types.js';

export function getClients(ctx: ServerContext) {
  return async (req: ApiRequest, res: ApiResponse): Promise<void> => {
    const { persona } = req.params!;
    const paths = ctx.getPersonaPaths(persona);
    const clients = getAllClients(paths.clients);
    res.json(clients.map(info => ({
      name: info.name,
      displayName: info.client.name,
      invoicePrefix: info.client.invoicePrefix,
      nextInvoiceNumber: info.client.nextInvoiceNumber,
      language: info.client.language,
      currency: info.client.service.currency,
      countryCode: info.client.countryCode,
      hasHistory: fs.existsSync(path.join(info.directory, 'history.json'))
    })));
  };
}

export function createNewClient(ctx: ServerContext) {
  return async (req: ApiRequest, res: ApiResponse): Promise<void> => {
    const { persona } = req.params!;
    const paths = ctx.getPersonaPaths(persona);
    const { directoryName, ...clientData } = req.body;
    if (!directoryName) {
      res.error('directoryName is required', 400);
      return;
    }

    const clientPath = createClient(paths.clients, directoryName, clientData as Client);
    res.json({ success: true, name: directoryName, path: clientPath }, 201);
  };
}

export function getClient(ctx: ServerContext) {
  return async (req: ApiRequest, res: ApiResponse): Promise<void> => {
    const { persona, name } = req.params!;
    const paths = ctx.getPersonaPaths(persona);
    const info = getClientInfo(paths.clients, name);

    if (!info) {
      res.error(`Client '${name}' not found`, 404);
      return;
    }

    res.json({
      name: info.name,
      directory: info.directory,
      configPath: info.configPath,
      client: info.client
    });
  };
}

export function updateClient(ctx: ServerContext) {
  return async (req: ApiRequest, res: ApiResponse): Promise<void> => {
    const { persona, name } = req.params!;
    const paths = ctx.getPersonaPaths(persona);
    const info = getClientInfo(paths.clients, name);

    if (!info) {
      res.error(`Client '${name}' not found`, 404);
      return;
    }

    const client = req.body as Client;
    saveClient(client, info.configPath);
    res.json({ success: true, client });
  };
}

export function deleteClient(ctx: ServerContext) {
  return async (req: ApiRequest, res: ApiResponse): Promise<void> => {
    const { persona, name } = req.params!;
    const paths = ctx.getPersonaPaths(persona);
    const info = getClientInfo(paths.clients, name);

    if (!info) {
      res.error(`Client '${name}' not found`, 404);
      return;
    }

    // Remove client directory
    fs.rmSync(info.directory, { recursive: true, force: true });
    res.json({ success: true, deleted: name });
  };
}

export function getClientHistory(ctx: ServerContext) {
  return async (req: ApiRequest, res: ApiResponse): Promise<void> => {
    const { persona, name } = req.params!;
    const paths = ctx.getPersonaPaths(persona);
    const info = getClientInfo(paths.clients, name);

    if (!info) {
      res.error(`Client '${name}' not found`, 404);
      return;
    }

    const history = loadHistory(info.directory);
    res.json(history);
  };
}
