import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
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
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: '../../coverage/app',
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/*.cy.{ts,tsx}',
        'src/index.ts',
        'dist/**',
        'e2e/**',
        'cypress/**',
      ],
    },
  },
  esbuild: {
    target: 'es2020',
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  resolve: {
    alias: {
      '@chat-mate/types': resolve(__dirname, '../../packages/types/src'),
      '@chat-mate/utils': resolve(__dirname, '../../packages/utils/src'),
      '@': resolve(__dirname, './src'),
    },
  },
});
