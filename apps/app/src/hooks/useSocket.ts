import { useEffect, useRef, useState } from 'react';
import {
  socketService,
  Message,
  TypingUser,
  PresenceData,
} from '../lib/socket';
import { useAuth } from '../contexts/AuthContext';

interface UseSocketOptions {
  autoConnect?: boolean;
  onMessage?: (message: Message) => void;
  onTyping?: (users: TypingUser[]) => void;
  onPresence?: (presence: PresenceData[]) => void;
  onBotStream?: (data: {
    messageId: string;
    chunk: string;
    isComplete: boolean;
  }) => void;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<PresenceData[]>([]);
  const isInitialized = useRef(false);

  const {
    autoConnect = true,
    onMessage,
    onTyping,
    onPresence,
    onBotStream,
  } = options;

  // Initialize socket connection
  useEffect(() => {
    if (!user || isInitialized.current) return;

    const initializeSocket = () => {
      try {
        // Get auth token (either from Supabase session or guest token)
        const token = (user as any).access_token || user.aud || '';
        const userId = user.id;

        if (!token || !userId) {
          setConnectionError('Missing authentication credentials');
          return;
        }

        // Set up event listeners
        socketService.onConnection(connected => {
          setIsConnected(connected);
          if (connected) {
            setConnectionError(null);
          } else {
            setConnectionError('Connection lost');
          }
        });

        socketService.onMessage(message => {
          onMessage?.(message);
        });

        socketService.onTyping(users => {
          setTypingUsers(users);
          onTyping?.(users);
        });

        socketService.onPresence(presence => {
          setOnlineUsers(presence);
          onPresence?.(presence);
        });

        socketService.onBotStream(data => {
          onBotStream?.(data);
        });

        // Connect if auto-connect is enabled
        if (autoConnect) {
          socketService.connect(token, userId);
        }

        isInitialized.current = true;
      } catch (error) {
        console.error('Socket initialization error:', error);
        setConnectionError('Failed to initialize socket connection');
      }
    };

    initializeSocket();

    // Cleanup on unmount
    return () => {
      socketService.removeAllListeners();
      socketService.disconnect();
      isInitialized.current = false;
    };
  }, [user, autoConnect, onMessage, onTyping, onPresence, onBotStream]);

  // Manual connection methods
  const connect = () => {
    if (!user) {
      setConnectionError('No user authenticated');
      return;
    }

    const token = (user as any).access_token || user.aud || '';
    const userId = user.id;

    if (!token || !userId) {
      setConnectionError('Missing authentication credentials');
      return;
    }

    socketService.connect(token, userId);
  };

  const disconnect = () => {
    socketService.disconnect();
    setIsConnected(false);
  };

  // Chat methods
  const joinGlobalChat = () => {
    if (!isConnected) {
      console.warn('Socket not connected');
      return;
    }
    socketService.joinGlobalChat();
  };

  const joinBotChat = (botId: string) => {
    if (!isConnected) {
      console.warn('Socket not connected');
      return;
    }
    socketService.joinBotChat(botId);
  };

  const leaveRoom = (roomId: string) => {
    if (!isConnected) {
      console.warn('Socket not connected');
      return;
    }
    socketService.leaveRoom(roomId);
  };

  const sendMessage = (
    content: string,
    chatType: 'global' | 'bot',
    botId?: string,
  ) => {
    if (!isConnected) {
      console.warn('Socket not connected');
      return false;
    }
    socketService.sendMessage(content, chatType, botId);
    return true;
  };

  // Typing indicators
  const startTyping = (chatType: 'global' | 'bot', botId?: string) => {
    if (!isConnected) return;
    socketService.startTyping(chatType, botId);
  };

  const stopTyping = (chatType: 'global' | 'bot', botId?: string) => {
    if (!isConnected) return;
    socketService.stopTyping(chatType, botId);
  };

  return {
    // Connection state
    isConnected,
    connectionError,
    isSocketConnected: socketService.isSocketConnected(),

    // User state
    typingUsers,
    onlineUsers,

    // Connection methods
    connect,
    disconnect,

    // Chat methods
    joinGlobalChat,
    joinBotChat,
    leaveRoom,
    sendMessage,

    // Typing methods
    startTyping,
    stopTyping,
  };
};
