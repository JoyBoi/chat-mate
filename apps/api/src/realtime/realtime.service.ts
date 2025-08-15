import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeChannel } from '@supabase/supabase-js';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private channels: Map<string, RealtimeChannel> = new Map();

  constructor(
    private configService: ConfigService,
    private supabaseService: SupabaseService,
    private prismaService: PrismaService,
  ) {}

  initializeRealtimeChannels() {
    try {
      // Initialize channels for different tables
      this.setupMessagesChannel();
      this.setupChatsChannel();
      this.setupChatParticipantsChannel();
      this.setupUserProfilesChannel();
      this.setupBotPersonalitiesChannel();

      this.logger.log('Realtime channels initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize realtime channels:', error);
      throw error;
    }
  }

  private setupMessagesChannel() {
    const channel = this.supabaseService
      .getClient()
      .channel('messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          this.logger.debug('Messages table change detected:', payload);
          void this.handleMessagesChange(payload);
        },
      )
      .subscribe();

    this.channels.set('messages', channel);
  }

  private setupChatsChannel() {
    const channel = this.supabaseService
      .getClient()
      .channel('chats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
        },
        (payload) => {
          this.logger.debug('Chats table change detected:', payload);
          void this.handleChatsChange(payload);
        },
      )
      .subscribe();

    this.channels.set('chats', channel);
  }

  private setupChatParticipantsChannel() {
    const channel = this.supabaseService
      .getClient()
      .channel('chat_participants_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_participants',
        },
        (payload) => {
          this.logger.debug(
            'Chat participants table change detected:',
            payload,
          );
          void this.handleChatParticipantsChange(payload);
        },
      )
      .subscribe();

    this.channels.set('chat_participants', channel);
  }

  private setupUserProfilesChannel() {
    const channel = this.supabaseService
      .getClient()
      .channel('user_profiles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
        },
        (payload) => {
          this.logger.debug('User profiles table change detected:', payload);
          void this.handleUserProfilesChange(payload);
        },
      )
      .subscribe();

    this.channels.set('user_profiles', channel);
  }

  private setupBotPersonalitiesChannel() {
    const channel = this.supabaseService
      .getClient()
      .channel('bot_personalities_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bot_personalities',
        },
        (payload) => {
          this.logger.debug(
            'Bot personalities table change detected:',
            payload,
          );
          void this.handleBotPersonalitiesChange(payload);
        },
      )
      .subscribe();

    this.channels.set('bot_personalities', channel);
  }

  private handleMessagesChange(payload: any) {
    try {
      switch (payload.eventType) {
        case 'INSERT':
          this.logger.log(`New message created: ${payload.new.id}`);
          // Handle message creation logic if needed
          break;
        case 'UPDATE':
          this.logger.log(`Message updated: ${payload.new.id}`);
          // Handle message update logic if needed
          break;
        case 'DELETE':
          this.logger.log(`Message deleted: ${payload.old.id}`);
          // Handle message deletion logic if needed
          break;
      }
    } catch (error) {
      this.logger.error('Error handling messages change:', error);
    }
  }

  private handleChatsChange(payload: any) {
    try {
      switch (payload.eventType) {
        case 'INSERT':
          this.logger.log(`New chat created: ${payload.new.id}`);
          break;
        case 'UPDATE':
          this.logger.log(`Chat updated: ${payload.new.id}`);
          break;
        case 'DELETE':
          this.logger.log(`Chat deleted: ${payload.old.id}`);
          break;
      }
    } catch (error) {
      this.logger.error('Error handling chats change:', error);
    }
  }

  private handleChatParticipantsChange(payload: any) {
    try {
      switch (payload.eventType) {
        case 'INSERT':
          this.logger.log(
            `New participant added to chat ${payload.new.chat_id}: ${payload.new.user_id}`,
          );
          break;
        case 'UPDATE':
          this.logger.log(
            `Participant updated in chat ${payload.new.chat_id}: ${payload.new.user_id}`,
          );
          break;
        case 'DELETE':
          this.logger.log(
            `Participant removed from chat ${payload.old.chat_id}: ${payload.old.user_id}`,
          );
          break;
      }
    } catch (error) {
      this.logger.error('Error handling chat participants change:', error);
    }
  }

  private handleUserProfilesChange(payload: any) {
    try {
      switch (payload.eventType) {
        case 'INSERT':
          this.logger.log(`New user profile created: ${payload.new.id}`);
          break;
        case 'UPDATE':
          this.logger.log(`User profile updated: ${payload.new.id}`);
          break;
        case 'DELETE':
          this.logger.log(`User profile deleted: ${payload.old.id}`);
          break;
      }
    } catch (error) {
      this.logger.error('Error handling user profiles change:', error);
    }
  }

  private handleBotPersonalitiesChange(payload: any) {
    try {
      switch (payload.eventType) {
        case 'INSERT':
          this.logger.log(`New bot personality created: ${payload.new.id}`);
          break;
        case 'UPDATE':
          this.logger.log(`Bot personality updated: ${payload.new.id}`);
          break;
        case 'DELETE':
          this.logger.log(`Bot personality deleted: ${payload.old.id}`);
          break;
      }
    } catch (error) {
      this.logger.error('Error handling bot personalities change:', error);
    }
  }

  async syncDataToSupabase(table: string, operation: string, data: any) {
    try {
      const supabase = this.supabaseService.getClient();

      switch (operation) {
        case 'INSERT': {
          const { error: insertError } = await supabase
            .from(table)
            .insert(data);
          if (insertError) throw insertError;
          break;
        }
        case 'UPDATE': {
          const { error: updateError } = await supabase
            .from(table)
            .update(data)
            .eq('id', data.id);
          if (updateError) throw updateError;
          break;
        }
        case 'DELETE': {
          const { error: deleteError } = await supabase
            .from(table)
            .delete()
            .eq('id', data.id);
          if (deleteError) throw deleteError;
          break;
        }
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      this.logger.log(`Successfully synced ${operation} to ${table}`);
    } catch (error) {
      this.logger.error(`Failed to sync ${operation} to ${table}:`, error);
      throw error;
    }
  }

  async validateDataConsistency(table: string, localData: any[]) {
    try {
      const supabase = this.supabaseService.getClient();
      const { data: remoteData, error } = await supabase
        .from(table)
        .select('*');

      if (error) throw error;

      // Compare local and remote data
      const inconsistencies = this.findDataInconsistencies(
        localData,
        remoteData,
      );

      if (inconsistencies.length > 0) {
        this.logger.warn(
          `Data inconsistencies found in ${table}:`,
          inconsistencies,
        );
        return { consistent: false, inconsistencies };
      }

      this.logger.log(`Data consistency validated for ${table}`);
      return { consistent: true, inconsistencies: [] };
    } catch (error) {
      this.logger.error(
        `Failed to validate data consistency for ${table}:`,
        error,
      );
      throw error;
    }
  }

  private findDataInconsistencies(localData: any[], remoteData: any[]) {
    const inconsistencies: any[] = [];

    // Create maps for efficient comparison
    const localMap = new Map(localData.map((item) => [item.id, item]));
    const remoteMap = new Map(remoteData.map((item) => [item.id, item]));

    // Check for items in local but not in remote
    for (const [id, localItem] of localMap) {
      if (!remoteMap.has(id)) {
        inconsistencies.push({
          type: 'missing_remote',
          id,
          localItem,
        });
      }
    }

    // Check for items in remote but not in local
    for (const [id, remoteItem] of remoteMap) {
      if (!localMap.has(id)) {
        inconsistencies.push({
          type: 'missing_local',
          id,
          remoteItem,
        });
      } else {
        // Check for data differences
        const localItem = localMap.get(id);
        if (JSON.stringify(localItem) !== JSON.stringify(remoteItem)) {
          inconsistencies.push({
            type: 'data_mismatch',
            id,
            localItem,
            remoteItem,
          });
        }
      }
    }

    return inconsistencies;
  }

  async cleanup() {
    try {
      const supabase = this.supabaseService.getClient();

      for (const [name, channel] of this.channels) {
        await supabase.removeChannel(channel);
        this.logger.log(`Removed realtime channel: ${name}`);
      }

      this.channels.clear();
      this.logger.log('Realtime service cleanup completed');
    } catch (error) {
      this.logger.error('Error during realtime service cleanup:', error);
    }
  }

  getChannelStatus() {
    const status: Record<string, { state: string; topic: string }> = {};

    for (const [name, channel] of this.channels) {
      status[name] = {
        state: (channel as { state: string }).state,
        topic: (channel as { topic: string }).topic,
      };
    }

    return status;
  }
}
