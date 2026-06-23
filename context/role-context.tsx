"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAuth } from "@/context/auth-context";
import type { DashboardRole } from "@/lib/roles";

type RoleContextValue = {
  role: DashboardRole;
  userName: string;
  email: string;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({
  role,
  children,
}: {
  role: DashboardRole;
  children: ReactNode;
}) {
  const { user } = useAuth();

  const value = useMemo(
    () => ({
      role,
      userName: user?.fullName ?? "User",
      email: user?.email ?? "",
    }),
    [role, user],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within RoleProvider");
  }
  return context;
}
