import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BullMQDashboardService } from './bullmq-dashboard.service';
import { Logger } from '@nestjs/common';
import { ErrorCode } from '@chat-mate/types';
import { createErrorResponse, createSuccessResponse } from '@chat-mate/utils';

@ApiTags('BullMQ Dashboard')
@Controller('api/v1/bullmq')
export class BullMQDashboardController {
  private readonly logger = new Logger(BullMQDashboardController.name);

  constructor(private readonly dashboardService: BullMQDashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get queue statistics' })
  @ApiResponse({
    status: 200,
    description: 'Queue statistics retrieved successfully',
  })
  async getQueueStats() {
    try {
      const stats = await this.dashboardService.getAllQueueStats();
      return createSuccessResponse(stats);
    } catch (error: unknown) {
      this.logger.error('Failed to get queue stats:', error);
      return createErrorResponse(
        'Failed to retrieve queue statistics',
        ErrorCode.EXTERNAL_SERVICE_ERROR
      );
    }
  }

  @Get('jobs/recent')
  @ApiOperation({ summary: 'Get recent jobs' })
  @ApiResponse({
    status: 200,
    description: 'Recent jobs retrieved successfully',
  })
  async getRecentJobs(
    @Query('queue') queue?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10
  ) {
    try {
      const jobs = await this.dashboardService.getRecentJobs(
        queue || 'ai-jobs',
        limit
      );
      return createSuccessResponse(jobs);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to get recent jobs for ${queue || 'ai-jobs'}:`,
        error
      );
      return createErrorResponse(
        'Failed to retrieve recent jobs',
        ErrorCode.EXTERNAL_SERVICE_ERROR
      );
    }
  }

  @Get('jobs/failed')
  @ApiOperation({ summary: 'Get failed jobs' })
  @ApiResponse({
    status: 200,
    description: 'Failed jobs retrieved successfully',
  })
  async getFailedJobs(
    @Query('queue') queue?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10
  ) {
    try {
      const jobs = await this.dashboardService.getFailedJobs(
        queue || 'ai-jobs',
        limit
      );
      return createSuccessResponse(jobs);
    } catch (error: unknown) {
      this.logger.error('Failed to get failed jobs:', error);
      return createErrorResponse(
        'Failed to retrieve failed jobs',
        ErrorCode.EXTERNAL_SERVICE_ERROR
      );
    }
  }

  @Post('jobs/:jobId/retry')
  @ApiOperation({ summary: 'Retry a failed job' })
  @ApiResponse({ status: 200, description: 'Job retry initiated successfully' })
  retryJob(@Param('jobId') jobId: string) {
    try {
      // Note: Individual job retry would need to be implemented in the service
      throw new Error('Individual job retry not yet implemented');
    } catch (error: unknown) {
      this.logger.error(`Failed to retry job ${jobId}:`, error);
      return createErrorResponse(
        'Failed to retry job',
        ErrorCode.EXTERNAL_SERVICE_ERROR
      );
    }
  }

  @Post('queues/:queueName/pause')
  @ApiOperation({ summary: 'Pause a queue' })
  @ApiResponse({ status: 200, description: 'Queue paused successfully' })
  async pauseQueue(@Param('queueName') queueName: string) {
    try {
      await this.dashboardService.pauseQueue(queueName);
      return createSuccessResponse({
        message: `Queue ${queueName} paused successfully`,
      });
    } catch (error: unknown) {
      this.logger.error(`Failed to pause queue ${queueName}:`, error);
      return createErrorResponse(
        'Failed to pause queue',
        ErrorCode.EXTERNAL_SERVICE_ERROR
      );
    }
  }

  @Post('queues/:queueName/resume')
  @ApiOperation({ summary: 'Resume a queue' })
  @ApiResponse({ status: 200, description: 'Queue resumed successfully' })
  async resumeQueue(@Param('queueName') queueName: string) {
    try {
      await this.dashboardService.resumeQueue(queueName);
      return createSuccessResponse({
        message: `Queue ${queueName} resumed successfully`,
      });
    } catch (error: unknown) {
      this.logger.error(`Failed to resume queue ${queueName}:`, error);
      return createErrorResponse(
        'Failed to resume queue',
        ErrorCode.EXTERNAL_SERVICE_ERROR
      );
    }
  }

  @Delete('queues/:queueName/clean')
  @ApiOperation({ summary: 'Clean old jobs from queue' })
  @ApiResponse({ status: 200, description: 'Queue cleaned successfully' })
  async cleanQueue(
    @Param('queueName') queueName: string,
    @Query('olderThanMs', new ParseIntPipe({ optional: true }))
    olderThanMs = 86400000
  ) {
    try {
      await this.dashboardService.cleanOldJobs(olderThanMs);
      return createSuccessResponse({
        message: `Cleaned old jobs from all queues`,
      });
    } catch (error: unknown) {
      this.logger.error('Failed to clean old jobs:', error);
      return createErrorResponse(
        'Failed to clean old jobs',
        ErrorCode.EXTERNAL_SERVICE_ERROR
      );
    }
  }

  @Get('dashboard/config')
  @ApiOperation({ summary: 'Get dashboard configuration' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard config retrieved successfully',
  })
  getDashboardConfig() {
    try {
      const config = this.dashboardService.getDashboardConfig();
      return createSuccessResponse(config);
    } catch (error: unknown) {
      this.logger.error('Failed to get dashboard config', error);
      return createErrorResponse('Failed to retrieve dashboard configuration');
    }
  }
}
