import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { supabase } from './supabase';
import type { ApiResponse } from '@chat-mate/types';
import { createErrorResponse, isApiSuccess } from '@chat-mate/utils';
import { handleApiError } from './error-handler';

// Re-export ApiResponse type for convenience
export type { ApiResponse };

// Create axios instance with base configuration
const createApiClient = (): AxiosInstance => {
  const baseURL: string =
    (process.env.EXPO_PUBLIC_API_URL as string | undefined) ||
    'http://localhost:3001';

  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    } as Record<string, string>,
  });

  // Request interceptor to add auth token
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.access_token && config.headers) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        }
      } catch (error) {
        console.warn('Failed to get auth token:', error);
      }

      return config;
    },
    (error: AxiosError) => {
      const message = error instanceof Error ? error.message : 'Request failed';
      return Promise.reject(new Error(message));
    }
  );

  // Response interceptor to handle API response format
  client.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      // Return the response as-is for successful requests
      return response;
    },
    async (error: AxiosError) => {
      // Handle 401 errors by refreshing the session
      if (error.response?.status === 401) {
        try {
          const { error: refreshError } = await supabase.auth.refreshSession();

          if (!refreshError) {
            // Retry the original request with new token
            const originalRequest = error.config as InternalAxiosRequestConfig;
            const {
              data: { session },
            } = await supabase.auth.getSession();

            if (session?.access_token) {
              originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
              return client(originalRequest);
            }
          }
        } catch (refreshError) {
          console.warn('Token refresh failed:', refreshError);
          // Optionally redirect to login or handle auth failure
        }
      }

      // Use centralized error handling
      const appError = handleApiError(error, false);

      // Transform to API format for consistency
      const apiError = createErrorResponse(
        appError.code,
        appError.userMessage || appError.message
      );

      const errorWithApiData = new Error(apiError.error) as AxiosError;

      if (error.response) {
        errorWithApiData.response = {
          ...error.response,
          data: apiError,
        };
      }

      return Promise.reject(errorWithApiData);
    }
  );

  return client;
};

// Export the configured API client
export const apiClient = createApiClient();

// Helper functions for common API operations
export const apiHelpers = {
  // Generic GET request
  get: async <T>(url: string, params?: unknown): Promise<T> => {
    const response = await apiClient.get<ApiResponse<T>>(url, { params });
    if (!isApiSuccess(response.data) || response.data.data === undefined) {
      throw new Error(response.data.error || 'Request failed');
    }

    return response.data.data as T;
  },

  // Generic POST request
  post: async <T>(url: string, data?: unknown): Promise<T> => {
    const response = await apiClient.post<ApiResponse<T>>(url, data);
    if (!isApiSuccess(response.data) || response.data.data === undefined) {
      throw new Error(response.data.error || 'Request failed');
    }

    return response.data.data as T;
  },

  // Generic PUT request
  put: async <T>(url: string, data?: unknown): Promise<T> => {
    const response = await apiClient.put<ApiResponse<T>>(url, data);
    if (!isApiSuccess(response.data) || response.data.data === undefined) {
      throw new Error(response.data.error || 'Request failed');
    }

    return response.data.data as T;
  },

  // Generic PATCH request
  patch: async <T>(url: string, data?: unknown): Promise<T> => {
    const response = await apiClient.patch<ApiResponse<T>>(url, data);
    if (!isApiSuccess(response.data) || response.data.data === undefined) {
      throw new Error(response.data.error || 'Request failed');
    }

    return response.data.data as T;
  },

  // Generic DELETE request
  delete: async <T>(url: string): Promise<T> => {
    const response = await apiClient.delete<ApiResponse<T>>(url);
    if (!isApiSuccess(response.data) || response.data.data === undefined) {
      throw new Error(response.data.error || 'Request failed');
    }

    return response.data.data as T;
  },
};

// Export types
export type { AxiosInstance, AxiosResponse };
