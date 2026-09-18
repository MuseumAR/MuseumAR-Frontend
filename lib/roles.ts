/** Role names from backend `Roles` table seed data */
export type BackendRole =
  | "SystemAdmin"
  | "MuseumManager"
  | "ContentManager"
  | "Visitor";

export type DashboardRole = Exclude<BackendRole, "Visitor">;

export const DASHBOARD_ROLES: DashboardRole[] = [
  "SystemAdmin",
  "MuseumManager",
  "ContentManager",
];

export type NavIcon =
  | "overview"
  | "museum_profile"
  | "analytics"
  | "artifact"
  | "exhibition"
  | "content_versions"
  | "offline_packages"
  | "maps_routes"
  | "ticket_application"
  | "refunds"
  | "museum_management"
  | "users"
  | "ticket_types"
  | "audit_logs"
  | "taxonomy"
  | "system_config";

export type NavItem = {
  label: string;
  href: string;
  icon: NavIcon;
};

export const ROLE_LABELS: Record<BackendRole, string> = {
  SystemAdmin: "Quản trị hệ thống",
  MuseumManager: "Quản lý bảo tàng",
  ContentManager: "Quản lý nội dung",
  Visitor: "Khách tham quan",
};

export const ROLE_BASE_PATH: Record<DashboardRole, string> = {
  SystemAdmin: "/admin",
  MuseumManager: "/museum-manager",
  ContentManager: "/content-manager",
};

export const ROLE_HOME_PATH: Record<BackendRole, string> = {
  SystemAdmin: "/admin/museum-management",
  MuseumManager: "/museum-manager/overview",
  ContentManager: "/content-manager/overview",
  Visitor: "/tickets",
};

export function canonicalRoleName(roleName: string): string {
  const compact = roleName.trim().toLowerCase().replace(/[\s_-]+/g, "");
  const map: Record<string, BackendRole> = {
    systemadmin: "SystemAdmin",
    museummanager: "MuseumManager",
    contentmanager: "ContentManager",
    visitor: "Visitor",
  };
  return map[compact] ?? roleName.trim();
}

export function isDashboardRole(roleName: string): roleName is DashboardRole {
  return (DASHBOARD_ROLES as readonly string[]).includes(
    canonicalRoleName(roleName),
  );
}

export function getHomePathForRole(roleName: string): string {
  const role = canonicalRoleName(roleName) as BackendRole;
  return ROLE_HOME_PATH[role] ?? "/";
}

/** After login: staff always land on their dashboard. Visitor keeps `next` if it is a public page. */
export function getPostLoginPath(roleName: string, next?: string | null): string {
  const home = getHomePathForRole(roleName);
  const role = canonicalRoleName(roleName);
  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : null;

  if (isDashboardRole(role)) {
    const base = ROLE_BASE_PATH[role];
    if (safeNext && (safeNext === base || safeNext.startsWith(`${base}/`))) {
      return safeNext;
    }
    return home;
  }

  if (
    safeNext &&
    !safeNext.startsWith("/admin") &&
    !safeNext.startsWith("/museum-manager") &&
    !safeNext.startsWith("/content-manager")
  ) {
    return safeNext;
  }

  return home;
}

export function getRoleDisplayLabel(roleName: string): string {
  const role = canonicalRoleName(roleName) as BackendRole;
  return ROLE_LABELS[role] ?? roleName.trim();
}

const NAV_CONFIG: Record<NavIcon, { label: string; segment: string }> = {
  overview: { label: "Tổng quan", segment: "overview" },
  museum_profile: { label: "Hồ sơ bảo tàng", segment: "museum-profile" },
  analytics: { label: "Phân tích", segment: "analytics" },
  artifact: { label: "Hiện vật", segment: "artifact" },
  exhibition: { label: "Triển lãm", segment: "exhibition" },
  content_versions: { label: "Phiên bản nội dung", segment: "content-versions" },
  offline_packages: { label: "Gói offline", segment: "offline-packages" },
  maps_routes: { label: "Bản đồ & Lộ trình", segment: "maps-routes" },
  ticket_application: {
    label: "Quản lý vé",
    segment: "ticket-application",
  },
  refunds: {
    label: "Hoàn vé",
    segment: "refunds",
  },
  museum_management: {
    label: "Hồ sơ bảo tàng",
    segment: "museum-management",
  },
  users: {
    label: "Người dùng",
    segment: "users",
  },
  ticket_types: { label: "Loại vé", segment: "ticket-types" },
  audit_logs: { label: "Nhật ký hệ thống", segment: "audit-logs" },
  taxonomy: { label: "Phân loại", segment: "taxonomy" },
  system_config: {
    label: "Cấu hình hệ thống",
    segment: "system-config",
  },
};

/** Navigation aligned with backend role permissions */
export const ROLE_NAV: Record<DashboardRole, NavIcon[]> = {
  SystemAdmin: [
    "museum_management",
    "users",
    "ticket_types",
    "taxonomy",
    "audit_logs",
    "system_config",
  ],
  MuseumManager: [
    "overview",
    "analytics",
    "museum_profile",
    "artifact",
    "ticket_application",
    "refunds",
  ],
  ContentManager: [
    "overview",
    "artifact",
    "exhibition",
    "content_versions",
    "offline_packages",
    "maps_routes",
  ],
};

export function getNavForRole(role: DashboardRole): NavItem[] {
  const base = ROLE_BASE_PATH[role];
  return ROLE_NAV[role].map((icon) => ({
    icon,
    label: NAV_CONFIG[icon].label,
    href: `${base}/${NAV_CONFIG[icon].segment}`,
  }));
}
