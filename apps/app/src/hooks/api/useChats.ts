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
  ChatRoom,
  ChatParticipant,
  CreateChatRequest,
  UpdateChatRequest,
  ChatsResponse,
} from '@chat-mate/types';

// Re-export shared types for convenience
export type {
  ChatRoom,
  ChatParticipant,
  CreateChatRequest,
  UpdateChatRequest,
  ChatsResponse,
};

// Get all chat rooms for the current user
export const useChats = (limit = 20) => {
  return useInfiniteQuery({
    queryKey: queryKeys.chats.list(),
    queryFn: async ({ pageParam }): Promise<ChatsResponse> => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(pageParam && { cursor: pageParam }),
      });
      const response = await apiClient.get(`/chats?${params}`);
      return (response.data as { data: ChatsResponse }).data;
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage: ChatsResponse) => lastPage.nextCursor,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// Get a single chat room
export const useChat = (chatId: string) => {
  return useQuery({
    queryKey: queryKeys.chats.detail(chatId),
    queryFn: async (): Promise<ChatRoom> => {
      const response = await apiClient.get(`/chats/${chatId}`);
      return (response.data as { data: ChatRoom }).data;
    },
    enabled: !!chatId,
    staleTime: 60 * 1000,
  });
};

// Get chat participants
export const useChatParticipants = (chatId: string) => {
  return useQuery({
    queryKey: queryKeys.chats.participants(chatId),
    queryFn: async (): Promise<ChatParticipant[]> => {
      const response = await apiClient.get(`/chats/${chatId}/participants`);
      return (response.data as { data: ChatParticipant[] }).data;
    },
    enabled: !!chatId,
    staleTime: 60 * 1000,
  });
};

// Create a new chat room
export const useCreateChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateChatRequest): Promise<ChatRoom> => {
      const response = await apiClient.post('/chats', data);
      return (response.data as { data: ChatRoom }).data;
    },
    onSuccess: newChat => {
      // Add the new chat to the infinite query cache
      queryClient.setQueryData(
        queryKeys.chats.list(),
        (oldData: InfiniteData<ChatsResponse> | undefined) => {
          if (!oldData)
            return {
              pages: [{ chats: [newChat] }],
              pageParams: [undefined],
            };
          const newPages = [...oldData.pages];
          if (newPages[0]) {
            newPages[0] = {
              ...newPages[0],
              chats: [newChat, ...newPages[0].chats],
            };
          }
          return { ...oldData, pages: newPages };
        }
      );

      // Set the individual chat data
      queryClient.setQueryData(queryKeys.chats.detail(newChat.id), newChat);
    },
  });
};

// Update a chat room
export const useUpdateChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chatId,
      data,
    }: {
      chatId: string;
      data: UpdateChatRequest;
    }): Promise<ChatRoom> => {
      const response = await apiClient.put(`/chats/${chatId}`, data);
      return (response.data as { data: ChatRoom }).data;
    },
    onSuccess: updatedChat => {
      // Update the chat in all relevant queries
      queryClient.setQueryData(
        queryKeys.chats.detail(updatedChat.id),
        updatedChat
      );

      // Update the chat in the list query
      queryClient.setQueryData(
        queryKeys.chats.list(),
        (oldData: InfiniteData<ChatsResponse> | undefined) => {
          if (!oldData) return oldData;
          const newPages = oldData.pages.map((page: ChatsResponse) => ({
            ...page,
            chats: page.chats.map((chat: ChatRoom) =>
              chat.id === updatedChat.id ? updatedChat : chat
            ),
          }));
          return { ...oldData, pages: newPages };
        }
      );
    },
  });
};

// Delete a chat room
export const useDeleteChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatId: string): Promise<void> => {
      await apiClient.delete(`/chats/${chatId}`);
    },
    onSuccess: (_, chatId) => {
      // Remove the chat from all queries
      void queryClient.removeQueries({
        queryKey: queryKeys.chats.detail(chatId),
      });

      void queryClient.removeQueries({
        queryKey: queryKeys.chats.participants(chatId),
      });

      void queryClient.removeQueries({
        queryKey: queryKeys.messages.list(chatId),
      });

      // Remove from the list query
      queryClient.setQueryData(
        queryKeys.chats.list(),
        (oldData: InfiniteData<ChatsResponse> | undefined) => {
          if (!oldData) return oldData;
          const newPages = oldData.pages.map((page: ChatsResponse) => ({
            ...page,
            chats: page.chats.filter((chat: ChatRoom) => chat.id !== chatId),
          }));
          return { ...oldData, pages: newPages };
        }
      );
    },
  });
};

// Join a chat room
export const useJoinChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatId: string): Promise<ChatParticipant> => {
      const response = await apiClient.post(`/chats/${chatId}/join`);
      return (response.data as { data: ChatParticipant }).data;
    },
    onSuccess: (participant, chatId) => {
      // Invalidate participants query
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chats.participants(chatId),
      });

      // Invalidate chat details to update participant count
      void queryClient.invalidateQueries({
        queryKey: queryKeys.chats.detail(chatId),
      });
    },
  });
};

// Leave a chat room
export const useLeaveChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatId: string): Promise<void> => {
      await apiClient.post(`/chats/${chatId}/leave`);
    },
    onSuccess: (_, chatId) => {
      // Remove the chat from user's chat list
      queryClient.setQueryData(
        queryKeys.chats.list(),
        (oldData: InfiniteData<ChatsResponse> | undefined) => {
          if (!oldData) return oldData;
          const newPages = oldData.pages.map((page: ChatsResponse) => ({
            ...page,
            chats: page.chats.filter((chat: ChatRoom) => chat.id !== chatId),
          }));
          return { ...oldData, pages: newPages };
        }
      );

      // Remove related queries
      void queryClient.removeQueries({
        queryKey: queryKeys.chats.detail(chatId),
      });

      void queryClient.removeQueries({
        queryKey: queryKeys.chats.participants(chatId),
      });
    },
  });
};
