import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

interface ValkeyConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  retryDelayOnFailover: number;
  enableReadyCheck: boolean;
  maxRetriesPerRequest: null;
}

@Injectable()
export class ValkeyService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly subscriber: Redis;
  private readonly publisher: Redis;

  constructor(private configService: ConfigService) {
    const valkeyConfig = this.configService.get<ValkeyConfig>('valkey')!;

    // Main client for general operations
    this.client = new Redis(valkeyConfig);

    // Dedicated connections for pub/sub
    this.subscriber = new Redis(valkeyConfig);
    this.publisher = new Redis(valkeyConfig);
  }

  getClient(): Redis {
    return this.client;
  }

  getSubscriber(): Redis {
    return this.subscriber;
  }

  getPublisher(): Redis {
    return this.publisher;
  }

  async onModuleDestroy() {
    await Promise.all([
      this.client.quit(),
      this.subscriber.quit(),
      this.publisher.quit(),
    ]);
  }
}
