"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  AUTH_CHANGED_EVENT,
  getAuthServerSnapshot,
  getAuthUserSnapshot,
  logout as logoutService,
  subscribeAuth,
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

const hydrateSubscribe = () => () => {};
const getClientHydrated = () => true;
const getServerHydrated = () => false;

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const user = useSyncExternalStore(
    subscribeAuth,
    getAuthUserSnapshot,
    getAuthServerSnapshot,
  );
  const isClient = useSyncExternalStore(
    hydrateSubscribe,
    getClientHydrated,
    getServerHydrated,
  );
  const isLoading = !isClient;

  const refresh = useCallback(() => {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }, []);

  const logout = useCallback(async () => {
    await logoutService();
    router.push("/");
  }, [router]);

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
