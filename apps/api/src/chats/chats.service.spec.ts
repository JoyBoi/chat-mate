/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Test, TestingModule } from '@nestjs/testing';
import { ChatsService } from './chats.service';
import { PrismaService } from '../prisma/prisma.service';
// Using Jest for mocking
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageType } from '@prisma/client';
import { createSuccessResponse } from '@chat-mate/utils';

describe('ChatsService', () => {
  let service: ChatsService;
  let prismaService: any;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    profile: {
      displayName: 'Test User',
      avatar: 'avatar.png',
    },
  };

  const mockBot = {
    id: 'bot-1',
    name: 'Test Bot',
    description: 'A test bot',
    prompt: 'You are a helpful test bot',
    avatar: 'bot-avatar.png',
    category: 'GENERAL',
    isActive: true,
    isFeatured: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockChat = {
    id: 'chat-1',
    name: 'Test Chat',
    type: 'DIRECT' as const,
    isGlobal: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    participants: [
      {
        userId: 'user-1',
        user: mockUser,
      },
    ],
    messages: [
      {
        id: 'message-1',
        content: 'Hello',
        type: MessageType.TEXT,
        senderId: 'user-1',
        sender: mockUser,
        createdAt: new Date('2024-01-01'),
      },
    ],
  };

  const mockMessage = {
    id: 'message-1',
    content: 'Test message',
    type: MessageType.TEXT,
    senderId: 'user-1',
    chatId: 'chat-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    metadata: null,
    sender: mockUser,
  };

  const mockCreateMessageDto: CreateMessageDto = {
    content: 'Test message',
    messageType: 'text',
    metadata: { test: true },
  };

  beforeEach(async () => {
    const mockPrismaService = {
      chat: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      chatParticipant: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      message: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
      },
      botPersonality: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      userProfile: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ChatsService>(ChatsService);
    prismaService = mockPrismaService;

    // Directly assign the mock to ensure it's available
    (service as any).prisma = mockPrismaService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserChats', () => {
    it('should return user chats with participants and latest message', async () => {
      const mockChats = [mockChat];
      prismaService.chat.findMany.mockResolvedValue(mockChats);

      const result = await service.getUserChats('user-1');

      expect(result).toEqual(createSuccessResponse(mockChats));
      expect(prismaService.chat.findMany).toHaveBeenCalledWith({
        where: {
          participants: {
            some: {
              userId: 'user-1',
            },
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  profile: {
                    select: {
                      displayName: true,
                      avatar: true,
                    },
                  },
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: {
              createdAt: 'desc',
            },
            include: {
              sender: {
                select: {
                  id: true,
                  email: true,
                  profile: {
                    select: {
                      displayName: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    });

    it('should handle empty chat list', async () => {
      prismaService.chat.findMany.mockResolvedValue([]);

      const result = await service.getUserChats('user-1');

      expect(result).toEqual(createSuccessResponse([]));
    });
  });

  describe('createChat', () => {
    const createChatDto = {
      name: 'New Chat',
      type: 'direct' as const,
      participantIds: ['user-1', 'user-2'],
    };

    it('should create a new chat with participants', async () => {
      const newChat = { ...mockChat, name: 'New Chat' };
      const completeChat = {
        ...newChat,
        participants: [{ userId: 'user-1', role: 'OWNER', user: mockUser }],
      };

      prismaService.chat.create.mockResolvedValue(newChat);
      prismaService.chatParticipant.create.mockResolvedValue({
        chatId: newChat.id,
        userId: 'user-1',
        role: 'OWNER',
      });
      prismaService.chat.findUnique.mockResolvedValue(completeChat);

      const result = await service.createChat('user-1', createChatDto);

      expect(result).toEqual(createSuccessResponse(completeChat));
      expect(prismaService.chat.create).toHaveBeenCalled();
      expect(prismaService.chatParticipant.create).toHaveBeenCalled();
      expect(prismaService.chat.findUnique).toHaveBeenCalled();
    });

    it('should handle chat creation with empty participant list', async () => {
      const chatWithNoParticipants = {
        ...createChatDto,
        participantIds: [],
      };
      const newChat = { ...mockChat, name: 'New Chat' };
      const completeChat = {
        ...newChat,
        participants: [{ userId: 'user-1', role: 'OWNER', user: mockUser }],
      };

      prismaService.chat.create.mockResolvedValue(newChat);
      prismaService.chatParticipant.create.mockResolvedValue({
        chatId: newChat.id,
        userId: 'user-1',
        role: 'OWNER',
      });
      prismaService.chat.findUnique.mockResolvedValue(completeChat);

      const result = await service.createChat('user-1', chatWithNoParticipants);

      expect(result).toEqual(createSuccessResponse(completeChat));
      expect(prismaService.chat.create).toHaveBeenCalled();
      expect(prismaService.chatParticipant.create).toHaveBeenCalled();
      expect(prismaService.chat.findUnique).toHaveBeenCalled();
    });
  });

  describe('getChatMessages', () => {
    it('should return chat messages for authorized user', async () => {
      const mockMessages = [mockMessage];
      prismaService.chatParticipant.findFirst.mockResolvedValue({
        userId: 'user-1',
        chatId: 'chat-1',
      });
      prismaService.message.findMany.mockResolvedValue(mockMessages);

      const result = await service.getChatMessages('chat-1', 'user-1');

      expect(result).toEqual(createSuccessResponse(mockMessages));
      expect(prismaService.chatParticipant.findFirst).toHaveBeenCalledWith({
        where: {
          chatId: 'chat-1',
          userId: 'user-1',
        },
      });
    });

    it('should throw ForbiddenException for unauthorized user', async () => {
      prismaService.chatParticipant.findFirst.mockResolvedValue(null);

      await expect(
        service.getChatMessages('chat-1', 'unauthorized-user')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('sendMessage', () => {
    it('should send message and update chat timestamp', async () => {
      const newMessage = { ...mockMessage, content: 'Test message' };
      prismaService.chatParticipant.findFirst.mockResolvedValue({
        userId: 'user-1',
        chatId: 'chat-1',
      });
      prismaService.$transaction.mockImplementation(callback => {
        return callback(prismaService);
      });
      prismaService.message.create.mockResolvedValue(newMessage);

      const result = await service.sendMessage(
        'chat-1',
        'user-1',
        mockCreateMessageDto
      );

      expect(result).toEqual(createSuccessResponse(newMessage));
      expect(prismaService.message.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException for unauthorized user', async () => {
      prismaService.chatParticipant.findFirst.mockResolvedValue(null);

      await expect(
        service.sendMessage('chat-1', 'unauthorized-user', mockCreateMessageDto)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getGlobalChat', () => {
    it('should return global chat', async () => {
      const globalChat = {
        ...mockChat,
        type: 'GLOBAL',
        messages: [mockMessage],
      };
      prismaService.chat.findFirst.mockResolvedValue(globalChat);

      const result = await service.getGlobalChat();

      expect(result).toEqual(
        createSuccessResponse({
          ...globalChat,
          messages: globalChat.messages.reverse(),
        })
      );
      expect(prismaService.chat.findFirst).toHaveBeenCalledWith({
        where: {
          type: 'GLOBAL',
        },
        include: {
          messages: {
            take: 50,
            orderBy: {
              createdAt: 'desc',
            },
            include: {
              sender: {
                select: {
                  id: true,
                  email: true,
                  profile: {
                    select: {
                      displayName: true,
                      avatar: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });

    it('should create global chat when not found', async () => {
      const newGlobalChat = {
        ...mockChat,
        name: 'Global Chat',
        type: 'GLOBAL',
        messages: [],
      };
      prismaService.chat.findFirst.mockResolvedValue(null);
      prismaService.chat.create.mockResolvedValue(newGlobalChat);

      const result = await service.getGlobalChat();

      expect(result).toEqual(
        createSuccessResponse({
          ...newGlobalChat,
          messages: newGlobalChat.messages.reverse(),
        })
      );
      expect(prismaService.chat.create).toHaveBeenCalled();
    });
  });

  describe('getActiveBots', () => {
    it('should return active bots', async () => {
      const activeBots = [mockBot];
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
          avatar: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  });

  describe('chatWithBot', () => {
    it('should create bot chat and return response', async () => {
      const botId = 'bot-1';
      const userId = 'user-1';
      const content = 'Hello bot!';
      const mockCreateMessageDto: CreateMessageDto = { content };

      const mockBot = {
        id: botId,
        name: 'TestBot',
        description: 'A test bot',
        prompt: 'You are a helpful assistant',
        avatar: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const botChat = {
        id: 'bot-chat-1',
        name: `Chat with ${mockBot.name}`,
        type: 'bot' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const userMessage = {
        id: 'msg-1',
        content,
        chatId: botChat.id,
        senderId: userId,
        type: 'TEXT' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const botResponse = {
        id: 'msg-2',
        content: 'Hello! How can I help you?',
        chatId: botChat.id,
        senderId: null,
        type: 'TEXT' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.botPersonality.findUnique.mockResolvedValue(mockBot);
      prismaService.chat.findFirst.mockResolvedValue(botChat);
      prismaService.message.findMany.mockResolvedValue([]);
      jest
        .spyOn(service as any, 'generateBotResponse')
        .mockResolvedValue('Hello! How can I help you?');
      prismaService.message.create
        .mockResolvedValueOnce(userMessage)
        .mockResolvedValueOnce(botResponse);

      const result = await service.chatWithBot(
        botId,
        userId,
        mockCreateMessageDto
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        userMessage,
        botMessage: {
          ...botResponse,
          sender: {
            id: 'bot-1',
            profile: {
              displayName: 'TestBot',
              avatar: null,
            },
          },
        },
        chat: botChat,
      });
      expect(prismaService.botPersonality.findUnique).toHaveBeenCalledWith({
        where: { id: botId, isActive: true },
      });
    });

    it('should throw NotFoundException for invalid bot', async () => {
      const botId = 'invalid-bot';
      const userId = 'user-1';
      const mockCreateMessageDto: CreateMessageDto = { content: 'Hello!' };

      prismaService.botPersonality.findUnique.mockResolvedValue(null);

      await expect(
        service.chatWithBot(botId, userId, mockCreateMessageDto)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateSimpleBotResponse', () => {
    it('should generate a simple bot response', () => {
      const response = (service as any).generateSimpleBotResponse(
        'Test Bot',
        'Hello',
        'You are a helpful bot'
      );

      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });
  });

  // Note: getOrCreateBotChat is handled internally within chatWithBot method
});
