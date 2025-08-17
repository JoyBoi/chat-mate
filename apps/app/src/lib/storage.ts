import { MMKV } from 'react-native-mmkv';
import { Platform } from 'react-native';

// Platform-conditional storage configuration
const createStorageConfig = (id: string, encryptionKey: string) => {
  const config: { id: string; encryptionKey?: string } = { id };

  // Only use encryption on native platforms (iOS/Android)
  // Web platform doesn't support encryption and is primarily for guest/recruiter access
  if (Platform.OS !== 'web') {
    config.encryptionKey = encryptionKey;
  }

  return config;
};

// Create separate MMKV instances for different purposes
const authStorage = new MMKV(
  createStorageConfig(
    'auth-storage',
    'auth-encryption-key-change-in-production'
  )
);

const appStorage = new MMKV(
  createStorageConfig('app-storage', 'app-encryption-key-change-in-production')
);

// Web-specific storage adapter for guest/recruiter access
class WebStorageAdapter {
  getItem(key: string): string | null {
    try {
      // Use sessionStorage for temporary sessions (better for guest access)
      // Falls back to localStorage if sessionStorage is unavailable
      const storage =
        typeof sessionStorage !== 'undefined' ? sessionStorage : localStorage;
      return storage.getItem(key);
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      const storage =
        typeof sessionStorage !== 'undefined' ? sessionStorage : localStorage;
      storage.setItem(key, value);
    } catch {
      // Silently fail on storage errors (e.g., quota exceeded)
    }
  }

  removeItem(key: string): void {
    try {
      const storage =
        typeof sessionStorage !== 'undefined' ? sessionStorage : localStorage;
      storage.removeItem(key);
    } catch {
      // Silently fail
    }
  }
}

// Supabase storage adapter with platform-conditional implementation
export class MMKVSupabaseAdapter {
  private storage: typeof authStorage | WebStorageAdapter;

  constructor() {
    // Use web storage for web platform, MMKV for native
    this.storage =
      Platform.OS === 'web' ? new WebStorageAdapter() : authStorage;
  }

  getItem(key: string): string | null {
    if (Platform.OS === 'web') {
      return (this.storage as WebStorageAdapter).getItem(key);
    }
    return (this.storage as typeof authStorage).getString(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (Platform.OS === 'web') {
      (this.storage as WebStorageAdapter).setItem(key, value);
    } else {
      (this.storage as typeof authStorage).set(key, value);
    }
  }

  removeItem(key: string): void {
    if (Platform.OS === 'web') {
      (this.storage as WebStorageAdapter).removeItem(key);
    } else {
      (this.storage as typeof authStorage).delete(key);
    }
  }
}

// Platform-conditional app storage utilities
const getAppStorageValue = (key: string): string | null => {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(`app_${key}`);
    } catch {
      return null;
    }
  }
  return appStorage.getString(key) ?? null;
};

const setAppStorageValue = (key: string, value: string): void => {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(`app_${key}`, value);
    } catch {
      // Silently fail on storage errors
    }
  } else {
    appStorage.set(key, value);
  }
};

const deleteAppStorageValue = (key: string): void => {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(`app_${key}`);
    } catch {
      // Silently fail
    }
  } else {
    appStorage.delete(key);
  }
};

// App preferences utilities
export const AppPreferences = {
  // User preferences
  getTheme: (): 'light' | 'dark' | 'system' => {
    return (
      (getAppStorageValue('theme') as 'light' | 'dark' | 'system') ?? 'system'
    );
  },
  setTheme: (theme: 'light' | 'dark' | 'system') => {
    setAppStorageValue('theme', theme);
  },

  // Language preference
  getLanguage: (): string => {
    return getAppStorageValue('language') ?? 'en';
  },
  setLanguage: (language: string) => {
    setAppStorageValue('language', language);
  },

  // Notification settings
  getNotificationsEnabled: (): boolean => {
    const value = getAppStorageValue('notifications_enabled');
    return value ? (JSON.parse(value) as boolean) : true;
  },
  setNotificationsEnabled: (enabled: boolean) => {
    setAppStorageValue('notifications_enabled', JSON.stringify(enabled));
  },

  // Chat drafts
  getChatDraft: (chatId: string): string | null => {
    return getAppStorageValue(`draft_${chatId}`);
  },
  setChatDraft: (chatId: string, draft: string) => {
    if (draft.trim()) {
      setAppStorageValue(`draft_${chatId}`, draft);
    } else {
      deleteAppStorageValue(`draft_${chatId}`);
    }
  },
  clearChatDraft: (chatId: string) => {
    deleteAppStorageValue(`draft_${chatId}`);
  },

  // Recently used emojis
  getRecentEmojis: (): string[] => {
    const emojis = getAppStorageValue('recent_emojis');
    if (!emojis) return [];

    try {
      return JSON.parse(emojis) as string[];
    } catch {
      return [];
    }
  },
  addRecentEmoji: (emoji: string) => {
    const recent = AppPreferences.getRecentEmojis();
    const filtered = recent.filter(e => e !== emoji);
    const updated = [emoji, ...filtered].slice(0, 20);
    setAppStorageValue('recent_emojis', JSON.stringify(updated));
  },

  // Clear all app data
  clearAll: () => {
    if (Platform.OS === 'web') {
      try {
        // Clear only app-prefixed keys to avoid affecting other web apps
        const keys = Object.keys(localStorage).filter(key =>
          key.startsWith('app_')
        );
        keys.forEach(key => localStorage.removeItem(key));
      } catch {
        // Silently fail
      }
    } else {
      appStorage.clearAll();
    }
  },
};

// Export storage instances for direct access if needed
export { authStorage, appStorage };
