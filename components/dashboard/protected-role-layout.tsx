"use client";

import type { DashboardRole } from "@/lib/roles";
import { RoleProvider } from "@/context/role-context";
import { DashboardShell } from "./dashboard-shell";
import { RoleGuard } from "./role-guard";

export function ProtectedRoleLayout({
  role,
  children,
}: {
  role: DashboardRole;
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRole={role}>
      <RoleProvider role={role}>
        <DashboardShell role={role}>{children}</DashboardShell>
      </RoleProvider>
    </RoleGuard>
  );
}
