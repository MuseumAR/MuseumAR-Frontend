"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LogOut } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useRole } from "@/context/role-context";
import {
  getNavForRole,
  ROLE_LABELS,
  type DashboardRole,
} from "@/lib/roles";
import { dashboardTheme as T, cinzel, sans } from "@/lib/dashboard-theme";
import { NavIcon } from "./nav-icons";

export const SIDEBAR_WIDTH = 304;

export function Sidebar({ role }: { role: DashboardRole }) {
  const pathname = usePathname();
  const { userName } = useRole();
  const { logout } = useAuth();
  const navItems = getNavForRole(role);

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 flex flex-col"
      style={{
        width: SIDEBAR_WIDTH,
        background: T.sidebar,
        borderRight: `1px solid ${T.border}`,
      }}
    >
      <div className="px-6 py-7" style={{ borderBottom: `1px solid ${T.border}` }}>
        <Link href="/" prefetch={false} className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold"
            style={{
              background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
              color: T.surface,
              fontFamily: cinzel,
              boxShadow: "0 4px 14px rgba(154,111,31,0.25)",
            }}
          >
            M
          </div>
          <div>
            <p
              className="text-sm font-semibold"
              style={{ fontFamily: cinzel, color: T.text }}
            >
              MUSEUM<span style={{ color: T.primary }}>AR</span>
            </p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: T.mutedLight }}>
              {ROLE_LABELS[role]}
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
        <p
          className="mb-3 px-3 text-[10px] font-medium uppercase tracking-[0.22em]"
          style={{ color: T.mutedLight }}
        >
          Menu
        </p>
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200"
              style={{
                background: active ? "rgba(200,155,69,0.18)" : "transparent",
                color: active ? T.primaryDark : T.muted,
                fontWeight: active ? 600 : 400,
                boxShadow: active ? "inset 0 0 0 1px rgba(200,155,69,0.22)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(200,155,69,0.08)";
                  (e.currentTarget as HTMLElement).style.color = T.text;
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = T.muted;
                }
              }}
            >
              <NavIcon icon={item.icon} active={active} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 pb-5 pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
        <div
          className="rounded-2xl p-4"
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            boxShadow: "0 4px 16px rgba(43,29,14,0.04)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-semibold"
              style={{
                background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
                color: T.surface,
                fontFamily: sans,
              }}
            >
              {userName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold" style={{ color: T.text, fontFamily: sans }}>
                {userName}
              </p>
              <p className="mt-0.5 truncate text-sm" style={{ color: T.mutedLight }}>
                {ROLE_LABELS[role]}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-nowrap gap-2">
            <Link
              href="/"
              prefetch={false}
              className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-2.5 py-2.5 text-xs font-medium leading-none whitespace-nowrap transition-colors"
              style={{
                background: "rgba(200,155,69,0.08)",
                color: T.muted,
                border: `1px solid ${T.border}`,
              }}
            >
              <Home className="h-3.5 w-3.5 shrink-0" />
              Trang chủ
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-2.5 py-2.5 text-xs font-medium leading-none whitespace-nowrap transition-colors"
              style={{
                background: "rgba(139,58,58,0.06)",
                color: "#8B3A3A",
                border: "1px solid rgba(139,58,58,0.12)",
              }}
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
