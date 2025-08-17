import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
} from 'class-validator';
import type { CreateChatRequest } from '@chat-mate/types';

export class CreateChatDto implements CreateChatRequest {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(['direct', 'group', 'bot'])
  type!: 'direct' | 'group' | 'bot';

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participantIds?: string[];
}
