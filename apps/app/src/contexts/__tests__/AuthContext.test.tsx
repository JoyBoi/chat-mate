import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { AuthProvider, useAuth } from '../AuthContext';
import { supabase } from '../../lib/supabase';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
  },
}));

// Mock user session
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: { name: 'Test User' },
};

const mockSession = {
  user: mockUser,
  access_token: 'mock-token',
  refresh_token: 'mock-refresh-token',
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAuth hook', () => {
    it('provides initial auth state', () => {
      const mockGetSession = vi
        .fn()
        .mockResolvedValue({ data: { session: null } });
      const mockOnAuthStateChange = vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      supabase.auth.getSession = mockGetSession;
      supabase.auth.onAuthStateChange = mockOnAuthStateChange;

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();

      expect(result.current.session).toBeNull();

      expect(result.current.loading).toBe(true);

      expect(typeof result.current.signIn).toBe('function');

      expect(typeof result.current.signUp).toBe('function');

      expect(typeof result.current.signOut).toBe('function');

      expect(typeof result.current.resetPassword).toBe('function');
    });

    it('handles successful sign in', async () => {
      const mockSignIn = vi.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });
      supabase.auth.signInWithPassword = mockSignIn;
      supabase.auth.getSession = vi
        .fn()
        .mockResolvedValue({ data: { session: null } });
      supabase.auth.onAuthStateChange = vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('handles sign in error', async () => {
      const mockError = { message: 'Invalid credentials' };
      const mockSignIn = vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });
      supabase.auth.signInWithPassword = mockSignIn;
      supabase.auth.getSession = vi
        .fn()
        .mockResolvedValue({ data: { session: null } });
      supabase.auth.onAuthStateChange = vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        act(async () => {
          await result.current.signIn('test@example.com', 'wrongpassword');
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('handles successful sign up', async () => {
      const mockSignUp = vi.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });
      supabase.auth.signUp = mockSignUp;
      supabase.auth.getSession = vi
        .fn()
        .mockResolvedValue({ data: { session: null } });
      supabase.auth.onAuthStateChange = vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await act(async () => {
        await result.current.signUp('test@example.com', 'password123');
      });

      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('handles sign up error', async () => {
      const mockError = { message: 'Email already registered' };
      const mockSignUp = vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });
      supabase.auth.signUp = mockSignUp;
      supabase.auth.getSession = vi
        .fn()
        .mockResolvedValue({ data: { session: null } });
      supabase.auth.onAuthStateChange = vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        act(async () => {
          await result.current.signUp('test@example.com', 'password123');
        })
      ).rejects.toThrow('Email already registered');
    });

    it('handles sign out', async () => {
      const mockSignOut = vi.fn().mockResolvedValue({ error: null });
      supabase.auth.signOut = mockSignOut;
      supabase.auth.getSession = vi
        .fn()
        .mockResolvedValue({ data: { session: null } });
      supabase.auth.onAuthStateChange = vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('handles password reset', async () => {
      const mockResetPassword = vi.fn().mockResolvedValue({ error: null });
      supabase.auth.resetPasswordForEmail = mockResetPassword;
      supabase.auth.getSession = vi
        .fn()
        .mockResolvedValue({ data: { session: null } });
      supabase.auth.onAuthStateChange = vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await act(async () => {
        await result.current.resetPassword('test@example.com');
      });

      expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');
    });

    it('handles password reset error', async () => {
      const mockError = { message: 'Email not found' };
      const mockResetPassword = vi.fn().mockResolvedValue({ error: mockError });
      supabase.auth.resetPasswordForEmail = mockResetPassword;
      supabase.auth.getSession = vi
        .fn()
        .mockResolvedValue({ data: { session: null } });
      supabase.auth.onAuthStateChange = vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        act(async () => {
          await result.current.resetPassword('nonexistent@example.com');
        })
      ).rejects.toThrow('Email not found');
    });
  });

  describe('AuthProvider', () => {
    it('throws error when useAuth is used outside provider', () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
    });
  });
});
