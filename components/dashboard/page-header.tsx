import type { NavIcon as NavIconName } from "@/lib/roles";
import { NavIcon } from "./nav-icons";

export function PageHeader({
  title,
  icon,
}: {
  title: string;
  icon: NavIconName;
}) {
  return (
    <header className="flex items-center gap-3 border-b border-white/20 px-8 py-6">
      <NavIcon icon={icon} />
      <h1 className="text-2xl font-medium tracking-wide">{title}</h1>
    </header>
  );
}
