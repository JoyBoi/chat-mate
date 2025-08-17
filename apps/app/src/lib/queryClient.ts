import { QueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { appStorage } from './storage';
import { getOfflineManager } from './offlineManager';

// Custom retry function with exponential backoff
const retryFunction = (failureCount: number, error: unknown) => {
  // Don't retry on 4xx errors (client errors)
  const errorWithResponse = error as { response?: { status?: number } };
  if (
    errorWithResponse?.response?.status &&
    errorWithResponse.response.status >= 400 &&
    errorWithResponse.response.status < 500
  ) {
    return false;
  }

  // Retry up to 3 times with exponential backoff
  return failureCount < 3;
};

import { handleError } from './error-handler';

// Custom error handler using centralized approach
const errorHandler = (error: unknown) => {
  // Use centralized error handling but don't show alerts for query errors
  const appError = handleError(
    error,
    {
      additionalData: { source: 'react-query' },
    },
    false
  );

  // Log for debugging in development
  if (__DEV__) {
    console.error('React Query Error:', appError);
  }
};

// Persister for offline support (native only)
const createPersister = () => {
  if (Platform.OS === 'web') {
    // Web fallback - use localStorage
    return {
      persistClient: (client: any) => {
        try {
          localStorage.setItem('react-query-cache', JSON.stringify(client));
        } catch (error) {
          console.warn('Failed to persist query cache to localStorage:', error);
        }
      },
      restoreClient: () => {
        try {
          const cached = localStorage.getItem('react-query-cache');
          return cached ? (JSON.parse(cached) as unknown) : undefined;
        } catch (error) {
          console.warn(
            'Failed to restore query cache from localStorage:',
            error
          );
          return undefined;
        }
      },
      removeClient: () => {
        try {
          localStorage.removeItem('react-query-cache');
        } catch (error) {
          console.warn(
            'Failed to remove query cache from localStorage:',
            error
          );
        }
      },
    };
  }

  // Native platforms - use MMKV
  return {
    persistClient: (client: any) => {
      try {
        appStorage.set('react-query-cache', JSON.stringify(client));
      } catch (error) {
        console.warn('Failed to persist query cache to MMKV:', error);
      }
    },
    restoreClient: () => {
      try {
        const cached = appStorage.getString('react-query-cache');
        return cached ? (JSON.parse(cached) as unknown) : undefined;
      } catch (error) {
        console.warn('Failed to restore query cache from MMKV:', error);
        return undefined;
      }
    },
    removeClient: () => {
      try {
        appStorage.delete('react-query-cache');
      } catch (error) {
        console.warn('Failed to remove query cache from MMKV:', error);
      }
    },
  };
};

// Create and configure the QueryClient
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry configuration
      retry: retryFunction,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Network mode for offline support
      networkMode: 'offlineFirst',
      // Refetch on window focus (web only)
      refetchOnWindowFocus: Platform.OS === 'web',
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: 'always',
    },
    mutations: {
      // Retry mutations on network errors
      retry: retryFunction,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Network mode for offline support
      networkMode: 'offlineFirst',
      // Global error handler
      onError: errorHandler,
    },
  },
});

// Initialize offline manager when query client is created
getOfflineManager();

// Export persister for use with persistQueryClient
export const persister = createPersister();

// Query keys factory for consistent key management
export const queryKeys = {
  // Auth related
  auth: {
    user: ['auth', 'user'] as const,
    session: ['auth', 'session'] as const,
  },
  // Bot personalities
  bots: {
    all: ['bots'] as const,
    active: ['bots', 'active'] as const,
    featured: ['bots', 'featured'] as const,
    nonFeatured: ['bots', 'non-featured'] as const,
    list: (filters?: Record<string, unknown>) =>
      ['bots', 'list', filters] as const,
    detail: (id: string) => ['bots', 'detail', id] as const,
  },
  // Messages
  messages: {
    all: ['messages'] as const,
    list: (chatId: string, filters?: Record<string, unknown>) =>
      ['messages', 'list', chatId, filters] as const,
    infinite: (chatId: string) => ['messages', 'infinite', chatId] as const,
    detail: (id: string) => ['messages', 'detail', id] as const,
  },
  // AI operations
  ai: {
    summarize: (messageIds: string[]) =>
      ['ai', 'summarize', messageIds] as const,
    translate: (messageId: string, targetLang: string) =>
      ['ai', 'translate', messageId, targetLang] as const,
  },
  // Chat rooms
  chats: {
    all: ['chats'] as const,
    list: (userId?: string) => ['chats', 'list', userId] as const,
    detail: (id: string) => ['chats', 'detail', id] as const,
    participants: (chatId: string) =>
      ['chats', 'participants', chatId] as const,
  },
  // Chat rooms (alias for compatibility)
  chatRooms: {
    all: ['chatRooms'] as const,
    list: (filters?: Record<string, unknown>) =>
      ['chatRooms', 'list', filters] as const,
    detail: (id: string) => ['chatRooms', 'detail', id] as const,
    members: (id: string) => ['chatRooms', 'members', id] as const,
  },
} as const;

// Helper function to invalidate related queries
export const invalidateQueries = {
  messages: (chatId?: string) => {
    if (chatId) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.messages.list(chatId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.messages.infinite(chatId),
      });
    } else {
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
    }
  },
  bots: () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.bots.all });
  },
  chats: (userId?: string) => {
    if (userId) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chats.list(userId),
      });
    } else {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
    }
  },
};
