import { Test, TestingModule } from '@nestjs/testing';
import { AIController } from './ai.controller';
import { BullMQService } from '../bullmq/bullmq.service';
// Using Jest for mocking

describe('AIController', () => {
  let controller: AIController;
  let addAIJobSpy: jest.SpyInstance;

  const mockSummarizeDto = {
    chatId: 'chat-123',
    userId: 'user-456',
    content:
      'This is a long message that needs to be summarized for better understanding.',
  };

  const mockTranslateDto = {
    chatId: 'chat-123',
    userId: 'user-456',
    content: 'Hello, how are you today?',
    targetLanguage: 'es',
  };

  const mockBotResponseDto = {
    chatId: 'chat-123',
    userId: 'user-456',
    content: 'Tell me a joke',
    message: 'Tell me a joke',
    botPersonality: 'funny',
  };

  beforeEach(async () => {
    addAIJobSpy = jest.fn();
    const mockBullMQService = {
      addAIJob: addAIJobSpy,
    } as jest.Mocked<Pick<BullMQService, 'addAIJob'>>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIController],
      providers: [
        {
          provide: BullMQService,
          useValue: mockBullMQService,
        },
      ],
    }).compile();

    controller = module.get<AIController>(AIController);

    // Directly assign the mock to ensure it's available
    (controller as unknown as { bullmqService: BullMQService }).bullmqService =
      mockBullMQService as unknown as BullMQService;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('summarize', () => {
    it('should enqueue summarization job successfully', async () => {
      const mockJob = { id: 'job-123' };
      addAIJobSpy.mockResolvedValue(mockJob);

      const result = await controller.summarize(mockSummarizeDto);

      expect(addAIJobSpy).toHaveBeenCalledWith('summarize', mockSummarizeDto);
      expect(result).toEqual({
        success: true,
        data: { jobId: 'job-123' },
      });
    });

    it('should handle summarization job failure', async () => {
      addAIJobSpy.mockRejectedValue(new Error('Queue error'));

      const result = await controller.summarize(mockSummarizeDto);

      expect(addAIJobSpy).toHaveBeenCalledWith('summarize', mockSummarizeDto);
      expect(result).toEqual({
        success: false,
        error: 'Failed to enqueue summarization job',
      });
    });
  });

  describe('translate', () => {
    it('should successfully enqueue translation job', async () => {
      const mockJob = { id: 'job-456' };
      addAIJobSpy.mockResolvedValue(mockJob);

      const result = await controller.translate(mockTranslateDto);

      expect(addAIJobSpy).toHaveBeenCalledWith('translate', mockTranslateDto);
      expect(result).toEqual({
        success: true,
        data: { jobId: 'job-456' },
      });
    });

    it('should handle translation job enqueue failure', async () => {
      addAIJobSpy.mockRejectedValue(new Error('Queue error'));

      const result = await controller.translate(mockTranslateDto);

      expect(addAIJobSpy).toHaveBeenCalledWith('translate', mockTranslateDto);
      expect(result).toEqual({
        success: false,
        error: 'Failed to enqueue translation job',
      });
    });
  });

  describe('botResponse', () => {
    it('should successfully enqueue bot response job', async () => {
      const mockJob = { id: 'job-789' };
      addAIJobSpy.mockResolvedValue(mockJob);

      const result = await controller.botResponse(mockBotResponseDto);

      expect(addAIJobSpy).toHaveBeenCalledWith(
        'botResponse',
        mockBotResponseDto
      );
      expect(result).toEqual({
        success: true,
        data: { jobId: 'job-789' },
      });
    });

    it('should use default bot personality when not provided', async () => {
      const mockJob = { id: 'job-default' };
      const dtoWithoutPersonality = {
        ...mockBotResponseDto,
        botPersonality: undefined,
      };

      addAIJobSpy.mockResolvedValue(mockJob);

      const result = await controller.botResponse(dtoWithoutPersonality);

      expect(addAIJobSpy).toHaveBeenCalledWith(
        'botResponse',
        dtoWithoutPersonality
      );
      expect(result).toEqual({
        success: true,
        data: { jobId: 'job-default' },
      });
    });

    it('should handle bot response job enqueue failure', async () => {
      addAIJobSpy.mockRejectedValue(new Error('Queue error'));

      const result = await controller.botResponse(mockBotResponseDto);

      expect(addAIJobSpy).toHaveBeenCalledWith(
        'botResponse',
        mockBotResponseDto
      );
      expect(result).toEqual({
        success: false,
        error: 'Failed to enqueue bot response job',
      });
    });
  });
});
