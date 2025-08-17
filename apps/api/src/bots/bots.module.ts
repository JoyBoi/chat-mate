import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BotsController } from './bots.controller';
import { BotsService } from './bots.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [BotsController],
  providers: [BotsService],
  exports: [BotsService],
})
export class BotsModule {}
