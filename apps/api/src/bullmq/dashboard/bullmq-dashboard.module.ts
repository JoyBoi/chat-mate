import { Module } from '@nestjs/common';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BullMQDashboardService } from './bullmq-dashboard.service';
import { BullMQDashboardController } from './bullmq-dashboard.controller';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({ name: 'ai-jobs' }, { name: 'ai-streaming' }),
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
  ],
  controllers: [BullMQDashboardController],
  providers: [BullMQDashboardService],
  exports: [BullMQDashboardService],
})
export class BullMQDashboardModule {
  constructor(
    @InjectQueue('ai-jobs') private readonly aiJobsQueue: Queue,
    @InjectQueue('ai-streaming') private readonly aiStreamingQueue: Queue
  ) {}

  static forQueues() {
    return {
      module: BullMQDashboardModule,
      imports: [
        BullBoardModule.forFeature({
          name: 'ai-jobs',
          adapter: BullMQAdapter,
        }),
        BullBoardModule.forFeature({
          name: 'ai-streaming',
          adapter: BullMQAdapter,
        }),
      ],
    };
  }
}
