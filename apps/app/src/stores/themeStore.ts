import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
  StateStorage,
  devtools,
} from 'zustand/middleware';
import { appStorage } from '../lib/storage';
import { zustandDevtoolsConfig } from '../lib/devtools';

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeState {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  getSystemTheme: () => 'light' | 'dark';
}

const getSystemTheme = (): 'light' | 'dark' => {
  // For web, check system preference
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  // Default to light for native platforms
  return 'light';
};

const applyTheme = (theme: Theme): boolean => {
  let isDark: boolean;

  switch (theme) {
    case 'dark':
      isDark = true;
      break;
    case 'light':
      isDark = false;
      break;
    case 'system':
    default:
      isDark = getSystemTheme() === 'dark';
      break;
  }

  // For web, apply theme to document
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute(
      'data-theme',
      isDark ? 'dark' : 'light',
    );
  }

  return isDark;
};

export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set, get) => ({
        theme: 'system',
        isDark: false,

        setTheme: (theme: Theme) => {
          const isDark = applyTheme(theme);
          set({ theme, isDark });
        },

        toggleTheme: () => {
          const currentTheme = get().theme;
          let newTheme: Theme;

          if (currentTheme === 'system') {
            // If system, toggle to opposite of current system preference
            newTheme = getSystemTheme() === 'dark' ? 'light' : 'dark';
          } else {
            // If explicit theme, toggle between light and dark
            newTheme = currentTheme === 'dark' ? 'light' : 'dark';
          }

          get().setTheme(newTheme);
        },

        getSystemTheme: () => {
          return getSystemTheme();
        },
      }),
      {
        name: 'theme-storage',
        storage: createJSONStorage(
          () =>
            ({
              getItem: (key: string) => appStorage.getString(key) ?? null,
              setItem: (key: string, value: string) =>
                appStorage.set(key, value),
              removeItem: (key: string) => appStorage.delete(key),
            }) as StateStorage,
        ),
        partialize: state => ({
          theme: state.theme,
        }),
        onRehydrateStorage: () => state => {
          if (state) {
            // Re-apply theme after rehydration
            state.setTheme(state.theme);
          }
        },
      },
    ),
    {
      enabled: zustandDevtoolsConfig.enabled,
      name: 'Theme Store',
    },
  ),
);

// Selector hooks
export const useTheme = () =>
  useThemeStore(state => ({
    theme: state.theme,
    isDark: state.isDark,
  }));

export const useThemeActions = () =>
  useThemeStore(state => ({
    setTheme: state.setTheme,
    toggleTheme: state.toggleTheme,
    getSystemTheme: state.getSystemTheme,
  }));

// Export useThemeColors for compatibility
export const useThemeColors = () =>
  useThemeStore(state => ({
    isDark: state.isDark,
    theme: state.theme,
  }));

// Export ThemeColors type
export interface ThemeColors {
  isDark: boolean;
  theme: Theme;
}
