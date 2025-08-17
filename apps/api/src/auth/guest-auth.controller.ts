import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpException,
  HttpCode,
} from '@nestjs/common';
import { GuestAuthService } from './guest-auth.service';
import { UsersService } from '../users/users.service';
import { createSuccessResponse, createErrorResponse } from '@chat-mate/utils';
import type { ApiResponse } from '@chat-mate/types';

interface GuestRegisterDto {
  displayName: string;
  deviceId: string;
}

interface GuestLoginDto {
  deviceId: string;
}

interface GuestTokenData {
  token: string;
  user: {
    id: string;
    type: 'guest';
    sessionId: string;
    displayName: string;
    createdAt: Date;
  };
  profile?: {
    displayName: string;
  };
}

type GuestTokenResponse = ApiResponse<GuestTokenData>;

@Controller('auth')
export class GuestAuthController {
  constructor(
    private readonly guestAuthService: GuestAuthService,
    private readonly usersService: UsersService
  ) {}

  @Post('guest-token')
  createGuestToken(): GuestTokenResponse {
    try {
      const result = this.guestAuthService.createGuestToken();
      return createSuccessResponse(result);
    } catch {
      return createErrorResponse('Failed to create guest session');
    }
  }

  @Post('guest/register')
  async registerGuest(
    @Body() guestData: GuestRegisterDto
  ): Promise<GuestTokenResponse> {
    try {
      if (!guestData.displayName?.trim() || !guestData.deviceId?.trim()) {
        throw new HttpException(
          'Display name and device ID are required',
          HttpStatus.BAD_REQUEST
        );
      }

      // Check if device already exists
      const existingUser = this.guestAuthService.findByDeviceId(
        guestData.deviceId
      );
      if (existingUser) {
        throw new HttpException(
          'Device ID already exists',
          HttpStatus.CONFLICT
        );
      }

      const result = this.guestAuthService.createGuestTokenWithDevice(
        guestData.displayName,
        guestData.deviceId
      );

      // Create user and profile in database
      await this.usersService.createOrUpdateProfile(result.user.id, {
        displayName: guestData.displayName,
      });

      return createSuccessResponse({
        ...result,
        profile: { displayName: guestData.displayName },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      return createErrorResponse('Failed to register guest user');
    }
  }

  @Post('guest/login')
  @HttpCode(200)
  loginGuest(@Body() loginData: GuestLoginDto): GuestTokenResponse {
    try {
      if (!loginData.deviceId?.trim()) {
        throw new HttpException(
          'Device ID is required',
          HttpStatus.BAD_REQUEST
        );
      }

      const existingUser = this.guestAuthService.findByDeviceId(
        loginData.deviceId
      );
      if (!existingUser) {
        throw new HttpException('Device ID not found', HttpStatus.NOT_FOUND);
      }

      const result = this.guestAuthService.refreshGuestToken(existingUser);
      return createSuccessResponse(result);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      return createErrorResponse('Failed to login guest user');
    }
  }
}
