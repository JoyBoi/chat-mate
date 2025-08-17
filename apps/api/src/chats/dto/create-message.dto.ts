import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import type { SendMessageRequest } from '@chat-mate/types';

export class CreateMessageDto
  implements Omit<SendMessageRequest, 'chatRoomId'>
{
  @IsString()
  content!: string;

  @IsOptional()
  @IsEnum(['text', 'image', 'file'])
  messageType?: 'text' | 'image' | 'file';

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  parentMessageId?: string;
}
