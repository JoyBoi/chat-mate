import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  InfiniteData,
} from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { queryKeys } from '../../lib/queryClient';

import type {
  ChatMessage,
  MessageReaction,
  SendMessageRequest,
  UpdateMessageRequest,
  MessagesResponse,
} from '@chat-mate/types';

// Re-export shared types for convenience
export type {
  ChatMessage,
  MessageReaction,
  SendMessageRequest,
  UpdateMessageRequest,
  MessagesResponse,
};

// Get messages for a chat room with infinite scroll
export const useMessages = (chatRoomId: string, limit = 50) => {
  return useInfiniteQuery({
    queryKey: queryKeys.messages.list(chatRoomId),
    queryFn: async ({ pageParam }): Promise<MessagesResponse> => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(pageParam && { cursor: pageParam }),
      });
      const response = await apiClient.get(`/messages/${chatRoomId}?${params}`);
      return (response.data as { data: MessagesResponse }).data;
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage: MessagesResponse) => lastPage.nextCursor,
    enabled: !!chatRoomId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// Get a single message
export const useMessage = (messageId: string) => {
  return useQuery({
    queryKey: queryKeys.messages.detail(messageId),
    queryFn: async (): Promise<ChatMessage> => {
      const response = await apiClient.get(`/messages/single/${messageId}`);
      return (response.data as { data: ChatMessage }).data;
    },
    enabled: !!messageId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Send a new message
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SendMessageRequest): Promise<ChatMessage> => {
      const response = await apiClient.post('/messages', data);
      return (response.data as { data: ChatMessage }).data;
    },
    onSuccess: (newMessage, variables) => {
      // Add the new message to the infinite query cache
      queryClient.setQueryData(
        queryKeys.messages.list(variables.chatRoomId),
        (oldData: InfiniteData<MessagesResponse> | undefined) => {
          if (!oldData)
            return {
              pages: [{ messages: [newMessage] }],
              pageParams: [undefined],
            };
          const newPages = [...oldData.pages];
          if (newPages[0]) {
            newPages[0] = {
              ...newPages[0],
              messages: [newMessage, ...newPages[0].messages],
            };
          }
          return { ...oldData, pages: newPages };
        }
      );

      // Invalidate chat room queries to update last message
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chatRooms.detail(variables.chatRoomId),
      });
    },
  });
};

// Update a message
export const useUpdateMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      data,
    }: {
      messageId: string;
      data: UpdateMessageRequest;
    }): Promise<ChatMessage> => {
      const response = await apiClient.patch(`/messages/${messageId}`, data);
      return (response.data as { data: ChatMessage }).data;
    },
    onSuccess: updatedMessage => {
      queryClient.setQueryData(
        queryKeys.messages.detail(updatedMessage.id),
        updatedMessage
      );

      queryClient.setQueryData(
        queryKeys.messages.list(updatedMessage.chatRoomId),
        (oldData: InfiniteData<MessagesResponse> | undefined) => {
          if (!oldData) return oldData;

          const newPages = oldData.pages.map((page: MessagesResponse) => ({
            ...page,
            messages: page.messages.map((msg: ChatMessage) =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            ),
          }));

          return {
            ...oldData,
            pages: newPages,
          };
        }
      );
    },
  });
};

// Delete a message
export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string): Promise<void> => {
      await apiClient.delete(`/messages/${messageId}`);
    },
    onSuccess: (_, messageId) => {
      void queryClient.removeQueries({
        queryKey: queryKeys.messages.detail(messageId),
      });

      queryClient.setQueriesData(
        { queryKey: ['messages', 'list'] },
        (oldData: InfiniteData<MessagesResponse> | undefined) => {
          if (!oldData) return oldData;

          const newPages = oldData.pages.map((page: MessagesResponse) => ({
            ...page,
            messages: page.messages.filter(
              (msg: ChatMessage) => msg.id !== messageId
            ),
          }));

          return {
            ...oldData,
            pages: newPages,
          };
        }
      );
    },
  });
};

// Add reaction to message
export const useAddReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
    }): Promise<MessageReaction> => {
      const response = await apiClient.post(
        `/messages/${messageId}/reactions`,
        { emoji }
      );
      return (response.data as { data: MessageReaction }).data;
    },
    onSuccess: (newReaction, { messageId }) => {
      queryClient.setQueryData(
        queryKeys.messages.detail(messageId),
        (oldMessage: ChatMessage | undefined) => {
          if (!oldMessage) return oldMessage;

          return {
            ...oldMessage,
            reactions: [...(oldMessage.reactions || []), newReaction],
          };
        }
      );

      queryClient.setQueriesData(
        { queryKey: ['messages', 'list'] },
        (oldData: InfiniteData<MessagesResponse> | undefined) => {
          if (!oldData) return oldData;

          const newPages = oldData.pages.map((page: MessagesResponse) => ({
            ...page,
            messages: page.messages.map((msg: ChatMessage) =>
              msg.id === messageId
                ? {
                    ...msg,
                    reactions: [...(msg.reactions || []), newReaction],
                  }
                : msg
            ),
          }));

          return {
            ...oldData,
            pages: newPages,
          };
        }
      );
    },
  });
};

// Remove reaction from message
export const useRemoveReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      reactionId,
    }: {
      messageId: string;
      reactionId: string;
    }): Promise<void> => {
      await apiClient.delete(`/messages/${messageId}/reactions/${reactionId}`);
    },
    onSuccess: (_, { messageId, reactionId }) => {
      queryClient.setQueryData(
        queryKeys.messages.detail(messageId),
        (oldMessage: ChatMessage | undefined) => {
          if (!oldMessage) return oldMessage;

          return {
            ...oldMessage,
            reactions:
              oldMessage.reactions?.filter(r => r.id !== reactionId) || [],
          };
        }
      );

      queryClient.setQueriesData(
        { queryKey: ['messages', 'list'] },
        (oldData: InfiniteData<MessagesResponse> | undefined) => {
          if (!oldData) return oldData;

          const newPages = oldData.pages.map((page: MessagesResponse) => ({
            ...page,
            messages: page.messages.map((msg: ChatMessage) =>
              msg.id === messageId
                ? {
                    ...msg,
                    reactions:
                      msg.reactions?.filter(r => r.id !== reactionId) || [],
                  }
                : msg
            ),
          }));

          return {
            ...oldData,
            pages: newPages,
          };
        }
      );
    },
  });
};
