/**
 * API Server Types
 *
 * Type definitions for the Invoicr API Server
 */

import * as http from 'http';

export interface ApiRequest extends http.IncomingMessage {
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

export interface ApiResponse extends http.ServerResponse {
  json: (data: any, status?: number) => void;
  error: (message: string, status?: number, details?: any) => void;
}

export type RouteHandler = (req: ApiRequest, res: ApiResponse) => Promise<void>;

export interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

export interface PersonaInfo {
  name: string;
  directory: string;
  hasProvider: boolean;
  clientCount: number;
}

export interface ServerContext {
  basePath: string;
  getPersonaPaths: (personaName: string) => import('../lib/index.js').ConfigPaths;
  listPersonas: () => PersonaInfo[];
}

// CORS headers for all responses
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

export const DEFAULT_PORT = 3847;
