import { useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    // 1. Get initial active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState({
        session,
        user: session?.user ?? null,
        isLoading: false,
        isAuthenticated: !!session?.user,
      });
    }).catch(() => {
      setAuthState((s) => ({ ...s, isLoading: false }));
    });

    // 2. Listen to real-time auth state updates (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState({
        session,
        user: session?.user ?? null,
        isLoading: false,
        isAuthenticated: !!session?.user,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  }, []);

  const signUp = useCallback(async (email: string, password: string, metadata?: { username?: string; name?: string }) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
  }, []);

  const signOut = useCallback(async () => {
    return await supabase.auth.signOut();
  }, []);

  const getAccessToken = useCallback((): string | undefined => {
    return authState.session?.access_token;
  }, [authState.session]);

  return {
    ...authState,
    signInWithPassword,
    signUp,
    signOut,
    getAccessToken,
  };
}
