import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, User, Session } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { api } from './api';

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

interface AuthContextType {
  user: User | null;
  session: Session | null;
  token: string | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdmin = async (token: string) => {
    try {
      const res = await api('/admin/check', {}, token);
      console.log('Admin check result:', res.isAdmin);
      setIsAdmin(res.isAdmin);
    } catch (err) {
      console.error('Admin check failed:', err);
      setIsAdmin(false);
    }
  };

  const refreshUser = async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    setSession(s);
    setUser(s?.user || null);
    if (s?.access_token) await checkAdmin(s.access_token);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user || null);
      if (s?.access_token) await checkAdmin(s.access_token);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      console.log('Auth state changed:', _event, s?.user?.email);
      setSession(s);
      setUser(s?.user || null);
      if (s?.access_token) await checkAdmin(s.access_token);
      else setIsAdmin(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    // Wait for session to be available, then force admin check
    setTimeout(async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (s?.access_token) await checkAdmin(s.access_token);
    }, 200);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, token: session?.access_token || null, isAdmin, loading, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { supabase };