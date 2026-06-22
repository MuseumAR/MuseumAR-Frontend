import type { Role } from "@/lib/roles";
import { ROLE_BASE_PATH } from "@/lib/roles";

export const DASHBOARD_ROLES: Role[] = [
  "admin",
  "content_manager",
  "museum_manager",
  "analyst",
];

export function isDashboardRole(role: string): role is Role {
  return DASHBOARD_ROLES.includes(role as Role);
}

export function getRoleBasePath(role: Role) {
  return ROLE_BASE_PATH[role];
}
