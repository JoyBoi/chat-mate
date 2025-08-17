// Mock implementation for @chat-mate/types

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: ErrorCode;
    message: string;
    severity: ErrorSeverity;
    details?: any;
  };
}

export interface User {
  id: string;
  email?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  isGuest: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chat {
  id: string;
  name?: string;
  type: 'DIRECT' | 'GROUP' | 'BOT' | 'GLOBAL';
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  content: string;
  chatId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
