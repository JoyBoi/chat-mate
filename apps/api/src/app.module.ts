import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SupabaseModule } from './supabase/supabase.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ChatsModule } from './chats/chats.module';
import { BotsModule } from './bots/bots.module';

import { GatewayModule } from './gateway/gateway.module';

import { AIModule } from './ai/ai.module';
import { OpenAIModule } from './openai/openai.module';
import { RealtimeModule } from './realtime/realtime.module';
import { SyncModule } from './sync/sync.module';
import { BullMQModule } from './bullmq/bullmq.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV === 'development'
            ? {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                },
              }
            : undefined,
      },
    }),
    PrismaModule,

    AuthModule,
    SupabaseModule,
    UsersModule,
    ChatsModule,
    BotsModule,
    GatewayModule,

    AIModule,
    OpenAIModule,
    RealtimeModule,
    SyncModule,
    CommonModule,
    ...(process.env.NODE_ENV !== 'test' ? [BullMQModule] : []),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
