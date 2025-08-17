import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '../chatStore';
import { renderHook, act } from '@testing-library/react-native';

describe('chatStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useChatStore());
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    act(() => {
      result.current.reset();
    });
  });

  describe('initial state', () => {
    it('has correct default values', () => {
      const { result } = renderHook(() => useChatStore());

      expect(result.current.currentChatId).toBeNull();

      expect(result.current.isUIVisible).toBe(true);

      expect(result.current.messageInput).toBe('');

      expect(result.current.isTyping).toBe(false);

      expect(result.current.lastActivity).toBeNull();
    });
  });

  describe('chat management', () => {
    it('sets current chat ID', () => {
      const { result } = renderHook(() => useChatStore());

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      act(() => {
        result.current.setCurrentChat('chat-123');
      });

      expect(result.current.currentChatId).toBe('chat-123');
    });

    it('clears current chat', () => {
      const { result } = renderHook(() => useChatStore());

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      act(() => {
        result.current.setCurrentChat('chat-123');

        result.current.clearCurrentChat();
      });

      expect(result.current.currentChatId).toBeNull();
    });
  });

  describe('UI visibility', () => {
    it('toggles UI visibility', () => {
      const { result } = renderHook(() => useChatStore());

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      act(() => {
        result.current.toggleUI();
      });

      expect(result.current.isUIVisible).toBe(false);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      act(() => {
        result.current.toggleUI();
      });

      expect(result.current.isUIVisible).toBe(true);
    });

    it('sets UI visibility directly', () => {
      const { result } = renderHook(() => useChatStore());

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      act(() => {
        result.current.setUIVisible(false);
      });

      expect(result.current.isUIVisible).toBe(false);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      act(() => {
        result.current.setUIVisible(true);
      });

      expect(result.current.isUIVisible).toBe(true);
    });
  });

  describe('message input', () => {
    it('updates message input', () => {
      const { result } = renderHook(() => useChatStore());

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      act(() => {
        result.current.setMessageInput('Hello world');
      });

      expect(result.current.messageInput).toBe('Hello world');
    });

    it('clears message input', () => {
      const { result } = renderHook(() => useChatStore());

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      act(() => {
        result.current.setMessageInput('Hello world');

        result.current.clearMessageInput();
      });

      expect(result.current.messageInput).toBe('');
    });
  });

  describe('typing indicator', () => {
    it('sets typing state', () => {
      const { result } = renderHook(() => useChatStore());

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      act(() => {
        result.current.setTyping(true);
      });

      expect(result.current.isTyping).toBe(true);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      act(() => {
        result.current.setTyping(false);
      });

      expect(result.current.isTyping).toBe(false);
    });
  });

  describe('activity tracking', () => {
    it('updates last activity', () => {
      const { result } = renderHook(() => useChatStore());
      const now = new Date();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      act(() => {
        result.current.updateLastActivity(now);
      });

      expect(result.current.lastActivity).toBe(now);
    });
  });

  describe('store reset', () => {
    it('resets all state to defaults', () => {
      const { result } = renderHook(() => useChatStore());

      // Set some non-default values
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      act(() => {
        result.current.setCurrentChat('chat-123');

        result.current.setUIVisible(false);

        result.current.setMessageInput('test message');

        result.current.setTyping(true);

        result.current.updateLastActivity(new Date());
      });

      // Reset the store
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      act(() => {
        result.current.reset();
      });

      // Verify all values are back to defaults

      expect(result.current.currentChatId).toBeNull();

      expect(result.current.isUIVisible).toBe(true);

      expect(result.current.messageInput).toBe('');

      expect(result.current.isTyping).toBe(false);

      expect(result.current.lastActivity).toBeNull();
    });
  });
});
