import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ValkeyModule } from '../valkey/valkey.module';
import { AIJobProcessor } from './processors/ai-job.processor';
import { BullMQService } from './bullmq.service';
import { OpenAIModule } from '../openai/openai.module';
import { BullMQDashboardModule } from './dashboard/bullmq-dashboard.module';
import { BullMQDashboardService } from './dashboard/bullmq-dashboard.service';
import valkeyProductionConfig from '../config/valkey-production.config';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    ConfigModule.forFeature(valkeyProductionConfig),
    ValkeyModule,
    OpenAIModule,
    CommonModule,
    BullMQDashboardModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('valkey.host'),
          port: configService.get<number>('valkey.port'),
          password: configService.get<string>('valkey.password'),
          db: configService.get<number>('valkey.db'),
          maxRetriesPerRequest: null,
          enableOfflineQueue: false, // Disable for Queue instances to prevent connection issues
          lazyConnect: true, // Connect only when needed
          enableReadyCheck: false, // Disable for better BullMQ compatibility
          family: 4, // Use IPv4
          keepAlive: true,
          connectTimeout: 30000,
          commandTimeout: 30000,
          retryDelayOnClusterDown: 300,
          retryDelayOnFailover: 100,
        },
        defaultJobOptions: {
          removeOnComplete: 10,
          removeOnFail: 5,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: 'ai-jobs',
      },
      {
        name: 'ai-streaming',
      }
    ),
  ],
  providers: [AIJobProcessor, BullMQService, BullMQDashboardService],
  exports: [BullMQService, BullMQDashboardService],
})
export class BullMQModule {}
