import { vi } from 'vitest';
import React from 'react';

// Set up environment variables
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3001';

// Set up global variables
(global as { __DEV__?: boolean }).__DEV__ = true;

// Storage mock object
const storageMockObject = {
  authStorage: {
    set: vi.fn(),
    getString: vi.fn(),
    getBoolean: vi.fn(),
    delete: vi.fn(),
    clearAll: vi.fn(),
  },
  appStorage: {
    set: vi.fn(),
    getString: vi.fn(),
    getBoolean: vi.fn(),
    delete: vi.fn(),
    clearAll: vi.fn(),
  },
  MMKVSupabaseAdapter: vi.fn(() => ({
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  })),
  AppPreferences: {
    getTheme: vi.fn(() => 'light'),
    setTheme: vi.fn(),
    getLanguage: vi.fn(() => 'en'),
    setLanguage: vi.fn(),
    getNotificationsEnabled: vi.fn(() => true),
    setNotificationsEnabled: vi.fn(),
    getChatDraft: vi.fn(),
    setChatDraft: vi.fn(),
    clearChatDraft: vi.fn(),
    getRecentEmojis: vi.fn(() => []),
    addRecentEmoji: vi.fn(),
    clearAll: vi.fn(),
  },
};

// Mock browser globals to prevent typeof errors
Object.defineProperty(global, 'window', {
  value: {
    location: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      protocol: 'http:',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000',
      pathname: '/',
      search: '',
      hash: '',
    },
    matchMedia: vi.fn(() => ({
      matches: false,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  },
  writable: true,
});

Object.defineProperty(global, 'document', {
  value: {
    documentElement: {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
      },
    },
  },
  writable: true,
});

Object.defineProperty(global, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(global, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
  },
  writable: true,
});

// Mock React Native modules
vi.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: vi.fn((obj: { ios?: unknown; default?: unknown }): unknown => {
      return obj.ios || obj.default;
    }),
  },
  Dimensions: {
    get: vi.fn(() => ({ width: 375, height: 667 })),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  Alert: {
    alert: vi.fn(),
  },
  StyleSheet: {
    create: vi.fn((styles: unknown): unknown => {
      return styles;
    }),
  },
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  Image: 'Image',
}));

// Mock Expo modules
vi.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// Mock MMKV storage
vi.mock('react-native-mmkv', () => ({
  MMKV: vi.fn(() => ({
    set: vi.fn(),
    getString: vi.fn(),
    getNumber: vi.fn(),
    getBoolean: vi.fn(),
    delete: vi.fn(),
    clearAll: vi.fn(),
  })),
}));

vi.mock('./lib/storage', () => storageMockObject);
vi.mock('../storage', () => storageMockObject);
vi.mock('../../lib/storage', () => storageMockObject);
vi.mock(
  '/Users/joyboy/Desktop/Twilight/chat-mate/apps/app/src/lib/storage',
  () => storageMockObject
);

// Mock devtools module
vi.mock('./lib/devtools', () => ({
  reactQueryDevtoolsConfig: {
    initialIsOpen: false,
    position: 'bottom-right',
    panelProps: {
      style: {
        zIndex: 99999,
      },
    },
  },
  zustandDevtoolsConfig: {
    enabled: false,
    name: 'ChatMate Store',
    serialize: true,
    trace: true,
  },
  shouldEnableDevtools: vi.fn(() => false),
  DevToolsProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock theme store
vi.mock('./stores/themeStore', () => ({
  useThemeStore: vi.fn(() => ({
    theme: 'light',
    colors: {
      primary: '#007AFF',
      background: '#FFFFFF',
      surface: '#F2F2F7',
      text: '#000000',
    },
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
    initializeTheme: vi.fn(),
  })),
  useThemeColors: vi.fn(() => ({
    primary: '#007AFF',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    text: '#000000',
  })),
}));

// Mock theme store for relative imports
vi.mock('../stores/themeStore', () => ({
  useThemeStore: vi.fn(() => ({
    theme: 'light',
    colors: {
      primary: '#007AFF',
      background: '#FFFFFF',
      surface: '#F2F2F7',
      text: '#000000',
    },
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
    initializeTheme: vi.fn(),
  })),
  useThemeColors: vi.fn(() => ({
    primary: '#007AFF',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    text: '#000000',
  })),
}));

// Mock devtools module for relative imports
vi.mock('../lib/devtools', () => ({
  reactQueryDevtoolsConfig: {
    initialIsOpen: false,
    position: 'bottom-right',
    panelProps: {
      style: {
        zIndex: 99999,
      },
    },
  },
  zustandDevtoolsConfig: {
    enabled: false,
    name: 'ChatMate Store',
    serialize: true,
    trace: true,
  },
  shouldEnableDevtools: vi.fn(() => false),
  DevToolsProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock storage module for relative imports
vi.mock('../storage', () => ({
  authStorage: {
    set: vi.fn(),
    getString: vi.fn(),
    getBoolean: vi.fn(),
    delete: vi.fn(),
    clearAll: vi.fn(),
  },
  appStorage: {
    set: vi.fn(),
    getString: vi.fn(),
    getBoolean: vi.fn(),
    delete: vi.fn(),
    clearAll: vi.fn(),
  },
  MMKVSupabaseAdapter: vi.fn(() => ({
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  })),
  AppPreferences: {
    getTheme: vi.fn(() => 'light'),
    setTheme: vi.fn(),
    getLanguage: vi.fn(() => 'en'),
    setLanguage: vi.fn(),
    getNotificationsEnabled: vi.fn(() => true),
    setNotificationsEnabled: vi.fn(),
    getChatDraft: vi.fn(),
    setChatDraft: vi.fn(),
    clearChatDraft: vi.fn(),
    getRecentEmojis: vi.fn(() => []),
    addRecentEmoji: vi.fn(),
    clearAll: vi.fn(),
  },
}));

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
  })),
}));

// Mock Socket.IO
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

// Global test setup
// Store original console methods
const originalConsole = { ...console };

// Mock console methods with proper typing
global.console = {
  ...originalConsole,
  log: vi.fn(() => {}),
  debug: vi.fn(() => {}),
  info: vi.fn(() => {}),
  warn: vi.fn(() => {}),
  error: vi.fn(() => {}),
};
