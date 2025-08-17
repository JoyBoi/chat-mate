import {
  ChatMateError,
  convertToAppError,
  createErrorContext,
} from '@chat-mate/utils';
import {
  AppError,
  ErrorCode,
  ErrorSeverity,
  ErrorContext,
} from '@chat-mate/types';
import { AxiosError } from 'axios';
import { Alert } from 'react-native';

// App-specific error handling
export class AppErrorHandler {
  private static instance: AppErrorHandler;
  private errorQueue: AppError[] = [];
  private isOnline = true;

  static getInstance(): AppErrorHandler {
    if (!AppErrorHandler.instance) {
      AppErrorHandler.instance = new AppErrorHandler();
    }
    return AppErrorHandler.instance;
  }

  /**
   * Handle errors in the React Native app
   */
  handleError(
    error: unknown,
    context?: Partial<ErrorContext>,
    showAlert = true
  ): AppError {
    const appError = convertToAppError(error, {
      ...createErrorContext(context),
      additionalData: {
        ...context?.additionalData,
        platform: 'mobile',
        isOnline: this.isOnline,
      },
    });

    // Log error for debugging
    this.logError(appError);

    // Queue error if offline
    if (!this.isOnline) {
      this.queueError(appError);
    }

    // Show user feedback if requested
    if (showAlert) {
      this.showErrorAlert(appError);
    }

    return appError;
  }

  /**
   * Handle API errors specifically
   */
  handleApiError(error: AxiosError, showAlert = true): AppError {
    let appError: AppError;

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const data = error.response.data as any;

      if (status === 401) {
        appError = convertToAppError(
          new ChatMateError({
            code: ErrorCode.UNAUTHORIZED,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
            message: data?.error || 'Unauthorized',
            userMessage: 'Please log in again',
          })
        );
      } else if (status === 403) {
        appError = convertToAppError(
          new ChatMateError({
            code: ErrorCode.FORBIDDEN,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
            message: data?.error || 'Forbidden',
            userMessage: 'Access denied',
          })
        );
      } else if (status === 404) {
        appError = convertToAppError(
          new ChatMateError({
            code: ErrorCode.NOT_FOUND,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
            message: data?.error || 'Not found',
            userMessage: 'Resource not found',
          })
        );
      } else if (status === 429) {
        appError = convertToAppError(
          new ChatMateError({
            code: ErrorCode.RATE_LIMITED,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
            message: data?.error || 'Rate limited',
            userMessage: 'Too many requests, please try again later',
            retryable: true,
          })
        );
      } else if (status >= 500) {
        appError = convertToAppError(
          new ChatMateError({
            code: ErrorCode.INTERNAL_SERVER_ERROR,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
            message: data?.error || 'Server error',
            userMessage: 'Server error, please try again',
            retryable: true,
          })
        );
      } else {
        appError = convertToAppError(
          new ChatMateError({
            code: ErrorCode.CLIENT_ERROR,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
            message: data?.error || error.message,
            userMessage: 'Request failed',
          })
        );
      }
    } else if (error.request) {
      // Network error
      appError = convertToAppError(
        new ChatMateError({
          code: ErrorCode.NETWORK_ERROR,
          message: 'Network request failed',
          userMessage:
            'Network connection issue. Please check your connection.',
          retryable: true,
        })
      );
    } else {
      // Request setup error
      appError = convertToAppError(error);
    }

    return this.handleError(appError, undefined, showAlert);
  }

  /**
   * Show error alert to user
   */
  private showErrorAlert(appError: AppError): void {
    const title = this.getAlertTitle(appError.severity);
    const message = appError.userMessage || appError.message;

    Alert.alert(title, message, [
      {
        text: 'OK',
        style: 'default',
      },
      ...(appError.retryable
        ? [
            {
              text: 'Retry',
              style: 'default' as const,
              onPress: () => this.handleRetry(appError),
            },
          ]
        : []),
    ]);
  }

  /**
   * Get alert title based on severity
   */
  private getAlertTitle(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'Critical Error';
      case ErrorSeverity.HIGH:
        return 'Error';
      case ErrorSeverity.MEDIUM:
        return 'Warning';
      case ErrorSeverity.LOW:
        return 'Notice';
      default:
        return 'Error';
    }
  }

  /**
   * Handle retry logic
   */
  private handleRetry(appError: AppError): void {
    // This would integrate with your retry mechanism
    // For now, just log the retry attempt
    console.log('Retry requested for error:', appError.code);
  }

  /**
   * Log error for debugging
   */
  private logError(appError: AppError): void {
    if (__DEV__) {
      console.group(`🚨 ${appError.severity.toUpperCase()} ERROR`);
      console.log('Code:', appError.code);
      console.log('Message:', appError.message);
      console.log('User Message:', appError.userMessage);
      console.log('Context:', appError.context);
      console.log('Retryable:', appError.retryable);
      if (appError.stack) {
        console.log('Stack:', appError.stack);
      }
      console.groupEnd();
    }
  }

  /**
   * Queue error for later processing (when offline)
   */
  private queueError(appError: AppError): void {
    this.errorQueue.push(appError);
    console.log('Error queued for later processing:', appError.code);
  }

  /**
   * Process queued errors (when back online)
   */
  processQueuedErrors(): void {
    if (this.errorQueue.length === 0) return;

    console.log(`Processing ${this.errorQueue.length} queued errors`);
    this.errorQueue.forEach(error => {
      // Process each queued error
      this.logError(error);
    });
    this.errorQueue = [];
  }

  /**
   * Set online status
   */
  setOnlineStatus(isOnline: boolean): void {
    const wasOffline = !this.isOnline;
    this.isOnline = isOnline;

    // Process queued errors when coming back online
    if (wasOffline && isOnline) {
      this.processQueuedErrors();
    }
  }

  /**
   * Create error boundary handler
   */
  createErrorBoundaryHandler() {
    return (error: Error, errorInfo: { componentStack: string }) => {
      const appError = this.handleError(
        error,
        {
          additionalData: {
            componentStack: errorInfo.componentStack,
            errorBoundary: true,
          },
        },
        false // Don't show alert for error boundary
      );

      // Log to crash reporting service in production
      if (!__DEV__) {
        // Integration with crash reporting (Crashlytics, Bugsnag, etc.)
        console.error('Error Boundary caught error:', appError);
      }
    };
  }
}

// Singleton instance
export const errorHandler = AppErrorHandler.getInstance();

// Convenience functions
export const handleError = (
  error: unknown,
  context?: Partial<ErrorContext>,
  showAlert = true
): AppError => errorHandler.handleError(error, context, showAlert);

export const handleApiError = (error: AxiosError, showAlert = true): AppError =>
  errorHandler.handleApiError(error, showAlert);

export const setOnlineStatus = (isOnline: boolean): void =>
  errorHandler.setOnlineStatus(isOnline);

export const createErrorBoundaryHandler = () =>
  errorHandler.createErrorBoundaryHandler();
