// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Error Types
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resource Management
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',

  // External Services
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',

  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',

  // AI Services
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  AI_QUOTA_EXCEEDED = 'AI_QUOTA_EXCEEDED',
  AI_MODEL_UNAVAILABLE = 'AI_MODEL_UNAVAILABLE',

  // System
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',

  // Client
  NETWORK_OFFLINE = 'NETWORK_OFFLINE',
  CLIENT_ERROR = 'CLIENT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  timestamp: string;
  additionalData?: Record<string, unknown>;
}

export interface AppError {
  code: ErrorCode;
  message: string;
  severity: ErrorSeverity;
  context?: ErrorContext;
  originalError?: Error;
  stack?: string;
  retryable: boolean;
  userMessage?: string;
}

export interface ErrorReport {
  id: string;
  error: AppError;
  reportedAt: string;
  resolved: boolean;
  resolvedAt?: string;
  notes?: string;
}

// Error Handler Configuration
export interface ErrorHandlerConfig {
  enableLogging?: boolean;
  enableReporting?: boolean;
  enableUserFeedback?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  reportingEndpoint?: string;
  maxRetries?: number;
  retryDelay?: number;
}

// Error Mapping for HTTP Status Codes
export const HTTP_ERROR_MAP: Record<number, ErrorCode> = {
  400: ErrorCode.VALIDATION_ERROR,
  401: ErrorCode.UNAUTHORIZED,
  403: ErrorCode.FORBIDDEN,
  404: ErrorCode.NOT_FOUND,
  409: ErrorCode.RESOURCE_CONFLICT,
  429: ErrorCode.RATE_LIMITED,
  500: ErrorCode.INTERNAL_SERVER_ERROR,
  502: ErrorCode.EXTERNAL_SERVICE_ERROR,
  503: ErrorCode.SERVICE_UNAVAILABLE,
  504: ErrorCode.TIMEOUT,
};

// Error Categories for grouping
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NETWORK = 'network',
  DATABASE = 'database',
  EXTERNAL_SERVICE = 'external_service',
  AI_SERVICE = 'ai_service',
  SYSTEM = 'system',
  CLIENT = 'client',
}

// Error metadata for enhanced context
export interface ErrorMetadata {
  category: ErrorCategory;
  isRetryable: boolean;
  userFriendlyMessage?: string;
  actionRequired?: string;
  documentationUrl?: string;
}

