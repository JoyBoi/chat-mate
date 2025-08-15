import { useEffect, useRef, useState } from 'react';
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  REALTIME_SUBSCRIBE_STATES,
} from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UseSupabaseRealtimeOptions {
  table: string;
  filter?: string;
  onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void;
  enabled?: boolean;
}

export const useSupabaseRealtime = (options: UseSupabaseRealtimeOptions) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const {
    table,
    filter,
    onInsert,
    onUpdate,
    onDelete,
    enabled = true,
  } = options;

  useEffect(() => {
    if (!enabled || !user) {
      return;
    }

    const setupRealtimeSubscription = () => {
      try {
        // Create channel name with optional filter
        const channelName = filter ? `${table}:${filter}` : table;

        // Create realtime channel
        const channel = supabase.channel(channelName);

        // Set up postgres changes listener
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
            filter: filter,
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            console.log('Realtime change received:', payload);

            switch (payload.eventType) {
              case 'INSERT':
                onInsert?.(payload);
                break;
              case 'UPDATE':
                onUpdate?.(payload);
                break;
              case 'DELETE':
                onDelete?.(payload);
                break;
            }
          },
        );

        // Subscribe and handle connection status
        channel.subscribe(status => {
          console.log(`Realtime subscription status for ${table}:`, status);

          if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
            setIsConnected(true);
            setError(null);
          } else if (status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR) {
            setIsConnected(false);
            setError('Failed to subscribe to realtime changes');
          } else if (status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT) {
            setIsConnected(false);
            setError('Realtime subscription timed out');
          } else if (status === REALTIME_SUBSCRIBE_STATES.CLOSED) {
            setIsConnected(false);
          }
        });

        channelRef.current = channel;
      } catch (err) {
        console.error('Error setting up realtime subscription:', err);
        setError('Failed to initialize realtime subscription');
      }
    };

    setupRealtimeSubscription();

    // Cleanup function
    return () => {
      if (channelRef.current) {
        console.log(`Unsubscribing from ${table} realtime changes`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnected(false);
      }
    };
  }, [enabled, user, table, filter, onInsert, onUpdate, onDelete]);

  const reconnect = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setError(null);
    // Re-trigger the effect by updating a dependency
  };

  return {
    isConnected,
    error,
    reconnect,
  };
};

// Specialized hooks for different tables
export const useMessagesRealtime = (chatId?: string) => {
  return useSupabaseRealtime({
    table: 'messages',
    filter: chatId ? `chat_id=eq.${chatId}` : undefined,
    enabled: !!chatId,
  });
};

export const useChatsRealtime = (userId?: string) => {
  return useSupabaseRealtime({
    table: 'chats',
    enabled: !!userId,
  });
};

export const useChatParticipantsRealtime = (chatId?: string) => {
  return useSupabaseRealtime({
    table: 'chat_participants',
    filter: chatId ? `chat_id=eq.${chatId}` : undefined,
    enabled: !!chatId,
  });
};

export const useUserProfilesRealtime = () => {
  return useSupabaseRealtime({
    table: 'user_profiles',
  });
};

export const useBotPersonalitiesRealtime = () => {
  return useSupabaseRealtime({
    table: 'bot_personalities',
  });
};
