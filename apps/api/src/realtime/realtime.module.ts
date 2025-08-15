import { Module } from '@nestjs/common';
import { RealtimeService } from './realtime.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [SupabaseModule, PrismaModule],
  providers: [RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
