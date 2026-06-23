const SEGMENT_TITLES: Record<string, string> = {
  overview: "Dashboard",
  "museum-profile": "Museum Profile",
  analytics: "Analytics",
  "staff-management": "Staff Management",
  artifact: "Artifacts",
  "exhibition-application": "Exhibition Applications",
  "ticket-application": "Ticket Applications",
  exhibition: "Exhibitions",
  "content-versions": "Content Versions",
  "offline-packages": "Offline Packages",
  "maps-routes": "Maps & Routes",
  users: "Users",
  "museum-management": "Museum Overview",
  "ticket-types": "Ticket Types",
  "system-config": "System Configuration",
  create: "Create",
  edit: "Edit",
};

export function getPageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  const prev = segments[segments.length - 2];

  if (last && SEGMENT_TITLES[last]) {
    if (last === "create" || last === "edit") {
      return `${SEGMENT_TITLES[prev] ?? "Page"} · ${SEGMENT_TITLES[last]}`;
    }
    return SEGMENT_TITLES[last];
  }

  if (/^ART-/.test(last ?? "")) return "Artifact Detail";
  return "Dashboard";
}
