const ROLE_HOME_PATH: Record<string, string> = {
  SystemAdmin: "/admin/user-management",
  Admin: "/admin/user-management",
  MuseumManager: "/museum-manager/overview",
  ContentManager: "/content-manager/overview",
  Analyst: "/analyst/overview",
};

export function getHomePathForRole(roleName: string): string {
  return ROLE_HOME_PATH[roleName] ?? "/";
}
