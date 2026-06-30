import {
  BarChart3,
  Building2,
  Download,
  GitBranch,
  Landmark,
  Layers,
  LayoutDashboard,
  Map,
  Settings,
  Ticket,
} from "lucide-react";
import type { NavIcon } from "@/lib/roles";
import { dashboardTheme as T } from "@/lib/dashboard-theme";

const iconClass = "h-[18px] w-[18px] shrink-0";

export function NavIcon({ icon, active }: { icon: NavIcon; active?: boolean }) {
  const color = active ? T.primaryDark : T.muted;
  const props = { className: iconClass, style: { color }, strokeWidth: 1.75 };

  switch (icon) {
    case "overview":
      return <LayoutDashboard {...props} />;
    case "museum_profile":
      return <Landmark {...props} />;
    case "analytics":
      return <BarChart3 {...props} />;
    case "artifact":
      return <Layers {...props} />;
    case "exhibition":
      return <Building2 {...props} />;
    case "content_versions":
      return <GitBranch {...props} />;
    case "offline_packages":
      return <Download {...props} />;
    case "maps_routes":
      return <Map {...props} />;
    case "ticket_application":
    case "ticket_types":
    case "ticket_management":
      return <Ticket {...props} />;
    case "ticket_statistic":
      return <BarChart3 {...props} />;
    case "museum_management":
      return <Building2 {...props} />;
    case "system_config":
      return <Settings {...props} />;
    default:
      return <LayoutDashboard {...props} />;
  }
}
