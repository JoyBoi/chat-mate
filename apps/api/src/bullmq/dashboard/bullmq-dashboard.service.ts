import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';

export interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

export interface JobSummary {
  id: string;
  name: string;
  data: unknown;
  progress: number;
  state: string;
  createdAt: Date;
  processedAt?: Date;
  finishedAt?: Date;
  failedReason?: string;
}

@Injectable()
export class BullMQDashboardService {
  private readonly logger = new Logger(BullMQDashboardService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue('ai-jobs') private readonly aiJobsQueue: Queue,
    @InjectQueue('ai-streaming') private readonly aiStreamingQueue: Queue
  ) {}

  /**
   * Get comprehensive stats for all queues
   */
  async getAllQueueStats(): Promise<QueueStats[]> {
    const queues = [this.aiJobsQueue, this.aiStreamingQueue];
    const stats: QueueStats[] = [];

    for (const queue of queues) {
      try {
        const [waiting, active, completed, failed, delayed] = await Promise.all(
          [
            queue.getWaiting(),
            queue.getActive(),
            queue.getCompleted(),
            queue.getFailed(),
            queue.getDelayed(),
          ]
        );

        const isPaused = await queue.isPaused();

        stats.push({
          name: queue.name,
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
          delayed: delayed.length,
          paused: isPaused,
        });
      } catch (error) {
        this.logger.error(
          `Failed to get stats for queue ${queue.name}:`,
          error
        );
        stats.push({
          name: queue.name,
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          paused: false,
        });
      }
    }

    return stats;
  }

  /**
   * Get recent jobs from a specific queue
   */
  async getRecentJobs(
    queueName: string,
    limit: number = 10
  ): Promise<JobSummary[]> {
    const queue = this.getQueueByName(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    try {
      const jobs = await queue.getJobs(
        ['completed', 'failed', 'active'],
        0,
        limit - 1
      );

      const jobSummaries: JobSummary[] = await Promise.all(
        jobs.map(
          async (job: Job): Promise<JobSummary> => ({
            id: job.id as string,
            name: job.name,
            data: job.data,
            progress: this.normalizeProgress(job.progress),
            state: await job.getState(),
            createdAt: new Date(job.timestamp),
            processedAt: job.processedOn
              ? new Date(job.processedOn)
              : undefined,
            finishedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
            failedReason: job.failedReason,
          })
        )
      );
      return jobSummaries;
    } catch (error) {
      this.logger.error(
        `Failed to get recent jobs for queue ${queueName}:`,
        error
      );
      return [];
    }
  }

  /**
   * Get failed jobs for retry analysis
   */
  async getFailedJobs(
    queueName: string,
    limit: number = 50
  ): Promise<JobSummary[]> {
    const queue = this.getQueueByName(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    try {
      const failedJobs = await queue.getFailed(0, limit - 1);

      return failedJobs.map(
        (job: Job): JobSummary => ({
          id: job.id as string,
          name: job.name,
          data: job.data,
          progress: this.normalizeProgress(job.progress),
          state: 'failed',
          createdAt: new Date(job.timestamp),
          processedAt: job.processedOn ? new Date(job.processedOn) : undefined,
          finishedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
          failedReason: job.failedReason,
        })
      );
    } catch (error) {
      this.logger.error(
        `Failed to get failed jobs for queue ${queueName}:`,
        error
      );
      return [];
    }
  }

  /**
   * Clean old jobs from queues
   */
  async cleanOldJobs(olderThanMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    const queues = [this.aiJobsQueue, this.aiStreamingQueue];

    for (const queue of queues) {
      try {
        await queue.clean(olderThanMs, 100, 'completed');
        await queue.clean(olderThanMs, 50, 'failed');
        this.logger.log(`Cleaned old jobs from queue ${queue.name}`);
      } catch (error) {
        this.logger.error(`Failed to clean queue ${queue.name}:`, error);
      }
    }
  }

  /**
   * Pause/Resume queue operations
   */
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.getQueueByName(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.pause();
    this.logger.log(`Queue ${queueName} paused`);
  }

  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.getQueueByName(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.resume();
    this.logger.log(`Queue ${queueName} resumed`);
  }

  /**
   * Get dashboard configuration
   */
  getDashboardConfig() {
    return {
      enabled: this.configService.get<boolean>(
        'BULLMQ_DASHBOARD_ENABLED',
        true
      ),
      path: this.configService.get<string>(
        'BULLMQ_DASHBOARD_PATH',
        '/admin/queues'
      ),
      auth: {
        enabled: this.configService.get<boolean>(
          'BULLMQ_DASHBOARD_AUTH',
          false
        ),
        username: this.configService.get<string>('BULLMQ_DASHBOARD_USERNAME'),
        password: this.configService.get<string>('BULLMQ_DASHBOARD_PASSWORD'),
      },
    };
  }

  private getQueueByName(name: string): Queue | null {
    switch (name) {
      case 'ai-jobs':
        return this.aiJobsQueue;
      case 'ai-streaming':
        return this.aiStreamingQueue;
      default:
        return null;
    }
  }

  private normalizeProgress(progress: unknown): number {
    if (typeof progress === 'number') {
      return Math.max(0, Math.min(100, progress));
    }
    if (typeof progress === 'string') {
      const parsed = parseFloat(progress);
      return isNaN(parsed) ? 0 : Math.max(0, Math.min(100, parsed));
    }
    if (typeof progress === 'boolean') {
      return progress ? 100 : 0;
    }
    if (progress && typeof progress === 'object' && 'percentage' in progress) {
      const progressObj = progress as { percentage: unknown };
      return this.normalizeProgress(progressObj.percentage);
    }
    return 0;
  }
}
