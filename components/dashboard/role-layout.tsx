import type { DashboardRole } from "@/lib/roles";
import { ProtectedRoleLayout } from "./protected-role-layout";

export function RoleLayout({
  role,
  children,
}: {
  role: DashboardRole;
  children: React.ReactNode;
}) {
  return <ProtectedRoleLayout role={role}>{children}</ProtectedRoleLayout>;
}
