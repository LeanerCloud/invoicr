import { describe, it, expect, beforeEach, vi } from 'vitest';

const state = vi.hoisted(() => ({ wordcraft: false, execFileSync: vi.fn() }));

vi.mock('child_process', () => ({ spawn: vi.fn(), execFileSync: state.execFileSync }));
vi.mock('fs', async importOriginal => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: (p: string) =>
      p.endsWith('/WordCraft.app/Contents/MacOS/WordCraft') ? state.wordcraft : actual.existsSync(p)
  };
});

import { detectPdfConverter } from '../src/lib/pdf-converter.js';

describe('detectPdfConverter', () => {
  beforeEach(() => {
    state.execFileSync.mockReset();
  });

  it('returns wordcraft when the binary exists without probing soffice', () => {
    state.wordcraft = true;
    expect(detectPdfConverter()).toBe('wordcraft');
    expect(state.execFileSync).not.toHaveBeenCalled();
  });

  it('returns libreoffice when soffice --version succeeds, with a hard kill timeout', () => {
    state.wordcraft = false;
    state.execFileSync.mockReturnValue(Buffer.from('LibreOffice 7'));
    expect(detectPdfConverter()).toBe('libreoffice');
    expect(state.execFileSync).toHaveBeenCalledWith(
      'soffice', ['--version'], expect.objectContaining({ timeout: 15_000, killSignal: 'SIGKILL' })
    );
  });

  it('returns null when soffice fails or times out', () => {
    state.wordcraft = false;
    state.execFileSync.mockImplementation(() => { throw new Error('ETIMEDOUT'); });
    expect(detectPdfConverter()).toBeNull();
  });
});
