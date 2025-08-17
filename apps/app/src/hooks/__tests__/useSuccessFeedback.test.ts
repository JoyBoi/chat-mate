import { renderHook, act } from '@testing-library/react-native';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSuccessFeedback } from '../useSuccessFeedback';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';

// Mock timers
vi.useFakeTimers();

describe('useSuccessFeedback', () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  describe('with query', () => {
    it('shows feedback when query succeeds with new data', () => {
      const mockQuery = {
        data: null,
        isLoading: true,
        isSuccess: false,
        error: null,
      } as unknown as UseQueryResult;

      const { result, rerender } = renderHook(
        props =>
          useSuccessFeedback(props.query, { successMessage: 'Data loaded!' }),
        { initialProps: { query: mockQuery } }
      );

      expect(result.current.visible).toBe(false);

      // Simulate successful data load
      const updatedQuery = {
        ...mockQuery,
        data: { id: 1, name: 'Test' },
        isLoading: false,
        isSuccess: true,
      } as UseQueryResult;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      act(() => {
        rerender({ query: updatedQuery });
      });

      expect(result.current.visible).toBe(true);

      expect(result.current.message).toBe('Data loaded!');
    });

    it('hides feedback after duration', () => {
      const mockQuery = {
        data: { id: 1 },
        isLoading: false,
        isSuccess: true,
        error: null,
      } as unknown as UseQueryResult;

      const { result, rerender } = renderHook(
        props => useSuccessFeedback(props.query, { duration: 1000 }),
        { initialProps: { query: mockQuery } }
      );

      // Simulate new data
      const updatedQuery = {
        ...mockQuery,
        data: { id: 2 },
      } as UseQueryResult;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      act(() => {
        rerender({ query: updatedQuery });
      });

      expect(result.current.visible).toBe(true);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.visible).toBe(false);
    });

    it('does not show feedback when disabled', () => {
      const mockQuery = {
        data: null,
        isLoading: true,
        isSuccess: false,
        error: null,
      } as unknown as UseQueryResult;

      const { result, rerender } = renderHook(
        props => useSuccessFeedback(props.query, { enabled: false }),
        { initialProps: { query: mockQuery } }
      );

      // Simulate successful data load
      const updatedQuery = {
        ...mockQuery,
        data: { id: 1 },
        isLoading: false,
        isSuccess: true,
      } as UseQueryResult;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      act(() => {
        rerender({ query: updatedQuery });
      });

      expect(result.current.visible).toBe(false);
    });
  });

  describe('with mutation', () => {
    it('shows feedback when mutation succeeds', () => {
      const mockMutation = {
        isSuccess: false,
        data: null,
        error: null,
        mutate: vi.fn(),
      } as unknown as UseMutationResult;

      const { result, rerender } = renderHook(
        props =>
          useSuccessFeedback(props.mutation, {
            successMessage: 'Mutation successful!',
          }),
        { initialProps: { mutation: mockMutation } }
      );

      expect(result.current.visible).toBe(false);

      // Simulate successful mutation
      const updatedMutation = {
        ...mockMutation,
        isSuccess: true,
        data: { success: true },
      } as UseMutationResult;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      act(() => {
        rerender({ mutation: updatedMutation });
      });

      expect(result.current.visible).toBe(true);

      expect(result.current.message).toBe('Mutation successful!');
    });

    it('hides feedback after mutation success timeout', () => {
      const mockMutation = {
        isSuccess: true,
        data: { success: true },
        error: null,
        mutate: vi.fn(),
      } as unknown as UseMutationResult;

      const { result } = renderHook(() =>
        useSuccessFeedback(mockMutation, { duration: 500 })
      );

      expect(result.current.visible).toBe(true);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.visible).toBe(false);
    });
  });

  describe('hideFeedback function', () => {
    it('manually hides feedback', () => {
      const mockQuery = {
        data: { id: 1 },
        isLoading: false,
        isSuccess: true,
        error: null,
      } as unknown as UseQueryResult;

      const { result, rerender } = renderHook(
        props => useSuccessFeedback(props.query),
        { initialProps: { query: mockQuery } }
      );

      // Trigger feedback
      const updatedQuery = {
        ...mockQuery,
        data: { id: 2 },
      } as UseQueryResult;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      act(() => {
        rerender({ query: updatedQuery });
      });

      expect(result.current.visible).toBe(true);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      act(() => {
        result.current.hideFeedback();
      });

      expect(result.current.visible).toBe(false);
    });
  });
});
