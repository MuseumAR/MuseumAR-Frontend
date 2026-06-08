"use client";

import { RoleProvider } from "@/context/role-context";
import type { Role } from "@/lib/roles";
import { Sidebar } from "./sidebar";

export function DashboardShell({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  return (
    <RoleProvider role={role}>
      <div className="flex min-h-screen bg-black text-white">
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </RoleProvider>
  );
}
