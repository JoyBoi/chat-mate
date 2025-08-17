import { Test, TestingModule } from '@nestjs/testing';
import { BotsController } from './bots.controller';
import { BotsService } from './bots.service';
import { createSuccessResponse } from '@chat-mate/utils';
// Using Jest for mocking

describe('BotsController', () => {
  let controller: BotsController;
  let botsService: jest.Mocked<BotsService>;

  const mockBot = {
    id: 'bot-1',
    name: 'Test Bot',
    description: 'A test bot personality',
    prompt: 'You are a helpful test bot',
    avatar: 'test-avatar.png',
    category: 'GENERAL',
    isActive: true,
    isFeatured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFeaturedBot = {
    ...mockBot,
    id: 'bot-2',
    name: 'Featured Bot',
    isFeatured: true,
  };

  const mockBots = [mockBot, mockFeaturedBot];
  const mockActiveBots = mockBots.filter(bot => bot.isActive);
  const mockFeaturedBots = mockBots.filter(bot => bot.isFeatured);
  const mockNonFeaturedBots = mockBots.filter(bot => !bot.isFeatured);

  let getAllBotsSpy: jest.SpyInstance;
  let getActiveBotsSpy: jest.SpyInstance;
  let getFeaturedBotsSpy: jest.SpyInstance;
  let getNonFeaturedBotsSpy: jest.SpyInstance;
  let manualRotateFeaturedBotsSpy: jest.SpyInstance;

  beforeEach(async () => {
    const mockBotsService = {
      getAllBots: jest.fn(),
      getActiveBots: jest.fn(),
      getFeaturedBots: jest.fn(),
      getNonFeaturedBots: jest.fn(),
      manualRotateFeaturedBots: jest.fn(),
      rotateFeaturedBots: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BotsController],
      providers: [
        {
          provide: BotsService,
          useValue: mockBotsService,
        },
      ],
    }).compile();

    controller = module.get<BotsController>(BotsController);
    botsService = mockBotsService as unknown as jest.Mocked<BotsService>;

    getAllBotsSpy = jest.spyOn(botsService, 'getAllBots');
    getActiveBotsSpy = jest.spyOn(botsService, 'getActiveBots');
    getFeaturedBotsSpy = jest.spyOn(botsService, 'getFeaturedBots');
    getNonFeaturedBotsSpy = jest.spyOn(botsService, 'getNonFeaturedBots');
    manualRotateFeaturedBotsSpy = jest.spyOn(
      botsService,
      'manualRotateFeaturedBots'
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllBots', () => {
    it('should return all bot personalities', async () => {
      const expectedResponse = createSuccessResponse(mockBots);
      getAllBotsSpy.mockResolvedValue(expectedResponse);

      const result = await controller.getAllBots();

      expect(result).toEqual(expectedResponse);
      expect(getAllBotsSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle empty bot list', async () => {
      const expectedResponse = createSuccessResponse([]);
      getAllBotsSpy.mockResolvedValue(expectedResponse);

      const result = await controller.getAllBots();

      expect(result).toEqual(expectedResponse);
      expect(getAllBotsSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getActiveBots', () => {
    it('should return active bot personalities', async () => {
      const expectedResponse = createSuccessResponse(mockActiveBots);
      getActiveBotsSpy.mockResolvedValue(expectedResponse);

      const result = await controller.getActiveBots();

      expect(result).toEqual(expectedResponse);
      expect(getActiveBotsSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle no active bots', async () => {
      const expectedResponse = createSuccessResponse([]);
      getActiveBotsSpy.mockResolvedValue(expectedResponse);

      const result = await controller.getActiveBots();

      expect(result).toEqual(expectedResponse);
      expect(getActiveBotsSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getFeaturedBots', () => {
    it('should return featured bot personalities', async () => {
      const expectedResponse = createSuccessResponse(mockFeaturedBots);
      getFeaturedBotsSpy.mockResolvedValue(expectedResponse);

      const result = await controller.getFeaturedBots();

      expect(result).toEqual(expectedResponse);
      expect(getFeaturedBotsSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle no featured bots', async () => {
      const expectedResponse = createSuccessResponse([]);
      getFeaturedBotsSpy.mockResolvedValue(expectedResponse);

      const result = await controller.getFeaturedBots();

      expect(result).toEqual(expectedResponse);
      expect(getFeaturedBotsSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getNonFeaturedBots', () => {
    it('should return non-featured bot personalities', async () => {
      const expectedResponse = createSuccessResponse(mockNonFeaturedBots);
      getNonFeaturedBotsSpy.mockResolvedValue(expectedResponse);

      const result = await controller.getNonFeaturedBots();

      expect(result).toEqual(expectedResponse);
      expect(getNonFeaturedBotsSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle no non-featured bots', async () => {
      const expectedResponse = createSuccessResponse([]);
      getNonFeaturedBotsSpy.mockResolvedValue(expectedResponse);

      const result = await controller.getNonFeaturedBots();

      expect(result).toEqual(expectedResponse);
      expect(getNonFeaturedBotsSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('manualRotateFeaturedBots', () => {
    it('should trigger manual rotation of featured bots', async () => {
      manualRotateFeaturedBotsSpy.mockResolvedValue(undefined);

      const result = await controller.manualRotateFeaturedBots();

      expect(result).toBeUndefined();
      expect(manualRotateFeaturedBotsSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle rotation errors gracefully', async () => {
      const error = new Error('Rotation failed');
      manualRotateFeaturedBotsSpy.mockRejectedValue(error);

      await expect(controller.manualRotateFeaturedBots()).rejects.toThrow(
        'Rotation failed'
      );
      expect(manualRotateFeaturedBotsSpy).toHaveBeenCalledTimes(1);
    });
  });
});
