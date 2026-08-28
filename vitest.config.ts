import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    environmentMatchGlobs: [['tests/components/**', 'jsdom']],
    coverage: {
      provider: 'v8',
      include: ['lib/**', 'config/**'],
      thresholds: {
        // Calculation layer must stay well covered.
        'lib/finance/**': { statements: 95, branches: 85, functions: 100, lines: 95 },
      },
    },
  },
});
