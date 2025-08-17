import { useEffect, useState, useRef } from 'react';
import { UseQueryResult, UseMutationResult } from '@tanstack/react-query';

interface SuccessFeedbackState {
  visible: boolean;
  message: string;
}

interface UseSuccessFeedbackOptions {
  successMessage?: string;
  duration?: number;
  enabled?: boolean;
}

/**
 * Hook to show success feedback when React Query operations complete successfully
 */
export const useSuccessFeedback = <
  TData = unknown,
  TError = unknown,
  TVariables = unknown,
>(
  queryOrMutation:
    | UseQueryResult<TData, TError>
    | UseMutationResult<TData, TError, TVariables>,
  options: UseSuccessFeedbackOptions = {}
) => {
  const {
    successMessage = 'Data loaded successfully',
    duration = 2000,
    enabled = true,
  } = options;

  const [feedback, setFeedback] = useState<SuccessFeedbackState>({
    visible: false,
    message: successMessage,
  });

  const prevDataState = useRef<{
    hasData: boolean;
    isLoading: boolean;
  }>({ hasData: false, isLoading: false });

  useEffect(() => {
    if (!enabled) return;

    const isQuery = 'data' in queryOrMutation;
    const isMutation =
      'isSuccess' in queryOrMutation && 'mutate' in queryOrMutation;

    if (isQuery) {
      const query = queryOrMutation as UseQueryResult<TData, TError>;
      const currentHasData = !!query.data;
      const currentIsLoading = query.isLoading;

      // Show success feedback when:
      // 1. We just finished loading (was loading, now not loading)
      // 2. We now have data (didn't have data before, now we do)
      // 3. No error occurred
      if (
        prevDataState.current.isLoading &&
        !currentIsLoading &&
        currentHasData &&
        !query.error
      ) {
        setFeedback({
          visible: true,
          message: successMessage,
        });
      }

      prevDataState.current = {
        hasData: currentHasData,
        isLoading: currentIsLoading,
      };
    } else if (isMutation) {
      const mutation = queryOrMutation as UseMutationResult<
        TData,
        TError,
        TVariables
      >;

      // Show success feedback when mutation succeeds
      if (mutation.isSuccess && mutation.data) {
        setFeedback({
          visible: true,
          message: successMessage,
        });
      }
    }
  }, [queryOrMutation, successMessage, enabled]);

  const hideFeedback = () => {
    setFeedback(prev => ({ ...prev, visible: false }));
  };

  return {
    ...feedback,
    hideFeedback,
    duration,
  };
};

/**
 * Hook specifically for multiple queries (like featured and non-featured bots)
 */
export const useMultiQuerySuccessFeedback = <TData = unknown, TError = unknown>(
  queries: UseQueryResult<TData, TError>[],
  options: UseSuccessFeedbackOptions = {}
) => {
  const {
    successMessage = 'All data loaded successfully',
    duration = 2000,
    enabled = true,
  } = options;

  const [feedback, setFeedback] = useState<SuccessFeedbackState>({
    visible: false,
    message: successMessage,
  });

  const prevState = useRef<{
    allHaveData: boolean;
    anyLoading: boolean;
  }>({ allHaveData: false, anyLoading: false });

  useEffect(() => {
    if (!enabled || queries.length === 0) return;

    const allHaveData = queries.every(query => !!query.data);
    const anyLoading = queries.some(query => query.isLoading);
    const anyError = queries.some(query => query.error);

    // Show success feedback when:
    // 1. We were loading before, now we're not
    // 2. All queries now have data
    // 3. No errors occurred
    if (
      prevState.current.anyLoading &&
      !anyLoading &&
      allHaveData &&
      !anyError
    ) {
      setFeedback({
        visible: true,
        message: successMessage,
      });
    }

    prevState.current = {
      allHaveData,
      anyLoading,
    };
  }, [queries, successMessage, enabled]);

  const hideFeedback = () => {
    setFeedback(prev => ({ ...prev, visible: false }));
  };

  return {
    ...feedback,
    hideFeedback,
    duration,
  };
};
