import {
  ErrorCode,
  ErrorSeverity,
  AppError,
  ErrorContext,
} from '@chat-mate/types';

// Date utilities
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRelativeTime = (date: Date | string): string => {
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatDate(date);
};

// Text utilities
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const capitalizeFirst = (text: string): string => {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidUuid = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// API utilities
export const createApiUrl = (baseUrl: string, endpoint: string): string => {
  return `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
};

export const handleApiError = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const apiError = error as { response?: { data?: { message?: string } } };
    if (apiError.response?.data?.message) {
      return apiError.response.data.message;
    }
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const errorWithMessage = error as { message: string };
    return errorWithMessage.message;
  }
  return 'An unexpected error occurred';
};

// API Response utilities
export const createSuccessResponse = <T>(data: T) => ({
  success: true as const,
  data,
});

export const createErrorResponse = (error: string, message?: string) => ({
  success: false as const,
  error,
  ...(message && { message }),
});

// Error Classes
export class ChatMateError extends Error {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly context?: ErrorContext;
  public readonly retryable: boolean;
  public readonly userMessage?: string;
  public readonly originalError?: Error;

  constructor({
    code,
    message,
    severity = ErrorSeverity.MEDIUM,
    context,
    retryable = false,
    userMessage,
    originalError,
  }: {
    code: ErrorCode;
    message: string;
    severity?: ErrorSeverity;
    context?: ErrorContext;
    retryable?: boolean;
    userMessage?: string;
    originalError?: Error;
  }) {
    super(message);
    this.name = 'ChatMateError';
    this.code = code;
    this.severity = severity;
    this.context = context;
    this.retryable = retryable;
    this.userMessage = userMessage;
    this.originalError = originalError;

    if (originalError) {
      this.stack = originalError.stack;
    }
  }

  toAppError(): AppError {
    return {
      code: this.code,
      message: this.message,
      severity: this.severity,
      context: this.context,
      originalError: this.originalError,
      stack: this.stack,
      retryable: this.retryable,
      userMessage: this.userMessage,
    };
  }
}

// Error Factory Functions
export const createAuthError = (message: string, userMessage?: string) =>
  new ChatMateError({
    code: ErrorCode.UNAUTHORIZED,
    message,
    severity: ErrorSeverity.MEDIUM,
    userMessage: userMessage || 'Authentication required',
  });

export const createValidationError = (message: string, userMessage?: string) =>
  new ChatMateError({
    code: ErrorCode.VALIDATION_ERROR,
    message,
    severity: ErrorSeverity.LOW,
    userMessage: userMessage || 'Please check your input',
  });

export const createNetworkError = (message: string, retryable = true) =>
  new ChatMateError({
    code: ErrorCode.NETWORK_ERROR,
    message,
    severity: ErrorSeverity.MEDIUM,
    retryable,
    userMessage: 'Network connection issue. Please try again.',
  });

export const createAIServiceError = (message: string, retryable = true) =>
  new ChatMateError({
    code: ErrorCode.AI_SERVICE_ERROR,
    message,
    severity: ErrorSeverity.HIGH,
    retryable,
    userMessage: 'AI service temporarily unavailable. Please try again.',
  });

export const createDatabaseError = (message: string) =>
  new ChatMateError({
    code: ErrorCode.DATABASE_ERROR,
    message,
    severity: ErrorSeverity.CRITICAL,
    retryable: false,
    userMessage: 'Service temporarily unavailable',
  });

// Error Context Helpers
export const createErrorContext = ({
  userId,
  sessionId,
  requestId,
  endpoint,
  method,
  userAgent,
  additionalData,
}: Partial<ErrorContext> = {}): ErrorContext => ({
  userId,
  sessionId,
  requestId,
  endpoint,
  method,
  userAgent,
  timestamp: new Date().toISOString(),
  additionalData,
});

// Error Conversion Utilities
export const convertToAppError = (
  error: unknown,
  context?: ErrorContext
): AppError => {
  if (error instanceof ChatMateError) {
    const appError = error.toAppError();
    if (context) {
      appError.context = { ...appError.context, ...context };
    }
    return appError;
  }

  if (error instanceof Error) {
    return {
      code: ErrorCode.UNKNOWN_ERROR,
      message: error.message,
      severity: ErrorSeverity.MEDIUM,
      context,
      originalError: error,
      stack: error.stack,
      retryable: false,
    };
  }

  return {
    code: ErrorCode.UNKNOWN_ERROR,
    message: typeof error === 'string' ? error : 'Unknown error occurred',
    severity: ErrorSeverity.MEDIUM,
    context,
    retryable: false,
  };
};

// Error Logging Utilities
export const shouldLogError = (error: AppError): boolean => {
  return (
    error.severity === ErrorSeverity.HIGH ||
    error.severity === ErrorSeverity.CRITICAL
  );
};

export const shouldReportError = (error: AppError): boolean => {
  return error.severity === ErrorSeverity.CRITICAL;
};

export const getRetryDelay = (attempt: number, baseDelay = 1000): number => {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
};

export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof ChatMateError) {
    return error.retryable;
  }
  return false;
};

export const isApiError = (
  response: unknown
): response is { success: false; error: string } => {
  if (!response || typeof response !== 'object') {
    return false;
  }
  const obj = response as Record<string, unknown>;
  return (
    'success' in obj &&
    obj.success === false &&
    'error' in obj &&
    typeof obj.error === 'string'
  );
};

export const isApiSuccess = <T>(
  response: unknown
): response is { success: true; data: T } => {
  if (!response || typeof response !== 'object') {
    return false;
  }
  const obj = response as Record<string, unknown>;
  return 'success' in obj && obj.success === true && 'data' in obj;
};

export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, String(item)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

// Array utilities
export const uniqueBy = <T>(array: T[], key: keyof T): T[] => {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce(
    (groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
};

// Object utilities
export const omit = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

export const pick = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

// Storage utilities
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};

export const safeJsonStringify = (obj: unknown): string => {
  try {
    return JSON.stringify(obj);
  } catch {
    return '{}';
  }
};

// Debounce utility
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Random utilities
export const generateId = (length: number = 8): string => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const randomBetween = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Environment utilities
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

export const isTest = (): boolean => {
  return process.env.NODE_ENV === 'test';
};
