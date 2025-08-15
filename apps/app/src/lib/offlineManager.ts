import { QueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { appStorage } from './storage';
import { apiClient } from './api';

export interface OfflineMutation {
  id: string;
  mutationKey: string[];
  variables: unknown;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: unknown;
}

export interface OfflineQueueState {
  mutations: OfflineMutation[];
  isOnline: boolean;
  isProcessing: boolean;
  lastSyncTime?: number;
}

class OfflineManager {
  private queryClient: QueryClient;
  private queue: OfflineMutation[] = [];
  private isOnline: boolean = true;
  private isProcessing = false;
  private syncInterval?: NodeJS.Timeout;
  private readonly STORAGE_KEY = 'offline_mutation_queue';
  private readonly SYNC_INTERVAL = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.loadQueueFromStorage();
    this.initializeNetworkListener();
    this.startSyncInterval();
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }

  private initializeNetworkListener() {
    if (Platform.OS === 'web') {
      this.isOnline = navigator.onLine;

      const handleOnline = () => {
        const wasOffline = !this.isOnline;
        this.isOnline = true;
        if (wasOffline) {
          void this.processQueue();
        }
      };

      const handleOffline = () => {
        this.isOnline = false;
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    } else {
      this.isOnline = true;
      this.startConnectivityCheck();
    }
  }

  private loadQueueFromStorage() {
    try {
      const storedQueue = appStorage.getString(this.STORAGE_KEY);
      if (storedQueue) {
        this.queue = JSON.parse(storedQueue) as OfflineMutation[];
      }
    } catch (error) {
      console.error('Failed to load offline queue from storage:', error);
    }
  }

  private saveQueueToStorage() {
    try {
      appStorage.set(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue to storage:', error);
    }
  }

  private startSyncInterval() {
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.queue.length > 0) {
        void this.processQueue();
      }
    }, this.SYNC_INTERVAL);
  }

  private startConnectivityCheck() {
    setInterval(() => {
      void apiClient
        .get('/health')
        .then(() => {
          const wasOffline = !this.isOnline;
          this.isOnline = true;
          if (wasOffline && this.queue.length > 0) {
            void this.processQueue();
          }
        })
        .catch(() => {
          this.isOnline = false;
        });
    }, 10000);
  }

  public addMutation(
    mutation: Omit<OfflineMutation, 'id' | 'timestamp' | 'retryCount'>,
  ): void {
    const offlineMutation: OfflineMutation = {
      ...mutation,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: mutation.maxRetries || this.MAX_RETRIES,
    };

    this.queue.push(offlineMutation);
    this.saveQueueToStorage();

    if (this.isOnline) {
      void this.processQueue();
    }
  }

  private async processQueue() {
    if (this.isProcessing || !this.isOnline || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const processedIds: string[] = [];

    try {
      for (const mutation of [...this.queue]) {
        try {
          await this.executeMutation(mutation);
          processedIds.push(mutation.id);

          void this.queryClient.invalidateQueries({
            queryKey: mutation.mutationKey,
          });
        } catch (error) {
          mutation.retryCount++;
          if (mutation.retryCount >= mutation.maxRetries) {
            processedIds.push(mutation.id);
            console.error(
              `Failed to execute offline mutation after ${mutation.maxRetries} retries:`,
              error,
            );
          }
        }
      }

      this.queue = this.queue.filter(m => !processedIds.includes(m.id));
      this.saveQueueToStorage();
    } finally {
      this.isProcessing = false;
    }
  }

  private async executeMutation(mutation: OfflineMutation): Promise<void> {
    const method = mutation.method;
    const endpoint = mutation.endpoint;
    const data = mutation.data;

    switch (method) {
      case 'POST':
        await apiClient.post(endpoint, data);
        break;
      case 'PUT':
        await apiClient.put(endpoint, data);
        break;
      case 'PATCH':
        await apiClient.patch(endpoint, data);
        break;
      case 'DELETE':
        await apiClient.delete(endpoint);
        break;
      case 'GET':
        await apiClient.get(endpoint);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method as string}`);
    }
  }

  public getQueueState(): OfflineQueueState {
    return {
      mutations: [...this.queue],
      isOnline: this.isOnline,
      isProcessing: this.isProcessing,
      lastSyncTime:
        this.queue.length > 0
          ? Math.max(...this.queue.map(m => m.timestamp))
          : undefined,
    };
  }

  public clearQueue(): void {
    this.queue = [];
    this.saveQueueToStorage();
  }

  public removeMutation(id: string): boolean {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(m => m.id !== id);

    if (this.queue.length !== initialLength) {
      this.saveQueueToStorage();
      return true;
    }

    return false;
  }

  public destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

let offlineManagerInstance: OfflineManager | null = null;

export const createOfflineManager = (
  queryClient: QueryClient,
): OfflineManager => {
  if (!offlineManagerInstance) {
    offlineManagerInstance = new OfflineManager(queryClient);
  }
  return offlineManagerInstance;
};

export const getOfflineManager = (): OfflineManager | null => {
  return offlineManagerInstance;
};

export const createOfflineMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    mutationKey: string[];
    endpoint: string;
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    getRequestData?: (variables: TVariables) => any;
    maxRetries?: number;
  },
) => {
  return async (variables: TVariables): Promise<TData> => {
    const offlineManager = getOfflineManager();

    if (!offlineManager) {
      throw new Error('Offline manager not initialized');
    }

    if (offlineManager.getIsOnline()) {
      try {
        return await mutationFn(variables);
      } catch (error) {
        offlineManager.addMutation({
          mutationKey: options.mutationKey,
          variables: variables as unknown,
          endpoint: options.endpoint,
          method: options.method,
          data: options.getRequestData
            ? options.getRequestData(variables)
            : (variables as unknown),
          maxRetries: options.maxRetries || 3,
        });
        throw error;
      }
    } else {
      offlineManager.addMutation({
        mutationKey: options.mutationKey,
        variables: variables as any,
        endpoint: options.endpoint,
        method: options.method,
        data: options.getRequestData
          ? options.getRequestData(variables)
          : (variables as any),
        maxRetries: options.maxRetries || 3,
      });

      throw new Error(
        'Offline: Mutation queued for when connection is restored',
      );
    }
  };
};
