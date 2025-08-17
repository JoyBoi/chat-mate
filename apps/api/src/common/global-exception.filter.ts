import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}
import { ErrorHandlerService } from './error-handler.service';
import { createErrorResponse } from '@chat-mate/utils';
import { ErrorCode } from '@chat-mate/types';

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly errorHandler: ErrorHandlerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<AuthenticatedRequest>();

    // Extract user ID from request (adjust based on your auth implementation)
    const userId = request.user?.id;

    // Handle the error through centralized service
    const appError = this.errorHandler.handleError(exception, request, userId);

    // Determine HTTP status code
    const status = this.getHttpStatus(exception, appError.code);

    // Get user-friendly message
    const userMessage = this.errorHandler.getUserMessage(exception);

    // Send standardized error response
    if (exception instanceof HttpException) {
      // For HttpExceptions, return the format expected by tests
      response.status(status).json({
        error: userMessage,
        statusCode: status,
      });
    } else {
      // For other exceptions, use the standard format
      response
        .status(status)
        .json(createErrorResponse(userMessage, appError.message));
    }
  }

  private getHttpStatus(exception: unknown, errorCode: ErrorCode): number {
    // If it's already an HTTP exception, use its status
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    // Map error codes to HTTP status codes
    return this.mapErrorCodeToHttpStatus(errorCode);
  }

  private mapErrorCodeToHttpStatus(errorCode: ErrorCode): number {
    const statusMap: Record<ErrorCode, number> = {
      [ErrorCode.UNAUTHORIZED]: 401,
      [ErrorCode.FORBIDDEN]: 403,
      [ErrorCode.TOKEN_EXPIRED]: 401,
      [ErrorCode.INVALID_CREDENTIALS]: 401,
      [ErrorCode.VALIDATION_ERROR]: 400,
      [ErrorCode.INVALID_INPUT]: 400,
      [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
      [ErrorCode.NOT_FOUND]: 404,
      [ErrorCode.ALREADY_EXISTS]: 409,
      [ErrorCode.RESOURCE_CONFLICT]: 409,
      [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
      [ErrorCode.RATE_LIMITED]: 429,
      [ErrorCode.NETWORK_ERROR]: 502,
      [ErrorCode.TIMEOUT]: 504,
      [ErrorCode.DATABASE_ERROR]: 500,
      [ErrorCode.CONNECTION_ERROR]: 503,
      [ErrorCode.AI_SERVICE_ERROR]: 502,
      [ErrorCode.AI_QUOTA_EXCEEDED]: 429,
      [ErrorCode.AI_MODEL_UNAVAILABLE]: 503,
      [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
      [ErrorCode.SERVICE_UNAVAILABLE]: 503,
      [ErrorCode.MAINTENANCE_MODE]: 503,
      [ErrorCode.NETWORK_OFFLINE]: 502,
      [ErrorCode.CLIENT_ERROR]: 400,
      [ErrorCode.UNKNOWN_ERROR]: 500,
    };

    return statusMap[errorCode] || HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
