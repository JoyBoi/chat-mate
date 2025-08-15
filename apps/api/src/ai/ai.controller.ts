import { Body, Controller, Post } from '@nestjs/common';
import { OpenAIService } from '../openai/openai.service';

export interface SummarizeDto {
  chatId: string;
  userId: string;
  content: string;
}

export interface TranslateDto {
  chatId: string;
  userId: string;
  content: string;
  targetLanguage: string;
}

export interface BotResponseDto {
  chatId: string;
  userId: string;
  content: string;
  botPersonality?: string;
}

@Controller('ai')
export class AIController {
  constructor(private readonly openaiService: OpenAIService) {}

  @Post('summarize')
  async summarize(@Body() dto: SummarizeDto) {
    try {
      const chunks: string[] = [];
      for await (const chunk of this.openaiService.summarizeText(dto.content)) {
        chunks.push(chunk);
      }
      return {
        success: true,
        data: { summary: chunks.join('') },
      };
    } catch {
      return {
        success: false,
        error: 'Summarization failed',
      };
    }
  }

  @Post('translate')
  async translate(@Body() dto: TranslateDto) {
    try {
      const chunks: string[] = [];
      for await (const chunk of this.openaiService.translateText(
        dto.content,
        dto.targetLanguage,
      )) {
        chunks.push(chunk);
      }
      return {
        success: true,
        data: { translation: chunks.join('') },
      };
    } catch {
      return {
        success: false,
        error: 'Translation failed',
      };
    }
  }

  @Post('bot-response')
  async botResponse(@Body() dto: BotResponseDto) {
    try {
      const chunks: string[] = [];
      for await (const chunk of this.openaiService.generateBotResponse(
        dto.content,
        dto.botPersonality || 'helpful assistant',
      )) {
        chunks.push(chunk);
      }
      return {
        success: true,
        data: { response: chunks.join('') },
      };
    } catch {
      return {
        success: false,
        error: 'Bot response failed',
      };
    }
  }
}
