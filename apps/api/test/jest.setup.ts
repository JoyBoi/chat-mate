// Set test environment variables BEFORE any imports
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test/test.db';
process.env.DIRECT_URL = 'file:./test/test.db';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';

import { execSync } from 'child_process';
import { config } from 'dotenv';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';

// Load additional test environment variables
config({ path: join(__dirname, '.env.test'), override: true });

// Increase test timeout for integration tests
jest.setTimeout(30000);

// Setup test database
beforeAll(() => {
  // Clean up any existing test database
  const testDbPath = join(__dirname, 'test.db');
  if (existsSync(testDbPath)) {
    unlinkSync(testDbPath);
  }

  // Generate Prisma client for test schema
  execSync('npx prisma generate --schema=test/schema.test.prisma', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: 'file:./test/test.db' },
  });

  // Push the test schema to create the database
  execSync('npx prisma db push --schema=test/schema.test.prisma', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: 'file:./test/test.db' },
  });
});

// Clean up after all tests
afterAll(() => {
  const testDbPath = join(__dirname, 'test.db');
  if (existsSync(testDbPath)) {
    unlinkSync(testDbPath);
  }
});

// Mock console methods to reduce test output
const originalConsole = { ...console };

beforeEach(() => {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.debug = () => {};
  console.error = (...args: unknown[]) => originalConsole.error(...args);
});

afterEach(() => {
  Object.assign(console, {
    log: (...args: unknown[]) => originalConsole.log(...args),
    info: (...args: unknown[]) => originalConsole.info(...args),
    warn: (...args: unknown[]) => originalConsole.warn(...args),
    debug: (...args: unknown[]) => originalConsole.debug(...args),
    error: (...args: unknown[]) => originalConsole.error(...args),
  });
});
