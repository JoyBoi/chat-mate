import { Module } from '@nestjs/common';
import { OpenAIModule } from '../openai/openai.module';
import { BullMQModule } from '../bullmq/bullmq.module';
import { AIController } from './ai.controller';

@Module({
  imports: [
    OpenAIModule,
    ...(process.env.NODE_ENV !== 'test' ? [BullMQModule] : []),
  ],
  controllers: [AIController],
})
export class AIModule {}
