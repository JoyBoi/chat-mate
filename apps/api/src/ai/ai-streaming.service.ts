import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from '../openai/openai.service';
import { ValkeyService } from '../valkey/valkey.service';

@Injectable()
export class AIStreamingService {
  private readonly logger = new Logger(AIStreamingService.name);

  constructor(
    private readonly openaiService: OpenAIService,
    private readonly valkeyService: ValkeyService,
  ) {}

  async processBotResponse(data: {
    chatId: string;
    userId: string;
    content: string;
    botPersonality?: string;
    conversationHistory?: string[];
  }) {
    try {
      const stream = this.openaiService.generateBotResponse(
        data.content,
        data.botPersonality || 'helpful assistant',
        data.conversationHistory,
      );

      for await (const chunk of stream) {
        await this.publishStreamChunk(
          data.chatId,
          data.userId,
          'bot-response',
          chunk,
        );
      }

      await this.publishStreamChunk(
        data.chatId,
        data.userId,
        'bot-response',
        '[DONE]',
      );
    } catch (error) {
      this.logger.error('Bot response processing failed:', error);
      await this.publishStreamChunk(
        data.chatId,
        data.userId,
        'bot-response',
        '[ERROR]',
      );
    }
  }

  async processSummarization(data: {
    chatId: string;
    userId: string;
    content: string;
  }) {
    try {
      const stream = this.openaiService.summarizeText(data.content);

      for await (const chunk of stream) {
        await this.publishStreamChunk(
          data.chatId,
          data.userId,
          'summarize',
          chunk,
        );
      }

      await this.publishStreamChunk(
        data.chatId,
        data.userId,
        'summarize',
        '[DONE]',
      );
    } catch (error) {
      this.logger.error('Summarization processing failed:', error);
      await this.publishStreamChunk(
        data.chatId,
        data.userId,
        'summarize',
        '[ERROR]',
      );
    }
  }

  async processTranslation(data: {
    chatId: string;
    userId: string;
    content: string;
    targetLanguage: string;
  }) {
    try {
      const stream = this.openaiService.translateText(
        data.content,
        data.targetLanguage,
      );

      for await (const chunk of stream) {
        await this.publishStreamChunk(
          data.chatId,
          data.userId,
          'translate',
          chunk,
        );
      }

      await this.publishStreamChunk(
        data.chatId,
        data.userId,
        'translate',
        '[DONE]',
      );
    } catch (error) {
      this.logger.error('Translation processing failed:', error);
      await this.publishStreamChunk(
        data.chatId,
        data.userId,
        'translate',
        '[ERROR]',
      );
    }
  }

  private async publishStreamChunk(
    chatId: string,
    userId: string,
    type: string,
    chunk: string,
  ) {
    const channel = `ai-stream:${chatId}:${userId}:${type}`;
    await this.valkeyService.getPublisher().publish(channel, chunk);
  }
}
