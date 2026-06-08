import type { Role } from "@/lib/roles";
import { DashboardShell } from "./dashboard-shell";

export function RoleLayout({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  return <DashboardShell role={role}>{children}</DashboardShell>;
}
