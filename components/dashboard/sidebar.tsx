"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/context/role-context";
import { getNavForRole, ROLE_BASE_PATH, ROLE_LABELS, type Role } from "@/lib/roles";
import { NavIcon } from "./nav-icons";

const DEMO_ROLES: Role[] = [
  "museum_manager",
  "content_manager",
  "admin",
  "analyst",
];

export function Sidebar() {
  const pathname = usePathname();
  const { role, userName } = useRole();
  const navItems = getNavForRole(role);

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-white/20 bg-black">
      <div className="border-b border-white/20 px-5 py-6">
        <p className="text-xs font-semibold tracking-[0.2em] text-white">
          MUSEUM AR
        </p>
        <p className="text-xs font-semibold tracking-[0.2em] text-white">
          MANAGEMENT
        </p>
        <p className="mt-3 text-sm text-white/60">{ROLE_LABELS[role]}</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <NavIcon icon={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/20 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-sm font-medium text-white">
            {userName.charAt(0)}
          </div>
          <span className="flex-1 text-sm text-white">{userName}</span>
          <button
            type="button"
            className="text-white/60 transition-colors hover:text-white"
            aria-label="Settings"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <p className="mb-2 text-xs text-white/50">Switch role (demo)</p>
        <div className="space-y-1">
          {DEMO_ROLES.filter((r) => r !== role).map((r) => (
            <Link
              key={r}
              href={r === "admin" ? `${ROLE_BASE_PATH[r]}/user-management` : `${ROLE_BASE_PATH[r]}/overview`}
              className="block rounded-lg px-2 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/5 hover:text-white"
            >
              → {ROLE_LABELS[r]}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
