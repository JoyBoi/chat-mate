import { Controller, Get, Post } from '@nestjs/common';
import { SyncService } from './sync.service';
import { createSuccessResponse, createErrorResponse } from '@chat-mate/utils';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('status')
  getSyncStatus() {
    return createSuccessResponse({
      message: 'Sync service is running',
      lastSyncCheck: new Date().toISOString(),
    });
  }

  @Post('check-consistency')
  async checkConsistency() {
    try {
      await this.syncService.checkDataConsistency();
      return createSuccessResponse({
        message: 'Consistency check completed successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return createErrorResponse(
        'Failed to perform consistency check',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  @Post('force-sync')
  async forceSync() {
    try {
      await this.syncService.checkDataConsistency();
      return createSuccessResponse({
        message: 'Force sync completed successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return createErrorResponse(
        'Failed to perform force sync',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  @Get('realtime-status')
  getRealtimeStatus() {
    const status = this.syncService.getSyncStatus();
    return createSuccessResponse({
      ...status,
      timestamp: new Date().toISOString(),
    });
  }
}
