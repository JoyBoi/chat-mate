import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ValidationError } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';
import { AuthExceptionFilter } from './auth/auth-exception.filter';
import { GlobalExceptionFilter } from './common/global-exception.filter';
import { ErrorHandlerService } from './common/error-handler.service';
import { createValidationError } from '@chat-mate/utils';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (validationErrors: ValidationError[]) => {
        const messages = validationErrors.map(error => {
          return Object.values(error.constraints || {}).join(', ');
        });
        return createValidationError(
          `Validation failed: ${messages.join('; ')}`,
          'Please check your input and try again'
        );
      },
    })
  );

  // Global exception filters
  const errorHandlerService = app.get(ErrorHandlerService);
  app.useGlobalFilters(
    new GlobalExceptionFilter(errorHandlerService),
    new AuthExceptionFilter()
  );

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
