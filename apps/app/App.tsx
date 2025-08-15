import React, { Suspense } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { AuthScreen } from './src/screens/AuthScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { Loading } from './src/components/Loading';
import { queryClient } from './src/lib/queryClient';
import { shouldEnableDevtools } from './src/lib/devtools';
import { Platform } from 'react-native';
import './global.css';

// Lazy load DevTools for web only
const DevTools = React.lazy(() =>
  import('@tanstack/react-query-devtools').then(module => ({
    default: module.ReactQueryDevtools,
  })),
);

const AppContent: React.FC = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return <Loading message="Initializing..." />;
  }

  return (
    <>
      {session ? <HomeScreen /> : <AuthScreen />}
      <StatusBar style="auto" />
    </>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
        {Platform.OS === 'web' && shouldEnableDevtools() && (
          <Suspense fallback={null}>
            <DevTools initialIsOpen={false} />
          </Suspense>
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
