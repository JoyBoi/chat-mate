import { create } from 'zustand';
import { createJSONStorage, persist, devtools } from 'zustand/middleware';
import { appStorage } from '../lib/storage';
import { zustandDevtoolsConfig } from '../lib/devtools';

export interface UIState {
  // Loading states
  isLoading: boolean;
  loadingMessage: string;

  // Error states
  error: string | null;
  isErrorVisible: boolean;

  // Toast/notification states
  toast: {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    isVisible: boolean;
  } | null;

  // Modal states
  activeModal: string | null;

  // Actions
  setLoading: (isLoading: boolean, message?: string) => void;
  setError: (error: string | null) => void;
  showError: (error: string) => void;
  hideError: () => void;
  showToast: (
    message: string,
    type?: 'success' | 'error' | 'info' | 'warning',
  ) => void;
  hideToast: () => void;
  setActiveModal: (modalId: string | null) => void;
  clearAll: () => void;
}

const createStateStorage = () => {
  return {
    getItem: (name: string): string | null => {
      const value = appStorage.getString(name);
      return value ? (JSON.parse(value) as string) : null;
    },
    setItem: (name: string, value: string) => {
      appStorage.set(name, value);
    },
    removeItem: (name: string) => {
      appStorage.delete(name);
    },
  };
};

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      set => ({
        // Initial state
        isLoading: false,
        loadingMessage: '',
        error: null,
        isErrorVisible: false,
        toast: null,
        activeModal: null,

        // Actions
        setLoading: (isLoading: boolean, message = '') => {
          set({ isLoading, loadingMessage: message });
        },

        setError: (error: string | null) => {
          set({ error, isErrorVisible: !!error });
        },

        showError: (error: string) => {
          set({ error, isErrorVisible: true });
        },

        hideError: () => {
          set({ error: null, isErrorVisible: false });
        },

        showToast: (message: string, type = 'info' as const) => {
          set({ toast: { message, type, isVisible: true } });
        },

        hideToast: () => {
          set({ toast: null });
        },

        setActiveModal: (modalId: string | null) => {
          set({ activeModal: modalId });
        },

        clearAll: () => {
          set({
            isLoading: false,
            loadingMessage: '',
            error: null,
            isErrorVisible: false,
            toast: null,
            activeModal: null,
          });
        },
      }),
      {
        name: 'ui-store',
        storage: createJSONStorage(() => createStateStorage()),
        partialize: state => ({
          activeModal: state.activeModal,
        }),
      },
    ),
    {
      enabled: zustandDevtoolsConfig.enabled,
      name: 'UI Store',
    },
  ),
);

// Selector hooks
export const useLoading = () =>
  useUIStore(state => ({
    isLoading: state.isLoading,
    loadingMessage: state.loadingMessage,
  }));

export const useError = () =>
  useUIStore(state => ({
    error: state.error,
    isErrorVisible: state.isErrorVisible,
  }));

export const useToast = () => useUIStore(state => state.toast);

export const useActiveModal = () => useUIStore(state => state.activeModal);
