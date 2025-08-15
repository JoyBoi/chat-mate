import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { supabase } from './supabase';

// API response wrapper interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Create axios instance with base configuration
const createApiClient = (): AxiosInstance => {
  const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

  const client = axios.create({
    baseURL: `${baseURL}/api/v1`,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  client.interceptors.request.use(
    async config => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        }
      } catch (error) {
        console.warn('Failed to get auth token:', error);
      }

      return config;
    },
    error => {
      return Promise.reject(new Error(error.message || 'Request failed'));
    },
  );

  // Response interceptor to handle API response format
  client.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      // Return the response as-is for successful requests
      return response;
    },
    async error => {
      // Handle 401 errors by refreshing the session
      if (error.response?.status === 401) {
        try {
          const { error: refreshError } = await supabase.auth.refreshSession();

          if (!refreshError) {
            // Retry the original request with new token
            const originalRequest = error.config;
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

      // Transform error response to match our API format
      const apiError = {
        success: false,
        error:
          error.response?.data?.error || error.message || 'An error occurred',
        message: error.response?.data?.message,
      };

      const errorWithApiData = new Error(apiError.error) as Error & {
        response?: {
          data: typeof apiError;
          status?: number;
          statusText?: string;
        };
      };
      errorWithApiData.response = {
        ...error.response,
        data: apiError,
      };

      return Promise.reject(errorWithApiData);
    },
  );

  return client;
};

// Export the configured API client
export const apiClient = createApiClient();

// Helper functions for common API operations
export const apiHelpers = {
  // Generic GET request
  get: async <T>(url: string, params?: any): Promise<T> => {
    const response = await apiClient.get<ApiResponse<T>>(url, { params });
    if (!response.data.success || response.data.data === undefined) {
      throw new Error(response.data.error || 'Request failed');
    }
    return response.data.data as T;
  },

  // Generic POST request
  post: async <T>(url: string, data?: any): Promise<T> => {
    const response = await apiClient.post<ApiResponse<T>>(url, data);
    if (!response.data.success || response.data.data === undefined) {
      throw new Error(response.data.error || 'Request failed');
    }
    return response.data.data as T;
  },

  // Generic PUT request
  put: async <T>(url: string, data?: any): Promise<T> => {
    const response = await apiClient.put<ApiResponse<T>>(url, data);
    if (!response.data.success || response.data.data === undefined) {
      throw new Error(response.data.error || 'Request failed');
    }
    return response.data.data as T;
  },

  // Generic PATCH request
  patch: async <T>(url: string, data?: any): Promise<T> => {
    const response = await apiClient.patch<ApiResponse<T>>(url, data);
    if (!response.data.success || response.data.data === undefined) {
      throw new Error(response.data.error || 'Request failed');
    }
    return response.data.data as T;
  },

  // Generic DELETE request
  delete: async <T>(url: string): Promise<T> => {
    const response = await apiClient.delete<ApiResponse<T>>(url);
    if (!response.data.success || response.data.data === undefined) {
      throw new Error(response.data.error || 'Request failed');
    }
    return response.data.data as T;
  },
};

// Export types
export type { AxiosInstance, AxiosResponse };
