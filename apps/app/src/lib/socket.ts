import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  content: string;
  userId: string;
  userName: string;
  timestamp: Date;
  type: 'user' | 'bot' | 'system';
  isStreaming?: boolean;
}

interface TypingUser {
  userId: string;
  userName: string;
}

interface PresenceData {
  userId: string;
  userName: string;
  status: 'online' | 'offline';
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Event callbacks
  private onMessageCallback?: (message: Message) => void;
  private onTypingCallback?: (users: TypingUser[]) => void;
  private onPresenceCallback?: (presence: PresenceData[]) => void;
  private onBotStreamCallback?: (data: {
    messageId: string;
    chunk: string;
    isComplete: boolean;
  }) => void;
  private onConnectionCallback?: (connected: boolean) => void;

  connect(token: string, userId: string) {
    if (this.socket?.connected) {
      return;
    }

    const serverUrl: string =
      (process.env.EXPO_PUBLIC_API_URL as string) || 'http://localhost:3001';

    this.socket = io(serverUrl, {
      auth: {
        token,
        userId,
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.onConnectionCallback?.(true);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.onConnectionCallback?.(false);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.onConnectionCallback?.(false);
      }
    });

    // Message events
    this.socket.on('message', (message: Message) => {
      this.onMessageCallback?.(message);
    });

    // Typing events
    this.socket.on('typing_update', (users: TypingUser[]) => {
      this.onTypingCallback?.(users);
    });

    // Presence events
    this.socket.on('presence_update', (presence: PresenceData[]) => {
      this.onPresenceCallback?.(presence);
    });

    // Bot streaming events
    this.socket.on(
      'bot_stream_chunk',
      (data: { messageId: string; chunk: string; isComplete: boolean }) => {
        this.onBotStreamCallback?.(data);
      },
    );
  }

  // Join/leave rooms
  joinGlobalChat() {
    this.socket?.emit('join_global_chat');
  }

  joinBotChat(botId: string) {
    this.socket?.emit('join_bot_chat', { botId });
  }

  leaveRoom(roomId: string) {
    this.socket?.emit('leave_room', { roomId });
  }

  // Send messages
  sendMessage(content: string, chatType: 'global' | 'bot', botId?: string) {
    if (!this.isConnected || !this.socket) {
      console.warn('Socket not connected, cannot send message');
      return;
    }

    const messageData = {
      content,
      chatType,
      botId,
      timestamp: new Date().toISOString(),
    };

    this.socket.emit('send_message', messageData);
  }

  // Typing indicators
  startTyping(chatType: 'global' | 'bot', botId?: string) {
    this.socket?.emit('start_typing', { chatType, botId });
  }

  stopTyping(chatType: 'global' | 'bot', botId?: string) {
    this.socket?.emit('stop_typing', { chatType, botId });
  }

  // Event listeners
  onMessage(callback: (message: Message) => void) {
    this.onMessageCallback = callback;
  }

  onTyping(callback: (users: TypingUser[]) => void) {
    this.onTypingCallback = callback;
  }

  onPresence(callback: (presence: PresenceData[]) => void) {
    this.onPresenceCallback = callback;
  }

  onBotStream(
    callback: (data: {
      messageId: string;
      chunk: string;
      isComplete: boolean;
    }) => void,
  ) {
    this.onBotStreamCallback = callback;
  }

  onConnection(callback: (connected: boolean) => void) {
    this.onConnectionCallback = callback;
  }

  // Utility methods
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Cleanup
  removeAllListeners() {
    this.onMessageCallback = undefined;
    this.onTypingCallback = undefined;
    this.onPresenceCallback = undefined;
    this.onBotStreamCallback = undefined;
    this.onConnectionCallback = undefined;
  }
}

// Export singleton instance
export const socketService = new SocketService();
export type { Message, TypingUser, PresenceData };
