import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as net from 'net';
import * as os from 'os';
import * as path from 'path';
import { runWordCraftControl, convertDocxToPdf } from '../src/lib/pdf-converter.js';

const KEY = 'sekrit-key-123';

describe('pdf-converter', () => {
  let tempDir: string;
  let keyPath: string;
  let server: net.Server;
  let port: number;
  let received: unknown[];
  let replyFor: (req: { method: string }) => object;

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'invoicr-pdfconv-test-'));
    keyPath = path.join(tempDir, 'control-key.local-test');
    fs.writeFileSync(keyPath, `${KEY}\n`);
    received = [];
    replyFor = () => ({ ok: true });
    server = net.createServer(socket => {
      let buf = '';
      socket.on('data', chunk => {
        buf += chunk.toString();
        let idx: number;
        while ((idx = buf.indexOf('\n')) >= 0) {
          const req = JSON.parse(buf.slice(0, idx));
          buf = buf.slice(idx + 1);
          received.push(req);
          socket.write(JSON.stringify({ id: req.id, ...replyFor(req) }) + '\n');
        }
      });
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    port = (server.address() as net.AddressInfo).port;
  });

  afterEach(async () => {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('runWordCraftControl', () => {
    it('sends open, exportPdf and close with key, incrementing ids and paths', async () => {
      await runWordCraftControl({ port, keyPath, docxPath: '/in/a.docx', pdfPath: '/in/a.pdf' });

      expect(received).toEqual([
        { key: KEY, id: 1, method: 'file.open', params: { path: '/in/a.docx' } },
        { key: KEY, id: 2, method: 'file.exportPdf', params: { path: '/in/a.pdf' } },
        { key: KEY, id: 3, method: 'file.close', params: {} }
      ]);
    });

    it('throws with the method and error when a request fails, without leaking the key', async () => {
      replyFor = req => (req.method === 'file.exportPdf' ? { ok: false, error: 'x' } : { ok: true });

      const err = await runWordCraftControl({
        port, keyPath, docxPath: '/in/a.docx', pdfPath: '/in/a.pdf'
      }).catch(e => e as Error);

      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).toBe('WordCraft file.exportPdf failed: x');
      expect((err as Error).message).not.toContain(KEY);
      expect(received).toHaveLength(2);
    });
  });

  describe('convertDocxToPdf', () => {
    it('rejects for a missing docx without starting any converter', async () => {
      await expect(convertDocxToPdf(path.join(tempDir, 'missing.docx'))).rejects.toThrow('DOCX file not found');
    });
  });
});
