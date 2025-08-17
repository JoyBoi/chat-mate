import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import {
  AppError,
  ErrorCode,
  ErrorSeverity,
  ErrorContext,
  ErrorReport,
  ERROR_CODE_METADATA,
} from '@chat-mate/types';
import {
  ChatMateError,
  convertToAppError,
  createErrorContext,
  shouldLogError,
  shouldReportError,
} from '@chat-mate/utils';

@Injectable()
export class ErrorHandlerService {
  private readonly logger = new Logger(ErrorHandlerService.name);
  private readonly errorReports: Map<string, ErrorReport> = new Map();

  /**
   * Process and handle any error with logging, reporting, and context enrichment
   */
  handleError(error: unknown, request?: Request, userId?: string): AppError {
    const context = this.createRequestContext(request, userId);
    const appError = convertToAppError(error, context);

    // Log error if severity warrants it
    if (shouldLogError(appError)) {
      this.logError(appError);
    }

    // Report critical errors
    if (shouldReportError(appError)) {
      this.reportError(appError);
    }

    return appError;
  }

  /**
   * Create standardized error context from request
   */
  private createRequestContext(
    request?: Request,
    userId?: string
  ): ErrorContext {
    if (!request) {
      return createErrorContext({ userId });
    }

    return createErrorContext({
      userId,
      requestId: request.headers['x-request-id'] as string,
      endpoint: request.url,
      method: request.method,
      userAgent: request.headers['user-agent'],
      additionalData: {
        ip: request.ip,
        query: request.query,
        params: request.params,
      },
    });
  }

  /**
   * Log error with structured data
   */
  private logError(appError: AppError): void {
    const logData = {
      code: appError.code,
      message: appError.message,
      severity: appError.severity,
      context: appError.context,
      stack: appError.stack,
    };

    switch (appError.severity) {
      case ErrorSeverity.CRITICAL:
        this.logger.fatal(logData, 'Critical error occurred');
        break;
      case ErrorSeverity.HIGH:
        this.logger.error(logData, 'High severity error occurred');
        break;
      case ErrorSeverity.MEDIUM:
        this.logger.warn(logData, 'Medium severity error occurred');
        break;
      case ErrorSeverity.LOW:
        this.logger.debug(logData, 'Low severity error occurred');
        break;
    }
  }

  /**
   * Report critical errors for monitoring/alerting
   */
  private reportError(appError: AppError): void {
    const reportId = this.generateReportId();
    const report: ErrorReport = {
      id: reportId,
      error: appError,
      reportedAt: new Date().toISOString(),
      resolved: false,
    };

    this.errorReports.set(reportId, report);

    // In production, this would integrate with external monitoring services
    // like Sentry, DataDog, or custom alerting systems
    this.logger.error(
      {
        reportId,
        error: appError,
      },
      'Critical error reported for monitoring'
    );
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(error: unknown): string {
    if (error instanceof ChatMateError && error.userMessage) {
      return error.userMessage;
    }

    const appError = convertToAppError(error);
    return this.getUserFriendlyMessage(appError.code);
  }

  /**
   * Get user-friendly error message using centralized metadata
   */
  private getUserFriendlyMessage(code: ErrorCode): string {
    const metadata = ERROR_CODE_METADATA[code];
    return metadata?.userFriendlyMessage || 'An unexpected error occurred';
  }

  /**
   * Get error reports (for admin/monitoring purposes)
   */
  getErrorReports(): ErrorReport[] {
    return Array.from(this.errorReports.values());
  }

  /**
   * Mark error report as resolved
   */
  resolveErrorReport(reportId: string, notes?: string): boolean {
    const report = this.errorReports.get(reportId);
    if (!report) {
      return false;
    }

    report.resolved = true;
    report.resolvedAt = new Date().toISOString();
    if (notes) {
      report.notes = notes;
    }

    return true;
  }

  private generateReportId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
