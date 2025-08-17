import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private supabaseService: SupabaseService
  ) {
    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret',
    };

    super(options);
  }

  validate(payload: { sub: string; email?: string }): {
    id: string;
    email?: string;
  } {
    this.logger.log(`JWT validation attempt for user: ${payload.sub}`);
    this.logger.debug(`JWT payload: ${JSON.stringify(payload)}`);

    if (!payload.sub) {
      this.logger.error(
        'JWT validation failed: Invalid token payload - missing sub'
      );
      throw new UnauthorizedException('Invalid token payload');
    }

    const result = {
      id: payload.sub,
      email: payload.email,
    };

    this.logger.log(
      `JWT validation successful for user: ${payload.sub}, email: ${payload.email || 'N/A'}`
    );
    return result;
  }
}
