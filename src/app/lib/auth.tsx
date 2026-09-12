import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { User } from "./types";

interface AuthResult {
  ok: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  adminPages: string[];
  hasAdminPage: (page: string) => boolean;
  viewAsStudent: boolean;
  setViewAsStudent: (v: boolean) => void;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const VIEW_KEY = "unzahssa_view_as_student";

async function buildUser(session: Session | null): Promise<User | null> {
  const su = session?.user;
  if (!su) return null;
  // Pick up an admin role that may have been granted after this user registered.
  try {
    await supabase.rpc("claim_admin_role");
  } catch {
    /* non-fatal */
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", su.id)
    .maybeSingle();
  return {
    id: su.id,
    email: su.email ?? "",
    name: profile?.full_name || (su.user_metadata?.name as string) || su.email || "",
    role: (profile?.role as User["role"]) || "student",
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminPages, setAdminPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewAsStudent, setViewAsStudentState] = useState<boolean>(() => {
    try { return sessionStorage.getItem(VIEW_KEY) === "1"; } catch { return false; }
  });

  const setViewAsStudent = useCallback((v: boolean) => {
    setViewAsStudentState(v);
    try { v ? sessionStorage.setItem(VIEW_KEY, "1") : sessionStorage.removeItem(VIEW_KEY); } catch { /* ignore */ }
  }, []);

  const sync = useCallback(async (session: Session | null) => {
    const u = await buildUser(session);
    setUser(u);
    if (u?.role === "admin") {
      const { data } = await supabase.rpc("my_admin_pages");
      setAdminPages((data as string[] | null) ?? []);
    } else {
      setAdminPages([]);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      await sync(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      void sync(session);
    });
    return () => sub.subscription.unsubscribe();
  }, [sync]);

  const refreshUser = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await sync(data.session);
  }, [sync]);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { ok: false, error: humanize(error.message) };
    await refreshUser();
    return { ok: true };
  }, [refreshUser]);

  const register = useCallback(async (name: string, email: string, password: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() } },
    });
    if (error) return { ok: false, error: humanize(error.message) };
    if (!data.session) {
      // Email confirmation is enabled on the project.
      return { ok: false, error: "Check your email to confirm your account before signing in." };
    }
    await refreshUser();
    return { ok: true };
  }, [refreshUser]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAdminPages([]);
    setViewAsStudent(false);
  }, [setViewAsStudent]);

  const hasAdminPage = useCallback(
    (page: string) => user?.role === "admin" && adminPages.includes(page),
    [user, adminPages],
  );

  const requestPasswordReset = useCallback(async (email: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { ok: false, error: humanize(error.message) };
    return { ok: true };
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ok: false, error: humanize(error.message) };
    return { ok: true };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin: user?.role === "admin",
        adminPages,
        hasAdminPage,
        viewAsStudent,
        setViewAsStudent,
        login,
        register,
        logout,
        refreshUser,
        requestPasswordReset,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function humanize(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "Incorrect email or password.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "An account with this email already exists.";
  if (m.includes("password should be")) return "Password must be at least 6 characters.";
  return msg;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
