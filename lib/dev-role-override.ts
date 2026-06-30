import { isDashboardRole, type DashboardRole } from "./roles";

const DEV_ROLE_OVERRIDE_KEY = "museumar_dev_role_override";

/** Dev-only: read role override from env or localStorage. Disabled in production. */
export function getDevRoleOverride(): DashboardRole | null {
  if (process.env.NODE_ENV === "production") return null;

  const fromEnv = process.env.NEXT_PUBLIC_DEV_ROLE_OVERRIDE?.trim();
  if (fromEnv && isDashboardRole(fromEnv)) return fromEnv;

  if (typeof window !== "undefined") {
    const fromStorage = localStorage.getItem(DEV_ROLE_OVERRIDE_KEY)?.trim();
    if (fromStorage && isDashboardRole(fromStorage)) return fromStorage;
  }

  return null;
}

/** API roleName, or dev override when testing dashboards before backend seed data exists. */
export function getEffectiveRoleName(roleName: string): string {
  return getDevRoleOverride() ?? roleName;
}

export function setDevRoleOverride(role: DashboardRole | null): void {
  if (process.env.NODE_ENV === "production") return;

  if (role === null) {
    localStorage.removeItem(DEV_ROLE_OVERRIDE_KEY);
  } else {
    localStorage.setItem(DEV_ROLE_OVERRIDE_KEY, role);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("museumar-dev-role-changed"));
  }
}
