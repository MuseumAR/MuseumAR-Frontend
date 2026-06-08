"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Role } from "@/lib/roles";

type RoleContextValue = {
  role: Role;
  userName: string;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({
      role,
      userName: "Quang",
    }),
    [role],
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
