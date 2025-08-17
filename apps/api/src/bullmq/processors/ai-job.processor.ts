import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { OpenAIService } from '../../openai/openai.service';
import { ValkeyService } from '../../valkey/valkey.service';
import { AIJobData, AIJobResult } from '../bullmq.service';
import { ErrorHandlerService } from '../../common/error-handler.service';
import { ErrorCode } from '@chat-mate/types';

// Job-specific error types for retry strategies
enum JobErrorType {
  RETRYABLE = 'retryable',
  NON_RETRYABLE = 'non_retryable',
  RATE_LIMITED = 'rate_limited',
}

interface JobProcessingError extends Error {
  type: JobErrorType;
  retryAfter?: number;
  errorCode?: ErrorCode;
}

@Injectable()
@Processor('ai-jobs')
export class AIJobProcessor extends WorkerHost {
  private readonly logger = new Logger(AIJobProcessor.name);

  constructor(
    private readonly openAIService: OpenAIService,
    private readonly valkeyService: ValkeyService,
    private readonly errorHandler: ErrorHandlerService
  ) {
    super();
  }

  async process(job: Job<AIJobData>): Promise<AIJobResult> {
    const { type, text, userId, chatId, botId, targetLanguage, metadata } =
      job.data;
    const attemptNumber = job.attemptsMade + 1;
    const maxAttempts = job.opts.attempts || 3;

    this.logger.log(
      `Processing ${type} job ${job.id} for user ${userId} (attempt ${attemptNumber}/${maxAttempts})`
    );

    try {
      // Validate input data
      this.validateJobData(job.data);

      // Update progress to indicate processing started
      await job.updateProgress(10);

      let result: string;

      switch (type) {
        case 'summarize':
          await job.updateProgress(25);
          result = await this.processWithRetry(
            () =>
              this.processStreamingResponse(
                this.openAIService.summarizeText(text)
              ),
            job
          );
          break;

        case 'translate':
          await job.updateProgress(25);
          result = await this.processWithRetry(
            () =>
              this.processStreamingResponse(
                this.openAIService.translateText(text, targetLanguage!)
              ),
            job
          );
          break;

        case 'bot-response':
          await job.updateProgress(25);
          result = await this.processWithRetry(
            () =>
              this.processStreamingResponse(
                this.openAIService.generateBotResponse(text, botId!)
              ),
            job
          );

          // Publish bot response to chat room via pub/sub
          await job.updateProgress(75);
          await this.publishBotResponse(chatId!, result, botId!, metadata);
          break;

        default: {
          const error = new Error(
            `Unknown job type: ${type as string}`
          ) as JobProcessingError;
          error.type = JobErrorType.NON_RETRYABLE;
          throw error;
        }
      }

      // Update job progress to completion
      await job.updateProgress(100);

      this.logger.log(`Completed ${type} job ${job.id}`);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return this.handleJobError(job, error as JobProcessingError);
    }
  }

  private validateJobData(data: AIJobData): void {
    if (!data.text || data.text.trim().length === 0) {
      const error = new Error('Text content is required') as JobProcessingError;
      error.type = JobErrorType.NON_RETRYABLE;
      throw error;
    }

    if (data.type === 'translate' && !data.targetLanguage) {
      const error = new Error(
        'Target language is required for translation'
      ) as JobProcessingError;
      error.type = JobErrorType.NON_RETRYABLE;
      throw error;
    }

    if (data.type === 'bot-response' && (!data.botId || !data.chatId)) {
      const error = new Error(
        'Bot ID and Chat ID are required for bot response'
      ) as JobProcessingError;
      error.type = JobErrorType.NON_RETRYABLE;
      throw error;
    }
  }

