// Mock for @chat-mate/types
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  timestamp?: string;
  additionalData?: Record<string, any>;
}

export interface AppError {
  code: ErrorCode;
  message: string;
  severity: ErrorSeverity;
  context?: ErrorContext;
  retryable: boolean;
  userMessage?: string;
  originalError?: Error;
}

// Mock other types as needed
export interface User {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bot {
  id: string;
  name: string;
  description: string;
  personality: string;
  avatar?: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}
