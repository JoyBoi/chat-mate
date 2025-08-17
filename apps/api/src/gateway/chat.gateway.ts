import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { Logger } from '@nestjs/common';

interface TypingData {
  chatId: string;
  userId: string;
  isTyping: boolean;
}

interface MessageData {
  chatId: string;
  content: string;
  userId: string;
}

interface JoinRoomData {
  chatId: string;
  userId: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly connectedUsers = new Map<
    string,
    { userId: string; chatId: string }
  >();

  constructor() {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userInfo = this.connectedUsers.get(client.id);
    if (userInfo) {
      // Notify others that user left
      client.to(`chat:${userInfo.chatId}`).emit('userLeft', {
        userId: userInfo.userId,
        chatId: userInfo.chatId,
      });
      this.connectedUsers.delete(client.id);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRoomData
  ) {
    const { chatId, userId } = data;
    const roomName = `chat:${chatId}`;

    // Leave previous room if any
    const previousUserInfo = this.connectedUsers.get(client.id);
    if (previousUserInfo) {
      await client.leave(`chat:${previousUserInfo.chatId}`);
    }

    // Join new room
    await client.join(roomName);
    this.connectedUsers.set(client.id, { userId, chatId });

    // Notify others about new user
    client.to(roomName).emit('userJoined', { userId, chatId });

    this.logger.log(`User ${userId} joined chat ${chatId}`);
  }

  @SubscribeMessage('sendMessage')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MessageData
  ) {
    const { chatId, content, userId } = data;
    const roomName = `chat:${chatId}`;

    // Broadcast message to all users in the chat room
    this.server.to(roomName).emit('newMessage', {
      id: `temp_${Date.now()}`, // Temporary ID, will be replaced by DB ID
      chatId,
      content,
      userId,
      createdAt: new Date().toISOString(),
    });

    this.logger.log(`Message sent in chat ${chatId} by user ${userId}`);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TypingData
  ) {
    const { chatId, userId, isTyping } = data;
    const roomName = `chat:${chatId}`;

    // Broadcast typing status to others in the room (exclude sender)
    client.to(roomName).emit('userTyping', { userId, isTyping });
  }

  @SubscribeMessage('ai-job-update')
  handleAIJobUpdate(
    @MessageBody()
    data: {
      chatId: string;
      jobId: string;
      status: string;
      result?: unknown;
    }
  ) {
    // Emit to specific chat room
    this.server.to(`chat:${data.chatId}`).emit('ai-job-update', data);
  }

  // Method to emit AI job status updates
  emitJobStatus(
    chatId: string,
    jobId: string,
    status: string,
    result?: unknown
  ) {
    this.server.to(`chat:${chatId}`).emit('jobStatus', {
      jobId,
      status,
      result,
    });
  }
}
