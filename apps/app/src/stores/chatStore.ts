import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
  devtools,
  StateStorage,
} from 'zustand/middleware';
import { appStorage } from '../lib/storage';
import { zustandDevtoolsConfig } from '../lib/devtools';

export interface TypingUser {
  userId: string;
  username: string;
  timestamp: number;
}

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  memberCount: number;
  lastActivity: string;
}

export interface BotPersonality {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  personality: string;
  isActive: boolean;
}

export interface ChatUIState {
  // Current chat context
  currentChatId: string | null;
  currentChatRoom: ChatRoom | null;
  selectedBotId: string | null;

  // UI state
  isTyping: boolean;
  typingUsers: Record<string, TypingUser>;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Modal states
  isBotSelectorVisible: boolean;
  isRoomListVisible: boolean;
  isUserListVisible: boolean;

  // Message input
  messageInput: string;
  isComposing: boolean;

  // Actions
  setCurrentChat: (chatId: string | null, room?: ChatRoom) => void;
  setSelectedBot: (botId: string | null) => void;
  setTyping: (isTyping: boolean) => void;
  addTypingUser: (user: TypingUser) => void;
  removeTypingUser: (userId: string) => void;
  clearTypingUsers: () => void;
  setConnected: (isConnected: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setMessageInput: (input: string) => void;
  setComposing: (isComposing: boolean) => void;
  setBotSelectorVisible: (visible: boolean) => void;
  setRoomListVisible: (visible: boolean) => void;
  setUserListVisible: (visible: boolean) => void;
  clearAll: () => void;
}

export const useChatStore = create<ChatUIState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentChatId: null,
        currentChatRoom: null,
        selectedBotId: null,
        isTyping: false,
        typingUsers: {},
        isConnected: false,
        isLoading: false,
        error: null,
        isBotSelectorVisible: false,
        isRoomListVisible: false,
        isUserListVisible: false,
        messageInput: '',
        isComposing: false,

        // Actions
        setCurrentChat: (chatId: string | null, room?: ChatRoom) => {
          set({
            currentChatId: chatId,
            currentChatRoom: room || null,
            error: null,
          });
        },

        setSelectedBot: (botId: string | null) => {
          set({ selectedBotId: botId });
        },

        setTyping: (isTyping: boolean) => {
          set({ isTyping });
        },

        addTypingUser: (user: TypingUser) => {
          const { typingUsers } = get();
          set({
            typingUsers: {
              ...typingUsers,
              [user.userId]: user,
            },
          });
        },

        removeTypingUser: (userId: string) => {
          const { typingUsers } = get();
          const newTypingUsers = { ...typingUsers };
          delete newTypingUsers[userId];
          set({ typingUsers: newTypingUsers });
        },

        clearTypingUsers: () => {
          set({ typingUsers: {} });
        },

        setConnected: (isConnected: boolean) => {
          set({ isConnected, error: isConnected ? null : get().error });
        },

        setLoading: (isLoading: boolean) => {
          set({ isLoading });
        },

        setError: (error: string | null) => {
          set({ error, isLoading: false });
        },

        setMessageInput: (input: string) => {
          set({ messageInput: input });
        },

        setComposing: (isComposing: boolean) => {
          set({ isComposing });
        },

        setBotSelectorVisible: (visible: boolean) => {
          set({ isBotSelectorVisible: visible });
        },

        setRoomListVisible: (visible: boolean) => {
          set({ isRoomListVisible: visible });
        },

        setUserListVisible: (visible: boolean) => {
          set({ isUserListVisible: visible });
        },

        clearAll: () => {
          set({
            currentChatId: null,
            currentChatRoom: null,
            selectedBotId: null,
            isTyping: false,
            typingUsers: {},
            error: null,
            messageInput: '',
            isComposing: false,
            isBotSelectorVisible: false,
            isRoomListVisible: false,
            isUserListVisible: false,
          });
        },
      }),
      {
        name: 'chat-ui-storage',
        storage: createJSONStorage(
          () =>
            ({
              getItem: (key: string) => appStorage.getString(key) ?? null,
              setItem: (key: string, value: string) =>
                appStorage.set(key, value),
              removeItem: (key: string) => appStorage.delete(key),
            }) as StateStorage,
        ),
        partialize: state => ({
          currentChatId: state.currentChatId,
          currentChatRoom: state.currentChatRoom,
          selectedBotId: state.selectedBotId,
        }),
      },
    ),
    {
      enabled: zustandDevtoolsConfig.enabled,
      name: 'Chat Store',
    },
  ),
);

// Selector hooks
export const useCurrentChat = () =>
  useChatStore(state => ({
    currentChatId: state.currentChatId,
    currentChatRoom: state.currentChatRoom,
    selectedBotId: state.selectedBotId,
  }));

export const useChatConnection = () =>
  useChatStore(state => ({
    isConnected: state.isConnected,
    isLoading: state.isLoading,
    error: state.error,
  }));

export const useTypingState = () =>
  useChatStore(state => ({
    isTyping: state.isTyping,
    typingUsers: state.typingUsers,
  }));

export const useMessageInput = () =>
  useChatStore(state => ({
    messageInput: state.messageInput,
    isComposing: state.isComposing,
  }));

export const useChatModals = () =>
  useChatStore(state => ({
    isBotSelectorVisible: state.isBotSelectorVisible,
    isRoomListVisible: state.isRoomListVisible,
    isUserListVisible: state.isUserListVisible,
  }));

// Export missing hooks for compatibility
export const useChatUI = () =>
  useChatStore(state => ({
    isTyping: state.isTyping,
    typingUsers: state.typingUsers,
    isConnected: state.isConnected,
    isLoading: state.isLoading,
    error: state.error,
    isBotSelectorVisible: state.isBotSelectorVisible,
    isRoomListVisible: state.isRoomListVisible,
    isUserListVisible: state.isUserListVisible,
  }));

export const useBotSelection = () =>
  useChatStore(state => ({
    selectedBotId: state.selectedBotId,
    setSelectedBot: state.setSelectedBot,
    setBotSelectorVisible: state.setBotSelectorVisible,
  }));

// Export ChatMessage type (define it based on common chat message structure)
export interface ChatMessage {
  id: string;
  content: string;
  userId: string;
  username: string;
  timestamp: string;
  type?: 'user' | 'bot' | 'system';
  botId?: string;
}
