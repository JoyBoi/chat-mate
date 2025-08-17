import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { GuestAuthService } from './guest-auth.service';
import { GuestAuthController } from './guest-auth.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    SupabaseModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [GuestAuthController],
  providers: [JwtStrategy, GuestAuthService],
  exports: [JwtStrategy, GuestAuthService],
})
export class AuthModule {}
