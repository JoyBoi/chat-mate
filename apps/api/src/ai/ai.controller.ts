import { Body, Controller, Post, Optional } from '@nestjs/common';
import { BullMQService } from '../bullmq/bullmq.service';
import { createSuccessResponse, createErrorResponse } from '@chat-mate/utils';
import type {
  SummarizeRequest,
  TranslateRequest,
  GenerateResponseRequest,
} from '@chat-mate/types';

export interface SummarizeDto extends SummarizeRequest {
  chatId: string;
  userId: string;
}

export interface TranslateDto extends TranslateRequest {
  chatId: string;
  userId: string;
}

export interface BotResponseDto extends Omit<GenerateResponseRequest, 'botId'> {
  chatId: string;
  userId: string;
  content: string;
  botPersonality?: string;
}

@Controller('ai')
export class AIController {
  constructor(@Optional() private readonly bullmqService?: BullMQService) {}

  @Post('summarize')
  async summarize(@Body() dto: SummarizeDto) {
    if (!this.bullmqService) {
      return createErrorResponse(
        'AI service not available in test environment'
      );
    }

    try {
      const jobId = await this.bullmqService.addAIJob({
        type: 'summarize',
        text: dto.content,
        userId: dto.userId,
        chatId: dto.chatId,
      });

      return createSuccessResponse({ jobId });
    } catch (error) {
      return createErrorResponse(
        'Failed to queue summarization job',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  @Post('translate')
  async translate(@Body() dto: TranslateDto) {
    if (!this.bullmqService) {
      return createErrorResponse(
        'AI service not available in test environment'
      );
    }

    try {
      const jobId = await this.bullmqService.addAIJob({
        type: 'translate',
        text: dto.content,
        userId: dto.userId,
        chatId: dto.chatId,
        targetLanguage: dto.targetLanguage,
      });

      return createSuccessResponse({ jobId });
    } catch {
      return createErrorResponse('Failed to enqueue translation job');
    }
  }

  @Post('bot-response')
  async botResponse(@Body() dto: BotResponseDto) {
    if (!this.bullmqService) {
      return createErrorResponse(
        'AI service not available in test environment'
      );
    }

    try {
      const jobId = await this.bullmqService.addAIJob({
        type: 'bot-response',
        text: dto.content,
        userId: dto.userId,
        chatId: dto.chatId,
        botId: dto.botPersonality || 'helpful-assistant',
      });

      return createSuccessResponse({ jobId });
    } catch {
      return createErrorResponse('Failed to enqueue bot response job');
    }
  }
}
