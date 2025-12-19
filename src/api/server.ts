/**
 * Invoicr API Server
 *
 * HTTP server that exposes the invoicr core library for GUI applications.
 * This server is designed to run as a sidecar process for the Tauri desktop app.
 */

import * as http from 'http';
import * as url from 'url';
import * as path from 'path';
import * as fs from 'fs';

import { getDefaultPaths, type ConfigPaths } from '../lib/index.js';
import type { ApiRequest, ApiResponse, Route, PersonaInfo, ServerContext } from './types.js';
import { CORS_HEADERS, DEFAULT_PORT } from './types.js';
import { getRouteDefinitions } from './routes/index.js';

export class InvoicrApiServer {
  private server: http.Server;
  private routes: Route[] = [];
  private basePath: string;

  constructor(basePath?: string) {
    this.basePath = basePath || process.cwd();
    this.server = http.createServer(this.handleRequest.bind(this));
    this.registerRoutes();
  }

  /**
   * Get paths for a specific persona
   */
  private getPersonaPaths(personaName: string): ConfigPaths {
    const personaDir = path.join(this.basePath, personaName);
    return getDefaultPaths(personaDir);
  }

  /**
   * List all personas in the base directory
   */
  private listPersonas(): PersonaInfo[] {
    if (!fs.existsSync(this.basePath)) {
      return [];
    }

    const entries = fs.readdirSync(this.basePath, { withFileTypes: true });
    const personas: PersonaInfo[] = [];

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const personaDir = path.join(this.basePath, entry.name);
        const providerPath = path.join(personaDir, 'provider.json');
        const clientsDir = path.join(personaDir, 'clients');

        let clientCount = 0;
        if (fs.existsSync(clientsDir)) {
          const clientEntries = fs.readdirSync(clientsDir, { withFileTypes: true });
          clientCount = clientEntries.filter(e => e.isDirectory()).length;
        }

        personas.push({
          name: entry.name,
          directory: personaDir,
          hasProvider: fs.existsSync(providerPath),
          clientCount
        });
      }
    }

    return personas;
  }

  /**
   * Create server context for route handlers
   */
  private createContext(): ServerContext {
    return {
      basePath: this.basePath,
      getPersonaPaths: this.getPersonaPaths.bind(this),
      listPersonas: this.listPersonas.bind(this)
    };
  }

  private registerRoutes(): void {
    const ctx = this.createContext();
    const definitions = getRouteDefinitions(ctx);

    for (const def of definitions) {
      this.route(def.method, def.path, def.handler);
    }
  }

  private route(method: string, routePath: string, handler: (req: ApiRequest, res: ApiResponse) => Promise<void>): void {
    const paramNames: string[] = [];
    const pattern = routePath.replace(/:(\w+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    this.routes.push({
      method,
      pattern: new RegExp(`^${pattern}$`),
      paramNames,
      handler
    });
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const apiReq = req as ApiRequest;
    const apiRes = res as ApiResponse;

    // Add helper methods to response
    apiRes.json = (data: any, status = 200) => {
      res.writeHead(status, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };

    apiRes.error = (message: string, status = 500, details?: any) => {
      res.writeHead(status, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: message, details }));
    };

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS_HEADERS);
      res.end();
      return;
    }

    // Parse URL
    const parsedUrl = url.parse(req.url || '/', true);
    const pathname = parsedUrl.pathname || '/';
    apiReq.query = parsedUrl.query as Record<string, string>;

    // Find matching route
    const route = this.routes.find(r =>
      r.method === req.method && r.pattern.test(pathname)
    );

    if (!route) {
      apiRes.error('Not found', 404);
      return;
    }

    // Extract route params
    const match = pathname.match(route.pattern);
    if (match) {
      apiReq.params = {};
      route.paramNames.forEach((name, i) => {
        apiReq.params![name] = decodeURIComponent(match[i + 1]);
      });
    }

    // Parse request body for POST/PUT
    if (req.method === 'POST' || req.method === 'PUT') {
      try {
        apiReq.body = await this.parseBody(req);
      } catch (err) {
        apiRes.error('Invalid JSON body', 400);
        return;
      }
    }

    // Execute handler
    try {
      await route.handler(apiReq, apiRes);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      console.error(`Error handling ${req.method} ${pathname}:`, err);
      apiRes.error(message, 500);
    }
  }

  private parseBody(req: http.IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        if (!body) {
          resolve({});
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(err);
        }
      });
      req.on('error', reject);
    });
  }

  // === Server Control ===

  start(port: number = DEFAULT_PORT): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          reject(new Error(`Port ${port} is already in use`));
        } else {
          reject(err);
        }
      });

      this.server.listen(port, () => {
        console.log(`Invoicr API server running at http://localhost:${port}`);
        console.log(`Base path: ${this.basePath}`);
        resolve();
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log('Invoicr API server stopped');
        resolve();
      });
    });
  }
}
