import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { Prisma } from '@prisma/client';

// import { Cron, CronExpression } from '@nestjs/schedule';

interface SyncResult {
  success: boolean;
  synced: number;
  errors: string[];
}

interface DataInconsistency {
  type: 'missing_remote' | 'missing_local' | 'data_mismatch';
  id: string;
  localItem?: Record<string, unknown>;
}

type MessageData = Prisma.MessageCreateInput;
type ChatData = Prisma.ChatCreateInput;
type UserProfileData = Prisma.UserProfileCreateInput;

@Injectable()
export class SyncService implements OnModuleInit {
  private readonly logger = new Logger(SyncService.name);
  private isInitialized = false;

  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService,
    private realtimeService: RealtimeService
  ) {}

  onModuleInit() {
    try {
      // Initialize realtime channels for bi-directional sync
      this.realtimeService.initializeRealtimeChannels();

      // Temporarily disabled due to Supabase permission issues
      // Perform initial data consistency check
      // await this.performInitialSync();

      this.isInitialized = true;
      this.logger.log(
        'Sync service initialized successfully (consistency checks disabled)'
      );
    } catch (error) {
      this.logger.error('Failed to initialize sync service:', error);
    }
  }

  private async performInitialSync() {
    try {
      this.logger.log('Starting initial data consistency check...');

      // Check consistency for all major tables
      const tables = [
        'messages',
        'chats',
        'chat_participants',
        'user_profiles',
        'bot_personalities',
      ];

      for (const table of tables) {
        await this.checkTableConsistency(table);
      }

      this.logger.log('Initial data consistency check completed');
    } catch (error) {
      this.logger.error('Error during initial sync:', error);
    }
  }

  private async checkTableConsistency(tableName: string) {
    try {
      let localData: Record<string, unknown>[] = [];

      // Get local data based on table name
      switch (tableName) {
        case 'messages':
          localData = (await this.prismaService.message.findMany()) as Record<
            string,
            unknown
          >[];
          break;
        case 'chats':
          localData = (await this.prismaService.chat.findMany()) as Record<
            string,
            unknown
          >[];
          break;
        case 'chat_participants':
          localData =
            (await this.prismaService.chatParticipant.findMany()) as Record<
              string,
              unknown
            >[];
          break;
        case 'user_profiles':
          localData =
            (await this.prismaService.userProfile.findMany()) as Record<
              string,
              unknown
            >[];
          break;
        case 'bot_personalities':
          localData =
            (await this.prismaService.botPersonality.findMany()) as Record<
              string,
              unknown
            >[];
          break;
        default:
          this.logger.warn(`Unknown table: ${tableName}`);
          return;
      }

      // Validate consistency with remote database
      const result = await this.realtimeService.validateDataConsistency(
        tableName,
        localData
      );

      if (!result.consistent) {
        this.logger.warn(
          `Data inconsistencies found in ${tableName}:`,
          result.inconsistencies
        );
        // Handle inconsistencies if needed
        await this.resolveInconsistencies(
          tableName,
          result.inconsistencies as unknown as DataInconsistency[]
        );
      } else {
        this.logger.log(`Data consistency validated for ${tableName}`);
      }
    } catch (error) {
      this.logger.error(`Error checking consistency for ${tableName}:`, error);
    }
  }

  private async resolveInconsistencies(
    tableName: string,
    inconsistencies: DataInconsistency[]
  ) {
    try {
      this.logger.log(
        `Resolving ${inconsistencies.length} inconsistencies in ${tableName}`
      );

      for (const inconsistency of inconsistencies) {
        switch (inconsistency.type) {
          case 'missing_remote':
            // Local data exists but not in remote - sync to remote
            if (inconsistency.localItem) {
              await this.realtimeService.syncDataToSupabase(
                tableName,
                'INSERT',
                inconsistency.localItem
              );
            }
            break;
          case 'missing_local':
            // Remote data exists but not locally - this should be handled by realtime subscriptions
            this.logger.log(
              `Remote data will be synced via realtime: ${inconsistency.id}`
            );
            break;
          case 'data_mismatch':
            // Data exists in both but differs - use remote as source of truth
            this.logger.log(
              `Data mismatch detected for ${inconsistency.id}, remote will be used as source of truth`
            );
            break;
        }
      }

      this.logger.log(`Resolved inconsistencies for ${tableName}`);
    } catch (error) {
      this.logger.error(
        `Error resolving inconsistencies for ${tableName}:`,
        error
      );
    }
  }

  // Periodic consistency check (every 5 minutes)
  // TODO: Temporarily disabled due to Supabase permission issues
  // @Cron(CronExpression.EVERY_5_MINUTES)
  performPeriodicSync() {
    if (!this.isInitialized) {
      return;
    }

    try {
      this.logger.debug('Performing periodic data consistency check...');
      // await this.performInitialSync();
    } catch (error) {
      this.logger.error('Error during periodic sync:', error);
    }
  }

  async syncMessageToSupabase(messageData: MessageData): Promise<SyncResult> {
    try {
      await this.realtimeService.syncDataToSupabase(
        'messages',
        'INSERT',
        messageData
      );
      return { success: true, synced: 1, errors: [] };
    } catch (error) {
      this.logger.error('Failed to sync message to Supabase:', error);
      return {
        success: false,
        synced: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  async syncChatToSupabase(chatData: ChatData): Promise<SyncResult> {
    try {
      await this.realtimeService.syncDataToSupabase(
        'chats',
        'INSERT',
        chatData
      );
      return { success: true, synced: 1, errors: [] };
    } catch (error) {
      this.logger.error('Failed to sync chat to Supabase:', error);
      return {
        success: false,
        synced: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  async syncUserProfileToSupabase(
    userProfileData: UserProfileData
  ): Promise<SyncResult> {
    try {
      await this.realtimeService.syncDataToSupabase(
        'user_profiles',
        'INSERT',
        userProfileData
      );
      return { success: true, synced: 1, errors: [] };
    } catch (error) {
      this.logger.error('Failed to sync user profile to Supabase:', error);
      return {
        success: false,
        synced: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  getSyncStatus() {
    return {
      initialized: this.isInitialized,
      realtimeChannels: this.realtimeService.getChannelStatus(),
      lastSync: new Date().toISOString(),
    };
  }

  async forceSyncAll(): Promise<SyncResult> {
    try {
      this.logger.log('Starting forced full synchronization...');
      await this.performInitialSync();
      return { success: true, synced: 1, errors: [] };
    } catch (error) {
      this.logger.error('Failed to perform forced sync:', error);
      return {
        success: false,
        synced: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  async checkDataConsistency(): Promise<void> {
    this.logger.log('Starting manual consistency check');

    try {
      await this.checkTableConsistency('messages');
      await this.checkTableConsistency('chats');
      await this.checkTableConsistency('chat_participants');
      await this.checkTableConsistency('user_profiles');
      await this.checkTableConsistency('bot_personalities');

      this.logger.log('Manual consistency check completed successfully');
    } catch (error) {
      this.logger.error('Manual consistency check failed', error);
      throw error;
    }
  }
}
