"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays, ChevronDown, KeyRound, LogOut, Search } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useRole } from "@/context/role-context";
import { ROLE_LABELS } from "@/lib/roles";
import { getPageTitle } from "@/lib/page-titles";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";

export function TopBar() {
  const pathname = usePathname();
  const { role, userName } = useRole();
  const { logout } = useAuth();
  const title = getPageTitle(pathname);

  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <header
      className="z-30 flex h-20 shrink-0 items-center justify-between gap-6 px-8"
      style={{ background: "#F7F2E9" }}
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em]" style={{ color: T.mutedLight }}>
          {ROLE_LABELS[role]} Portal
        </p>
        <h1
          className="mt-0.5 text-2xl font-semibold tracking-wide"
          style={{ fontFamily: cinzel, color: T.text }}
        >
          {title}
        </h1>
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="relative hidden max-w-sm flex-1 md:block">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: T.mutedLight }}
          />
          <input
            type="search"
            placeholder="Search..."
            className="w-full rounded-2xl py-2.5 pl-11 pr-4 text-sm outline-none transition-all"
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              color: T.text,
            }}
          />
        </div>

        <button
          type="button"
          className="hidden items-center gap-2 rounded-2xl px-3 py-2 text-xs transition-colors sm:flex"
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            color: T.muted,
          }}
        >
          <CalendarDays className="h-4 w-4" style={{ color: T.primary }} />
          {today}
        </button>

        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-2xl transition-colors"
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            color: T.muted,
          }}
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span
            className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full"
            style={{ background: T.primary }}
          />
        </button>

        <div className="group relative">
          <button
            type="button"
            className="flex items-center gap-2.5 rounded-2xl py-1.5 pl-1.5 pr-3 transition-colors"
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
            }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl text-sm font-semibold"
              style={{
                background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
                color: T.surface,
                fontFamily: cinzel,
              }}
            >
              {userName.charAt(0)}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-none" style={{ color: T.text }}>
                {userName}
              </p>
              <p className="mt-0.5 text-[11px]" style={{ color: T.mutedLight }}>
                {ROLE_LABELS[role]}
              </p>
            </div>
            <ChevronDown className="hidden h-4 w-4 sm:block" style={{ color: T.mutedLight }} />
          </button>

          <div
            className="invisible absolute right-0 top-[calc(100%+8px)] z-50 min-w-[180px] rounded-2xl py-1 opacity-0 shadow-lg transition-all group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
            }}
          >
            <Link
              href="/change-password"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors"
              style={{ color: T.text }}
            >
              <KeyRound className="h-4 w-4" style={{ color: T.primary }} />
              Change password
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors"
              style={{ color: "#8B3A3A" }}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
