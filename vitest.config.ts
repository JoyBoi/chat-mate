import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.expo/**',
      '**/android/**',
      '**/ios/**',
      '**/coverage/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/.expo/**',
        '**/android/**',
        '**/ios/**',
        '**/prisma/**',
        '**/test/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@chat-mate/types': resolve(__dirname, './packages/types/src'),
      '@chat-mate/utils': resolve(__dirname, './packages/utils/src'),
    },
  },
});
