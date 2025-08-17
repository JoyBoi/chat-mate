import { IsOptional, IsString } from 'class-validator';
import type { UserProfile } from '@chat-mate/types';

export class CreateUserProfileDto implements Partial<UserProfile> {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}
