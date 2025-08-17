import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          // Log only errors in production
          if (__DEV__) console.error('[AUTH] Error in getSession():', error);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        if (__DEV__) console.error('[AUTH] Exception in getSession():', error);
      } finally {
        setLoading(false);
      }
    };

    void getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error && __DEV__) {
        console.error('[AUTH] Sign-in failed:', error.message);
      }

      return { error };
    } catch (exception) {
      if (__DEV__) console.error('[AUTH] Exception during sign-in:', exception);
      return { error: exception as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error && __DEV__) {
        console.error('[AUTH] Sign-up failed:', error.message);
      }

      return { error };
    } catch (exception) {
      if (__DEV__) console.error('[AUTH] Exception during sign-up:', exception);
      return { error: exception as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();

      if (error && __DEV__) {
        console.error('[AUTH] Sign-out failed:', error.message);
      }

      return { error };
    } catch (exception) {
      if (__DEV__)
        console.error('[AUTH] Exception during sign-out:', exception);
      return { error: exception as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error && __DEV__) {
        console.error('[AUTH] Password reset failed:', error.message);
      }

      return { error };
    } catch (exception) {
      if (__DEV__)
        console.error('[AUTH] Exception during password reset:', exception);
      return { error: exception as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
