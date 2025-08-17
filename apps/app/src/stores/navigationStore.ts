import { create } from 'zustand';
import { createJSONStorage, persist, devtools } from 'zustand/middleware';
import { appStorage } from '../lib/storage';
import { zustandDevtoolsConfig } from '../lib/devtools';

export type Screen = 'auth' | 'home' | 'chat' | 'profile' | 'settings';

export interface NavigationState {
  // Current chat state
  currentScreen: Screen;
  previousScreen: Screen | null;

  // Navigation history
  history: Screen[];

  // Modal states
  isProfileModalVisible: boolean;
  isSettingsModalVisible: boolean;
  isAboutModalVisible: boolean;

  // Actions
  navigateTo: (screen: Screen) => void;
  goBack: () => void;
  resetNavigation: () => void;

  // Modal actions
  showProfileModal: () => void;
  hideProfileModal: () => void;
  showSettingsModal: () => void;
  hideSettingsModal: () => void;
  showAboutModal: () => void;
  hideAboutModal: () => void;
  hideAllModals: () => void;
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

export const useNavigationStore = create<NavigationState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentScreen: 'auth',
        previousScreen: null,
        history: ['auth'],
        isProfileModalVisible: false,
        isSettingsModalVisible: false,
        isAboutModalVisible: false,

        // Navigation actions
        navigateTo: (screen: Screen) => {
          const { currentScreen, history } = get();
          set({
            previousScreen: currentScreen,
            currentScreen: screen,
            history: [...history, screen],
          });
        },

        goBack: () => {
          const { history } = get();
          if (history.length > 1) {
            const newHistory = history.slice(0, -1);
            const previousScreen = newHistory[newHistory.length - 1];
            set({
              currentScreen: previousScreen,
              previousScreen:
                newHistory.length > 1
                  ? newHistory[newHistory.length - 2]
                  : null,
              history: newHistory,
            });
          }
        },

        resetNavigation: () => {
          set({
            currentScreen: 'auth',
            previousScreen: null,
            history: ['auth'],
          });
        },

        // Modal actions
        showProfileModal: () => set({ isProfileModalVisible: true }),
        hideProfileModal: () => set({ isProfileModalVisible: false }),

        showSettingsModal: () => set({ isSettingsModalVisible: true }),
        hideSettingsModal: () => set({ isSettingsModalVisible: false }),

        showAboutModal: () => set({ isAboutModalVisible: true }),
        hideAboutModal: () => set({ isAboutModalVisible: false }),

        hideAllModals: () =>
          set({
            isProfileModalVisible: false,
            isSettingsModalVisible: false,
            isAboutModalVisible: false,
          }),
      }),
      {
        name: 'navigation-store',
        storage: createJSONStorage(() => createStateStorage()),
        partialize: state => ({
          currentScreen: state.currentScreen,
          history: state.history,
        }),
      }
    ),
    {
      enabled: zustandDevtoolsConfig.enabled,
      name: 'Navigation Store',
    }
  )
);

// Selector hooks for better performance
export const useCurrentScreen = () =>
  useNavigationStore(state => state.currentScreen);

export const useNavigationHistory = () =>
  useNavigationStore(state => ({
    history: state.history,
    previousScreen: state.previousScreen,
  }));

export const useModals = () =>
  useNavigationStore(state => ({
    isProfileModalVisible: state.isProfileModalVisible,
    isSettingsModalVisible: state.isSettingsModalVisible,
    isAboutModalVisible: state.isAboutModalVisible,
  }));
