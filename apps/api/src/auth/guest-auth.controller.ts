import { Controller, Post, Body } from '@nestjs/common';
import { GuestAuthService } from './guest-auth.service';

interface GuestTokenResponse {
  success: boolean;
  data?: {
    token: string;
    user: {
      id: string;
      type: 'guest';
      sessionId: string;
      displayName: string;
      createdAt: Date;
    };
  };
  error?: string;
}

@Controller('auth')
export class GuestAuthController {
  constructor(private readonly guestAuthService: GuestAuthService) {}

  @Post('guest-token')
  createGuestToken(): GuestTokenResponse {
    try {
      const result = this.guestAuthService.createGuestToken();
      return {
        success: true,
        data: result,
      };
    } catch {
      return {
        success: false,
        error: 'Failed to create guest token',
      };
    }
  }
}
