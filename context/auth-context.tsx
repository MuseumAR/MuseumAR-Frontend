"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  AUTH_CHANGED_EVENT,
  getAuthUser,
  logout as logoutService,
  type StoredAuthUser,
} from "@/services/auth";

type AuthContextValue = {
  user: StoredAuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refresh: () => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<StoredAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setUser(getAuthUser());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();

    const onAuthChanged = () => refresh();
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    window.addEventListener("storage", onAuthChanged);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
      window.removeEventListener("storage", onAuthChanged);
    };
  }, [refresh]);

  const logout = useCallback(async () => {
    await logoutService();
    refresh();
    router.push("/");
  }, [refresh, router]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      refresh,
      logout,
    }),
    [user, isLoading, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