// Enhanced error code mapping with metadata
export const ERROR_CODE_METADATA: Record<ErrorCode, ErrorMetadata> = {
  [ErrorCode.UNAUTHORIZED]: {
    category: ErrorCategory.AUTHENTICATION,
    isRetryable: false,
    userFriendlyMessage: 'Please sign in to continue',
    actionRequired: 'Sign in required',
  },
  [ErrorCode.FORBIDDEN]: {
    category: ErrorCategory.AUTHORIZATION,
    isRetryable: false,
    userFriendlyMessage: 'You do not have permission to perform this action',
    actionRequired: 'Contact administrator',
  },
  [ErrorCode.TOKEN_EXPIRED]: {
    category: ErrorCategory.AUTHENTICATION,
    isRetryable: true,
    userFriendlyMessage: 'Your session has expired. Please sign in again',
    actionRequired: 'Re-authentication required',
  },
  [ErrorCode.VALIDATION_ERROR]: {
    category: ErrorCategory.VALIDATION,
    isRetryable: false,
    userFriendlyMessage: 'Please check your input and try again',
    actionRequired: 'Fix input errors',
  },
  [ErrorCode.NOT_FOUND]: {
    category: ErrorCategory.CLIENT,
    isRetryable: false,
    userFriendlyMessage: 'The requested resource was not found',
    actionRequired: 'Check resource exists',
  },
  [ErrorCode.NETWORK_ERROR]: {
    category: ErrorCategory.NETWORK,
    isRetryable: true,
    userFriendlyMessage: 'Network connection failed. Please try again',
    actionRequired: 'Check internet connection',
  },
  [ErrorCode.RATE_LIMITED]: {
    category: ErrorCategory.EXTERNAL_SERVICE,
    isRetryable: true,
    userFriendlyMessage:
      'Too many requests. Please wait a moment and try again',
    actionRequired: 'Wait before retrying',
  },
  [ErrorCode.INTERNAL_SERVER_ERROR]: {
    category: ErrorCategory.SYSTEM,
    isRetryable: true,
    userFriendlyMessage: 'Something went wrong. Please try again later',
    actionRequired: 'Retry or contact support',
  },
  [ErrorCode.AI_SERVICE_ERROR]: {
    category: ErrorCategory.AI_SERVICE,
    isRetryable: true,
    userFriendlyMessage: 'AI service is temporarily unavailable',
    actionRequired: 'Try again later',
  },
  [ErrorCode.DATABASE_ERROR]: {
    category: ErrorCategory.DATABASE,
    isRetryable: true,
    userFriendlyMessage: 'Data service is temporarily unavailable',
    actionRequired: 'Try again later',
  },
  [ErrorCode.NETWORK_OFFLINE]: {
    category: ErrorCategory.NETWORK,
    isRetryable: true,
    userFriendlyMessage:
      'You appear to be offline. Please check your connection',
    actionRequired: 'Check internet connection',
  },
  // Add default metadata for remaining error codes
  [ErrorCode.INVALID_CREDENTIALS]: {
    category: ErrorCategory.AUTHENTICATION,
    isRetryable: false,
    userFriendlyMessage: 'Invalid credentials provided',
  },
  [ErrorCode.INVALID_INPUT]: {
    category: ErrorCategory.VALIDATION,
    isRetryable: false,
    userFriendlyMessage: 'Invalid input provided',
  },
  [ErrorCode.MISSING_REQUIRED_FIELD]: {
    category: ErrorCategory.VALIDATION,
    isRetryable: false,
    userFriendlyMessage: 'Required field is missing',
  },
  [ErrorCode.ALREADY_EXISTS]: {
    category: ErrorCategory.VALIDATION,
    isRetryable: false,
    userFriendlyMessage: 'Resource already exists',
  },
  [ErrorCode.RESOURCE_CONFLICT]: {
    category: ErrorCategory.VALIDATION,
    isRetryable: false,
    userFriendlyMessage: 'Resource conflict detected',
  },
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: {
    category: ErrorCategory.EXTERNAL_SERVICE,
    isRetryable: true,
    userFriendlyMessage: 'External service error',
  },
  [ErrorCode.TIMEOUT]: {
    category: ErrorCategory.NETWORK,
    isRetryable: true,
    userFriendlyMessage: 'Request timed out',
  },
  [ErrorCode.CONNECTION_ERROR]: {
    category: ErrorCategory.DATABASE,
    isRetryable: true,
    userFriendlyMessage: 'Connection error',
  },
  [ErrorCode.AI_QUOTA_EXCEEDED]: {
    category: ErrorCategory.AI_SERVICE,
    isRetryable: false,
    userFriendlyMessage: 'AI quota exceeded',
  },
  [ErrorCode.AI_MODEL_UNAVAILABLE]: {
    category: ErrorCategory.AI_SERVICE,
    isRetryable: true,
    userFriendlyMessage: 'AI model unavailable',
  },
  [ErrorCode.SERVICE_UNAVAILABLE]: {
    category: ErrorCategory.SYSTEM,
    isRetryable: true,
    userFriendlyMessage: 'Service unavailable',
  },
  [ErrorCode.MAINTENANCE_MODE]: {
    category: ErrorCategory.SYSTEM,
    isRetryable: true,
    userFriendlyMessage: 'System under maintenance',
  },
  [ErrorCode.CLIENT_ERROR]: {
    category: ErrorCategory.CLIENT,
    isRetryable: false,
    userFriendlyMessage: 'Client error',
  },
  [ErrorCode.UNKNOWN_ERROR]: {
    category: ErrorCategory.SYSTEM,
    isRetryable: false,
    userFriendlyMessage: 'Unknown error occurred',
  },
};

// User Types
export interface User {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  displayName: string | null;
  avatar: string | null;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  id: string;
  email?: string;
}

