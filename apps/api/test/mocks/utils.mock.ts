// Mock implementation for @chat-mate/utils
import { ErrorCode, ErrorSeverity, ApiResponse } from './types.mock';

export function createSuccessResponse<T>(data?: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

export function createErrorResponse(
  code: ErrorCode,
  message: string,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  details?: Record<string, unknown>
): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      severity,
      details,
    },
  };
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>"'&]/g, '');
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function formatDate(date: Date): string {
  return date.toISOString();
}
