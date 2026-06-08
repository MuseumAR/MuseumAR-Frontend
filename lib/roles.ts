export type Role = "museum_manager" | "content_manager" | "admin" | "analyst";

export type NavIcon =
  | "overview"
  | "museum_profile"
  | "analytics"
  | "staff"
  | "artifact"
  | "exhibition_application"
  | "ticket_application"
  | "exhibition"
  | "users"
  | "user_management"
  | "activity_log"
  | "museum_application"
  | "museum_management";

export type NavItem = {
  label: string;
  href: string;
  icon: NavIcon;
};

export const ROLE_LABELS: Record<Role, string> = {
  museum_manager: "Museum manager",
  content_manager: "Content manager",
  admin: "Admin",
  analyst: "Analyst",
};

export const ROLE_BASE_PATH: Record<Role, string> = {
  museum_manager: "/museum-manager",
  content_manager: "/content-manager",
  admin: "/admin",
  analyst: "/analyst",
};

const NAV_CONFIG: Record<NavIcon, { label: string; segment: string }> = {
  overview: { label: "Overview", segment: "overview" },
  museum_profile: { label: "Museum Profile", segment: "museum-profile" },
  analytics: { label: "Analytics", segment: "analytics" },
  staff: { label: "Staff Management", segment: "staff-management" },
  artifact: { label: "Artifact", segment: "artifact" },
  exhibition_application: {
    label: "Exhibition Application",
    segment: "exhibition-application",
  },
  ticket_application: {
    label: "Ticket Application",
    segment: "ticket-application",
  },
  exhibition: { label: "Exhibition", segment: "exhibition" },
  users: { label: "Users", segment: "users" },
  user_management: { label: "User Management", segment: "user-management" },
  activity_log: { label: "Activity Log", segment: "activity-log" },
  museum_application: { label: "Museum Application", segment: "museum-application" },
  museum_management: { label: "Museum Management", segment: "museum-management" },
};

export const ROLE_NAV: Record<Role, NavIcon[]> = {
  museum_manager: [
    "overview",
    "museum_profile",
    "analytics",
    "staff",
    "artifact",
    "exhibition_application",
    "ticket_application",
  ],
  content_manager: ["overview", "artifact", "exhibition"],
  admin: [
    "user_management",
    "activity_log",
    "museum_application",
    "museum_management",
  ],
  analyst: ["overview", "analytics"],
};

export function getNavForRole(role: Role): NavItem[] {
  const base = ROLE_BASE_PATH[role];
  return ROLE_NAV[role].map((icon) => ({
    icon,
    label: NAV_CONFIG[icon].label,
    href: `${base}/${NAV_CONFIG[icon].segment}`,
  }));
}
