import { describe, it, expect } from 'vitest';
import { spawnSync } from 'child_process';
import * as path from 'path';

const distPath = path.join(process.cwd(), 'dist', 'commands', 'bulk-email.js');

function run(...args: string[]) {
  return spawnSync('node', [distPath, ...args], { encoding: 'utf8' });
}

describe('invoicr-bulk-email flag validation', () => {
  it.each([
    ['an unknown flag', ['acme', '--dryrun'], /unknown option --dryrun/],
    ['--month without a value', ['acme', '--month'], /--month requires a value/],
    ['--month= with an empty value', ['acme', '--month='], /--month requires a value/],
    ['an invalid month', ['acme', '--month=13-2026'], /Invalid month/],
  ])('exits non-zero for %s', (_label, args, message) => {
    const result = run(...args);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(message);
  });
});
