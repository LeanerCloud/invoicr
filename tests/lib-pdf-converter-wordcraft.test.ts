import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as net from 'net';
import * as os from 'os';
import * as path from 'path';

const state = vi.hoisted(() => ({ home: '', spawn: null as null | ((args: string[]) => unknown) }));

// The real app must never launch and the real key dir must never be read
vi.mock('child_process', () => ({
  spawn: (_bin: string, args: string[]) => state.spawn!(args),
  execFileSync: vi.fn(() => { throw new Error('soffice must not run'); })
}));
vi.mock('os', async importOriginal => ({
  ...(await importOriginal<typeof import('os')>()),
  homedir: () => state.home
}));
vi.mock('fs', async importOriginal => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: (p: string) => p.endsWith('/WordCraft.app/Contents/MacOS/WordCraft') || actual.existsSync(p)
  };
});

import { convertDocxToPdf } from '../src/lib/pdf-converter.js';

class FakeChild extends EventEmitter {
  pid: number | undefined = 4242;
  kill = vi.fn((_sig?: string) => { queueMicrotask(() => this.emit('exit', null, 'SIGTERM')); return true; });
}

describe('convertDocxToPdf with WordCraft', () => {
  let tempDir: string;
  let docx: string;
  let servers: net.Server[];

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'invoicr-wc-test-'));
    state.home = tempDir;
    docx = path.join(tempDir, 'a.docx');
    fs.writeFileSync(docx, 'x');
    servers = [];
  });

  afterEach(() => {
    servers.forEach(s => s.close());
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // Fake app: writes the key file and serves the control port named in the args
  function fakeApp(child: FakeChild, exportReply: object) {
    return (args: string[]) => {
      const port = Number(args[1]);
      const dir = path.join(tempDir, 'Library', 'Application Support', 'WordCraft');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `control-key.local-${port}`), 'k\n');
      const server = net.createServer(socket => {
        socket.on('data', chunk => {
          for (const line of chunk.toString().split('\n').filter(Boolean)) {
            const req = JSON.parse(line);
            let reply: object = { ok: true };
            if (req.method === 'file.exportPdf') {
              reply = exportReply;
              if ((reply as { ok: boolean }).ok) fs.writeFileSync(req.params.path, '%PDF');
            }
            socket.write(JSON.stringify({ id: req.id, ...reply }) + '\n');
          }
        });
      });
      server.listen(port, '127.0.0.1');
      servers.push(server);
      return child;
    };
  }

  it('rejects with the wordcraft message when spawn emits error', async () => {
    const child = new FakeChild();
    child.pid = undefined;
    state.spawn = () => { queueMicrotask(() => child.emit('error', new Error('spawn EACCES'))); return child; };

    await expect(convertDocxToPdf(docx)).rejects.toThrow('PDF conversion failed (wordcraft): spawn EACCES');
  });

  it('rejects fast when the child exits before the control server is ready', async () => {
    const child = new FakeChild();
    state.spawn = () => { queueMicrotask(() => child.emit('exit', 1, null)); return child; };

    const start = Date.now();
    await expect(convertDocxToPdf(docx)).rejects.toThrow('WordCraft exited before its control server started (code 1)');
    expect(Date.now() - start).toBeLessThan(5000);
  });

  it('converts and kills the child on success', async () => {
    const child = new FakeChild();
    state.spawn = fakeApp(child, { ok: true });

    await expect(convertDocxToPdf(docx)).resolves.toBe(path.join(tempDir, 'a.pdf'));
    expect(child.kill).toHaveBeenCalledWith('SIGTERM');
  });

  it('kills the child when a control request fails', async () => {
    const child = new FakeChild();
    state.spawn = fakeApp(child, { ok: false, error: 'bad' });

    await expect(convertDocxToPdf(docx)).rejects.toThrow('WordCraft file.exportPdf failed: bad');
    expect(child.kill).toHaveBeenCalled();
  });
});
