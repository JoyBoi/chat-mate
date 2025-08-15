import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { queryKeys } from '../../lib/queryClient';

export interface SummarizeRequest {
  messageIds: string[];
  maxLength?: number;
  style?: 'brief' | 'detailed' | 'bullet-points';
}

export interface SummarizeResponse {
  summary: string;
  originalMessageCount: number;
  keyPoints?: string[];
  createdAt: string;
}

export interface TranslateRequest {
  messageId: string;
  targetLanguage: string;
  preserveFormatting?: boolean;
}

export interface TranslateResponse {
  translatedText: string;
  originalText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  createdAt: string;
}

export interface DetectLanguageRequest {
  text: string;
}

export interface DetectLanguageResponse {
  language: string;
  confidence: number;
  alternatives?: Array<{
    language: string;
    confidence: number;
  }>;
}

export interface GenerateResponseRequest {
  prompt: string;
  context?: string;
  botPersonalityId?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GenerateResponseResponse {
  response: string;
  tokensUsed: number;
  model: string;
  createdAt: string;
}

// Summarize messages
export const useSummarizeMessages = () => {
  return useMutation({
    mutationFn: async (data: SummarizeRequest): Promise<SummarizeResponse> => {
      const response = await apiClient.post('/ai/summarize', data);
      return response.data.data;
    },
  });
};

// Get cached summary if available
export const useCachedSummary = (messageIds: string[]) => {
  return useQuery({
    queryKey: queryKeys.ai.summarize(messageIds),
    queryFn: async (): Promise<SummarizeResponse | null> => {
      try {
        const response = await apiClient.get(
          `/ai/summarize/cached?messageIds=${messageIds.join(',')}`,
        );
        return response.data.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: messageIds.length > 0,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

// Translate a message
export const useTranslateMessage = () => {
  return useMutation({
    mutationFn: async (data: TranslateRequest): Promise<TranslateResponse> => {
      const response = await apiClient.post('/ai/translate', data);
      return response.data.data;
    },
  });
};

// Get cached translation if available
export const useCachedTranslation = (
  messageId: string,
  targetLanguage: string,
) => {
  return useQuery({
    queryKey: queryKeys.ai.translate(messageId, targetLanguage),
    queryFn: async (): Promise<TranslateResponse | null> => {
      try {
        const response = await apiClient.get(
          `/ai/translate/cached/${messageId}?targetLanguage=${targetLanguage}`,
        );
        return response.data.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!messageId && !!targetLanguage,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

// Detect language of text
export const useDetectLanguage = () => {
  return useMutation({
    mutationFn: async (
      data: DetectLanguageRequest,
    ): Promise<DetectLanguageResponse> => {
      const response = await apiClient.post('/ai/detect-language', data);
      return response.data.data;
    },
  });
};

// Generate AI response (for bot personalities)
export const useGenerateResponse = () => {
  return useMutation({
    mutationFn: async (
      data: GenerateResponseRequest,
    ): Promise<GenerateResponseResponse> => {
      const response = await apiClient.post('/ai/generate', data);
      return response.data.data;
    },
  });
};

// Batch translate multiple messages
export const useBatchTranslate = () => {
  return useMutation({
    mutationFn: async (data: {
      messageIds: string[];
      targetLanguage: string;
    }): Promise<TranslateResponse[]> => {
      const response = await apiClient.post('/ai/translate/batch', data);
      return response.data.data;
    },
  });
};

// Get AI usage statistics
export const useAIUsageStats = (timeframe: 'day' | 'week' | 'month') => {
  return useQuery({
    queryKey: ['ai', 'usage', timeframe],
    queryFn: async () => {
      const response = await apiClient.get(`/ai/usage?timeframe=${timeframe}`);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};
