import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { createSuccessResponse } from '@chat-mate/utils';
import type { AuthUser } from '@chat-mate/types';

interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: AuthenticatedRequest) {
    const user = await this.usersService.findUserWithProfile(req.user.id);
    return createSuccessResponse(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  async createOrUpdateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() createUserProfileDto: CreateUserProfileDto
  ) {
    return await this.usersService.createOrUpdateProfile(
      req.user.id,
      createUserProfileDto
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUser(@Param('id') id: string) {
    return await this.usersService.findUserWithProfile(id);
  }
}
