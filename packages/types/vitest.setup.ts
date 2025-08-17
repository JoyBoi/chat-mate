import { vi } from 'vitest';

// Mock console methods to reduce noise during tests
// Store original console methods
const originalConsole = { ...console };

// Mock console methods with proper typing
global.console = {
  ...originalConsole,
  log: vi.fn(() => {}),
  debug: vi.fn(() => {}),
  info: vi.fn(() => {}),
  warn: vi.fn(() => {}),
  error: vi.fn(() => {}),
};