  private async processWithRetry<T>(
    operation: () => Promise<T>,
    job: Job<AIJobData>
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const processedError = this.categorizeError(error);

      // Log the error with context
      this.logger.warn(
        `Operation failed for job ${job.id}, error type: ${processedError.type}`,
        { error: processedError.message, attemptsMade: job.attemptsMade }
      );

      throw processedError;
    }
  }

  private categorizeError(error: unknown): JobProcessingError {
    const processedError: JobProcessingError = {
      name: 'JobProcessingError',
      message: error instanceof Error ? error.message : 'Unknown error',
      type: JobErrorType.RETRYABLE,
      errorCode: ErrorCode.AI_SERVICE_ERROR,
      ...(error instanceof Error && { stack: error.stack }),
    };

    const errorObj = error as {
      status?: number;
      code?: string;
      message?: string;
    };

    // Rate limiting errors
    if (errorObj.status === 429 || errorObj.message?.includes('rate limit')) {
      processedError.type = JobErrorType.RATE_LIMITED;
      processedError.errorCode = ErrorCode.RATE_LIMITED;
      processedError.retryAfter = this.extractRetryAfter(error);
      return processedError;
    }

    // Network/timeout errors - retryable
    if (
      errorObj.code === 'ECONNRESET' ||
      errorObj.code === 'ETIMEDOUT' ||
      errorObj.code === 'ENOTFOUND' ||
      errorObj.message?.includes('timeout') ||
      errorObj.message?.includes('network')
    ) {
      processedError.type = JobErrorType.RETRYABLE;
      processedError.errorCode = errorObj.message?.includes('timeout')
        ? ErrorCode.TIMEOUT
        : ErrorCode.NETWORK_ERROR;
      return processedError;
    }

    // OpenAI API errors
    if (errorObj.status) {
      if (errorObj.status >= 500) {
        // Server errors - retryable
        processedError.type = JobErrorType.RETRYABLE;
        processedError.errorCode = ErrorCode.AI_SERVICE_ERROR;
      } else if (errorObj.status >= 400 && errorObj.status < 500) {
        // Client errors - non-retryable
        processedError.type = JobErrorType.NON_RETRYABLE;
        processedError.errorCode = ErrorCode.AI_SERVICE_ERROR;
      }
      return processedError;
    }

    // Default to retryable for unknown errors
    processedError.type = JobErrorType.RETRYABLE;
    return processedError;
  }

  private extractRetryAfter(error: unknown): number {
    // Try to extract retry-after header or use default
    if (error && typeof error === 'object' && 'headers' in error) {
      const errorWithHeaders = error as { headers?: Record<string, string> };
      const retryAfterHeader = errorWithHeaders.headers?.['retry-after'];
      if (retryAfterHeader && typeof retryAfterHeader === 'string') {
        const retryAfterSeconds = parseInt(retryAfterHeader, 10);
        if (!isNaN(retryAfterSeconds)) {
          return retryAfterSeconds * 1000;
        }
      }
    }
    return 60000; // Default 1 minute
  }

  private async handleJobError(
    job: Job<AIJobData>,
    error: JobProcessingError
  ): Promise<AIJobResult> {
    const { type, userId } = job.data;
    const attemptNumber = job.attemptsMade + 1;
    const maxAttempts = job.opts.attempts || 3;

    this.logger.error(
      `Failed to process ${type} job ${job.id} for user ${userId} (attempt ${attemptNumber}/${maxAttempts}):`,
      {
        error: error.message,
        errorType: error.type,
        stack: error.stack,
      }
    );

    // Handle non-retryable errors
    if (error.type === JobErrorType.NON_RETRYABLE) {
      this.logger.error(
        `Non-retryable error for job ${job.id}, moving to failed state`
      );
      throw error; // This will cause the job to fail immediately
    }

    // Handle rate limiting
    if (error.type === JobErrorType.RATE_LIMITED && error.retryAfter) {
      this.logger.warn(
        `Rate limited for job ${job.id}, will retry after ${error.retryAfter}ms`
      );
      // BullMQ will handle the retry delay based on backoff settings
    }

    // If this is the last attempt, log final failure
    if (attemptNumber >= maxAttempts) {
      this.logger.error(
        `Job ${job.id} failed after ${maxAttempts} attempts, moving to dead letter queue`
      );

      // Optionally notify about final failure
      await this.notifyJobFailure(job, error);
    }

    // Re-throw to let BullMQ handle retry logic
    throw error;
  }

  private async notifyJobFailure(
    job: Job<AIJobData>,
    error: JobProcessingError
  ): Promise<void> {
    try {
      const { chatId, userId, type } = job.data;

      if (chatId) {
        const publisher = this.valkeyService.getPublisher();
        const failureMessage = {
          type: 'job-failed',
          jobId: job.id,
          jobType: type,
          userId,
          error: error.message,
          timestamp: new Date().toISOString(),
        };

        await publisher.publish(
          `chat:${chatId}`,
          JSON.stringify(failureMessage)
        );
      }
    } catch (notificationError) {
      this.logger.error(
        `Failed to notify job failure for job ${job.id}:`,
        notificationError
      );
    }
  }

  private async processStreamingResponse(
    stream: AsyncGenerator<string, void, unknown>
  ): Promise<string> {
    let fullResponse = '';
    let chunkCount = 0;
    const maxChunks = 1000; // Prevent infinite loops

    try {
      for await (const chunk of stream) {
        if (++chunkCount > maxChunks) {
          throw new Error('Stream exceeded maximum chunk limit');
        }
        fullResponse += chunk;
      }
    } catch (error) {
      this.logger.error('Error processing streaming response:', error);
      throw error;
    }

    if (fullResponse.trim().length === 0) {
      throw new Error('Received empty response from AI service');
    }

    return fullResponse;
  }

  private async publishBotResponse(
    chatId: string,
    response: string,
    botId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const publisher = this.valkeyService.getPublisher();

    const message = {
      type: 'bot-response',
      chatId,
      botId,
      response,
      timestamp: new Date().toISOString(),
      metadata,
    };

    await publisher.publish(`chat:${chatId}`, JSON.stringify(message));
  }
}
