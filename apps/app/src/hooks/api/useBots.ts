import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { queryKeys } from '../../lib/queryClient';

export interface BotPersonality {
  id: string;
  name: string;
  description: string;
  prompt: string;
  avatar?: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBotRequest {
  name: string;
  description: string;
  prompt: string;
  avatar?: string;
  category?: string;
}

export interface UpdateBotRequest extends Partial<CreateBotRequest> {
  isActive?: boolean;
}

// Get all bot personalities
export const useBots = () => {
  return useQuery({
    queryKey: queryKeys.bots.all,
    queryFn: async () => {
      const response = await apiClient.get<BotPersonality[]>('/bots');
      return response.data;
    },
  });
};

// Get active bot personalities only
export const useActiveBots = () => {
  return useQuery({
    queryKey: queryKeys.bots.active,
    queryFn: async () => {
      const response = await apiClient.get<BotPersonality[]>('/bots/active');
      return response.data;
    },
  });
};

// Get single bot personality
export const useBot = (id: string) => {
  return useQuery({
    queryKey: queryKeys.bots.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<BotPersonality>(`/bots/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

// Create new bot personality
export const useCreateBot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBotRequest): Promise<BotPersonality> => {
      const response = await apiClient.post('/bots', data);
      return (response.data as { data: BotPersonality }).data;
    },
    onSuccess: newBot => {
      // Invalidate and refetch bot lists
      void queryClient.invalidateQueries({ queryKey: queryKeys.bots.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.bots.active });

      // Add the new bot to the cache
      queryClient.setQueryData(queryKeys.bots.detail(newBot.id), newBot);
    },
  });
};

// Update bot personality
export const useUpdateBot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      botId,
      data,
    }: {
      botId: string;
      data: UpdateBotRequest;
    }): Promise<BotPersonality> => {
      const response = await apiClient.patch(`/bots/${botId}`, data);
      return (response.data as { data: BotPersonality }).data;
    },
    onSuccess: updatedBot => {
      // Update the specific bot in cache
      queryClient.setQueryData(
        queryKeys.bots.detail(updatedBot.id),
        updatedBot,
      );

      // Invalidate lists to ensure consistency
      void queryClient.invalidateQueries({ queryKey: queryKeys.bots.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.bots.active });
    },
  });
};

// Delete bot personality
export const useDeleteBot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (botId: string): Promise<void> => {
      await apiClient.delete(`/bots/${botId}`);
    },
    onSuccess: (_, botId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.bots.detail(botId) });

      // Invalidate lists
      void queryClient.invalidateQueries({ queryKey: queryKeys.bots.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.bots.active });
    },
  });
};

// Toggle bot active status
export const useToggleBotStatus = () => {
  const updateBot = useUpdateBot();

  return useMutation({
    mutationFn: async ({
      botId,
      isActive,
    }: {
      botId: string;
      isActive: boolean;
    }) => {
      return updateBot.mutateAsync({ botId, data: { isActive } });
    },
  });
};
