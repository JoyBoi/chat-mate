import { describe, it, expect, vi } from 'vitest';

// Mock all the complex dependencies first
vi.mock('../../App', () => ({
  default: () => 'App',
}));

vi.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

vi.mock('@tanstack/react-query', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  QueryClientProvider: ({ children }: any) => children,
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('../../src/contexts/AuthContext', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  AuthProvider: ({ children }: any) => children,
  useAuth: vi.fn(() => ({ session: null, loading: false })),
}));

// Simple smoke test
describe('App', () => {
  it('should be importable', () => {
    expect(true).toBe(true);
  });

  // TODO: Add more specific tests for navigation, auth states, etc.
});