// Chat Message Types
export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  chatRoomId: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  metadata?: Record<string, unknown>;
  isBot: boolean;
  parentMessageId?: string;
  reactions?: MessageReaction[];
  createdAt: string;
  updatedAt: string;
}

export interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface MessageWithSender {
  id: string;
  content: string;
  chatId: string;
  senderId: string;
  type: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  sender: {
    id: string;
    email: string;
    profile: {
      displayName: string | null;
      avatar: string | null;
    } | null;
  };
}

// Chat Room Types
export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  type: 'direct' | 'group' | 'bot' | 'global';
  isPrivate: boolean;
  createdBy?: string;
  participantCount?: number;
  memberCount?: number;
  lastActivity?: string;
  lastMessage?: {
    id: string;
    content: string;
    senderName: string;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ChatWithMessages {
  id: string;
  name: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  messages: MessageWithSender[];
}

export interface ChatParticipant {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface UserChat {
  id: string;
  name: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: {
    content: string;
    createdAt: Date;
    sender: {
      profile: {
        displayName: string | null;
      } | null;
    } | null;
  };
}

// Bot Personality Types
export interface BotPersonality {
  id: string;
  name: string;
  description: string;
  prompt?: string;
  avatar?: string | null;
  personality?: string;
  category?: string;
  isActive: boolean;
  isFeatured?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Legacy AIBot interface for backward compatibility
export interface AIBot extends BotPersonality {
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Typing and Presence Types
export interface TypingUser {
  userId: string;
  username: string;
  timestamp: number;
}

// AI Service Types
export interface SummarizeRequest {
  content: string;
  maxLength?: number;
}

export interface SummarizeResponse {
  success: boolean;
  jobId: string;
  summary?: string;
}

export interface TranslateRequest {
  content: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

export interface TranslateResponse {
  success: boolean;
  jobId: string;
  translatedText?: string;
  detectedLanguage?: string;
}

export interface DetectLanguageRequest {
  content: string;
}

export interface DetectLanguageResponse {
  language: string;
  confidence: number;
}

export interface GenerateResponseRequest {
  message: string;
  botId: string;
  chatHistory?: ChatMessage[];
  context?: Record<string, unknown>;
}

export interface GenerateResponseResponse {
  success: boolean;
  jobId: string;
  response?: string;
}

export interface AIUsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
}

// API Request/Response Types
export interface CreateChatRequest {
  name?: string;
  description?: string;
  type: 'direct' | 'group' | 'bot';
  isPrivate?: boolean;
  participantIds?: string[];
}

export interface UpdateChatRequest {
  name?: string;
  description?: string;
  isPrivate?: boolean;
}

export interface SendMessageRequest {
  content: string;
  chatRoomId: string;
  messageType?: 'text' | 'image' | 'file';
  metadata?: Record<string, unknown>;
  parentMessageId?: string;
}

export interface UpdateMessageRequest {
  content?: string;
  metadata?: Record<string, any>;
}

export interface CreateBotRequest {
  name: string;
  description: string;
  prompt: string;
  avatar?: string;
  category?: string;
}

export interface UpdateBotRequest extends Partial<CreateBotRequest> {
  isActive?: boolean;
  isFeatured?: boolean;
}

// Paginated Response Types
export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
  total?: number;
}

export interface MessagesResponse extends PaginatedResponse<ChatMessage> {
  messages: ChatMessage[];
}

export interface ChatsResponse extends PaginatedResponse<ChatRoom> {
  chats: ChatRoom[];
}

// Realtime Event Types
export interface RealtimePayload<T = Record<string, unknown>> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: T;
  old?: T;
  schema: string;
  table: string;
}

export interface MessagePayload {
  id: string;
  content: string;
  chatId: string;
  senderId: string;
  type: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ChatPayload {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfilePayload {
  id: string;
  userId: string;
  displayName: string | null;
  avatar: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BotPersonalityPayload {
  id: string;
  name: string;
  description: string;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatParticipantPayload {
  id: string;
  chatId: string;
  userId: string;
  role: string;
  joinedAt: string;
  leftAt: string | null;
}
