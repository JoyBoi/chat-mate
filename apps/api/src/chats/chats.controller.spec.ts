/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Test, TestingModule } from '@nestjs/testing';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { createSuccessResponse } from '@chat-mate/utils';
import type { AuthenticatedRequest } from '../common/types';
// Using Jest for mocking

describe('ChatsController', () => {
  let controller: ChatsController;
  let chatsService: any;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    profile: {
      displayName: 'Test User',
      avatar: 'avatar.png',
    },
  };

  const mockChat = {
    id: 'chat-123',
    name: 'Test Chat',
    type: 'DIRECT',
    createdAt: new Date(),
    updatedAt: new Date(),
    participants: [
      {
        userId: 'user-123',
        role: 'OWNER',
        user: mockUser,
      },
    ],
    messages: [],
  };

  const mockMessage = {
    id: 'message-123',
    content: 'Hello, world!',
    chatId: 'chat-123',
    senderId: 'user-123',
    type: 'TEXT',
    createdAt: new Date(),
    updatedAt: new Date(),
    sender: mockUser,
    metadata: {} as Record<string, unknown>,
  };

  const mockBot = {
    id: 'bot-123',
    name: 'Test Bot',
    description: 'A helpful test bot',
    avatar: 'bot-avatar.png',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCreateChatDto: CreateChatDto = {
    name: 'New Chat',
    type: 'direct',
    description: 'A new test chat',
    isPrivate: false,
    participantIds: ['user-123'],
  };

  const mockCreateMessageDto: CreateMessageDto = {
    content: 'Test message',
    messageType: 'text',
    metadata: { test: true },
  };

  beforeEach(async () => {
    const mockChatsService = {
      getUserChats: jest.fn(),
      createChat: jest.fn(),
      getChatMessages: jest.fn(),
      sendMessage: jest.fn(),
      getGlobalChat: jest.fn(),
      getActiveBots: jest.fn(),
      chatWithBot: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatsController],
      providers: [
        {
          provide: ChatsService,
          useValue: mockChatsService,
        },
      ],
    }).compile();

    controller = module.get<ChatsController>(ChatsController);
    chatsService = mockChatsService;

    // Directly assign the mock to ensure it's available
    (controller as any).chatsService = mockChatsService;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Helper to create mock authenticated request
  const createMockRequest = (userId: string): AuthenticatedRequest =>
    ({
      user: { id: userId, email: 'test@example.com' },
      headers: {},
      method: 'GET',
      url: '/chats',
      params: {},
      query: {},
      body: {},
    }) as AuthenticatedRequest;

  describe('getUserChats', () => {
    it('should return user chats', async () => {
      const expectedResponse = createSuccessResponse([mockChat]);
      const mockRequest = createMockRequest('user-123');
      chatsService.getUserChats.mockResolvedValue(expectedResponse);

      const result = await controller.getUserChats(mockRequest);

      expect(result).toEqual(expectedResponse);
      expect(chatsService.getUserChats).toHaveBeenCalledWith('user-123');
      expect(chatsService.getUserChats).toHaveBeenCalledTimes(1);
    });

    it('should handle empty chat list', async () => {
      const expectedResponse = createSuccessResponse([]);
      const mockRequest = createMockRequest('user-123');
      chatsService.getUserChats.mockResolvedValue(expectedResponse);

      const result = await controller.getUserChats(mockRequest);

      expect(result).toEqual(expectedResponse);
      expect(chatsService.getUserChats).toHaveBeenCalledWith('user-123');
      expect(chatsService.getUserChats).toHaveBeenCalledTimes(1);
    });
  });

  describe('createChat', () => {
    it('should create a new chat', async () => {
      const expectedResponse = createSuccessResponse(mockChat);
      const mockRequest = createMockRequest('user-123');
      chatsService.createChat.mockResolvedValue(expectedResponse);

      const result = await controller.createChat(
        mockCreateChatDto,
        mockRequest
      );

      expect(result).toEqual(expectedResponse);
      expect(chatsService.createChat).toHaveBeenCalledWith(
        'user-123',
        mockCreateChatDto
      );
      expect(chatsService.createChat).toHaveBeenCalledTimes(1);
    });
  });

  describe('getChatMessages', () => {
    it('should return chat messages', async () => {
      const expectedResponse = createSuccessResponse([mockMessage]);
      chatsService.getChatMessages.mockResolvedValue(expectedResponse);

      const result = await controller.getChatMessages('chat-123', 'user-123');

      expect(result).toEqual(expectedResponse);
      expect(chatsService.getChatMessages).toHaveBeenCalledWith(
        'chat-123',
        'user-123'
      );
      expect(chatsService.getChatMessages).toHaveBeenCalledTimes(1);
    });

    it('should handle empty message list', async () => {
      const expectedResponse = createSuccessResponse([]);
      chatsService.getChatMessages.mockResolvedValue(expectedResponse);

      const result = await controller.getChatMessages('chat-123', 'user-123');

      expect(result).toEqual(expectedResponse);
      expect(chatsService.getChatMessages).toHaveBeenCalledWith(
        'chat-123',
        'user-123'
      );
      expect(chatsService.getChatMessages).toHaveBeenCalledTimes(1);
    });
  });

  describe('sendMessage', () => {
    it('should send a message', async () => {
      const expectedResponse = createSuccessResponse(mockMessage);
      chatsService.sendMessage.mockResolvedValue(expectedResponse);

      const result = await controller.sendMessage(
        'chat-123',
        'user-123',
        mockCreateMessageDto
      );

      expect(result).toEqual(expectedResponse);
      expect(chatsService.sendMessage).toHaveBeenCalledWith(
        'chat-123',
        'user-123',
        mockCreateMessageDto
      );
      expect(chatsService.sendMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe('getGlobalChat', () => {
    it('should return global chat', async () => {
      const globalChat = {
        ...mockChat,
        name: 'Global Chat',
        type: 'GLOBAL',
        messages: [mockMessage],
      };
      const expectedResponse = createSuccessResponse(globalChat);
      chatsService.getGlobalChat.mockResolvedValue(expectedResponse);

      const result = await controller.getGlobalChat();

      expect(result).toEqual(expectedResponse);
      expect(chatsService.getGlobalChat).toHaveBeenCalledTimes(1);
    });
  });

  describe('getActiveBots', () => {
    it('should return active bots', async () => {
      const expectedResponse = createSuccessResponse([mockBot]);
      chatsService.getActiveBots.mockResolvedValue(expectedResponse);

      const result = await controller.getActiveBots();

      expect(result).toEqual(expectedResponse);
      expect(chatsService.getActiveBots).toHaveBeenCalledTimes(1);
    });

    it('should handle empty bot list', async () => {
      const expectedResponse = createSuccessResponse([]);
      chatsService.getActiveBots.mockResolvedValue(expectedResponse);

      const result = await controller.getActiveBots();

      expect(result).toEqual(expectedResponse);
      expect(chatsService.getActiveBots).toHaveBeenCalledTimes(1);
    });
  });

  describe('chatWithBot', () => {
    it('should handle bot chat interaction', async () => {
      const botChatResponse = {
        userMessage: mockMessage,
        botMessage: {
          ...mockMessage,
          id: 'bot-message-123',
          content: 'Bot response',
          senderId: 'system-bot',
          type: 'BOT_RESPONSE',
          sender: {
            id: 'bot-123',
            profile: {
              displayName: 'Test Bot',
              avatar: 'bot-avatar.png',
            },
          },
        },
        chat: {
          ...mockChat,
          name: 'Chat with Test Bot',
          type: 'BOT',
        },
      };
      const expectedResponse = createSuccessResponse(botChatResponse);
      chatsService.chatWithBot.mockResolvedValue(expectedResponse);

      const result = await controller.chatWithBot(
        'bot-123',
        'user-123',
        mockCreateMessageDto
      );

      expect(result).toEqual(expectedResponse);
      expect(chatsService.chatWithBot).toHaveBeenCalledWith(
        'bot-123',
        'user-123',
        mockCreateMessageDto
      );
      expect(chatsService.chatWithBot).toHaveBeenCalledTimes(1);
    });
  });
});
