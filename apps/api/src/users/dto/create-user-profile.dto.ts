import { IsOptional, IsString, IsObject } from 'class-validator';

export class CreateUserProfileDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;
}
