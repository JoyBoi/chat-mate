import { Controller, Get, Post } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('status')
  getSyncStatus() {
    return {
      success: true,
      data: {
        message: 'Sync service is running',
        lastSyncCheck: new Date().toISOString(),
      },
    };
  }

  @Post('check-consistency')
  async checkConsistency() {
    try {
      await this.syncService.checkDataConsistency();
      return {
        success: true,
        data: {
          message: 'Consistency check completed successfully',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to perform consistency check',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Post('force-sync')
  async forceSync() {
    try {
      await this.syncService.checkDataConsistency();
      return {
        success: true,
        data: {
          message: 'Force sync completed successfully',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to perform force sync',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get('realtime-status')
  getRealtimeStatus() {
    const status = this.syncService.getSyncStatus();
    return {
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    };
  }
}
