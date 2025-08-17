import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue, Job } from 'bullmq';

export interface AIJobData {
  type: 'summarize' | 'translate' | 'bot-response';
  text: string;
  userId: string;
  chatId?: string;
  botId?: string;
  targetLanguage?: string;
  metadata?: Record<string, unknown>;
}

export interface AIJobResult {
  success: boolean;
  data?: string;
  error?: string;
}

@Injectable()
export class BullMQService {
  constructor(
    @InjectQueue('ai-jobs') private aiJobsQueue: Queue,
    @InjectQueue('ai-streaming') private aiStreamingQueue: Queue
  ) {}

  async addAIJob(
    jobData: AIJobData,
    options?: Record<string, unknown>
  ): Promise<string> {
    const defaultOptions = this.getDefaultJobOptions(jobData.type);
    const job = await this.aiJobsQueue.add('process-ai-request', jobData, {
      ...defaultOptions,
      ...options,
    });
    return job.id!;
  }

  async addStreamingJob(
    jobData: AIJobData,
    options?: Record<string, unknown>
  ): Promise<string> {
    const defaultOptions = this.getDefaultJobOptions(jobData.type);
    const job = await this.aiStreamingQueue.add(
      'process-streaming-request',
      jobData,
      {
        ...defaultOptions,
        ...options,
      }
    );
    return job.id!;
  }

  async getJobStatus(jobId: string): Promise<{
    id: string | undefined;
    name: string;
    data: unknown;
    progress: number | string;
    returnvalue: unknown;
    failedReason?: string;
    processedOn?: number;
    finishedOn?: number;
    opts: unknown;
  } | null> {
    const job = (await this.aiJobsQueue.getJob(jobId)) as Job | null;
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      name: job.name,
      data: job.data as unknown,
      progress: typeof job.progress === 'number' ? job.progress : 0,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      opts: job.opts,
    };
  }

  async removeJob(jobId: string): Promise<void> {
    const job = (await this.aiJobsQueue.getJob(jobId)) as Job | null;
    if (job) {
      await job.remove();
    }
  }

  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.aiJobsQueue.getWaiting(),
      this.aiJobsQueue.getActive(),
      this.aiJobsQueue.getCompleted(),
      this.aiJobsQueue.getFailed(),
      this.aiJobsQueue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  private getJobPriority(type: AIJobData['type']): number {
    switch (type) {
      case 'bot-response':
        return 1; // Highest priority
      case 'summarize':
        return 2;
      case 'translate':
        return 3;
      default:
        return 5;
    }
  }

  private getDefaultJobOptions(type: AIJobData['type']) {
    const baseOptions = {
      priority: this.getJobPriority(type),
      delay: 0,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000, // Start with 2 seconds
      },
      removeOnComplete: 100, // Keep last 100 completed jobs
      removeOnFail: 50, // Keep last 50 failed jobs
    };

    // Customize options based on job type
    switch (type) {
      case 'bot-response':
        return {
          ...baseOptions,
          attempts: 5, // More retries for bot responses
          backoff: {
            type: 'exponential',
            delay: 1000, // Faster retry for real-time responses
          },
        };
      case 'summarize':
        return {
          ...baseOptions,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 3000, // Longer delay for summarization
          },
        };
      case 'translate':
        return {
          ...baseOptions,
          attempts: 4, // Translation might need more retries
          backoff: {
            type: 'exponential',
            delay: 2500,
          },
        };
      default:
        return baseOptions;
    }
  }

  async getFailedJobs(limit = 10) {
    const failedJobs = (await this.aiJobsQueue.getFailed(
      0,
      limit - 1
    )) as Job[];
    return failedJobs.map(job => ({
      id: job.id,
      name: job.name,
      data: job.data as unknown,
      failedReason: job.failedReason,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      attemptsMade: job.attemptsMade,
    }));
  }

  async retryFailedJob(jobId: string): Promise<void> {
    const job = (await this.aiJobsQueue.getJob(jobId)) as Job | null;
    if (job && (await job.isFailed())) {
      await job.retry();
    }
  }

  async retryAllFailedJobs(): Promise<number> {
    const failedJobs = (await this.aiJobsQueue.getFailed()) as Job[];
    let retriedCount = 0;

    for (const job of failedJobs) {
      try {
        await job.retry();
        retriedCount++;
      } catch {
        // Silently continue with other jobs if retry fails
      }
    }

    return retriedCount;
  }
}
