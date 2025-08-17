import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { ValkeyService } from './valkey.service';

/**
 * Service to apply production Valkey configuration settings
 * These settings are critical for BullMQ operation in production
 */
@Injectable()
export class ValkeyConfigService implements OnModuleInit {
  private readonly logger = new Logger(ValkeyConfigService.name);

  constructor(
    private readonly valkeyService: ValkeyService,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    if (this.configService.get('NODE_ENV') === 'production') {
      await this.applyProductionSettings();
    }
  }

  /**
   * Apply critical production settings for BullMQ compatibility
   */
  private async applyProductionSettings() {
    try {
      const client = this.valkeyService.getClient();
      const productionConfig = this.configService.get<Record<string, unknown>>(
        'valkeyProduction.productionSettings'
      );

      if (!productionConfig) {
        this.logger.warn(
          'No production Valkey settings found in configuration'
        );
        return;
      }

      // Apply critical BullMQ settings
      await this.setConfigIfNeeded(client, 'maxmemory-policy', 'noeviction');

      // Apply memory settings
      const maxMemory =
        this.configService.get<string>('VALKEY_MAX_MEMORY') || '256mb';
      await this.setConfigIfNeeded(client, 'maxmemory', maxMemory);

      // Apply persistence settings
      await this.setConfigIfNeeded(client, 'appendonly', 'yes');
      await this.setConfigIfNeeded(client, 'appendfsync', 'everysec');

      // Apply connection settings
      const tcpKeepAlive =
        this.configService.get<string>('VALKEY_TCP_KEEPALIVE') || '30';
      await this.setConfigIfNeeded(client, 'tcp-keepalive', tcpKeepAlive);

      // Apply save policy
      const savePolicy =
        this.configService.get<string>('VALKEY_SAVE_POLICY') ||
        '3600 1 300 100 60 10000';
      await this.setConfigIfNeeded(client, 'save', savePolicy);

      this.logger.log('Production Valkey settings applied successfully');
    } catch (error) {
      this.logger.error('Failed to apply production Valkey settings', error);
      // Don't throw - let the application start even if config fails
    }
  }

  /**
   * Set a Redis config value only if it's different from current value
   */
  private async setConfigIfNeeded(client: Redis, key: string, value: string) {
    try {
      const currentValue = (await client.config('GET', key)) as string[];
      const currentSetting =
        Array.isArray(currentValue) && currentValue.length > 1
          ? String(currentValue[1])
          : String(currentValue);

      if (currentSetting !== value) {
        await client.config('SET', key, value);
        this.logger.log(`Set ${key} = ${value} (was: ${currentSetting})`);
      } else {
        this.logger.debug(`${key} already set to ${value}`);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to set ${key} = ${value}:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Verify critical BullMQ settings are properly configured
   */
  async verifyBullMQSettings(): Promise<boolean> {
    try {
      const client = this.valkeyService.getClient();

      // Check maxmemory-policy
      const maxMemoryPolicy: unknown = await client.config(
        'GET',
        'maxmemory-policy'
      );
      const policy =
        Array.isArray(maxMemoryPolicy) && maxMemoryPolicy.length > 1
          ? String(maxMemoryPolicy[1])
          : String(maxMemoryPolicy);

      if (policy !== 'noeviction') {
        this.logger.error(
          `CRITICAL: maxmemory-policy is '${policy}' but must be 'noeviction' for BullMQ to work properly`
        );
        return false;
      }

      // Check AOF is enabled
      const aofEnabled: unknown = await client.config('GET', 'appendonly');
      const aof =
        Array.isArray(aofEnabled) && aofEnabled.length > 1
          ? String(aofEnabled[1])
          : String(aofEnabled);

      if (aof !== 'yes') {
        this.logger.warn(
          'AOF persistence is disabled. Consider enabling for job durability in production.'
        );
      }

      this.logger.log('BullMQ compatibility settings verified');
      return true;
    } catch (error) {
      this.logger.error('Failed to verify BullMQ settings', error);
      return false;
    }
  }

  /**
   * Get current Valkey configuration for monitoring
   */
  async getConfigInfo(): Promise<Record<string, string>> {
    try {
      const client = this.valkeyService.getClient();
      const info = await client.info('memory');
      const config: unknown = await client.config('GET', '*');

      // Parse config array into object
      const configObj: Record<string, string> = {};
      if (Array.isArray(config)) {
        for (let i = 0; i < config.length; i += 2) {
          const key = config[i] as unknown;
          const value = config[i + 1] as unknown;
          if (
            typeof key === 'string' &&
            value !== undefined &&
            value !== null &&
            (typeof value === 'string' || typeof value === 'number')
          ) {
            configObj[key] = String(value);
          }
        }
      }

      return {
        ...configObj,
        memory_info: info,
      };
    } catch (error) {
      this.logger.error('Failed to get config info', error);
      return {};
    }
  }
}
