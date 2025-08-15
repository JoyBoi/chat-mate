import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ChatType } from '@prisma/client';

export class CreateChatDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ChatType)
  type?: ChatType;
}
