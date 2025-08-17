/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// Mock for @chat-mate/utils

// Response utilities
export const createSuccessResponse = <T>(data: T) => ({
  success: true as const,
  data,
});

export const createErrorResponse = (error: string, message?: string) => ({
  success: false as const,
  error,
  ...(message && { message }),
});

// Error utilities
export class ChatMateError extends Error {
  public readonly code: string;
  public readonly severity: string;
  public readonly context?: any;
  public readonly retryable: boolean;
  public readonly userMessage?: string;
  public readonly originalError?: Error;

  constructor({
    code,
    message,
    severity = 'MEDIUM',
    context,
    retryable = false,
    userMessage,
    originalError,
  }: {
    code: string;
    message: string;
    severity?: string;
    context?: any;
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
  }

  toAppError() {
    return {
      code: this.code,
      message: this.message,
      severity: this.severity,
      context: this.context,
      retryable: this.retryable,
      userMessage: this.userMessage,
      originalError: this.originalError,
    };
  }
}

// Mock other utility functions as needed
export const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString();
};

export const formatDateTime = (date: Date | string): string => {
  return new Date(date).toLocaleString();
};

export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const generateId = (length: number = 8): string => {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
};
