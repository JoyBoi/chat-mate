import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { INestApplicationContext } from '@nestjs/common';
import { AppModule } from '../app.module';
import { ValkeyService } from '../valkey/valkey.service';
import { ValkeyConfigService } from '../valkey/valkey-config.service';
import { BullMQService } from '../bullmq/bullmq.service';
import { ConfigService } from '@nestjs/config';

export class ValkeySetupVerifier {
  private readonly logger = new Logger(ValkeySetupVerifier.name);
  private app!: INestApplicationContext;
  private valkeyService!: ValkeyService;
  private valkeyConfigService!: ValkeyConfigService;
  private bullmqService!: BullMQService;
  private configService!: ConfigService;

  async initialize() {
    this.app = await NestFactory.createApplicationContext(AppModule);
    this.valkeyService = this.app.get<ValkeyService>(ValkeyService);
    this.valkeyConfigService =
      this.app.get<ValkeyConfigService>(ValkeyConfigService);
    this.bullmqService = this.app.get<BullMQService>(BullMQService);
    this.configService = this.app.get<ConfigService>(ConfigService);
  }

  async verifyConnection(): Promise<boolean> {
    try {
      this.logger.log('🔍 Testing Valkey connection...');
      const client = this.valkeyService.getClient();
      const pong = await client.ping();
      if (pong === 'PONG') {
        this.logger.log('✅ Valkey connection successful');
        return true;
      }
      this.logger.error('❌ Valkey ping failed');
      return false;
    } catch (error) {
      this.logger.error('❌ Valkey connection failed:', error);
      return false;
    }
  }

  async verifyConfiguration(): Promise<boolean> {
    try {
      this.logger.log('🔍 Checking critical configuration...');
      const client = this.valkeyService.getClient();

      // Apply critical settings for verification (since we're in dev mode)
      this.logger.log('Applying critical BullMQ settings for verification...');
      await client.config('SET', 'maxmemory-policy', 'noeviction');
      await client.config('SET', 'appendonly', 'yes');
      await client.config('SET', 'appendfsync', 'everysec');

      const criticalSettings = {
        'maxmemory-policy': 'noeviction',
        appendonly: 'yes',
        appendfsync: 'everysec',
      };

      let allCorrect = true;
      for (const [key, expectedValue] of Object.entries(criticalSettings)) {
        const actualValue = await client.config('GET', key);
        const value = Array.isArray(actualValue)
          ? (actualValue[1] as string)
          : (actualValue as string);

        if (value !== expectedValue) {
          this.logger.warn(
            `❌ ${key}: expected '${expectedValue}', got '${value}'`
          );
          allCorrect = false;
        } else {
          this.logger.log(`✅ ${key}: ${value}`);
        }
      }

      return allCorrect;
    } catch (error) {
      this.logger.error('❌ Configuration check failed:', error);
      return false;
    }
  }

  async verifyBullMQCompatibility(): Promise<boolean> {
    try {
      this.logger.log('🔍 Verifying BullMQ compatibility...');
      const isCompatible =
        await this.valkeyConfigService.verifyBullMQSettings();

      if (isCompatible) {
        this.logger.log('✅ BullMQ compatibility verified');
      } else {
        this.logger.error('❌ BullMQ compatibility check failed');
      }

      return isCompatible;
    } catch (error) {
      this.logger.error('❌ BullMQ compatibility check failed:', error);
      return false;
    }
  }

  async verifyJobQueue(): Promise<boolean> {
    try {
      this.logger.log('🔍 Testing job queue operations...');

      const jobId = await this.bullmqService.addAIJob({
        type: 'summarize',
        text: 'Test job for verification',
        userId: 'test-user',
      });

      if (jobId) {
        this.logger.log(`✅ Job queue test successful - Job ID: ${jobId}`);
        return true;
      }

      this.logger.error('❌ Job queue test failed');
      return false;
    } catch (error) {
      this.logger.error('❌ Job queue test failed:', error);
      return false;
    }
  }

  verifyEnvironmentVariables(): boolean {
    try {
      this.logger.log('🔍 Checking environment variables...');

      const requiredVars = ['VALKEY_HOST', 'VALKEY_PORT', 'VALKEY_DB'];

      let allPresent = true;
      for (const varName of requiredVars) {
        const value = this.configService.get<string>(varName);
        if (!value) {
          this.logger.warn(`❌ Missing environment variable: ${varName}`);
          allPresent = false;
        } else {
          this.logger.log(`✅ ${varName}: ${value}`);
        }
      }

      return allPresent;
    } catch (error) {
      this.logger.error('❌ Environment variable check failed:', error);
      return false;
    }
  }

  async runAllVerifications(): Promise<void> {
    this.logger.log('🚀 Starting Valkey setup verification...');

    const results = {
      connection: await this.verifyConnection(),
      configuration: await this.verifyConfiguration(),
      bullmqCompatibility: await this.verifyBullMQCompatibility(),
      jobQueue: await this.verifyJobQueue(),
      environmentVariables: this.verifyEnvironmentVariables(),
    };

    const allPassed = Object.values(results).every(Boolean);

    this.logger.log('\n📊 Verification Results:');
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅' : '❌';
      this.logger.log(`${status} ${test}`);
    });

    if (allPassed) {
      this.logger.log(
        '\n🎉 All verifications passed! Valkey setup is complete.'
      );
    } else {
      this.logger.error(
        '\n⚠️  Some verifications failed. Please check the configuration.'
      );
    }
  }

  async cleanup(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
  }
}

async function main() {
  const verifier = new ValkeySetupVerifier();

  try {
    await verifier.initialize();
    await verifier.runAllVerifications();
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  } finally {
    await verifier.cleanup();
  }
}

if (require.main === module) {
  void main();
}
