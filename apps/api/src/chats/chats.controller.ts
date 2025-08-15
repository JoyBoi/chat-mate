import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { CreateMessageDto } from './dto/create-message.dto';

@ApiTags('chats')
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user chats' })
  @ApiResponse({
    status: 200,
    description: 'List of user chats',
  })
  async getUserChats(@Param('userId') userId: string): Promise<any> {
    return await this.chatsService.getUserChats(userId);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new chat' })
  @ApiResponse({
    status: 201,
    description: 'Chat created successfully',
  })
  async createChat(
    @Body() createChatDto: CreateChatDto,
    @Query('userId') userId: string,
  ): Promise<any> {
    return await this.chatsService.createChat(userId, createChatDto);
  }

  @Get(':chatId/messages')
  @ApiOperation({ summary: 'Get chat messages' })
  @ApiResponse({
    status: 200,
    description: 'List of chat messages',
  })
  async getChatMessages(
    @Param('chatId') chatId: string,
    @Query('userId') userId: string,
  ): Promise<any> {
    return await this.chatsService.getChatMessages(chatId, userId);
  }

  @Post(':chatId/messages')
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
  })
  async sendMessage(
    @Param('chatId') chatId: string,
    @Query('userId') userId: string,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<any> {
    return await this.chatsService.sendMessage(
      chatId,
      userId,
      createMessageDto,
    );
  }

  @Get('global')
  @ApiOperation({ summary: 'Get or create global chat' })
  async getGlobalChat(): Promise<any> {
    return await this.chatsService.getGlobalChat();
  }

  @Get('bots')
  @ApiOperation({ summary: 'Get active bots' })
  async getActiveBots(): Promise<any> {
    return await this.chatsService.getActiveBots();
  }

  @Post('bot/:botId/chat')
  @ApiOperation({ summary: 'Chat with a specific bot' })
  @ApiResponse({
    status: 200,
    description: 'Bot response generated',
  })
  async chatWithBot(
    @Param('botId') botId: string,
    @Query('userId') userId: string,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<any> {
    return await this.chatsService.chatWithBot(botId, userId, createMessageDto);
  }
}
