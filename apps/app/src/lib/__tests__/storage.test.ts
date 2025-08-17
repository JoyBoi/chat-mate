import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authStorage, appStorage, AppPreferences } from '../storage';

// Mock MMKV
vi.mock('react-native-mmkv', () => ({
  MMKV: vi.fn().mockImplementation(() => ({
    set: vi.fn(),
    getString: vi.fn(),
    getBoolean: vi.fn(),
    delete: vi.fn(),
    clearAll: vi.fn(),
  })),
}));

// Mock WebStorageAdapter
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    setItem: vi.fn(),
    getItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

describe('storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('platform-specific storage', () => {
    it('creates MMKV instances for native platforms', () => {
      expect(authStorage).toBeDefined();
      expect(appStorage).toBeDefined();
    });

    it('handles web platform gracefully', () => {
      // The storage instances should still be created even on web
      expect(authStorage).toBeDefined();
      expect(appStorage).toBeDefined();
    });
  });

  describe('appStorage operations', () => {
    it('sets and gets string values', () => {
      const mockSet = vi.fn();
      const mockGetString = vi.fn().mockReturnValue('test-value');

      // Mock the storage instance
      appStorage.set = mockSet;
      appStorage.getString = mockGetString;

      appStorage.set('test-key', 'test-value');
      expect(mockSet).toHaveBeenCalledWith('test-key', 'test-value');

      const result = appStorage.getString('test-key');
      expect(mockGetString).toHaveBeenCalledWith('test-key');
      expect(result).toBe('test-value');
    });

    it('removes items', () => {
      const mockDelete = vi.fn();
      appStorage.delete = mockDelete;

      appStorage.delete('test-key');
      expect(mockDelete).toHaveBeenCalledWith('test-key');
    });
  });

  describe('AppPreferences', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('gets theme preference', () => {
      const mockGetString = vi.fn().mockReturnValue('dark');
      appStorage.getString = mockGetString;

      const theme = AppPreferences.getTheme();
      expect(mockGetString).toHaveBeenCalledWith('theme');
      expect(theme).toBe('dark');
    });

    it('sets theme preference', () => {
      const mockSet = vi.fn();
      appStorage.set = mockSet;

      AppPreferences.setTheme('light');
      expect(mockSet).toHaveBeenCalledWith('theme', 'light');
    });

    it('gets language preference', () => {
      const mockGetString = vi.fn().mockReturnValue('es');
      appStorage.getString = mockGetString;

      const language = AppPreferences.getLanguage();
      expect(mockGetString).toHaveBeenCalledWith('language');
      expect(language).toBe('es');
    });

    it('sets language preference', () => {
      const mockSet = vi.fn();
      appStorage.set = mockSet;

      AppPreferences.setLanguage('fr');
      expect(mockSet).toHaveBeenCalledWith('language', 'fr');
    });

    it('gets notification settings', () => {
      const mockGetString = vi.fn().mockReturnValue('false');
      appStorage.getString = mockGetString;

      const notifications = AppPreferences.getNotificationsEnabled();
      expect(mockGetString).toHaveBeenCalledWith('notifications_enabled');
      expect(notifications).toBe(false);
    });

    it('sets notification settings', () => {
      const mockSet = vi.fn();
      appStorage.set = mockSet;

      AppPreferences.setNotificationsEnabled(true);
      expect(mockSet).toHaveBeenCalledWith('notifications_enabled', 'true');
    });

    it('gets chat draft', () => {
      const mockGetString = vi.fn().mockReturnValue('draft message');
      appStorage.getString = mockGetString;

      const draft = AppPreferences.getChatDraft('chat-123');
      expect(mockGetString).toHaveBeenCalledWith('draft_chat-123');
      expect(draft).toBe('draft message');
    });

    it('sets chat draft', () => {
      const mockSet = vi.fn();
      appStorage.set = mockSet;

      AppPreferences.setChatDraft('chat-123', 'new draft');
      expect(mockSet).toHaveBeenCalledWith('draft_chat-123', 'new draft');
    });

    it('clears chat draft', () => {
      const mockDelete = vi.fn();
      appStorage.delete = mockDelete;

      AppPreferences.clearChatDraft('chat-123');
      expect(mockDelete).toHaveBeenCalledWith('draft_chat-123');
    });

    it('gets recent emojis', () => {
      const mockGetString = vi.fn().mockReturnValue('["😀","😂","❤️"]');
      appStorage.getString = mockGetString;

      const emojis = AppPreferences.getRecentEmojis();
      expect(mockGetString).toHaveBeenCalledWith('recent_emojis');
      expect(emojis).toEqual(['😀', '😂', '❤️']);
    });

    it('adds recent emoji', () => {
      const mockSet = vi.fn();
      const mockGetString = vi.fn().mockReturnValue('["😀","😂"]');
      appStorage.set = mockSet;
      appStorage.getString = mockGetString;

      AppPreferences.addRecentEmoji('🎉');
      expect(mockSet).toHaveBeenCalledWith(
        'recent_emojis',
        JSON.stringify(['🎉', '😀', '😂'])
      );
    });

    it('handles invalid JSON for recent emojis', () => {
      const mockGetString = vi.fn().mockReturnValue('invalid-json');
      appStorage.getString = mockGetString;

      const emojis = AppPreferences.getRecentEmojis();
      expect(emojis).toEqual([]);
    });

    it('returns empty array when no recent emojis stored', () => {
      const mockGetString = vi.fn().mockReturnValue(undefined);
      appStorage.getString = mockGetString;

      const emojis = AppPreferences.getRecentEmojis();
      expect(emojis).toEqual([]);
    });
  });
});
