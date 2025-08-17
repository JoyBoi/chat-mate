import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { createErrorResponse } from '@chat-mate/utils';
import { ErrorCode } from '@chat-mate/types';

@Catch(UnauthorizedException)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    response.status(status).json({
      ...createErrorResponse(
        exception.message || 'Authentication required',
        ErrorCode.UNAUTHORIZED
      ),
      statusCode: status,
    });
  }
}
