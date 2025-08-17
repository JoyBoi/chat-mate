import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { queryClient, queryKeys } from '../queryClient';

// Mock the storage
vi.mock('../storage', () => ({
  appStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe('queryClient', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  describe('QueryClient configuration', () => {
    it('is an instance of QueryClient', () => {
      expect(queryClient).toBeInstanceOf(QueryClient);
    });

    it('has correct default options', () => {
      const defaultOptions = queryClient.getDefaultOptions();

      expect(defaultOptions.queries?.staleTime).toBe(1000 * 60 * 5);
      expect(defaultOptions.queries?.gcTime).toBe(1000 * 60 * 30);
      expect(defaultOptions.queries?.retry).toBe(3);
      expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
    });

    it('has correct mutation options', () => {
      const defaultOptions = queryClient.getDefaultOptions();

      expect(defaultOptions.mutations?.retry).toBe(1);
    });
  });

  describe('query operations', () => {
    it('can set and get query data', () => {
      const testData = { id: 1, name: 'Test' };
      const queryKey = ['test', 'data'];

      queryClient.setQueryData(queryKey, testData);
      const retrievedData = queryClient.getQueryData(queryKey);

      expect(retrievedData).toEqual(testData);
    });

    it('can invalidate queries', async () => {
      const queryKey = ['test', 'invalidate'];
      queryClient.setQueryData(queryKey, { data: 'test' });

      await queryClient.invalidateQueries({ queryKey });

      const queryState = queryClient.getQueryState(queryKey);
      expect(queryState?.isInvalidated).toBe(true);
    });

    it('can remove queries', () => {
      const queryKey = ['test', 'remove'];
      queryClient.setQueryData(queryKey, { data: 'test' });

      queryClient.removeQueries({ queryKey });

      const retrievedData = queryClient.getQueryData(queryKey);
      expect(retrievedData).toBeUndefined();
    });
  });

  describe('cache management', () => {
    it('can clear all cache', () => {
      queryClient.setQueryData(['test', '1'], { data: 'test1' });
      queryClient.setQueryData(['test', '2'], { data: 'test2' });

      queryClient.clear();

      expect(queryClient.getQueryData(['test', '1'])).toBeUndefined();
      expect(queryClient.getQueryData(['test', '2'])).toBeUndefined();
    });
  });
});

describe('queryKeys', () => {
  describe('auth keys', () => {
    it('generates correct auth keys', () => {
      expect(queryKeys.auth.user).toEqual(['auth', 'user']);
      expect(queryKeys.auth.session).toEqual(['auth', 'session']);
    });
  });

  describe('bots keys', () => {
    it('generates correct bots keys', () => {
      expect(queryKeys.bots.all).toEqual(['bots']);
      expect(queryKeys.bots.list()).toEqual(['bots', 'list', undefined]);
      expect(queryKeys.bots.detail('bot-123')).toEqual([
        'bots',
        'detail',
        'bot-123',
      ]);
    });
  });

  describe('messages keys', () => {
    it('generates correct messages keys', () => {
      expect(queryKeys.messages.all).toEqual(['messages']);
      expect(queryKeys.messages.list('chat-123')).toEqual([
        'messages',
        'list',
        'chat-123',
        undefined,
      ]);
      expect(queryKeys.messages.detail('msg-123')).toEqual([
        'messages',
        'detail',
        'msg-123',
      ]);
    });
  });

  describe('ai keys', () => {
    it('generates correct ai keys', () => {
      expect(queryKeys.ai.summarize(['msg-1', 'msg-2'])).toEqual([
        'ai',
        'summarize',
        ['msg-1', 'msg-2'],
      ]);
      expect(queryKeys.ai.translate('msg-123', 'en')).toEqual([
        'ai',
        'translate',
        'msg-123',
        'en',
      ]);
    });
  });

  describe('chats keys', () => {
    it('generates correct chats keys', () => {
      expect(queryKeys.chats.all).toEqual(['chats']);
      expect(queryKeys.chats.list()).toEqual(['chats', 'list', undefined]);
      expect(queryKeys.chats.detail('chat-123')).toEqual([
        'chats',
        'detail',
        'chat-123',
      ]);
    });
  });

  describe('chatRooms keys', () => {
    it('generates correct chatRooms keys', () => {
      expect(queryKeys.chatRooms.all).toEqual(['chatRooms']);
      expect(queryKeys.chatRooms.list()).toEqual([
        'chatRooms',
        'list',
        undefined,
      ]);
      expect(queryKeys.chatRooms.detail('room-123')).toEqual([
        'chatRooms',
        'detail',
        'room-123',
      ]);
      expect(queryKeys.chatRooms.members('room-123')).toEqual([
        'chatRooms',
        'members',
        'room-123',
      ]);
    });
  });
});
