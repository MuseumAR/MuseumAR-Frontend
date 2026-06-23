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
  | "museum_management"
  | "ticket_types"
  | "system_config";

export type NavItem = {
  label: string;
  href: string;
  icon: NavIcon;
};

export const ROLE_LABELS: Record<BackendRole, string> = {
  SystemAdmin: "System Admin",
  MuseumManager: "Museum Manager",
  ContentManager: "Content Manager",
  Visitor: "Visitor",
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
  Visitor: "/",
};

export function isDashboardRole(roleName: string): roleName is DashboardRole {
  return (DASHBOARD_ROLES as readonly string[]).includes(roleName);
}

export function getHomePathForRole(roleName: string): string {
  return ROLE_HOME_PATH[roleName as BackendRole] ?? "/";
}

export function getRoleDisplayLabel(roleName: string): string {
  return ROLE_LABELS[roleName as BackendRole] ?? roleName;
}

const NAV_CONFIG: Record<NavIcon, { label: string; segment: string }> = {
  overview: { label: "Overview", segment: "overview" },
  museum_profile: { label: "Museum Profile", segment: "museum-profile" },
  analytics: { label: "Analytics", segment: "analytics" },
  artifact: { label: "Artifacts", segment: "artifact" },
  exhibition: { label: "Exhibitions", segment: "exhibition" },
  content_versions: { label: "Content Versions", segment: "content-versions" },
  offline_packages: { label: "Offline Packages", segment: "offline-packages" },
  maps_routes: { label: "Maps & Routes", segment: "maps-routes" },
  ticket_application: {
    label: "Ticket Management",
    segment: "ticket-application",
  },
  museum_management: {
    label: "Museum Overview",
    segment: "museum-management",
  },
  ticket_types: { label: "Ticket Types", segment: "ticket-types" },
  system_config: {
    label: "System Configuration",
    segment: "system-config",
  },
};

/** Navigation aligned with backend role permissions */
export const ROLE_NAV: Record<DashboardRole, NavIcon[]> = {
  SystemAdmin: ["museum_management", "ticket_types", "system_config"],
  MuseumManager: [
    "overview",
    "analytics",
    "museum_profile",
    "artifact",
    "ticket_application",
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
