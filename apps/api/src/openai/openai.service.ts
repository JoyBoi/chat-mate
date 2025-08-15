import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENROUTER_API_KEY not found in environment variables');
    }

    this.openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey || 'dummy-key',
      defaultHeaders: {
        'HTTP-Referer': 'https://chatmate.app',
        'X-Title': 'ChatMate',
      },
    });
  }

  async *streamChatCompletion(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    },
  ): AsyncGenerator<string, void, unknown> {
    try {
      const stream = await this.openai.chat.completions.create({
        model: options?.model || 'deepseek/deepseek-chat-v3-0324:free',
        messages,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 1000,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      this.logger.error('Error streaming chat completion:', error);
      throw error;
    }
  }

  summarizeText(text: string): AsyncGenerator<string, void, unknown> {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content:
          'You are a helpful assistant that summarizes text concisely and clearly.',
      },
      {
        role: 'user',
        content: `Please summarize the following text:\n\n${text}`,
      },
    ];

    return this.streamChatCompletion(messages, {
      model: 'deepseek/deepseek-chat-v3-0324:free',
      temperature: 0.3,
    });
  }

  translateText(
    text: string,
    targetLanguage: string,
  ): AsyncGenerator<string, void, unknown> {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are a professional translator. Translate the given text to ${targetLanguage}. Only provide the translation, no explanations.`,
      },
      {
        role: 'user',
        content: text,
      },
    ];

    return this.streamChatCompletion(messages, {
      model: 'deepseek/deepseek-chat-v3-0324:free',
      temperature: 0.2,
    });
  }

  generateBotResponse(
    userMessage: string,
    botPersonality: string,
    conversationHistory?: string[],
  ): AsyncGenerator<string, void, unknown> {
    const systemPrompt = this.getBotSystemPrompt(botPersonality);
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    // Add conversation history if provided
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach((msg, index) => {
        messages.push({
          role: index % 2 === 0 ? 'user' : 'assistant',
          content: msg,
        });
      });
    }

    messages.push({
      role: 'user',
      content: userMessage,
    });

    return this.streamChatCompletion(messages, {
      model: 'deepseek/deepseek-chat-v3-0324:free',
      temperature: 0.8,
    });
  }

  private getBotSystemPrompt(personality: string): string {
    const personalities: Record<string, string> = {
      friendly:
        'You are a friendly and helpful assistant. Be warm, encouraging, and supportive in your responses.',
      professional:
        'You are a professional assistant. Be formal, precise, and business-oriented in your responses.',
      casual:
        'You are a casual and laid-back assistant. Use informal language and be relaxed in your responses.',
      witty:
        'You are a witty and humorous assistant. Include clever jokes and wordplay in your responses while being helpful.',
      wise: 'You are a wise and thoughtful assistant. Provide deep insights and philosophical perspectives in your responses.',
      energetic:
        'You are an energetic and enthusiastic assistant. Be upbeat, excited, and motivational in your responses.',
    };

    return personalities[personality] || personalities.friendly;
  }
}
