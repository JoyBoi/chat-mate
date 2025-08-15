import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private supabaseService: SupabaseService,
  ) {
    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret',
    };

    super(options);
  }

  validate(payload: { sub: string; email?: string }): {
    userId: string;
    email?: string;
  } {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // For Supabase JWT, the payload already contains user info
    // We can optionally verify with Supabase if needed
    return {
      userId: payload.sub,
      email: payload.email,
    };
  }
}
