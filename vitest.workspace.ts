import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    extends: './packages/types/vitest.config.ts',
    test: {
      name: 'types',
      root: './packages/types',
    },
  },
  {
    extends: './packages/utils/vitest.config.ts',
    test: {
      name: 'utils',
      root: './packages/utils',
    },
  },
  {
    extends: './apps/api/vitest.config.ts',
    test: {
      name: 'api',
      root: './apps/api',
    },
  },
  {
    extends: './apps/app/vitest.config.ts',
    test: {
      name: 'app',
      root: './apps/app',
    },
  },
]);