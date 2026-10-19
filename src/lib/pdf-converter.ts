/**
 * DOCX to PDF conversion via WordCraft (preferred) or LibreOffice
 */
import * as fs from 'fs';
import * as net from 'net';
import * as os from 'os';
import * as path from 'path';
import { execFileSync, spawn, type ChildProcess } from 'child_process';

export type PdfConverter = 'wordcraft' | 'libreoffice';

const WORDCRAFT_BINARY = '/Applications/WordCraft.app/Contents/MacOS/WordCraft';
const STARTUP_TIMEOUT_MS = 30_000;
const REQUEST_TIMEOUT_MS = 60_000;
const SOFFICE_PROBE_TIMEOUT_MS = 15_000;
const SOFFICE_CONVERT_TIMEOUT_MS = 120_000;
const KILL_GRACE_MS = 5_000;

export interface WordCraftControlOptions {
  port: number;
  keyPath: string;
  docxPath: string;
  pdfPath: string;
}

/**
 * Detect which PDF converter is usable. The soffice probe is time-limited
 * because a stale symlink to an uninstalled LibreOffice hangs forever.
 */
export function detectPdfConverter(): PdfConverter | null {
  if (fs.existsSync(WORDCRAFT_BINARY)) return 'wordcraft';
  try {
    execFileSync('soffice', ['--version'], { stdio: 'pipe', timeout: SOFFICE_PROBE_TIMEOUT_MS, killSignal: 'SIGKILL' });
    return 'libreoffice';
  } catch {
    return null;
  }
}

/**
 * Drive a running WordCraft control channel: open the DOCX, export the PDF, close.
 * Requests are newline-delimited JSON over one connection, one reply line each.
 */
export async function runWordCraftControl(opts: WordCraftControlOptions): Promise<void> {
  const key = fs.readFileSync(opts.keyPath, 'utf8').trim();
  const socket = net.createConnection({ host: '127.0.0.1', port: opts.port });
  const lines: string[] = [];
  let buffer = '';
  let wake: (() => void) | null = null;
  let socketError: Error | null = null;
  let closed = false;

  socket.setEncoding('utf8');
  socket.on('data', chunk => {
    buffer += chunk;
    let idx: number;
    while ((idx = buffer.indexOf('\n')) >= 0) {
      lines.push(buffer.slice(0, idx));
      buffer = buffer.slice(idx + 1);
    }
    wake?.();
  });
  socket.on('error', err => { socketError = err; wake?.(); });
  socket.on('close', () => { closed = true; wake?.(); });

  const nextLine = (method: string): Promise<string> => new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      wake = null;
      reject(new Error(`WordCraft ${method} timed out after ${REQUEST_TIMEOUT_MS / 1000}s`));
    }, REQUEST_TIMEOUT_MS);
    const check = (): void => {
      if (lines.length > 0) {
        clearTimeout(timer);
        wake = null;
        resolve(lines.shift() as string);
      } else if (socketError || closed) {
        clearTimeout(timer);
        wake = null;
        reject(new Error(`WordCraft ${method} failed: ${socketError?.message ?? 'connection closed'}`));
      } else {
        wake = check;
      }
    };
    check();
  });

  let id = 0;
  const request = async (method: string, params: Record<string, string>): Promise<void> => {
    id++;
    socket.write(JSON.stringify({ key, id, method, params }) + '\n');
    const reply = JSON.parse(await nextLine(method)) as { ok?: boolean; error?: string };
    if (reply.ok !== true) {
      throw new Error(`WordCraft ${method} failed: ${reply.error ?? 'unknown error'}`);
    }
  };

  try {
    await request('file.open', { path: opts.docxPath });
    await request('file.exportPdf', { path: opts.pdfPath });
    await request('file.close', {});
  } finally {
    socket.destroy();
  }
}

function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as net.AddressInfo;
      server.close(() => resolve(port));
    });
  });
}

function canConnect(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const probe = net.createConnection({ host: '127.0.0.1', port });
    probe.once('connect', () => { probe.destroy(); resolve(true); });
    probe.once('error', () => { probe.destroy(); resolve(false); });
  });
}

/**
 * Wait for a control server started after `spawnedAt`: a key file older than
 * that belongs to an earlier run on the same port.
 */
async function waitForWordCraft(
  port: number,
  keyPath: string,
  spawnedAt: number,
  childFailure: () => Error | null
): Promise<void> {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const failure = childFailure();
    if (failure) throw failure;
    if (fs.existsSync(keyPath) && fs.statSync(keyPath).mtimeMs >= spawnedAt && await canConnect(port)) return;
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error(`WordCraft did not start its control channel within ${STARTUP_TIMEOUT_MS / 1000}s`);
}

function stopChild(child: ChildProcess, alreadyGone: boolean): Promise<void> {
  if (alreadyGone || child.pid === undefined) {
    child.kill('SIGTERM');
    return Promise.resolve();
  }
  return new Promise(resolve => {
    const timer = setTimeout(() => child.kill('SIGKILL'), KILL_GRACE_MS);
    child.once('exit', () => { clearTimeout(timer); resolve(); });
    child.kill('SIGTERM');
  });
}

async function convertWithWordCraft(docxPath: string, pdfPath: string): Promise<void> {
  const port = await findFreePort();
  const keyPath = path.join(
    os.homedir(), 'Library', 'Application Support', 'WordCraft', `control-key.local-${port}`
  );
  const spawnedAt = Date.now();
  const child = spawn(WORDCRAFT_BINARY, ['--control', String(port)], { stdio: 'ignore' });
  let failure: Error | null = null;
  let gone = false;
  child.once('error', err => { failure = err; gone = true; });
  child.once('exit', code => {
    gone = true;
    failure ??= new Error(`WordCraft exited before its control server started (code ${code})`);
  });
  try {
    await waitForWordCraft(port, keyPath, spawnedAt, () => failure);
    await runWordCraftControl({ port, keyPath, docxPath, pdfPath });
  } finally {
    await stopChild(child, gone);
  }
}

/**
 * Convert a DOCX to a PDF next to it and return the PDF path
 */
export async function convertDocxToPdf(docxPath: string): Promise<string> {
  if (!fs.existsSync(docxPath)) {
    throw new Error(`DOCX file not found: ${docxPath}`);
  }
  const converter = detectPdfConverter();
  if (!converter) {
    throw new Error(
      'No PDF converter available. Install WordCraft (/Applications/WordCraft.app) or LibreOffice:\n' +
      '  macOS: brew install --cask libreoffice\n' +
      '  Linux: sudo apt install libreoffice\n' +
      '  Windows: https://www.libreoffice.org/download/'
    );
  }

  const outputDir = path.dirname(docxPath);
  const pdfPath = path.join(outputDir, `${path.basename(docxPath, '.docx')}.pdf`);

  try {
    if (converter === 'wordcraft') {
      await convertWithWordCraft(docxPath, pdfPath);
    } else {
      execFileSync(
        'soffice',
        ['--headless', '--convert-to', 'pdf', '--outdir', outputDir, docxPath],
        { stdio: 'pipe', timeout: SOFFICE_CONVERT_TIMEOUT_MS, killSignal: 'SIGKILL' }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`PDF conversion failed (${converter}): ${message}`);
  }

  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF conversion failed (${converter}): PDF file was not created`);
  }
  return pdfPath;
}
