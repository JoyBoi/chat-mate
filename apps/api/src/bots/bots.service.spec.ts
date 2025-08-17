/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { BotsService } from './bots.service';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';
// Using Jest for mocking
import { createSuccessResponse } from '@chat-mate/utils';

describe('BotsService', () => {
  let service: BotsService;
  let prismaService: any;
  let loggerSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  const mockBot = {
    id: 'bot-1',
    name: 'Test Bot',
    description: 'A test bot personality',
    prompt: 'You are a helpful test bot',
    avatar: 'test-avatar.png',
    category: 'GENERAL',
    isActive: true,
    isFeatured: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockFeaturedBot = {
    ...mockBot,
    id: 'bot-2',
    name: 'Featured Bot',
    isFeatured: true,
  };

  const mockInactiveBot = {
    ...mockBot,
    id: 'bot-3',
    name: 'Inactive Bot',
    isActive: false,
  };

  const mockBots = [mockBot, mockFeaturedBot, mockInactiveBot];

  beforeEach(async () => {
    const mockPrismaService = {
      botPersonality: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      featuredBotRotation: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BotsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BotsService>(BotsService);
    prismaService = mockPrismaService;

    // Directly assign the mock to ensure it's available
    (service as any).prisma = mockPrismaService;
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllBots', () => {
    it('should return all bots ordered by name', async () => {
      prismaService.botPersonality.findMany.mockResolvedValue(mockBots);

      const result = await service.getAllBots();

      expect(result).toEqual(createSuccessResponse(mockBots));
      expect(prismaService.botPersonality.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
          description: true,
          prompt: true,
          avatar: true,
          category: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
    });

    it('should handle empty bot list', async () => {
      prismaService.botPersonality.findMany.mockResolvedValue([]);

      const result = await service.getAllBots();

      expect(result).toEqual(createSuccessResponse([]));
    });
  });

  describe('getActiveBots', () => {
    it('should return only active bots ordered by featured status and name', async () => {
      const activeBots = mockBots.filter(bot => bot.isActive);
      prismaService.botPersonality.findMany.mockResolvedValue(activeBots);

      const result = await service.getActiveBots();

      expect(result).toEqual(createSuccessResponse(activeBots));
      expect(prismaService.botPersonality.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          prompt: true,
          avatar: true,
          category: true,
          isActive: true,
          isFeatured: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
      });
    });
  });

  describe('getFeaturedBots', () => {
    it('should return only active and featured bots', async () => {
      const featuredBots = mockBots.filter(
        bot => bot.isActive && bot.isFeatured
      );
      prismaService.botPersonality.findMany.mockResolvedValue(featuredBots);

      const result = await service.getFeaturedBots();

      expect(result).toEqual(createSuccessResponse(featuredBots));
      expect(prismaService.botPersonality.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          isFeatured: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          prompt: true,
          avatar: true,
          category: true,
          isActive: true,
          isFeatured: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
    });
  });

  describe('getNonFeaturedBots', () => {
    it('should return only active and non-featured bots', async () => {
      const nonFeaturedBots = mockBots.filter(
        bot => bot.isActive && !bot.isFeatured
      );
      prismaService.botPersonality.findMany.mockResolvedValue(nonFeaturedBots);

      const result = await service.getNonFeaturedBots();

      expect(result).toEqual(createSuccessResponse(nonFeaturedBots));
      expect(prismaService.botPersonality.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          isFeatured: false,
        },
        select: {
          id: true,
          name: true,
          description: true,
          prompt: true,
          avatar: true,
          category: true,
          isActive: true,
          isFeatured: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
    });
  });

  describe('rotateFeaturedBots', () => {
    const mockWeekStart = new Date('2024-01-01');

    beforeEach(() => {
      jest.spyOn(service as any, 'getWeekStart').mockReturnValue(mockWeekStart);
    });

    it('should skip rotation if already exists for the week', async () => {
      prismaService.featuredBotRotation.findUnique.mockResolvedValue({
        id: 'rotation-1',
        weekStart: mockWeekStart,
        botIds: ['bot-1', 'bot-2'],
        createdAt: new Date(),
      });

      await service.rotateFeaturedBots();

      expect(loggerSpy).toHaveBeenCalledWith(
        'Rotation already exists for this week'
      );
      expect(prismaService.botPersonality.findMany).not.toHaveBeenCalled();
    });

    it('should warn and return if no active bots found', async () => {
      prismaService.featuredBotRotation.findUnique.mockResolvedValue(null);
      prismaService.botPersonality.findMany.mockResolvedValue([]);

      await service.rotateFeaturedBots();

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'No active bots found for rotation'
      );
    });

    it('should successfully rotate featured bots', async () => {
      const activeBots = [
        { id: 'bot-1', name: 'Bot 1', category: 'GENERAL' },
        { id: 'bot-2', name: 'Bot 2', category: 'HUMOR' },
        { id: 'bot-3', name: 'Bot 3', category: 'TECH' },
      ];

      prismaService.featuredBotRotation.findUnique.mockResolvedValue(null);
      prismaService.botPersonality.findMany.mockResolvedValue(activeBots);
      prismaService.$transaction.mockResolvedValue([
        {} as object,
        {} as object,
        {} as object,
      ]);

      jest
        .spyOn(service as any, 'selectDiverseBots')
        .mockReturnValue(activeBots);

      await service.rotateFeaturedBots();

      expect(prismaService.$transaction).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith(
        'Featured bots rotated: Bot 1, Bot 2, Bot 3'
      );
    });

    it('should handle rotation errors', async () => {
      const error = new Error('Database error');
      prismaService.featuredBotRotation.findUnique.mockRejectedValue(error);

      await service.rotateFeaturedBots();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to rotate featured bots:',
        error
      );
    });
  });

  describe('manualRotateFeaturedBots', () => {
    it('should trigger manual rotation', async () => {
      const rotateSpy = jest
        .spyOn(service, 'rotateFeaturedBots')
        .mockResolvedValue();

      await service.manualRotateFeaturedBots();

      expect(loggerSpy).toHaveBeenCalledWith(
        'Manual bot rotation triggered...'
      );
      expect(rotateSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('selectDiverseBots', () => {
    it('should select diverse bots from different categories', () => {
      const bots = [
        { id: 'bot-1', name: 'Bot 1', category: 'GENERAL' },
        { id: 'bot-2', name: 'Bot 2', category: 'HUMOR' },
        { id: 'bot-3', name: 'Bot 3', category: 'TECH' },
        { id: 'bot-4', name: 'Bot 4', category: 'GENERAL' },
        { id: 'bot-5', name: 'Bot 5', category: null },
      ];

      const result = (service as any).selectDiverseBots(bots, 3);

      expect(result).toHaveLength(3);
      // Should include at least one from each category
      const categories = result.map((bot: any) => bot.category || 'GENERAL');
      expect(new Set(categories).size).toBeGreaterThan(1);
    });

    it('should handle bots with null categories', () => {
      const bots = [
        { id: 'bot-1', name: 'Bot 1', category: null },
        { id: 'bot-2', name: 'Bot 2', category: null },
      ];

      const result = (service as any).selectDiverseBots(bots, 2);

      expect(result).toHaveLength(2);
    });

    it('should not exceed requested count', () => {
      const bots = [
        { id: 'bot-1', name: 'Bot 1', category: 'GENERAL' },
        { id: 'bot-2', name: 'Bot 2', category: 'HUMOR' },
      ];

      const result = (service as any).selectDiverseBots(bots, 5);

      expect(result).toHaveLength(2); // Should not exceed available bots
    });
  });

  describe('getWeekStart', () => {
    it('should return the start of the week (Sunday)', () => {
      const testDate = new Date('2024-01-03'); // Wednesday
      const result = (service as any).getWeekStart(testDate);

      expect(result.getDay()).toBe(0); // Sunday
      expect(result.getDate()).toBe(31); // Dec 31, 2023 (Sunday)
    });

    it('should handle Sunday input correctly', () => {
      const testDate = new Date('2024-01-07'); // Sunday
      const result = (service as any).getWeekStart(testDate);

      expect(result.getDay()).toBe(0); // Sunday
      expect(result.getDate()).toBe(7); // Same day
    });
  });
});
