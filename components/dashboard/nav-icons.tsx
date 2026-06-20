import {
  Activity,
  BarChart3,
  Building2,
  ClipboardCheck,
  Landmark,
  LayoutDashboard,
  Layers,
  Ticket,
  Users,
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
    case "staff":
    case "users":
    case "user_management":
      return <Users {...props} />;
    case "artifact":
      return <Layers {...props} />;
    case "exhibition":
      return <Building2 {...props} />;
    case "exhibition_application":
      return <ClipboardCheck {...props} />;
    case "ticket_application":
      return <Ticket {...props} />;
    case "activity_log":
      return <Activity {...props} />;
    case "museum_application":
      return <ClipboardCheck {...props} />;
    case "museum_management":
      return <Building2 {...props} />;
    default:
      return <LayoutDashboard {...props} />;
  }
}
