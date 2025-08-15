import { Module } from '@nestjs/common';
import { OpenAIModule } from '../openai/openai.module';
import { AIController } from './ai.controller';

@Module({
  imports: [OpenAIModule],
  controllers: [AIController],
})
export class AIModule {}
