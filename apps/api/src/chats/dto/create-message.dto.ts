import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { MessageType } from '@prisma/client';

export class CreateMessageDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
