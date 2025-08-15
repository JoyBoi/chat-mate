import React from 'react';
import { Platform } from 'react-native';

// React Query DevTools configuration
export const reactQueryDevtoolsConfig = {
  initialIsOpen: false,
  position: 'bottom-right' as const,
  panelProps: {
    style: {
      zIndex: 99999,
    },
  },
};

// Zustand DevTools configuration
export const zustandDevtoolsConfig = {
  enabled: __DEV__ && Platform.OS === 'web',
  name: 'ChatMate Store',
  serialize: true,
  trace: true,
};

// Check if devtools should be enabled
export const shouldEnableDevtools = () => {
  return __DEV__ && Platform.OS === 'web';
};

// DevTools component for conditional rendering
export const DevToolsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  if (!shouldEnableDevtools()) {
    return React.createElement(React.Fragment, null, children);
  }

  // For web platform, we'll conditionally render devtools
  // This should be handled in the main App component
  return React.createElement(React.Fragment, null, children);
};
