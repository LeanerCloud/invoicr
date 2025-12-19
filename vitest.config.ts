import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/commands/init.ts',       // CLI wizard (interactive prompts)
        'src/commands/list.ts',       // CLI entry point
        'src/commands/export.ts',     // CLI entry point
        'src/commands/bulk.ts',       // CLI entry point (spawns processes)
        'src/commands/einvoice.ts',   // CLI entry point (e-invoice generation)
        'src/invoice.ts',             // Main entry point (integration test)
        'src/create-client.ts',       // CLI wizard (integration test)
        'src/api/index.ts',           // API server CLI entry point
        'src/types.ts',               // Type definitions only
        'src/document.ts',            // Re-export only
        'src/einvoice/formats/types.ts' // Type definitions only
      ]
    }
  }
});
