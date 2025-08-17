import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  ChatsService,
  ChatData,
  MessageData,
  BotChatResponse,
} from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/types';
import type { ApiResponse as ApiResponseType } from '@chat-mate/types';

@ApiTags('chats')
@Controller('chats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user chats' })
  @ApiResponse({
    status: 200,
    description: 'List of user chats',
  })
  async getUserChats(
    @Request() req: AuthenticatedRequest
  ): Promise<ApiResponseType<ChatData[]>> {
    return await this.chatsService.getUserChats(req.user.id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user chats by userId' })
  @ApiResponse({
    status: 200,
    description: 'List of user chats',
  })
  async getUserChatsByUserId(
    @Param('userId') userId: string
  ): Promise<ApiResponseType<ChatData[]>> {
    return await this.chatsService.getUserChats(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get chat details' })
  @ApiResponse({
    status: 200,
    description: 'Chat details',
  })
  async getChatById(
    @Param('id') chatId: string,
    @Request() req: AuthenticatedRequest
  ): Promise<ApiResponseType<ChatData>> {
    return await this.chatsService.getChatById(chatId, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new chat' })
  @ApiResponse({
    status: 201,
    description: 'Chat created successfully',
  })
  async createChat(
    @Body() createChatDto: CreateChatDto,
    @Request() req: AuthenticatedRequest
  ): Promise<ApiResponseType<ChatData>> {
    return await this.chatsService.createChat(req.user.id, createChatDto);
  }

  @Get(':chatId/messages')
  @ApiOperation({ summary: 'Get chat messages' })
  @ApiResponse({
    status: 200,
    description: 'List of chat messages',
  })
  async getChatMessages(
    @Param('chatId') chatId: string,
    @Query('userId') userId: string
  ): Promise<ApiResponseType<MessageData[]>> {
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
    @Body() createMessageDto: CreateMessageDto
  ): Promise<ApiResponseType<MessageData>> {
    return await this.chatsService.sendMessage(
      chatId,
      userId,
      createMessageDto
    );
  }

  @Get('global')
  @ApiOperation({ summary: 'Get or create global chat' })
  async getGlobalChat(): Promise<ApiResponseType<ChatData>> {
    return await this.chatsService.getGlobalChat();
  }

  @Get('bots')
  @ApiOperation({ summary: 'Get active bots' })
  async getActiveBots(): Promise<ApiResponseType<any[]>> {
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
    @Body() createMessageDto: CreateMessageDto
  ): Promise<ApiResponseType<BotChatResponse>> {
    return await this.chatsService.chatWithBot(botId, userId, createMessageDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a chat' })
  @ApiResponse({
    status: 200,
    description: 'Chat deleted successfully',
  })
  async deleteChat(
    @Param('id') chatId: string,
    @Request() req: AuthenticatedRequest
  ): Promise<ApiResponseType<{ message: string }>> {
    return await this.chatsService.deleteChat(chatId, req.user.id);
  }
}
