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

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email?: string;
  };
}

@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: AuthenticatedRequest) {
    return await this.usersService.findUserWithProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  async createOrUpdateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() createUserProfileDto: CreateUserProfileDto,
  ) {
    return await this.usersService.createOrUpdateProfile(
      req.user.userId,
      createUserProfileDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUser(@Param('id') id: string) {
    return await this.usersService.findUserWithProfile(id);
  }
}
