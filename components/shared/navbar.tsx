"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, KeyRound, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getHomePathForRole, getRoleDisplayLabel } from "@/services/auth";
import { isDashboardRole } from "@/lib/roles";

const C = {
  bg: "rgba(245,230,200,0.88)",
  border: "rgba(200,155,60,0.25)",
  text: "#2B1D0E",
  muted: "#7D5A3C",
  primary: "#C89B3C",
  secondary: "#A67C2D",
  surface: "#FFF8E7",
};

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Collections", href: "#collections" },
  { label: "Museums", href: "#museums" },
  { label: "About", href: "#about" },
];

function AuthSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-9 w-16 animate-pulse rounded-full"
        style={{ background: "rgba(200,155,60,0.15)" }}
      />
      <div
        className="h-9 w-24 animate-pulse rounded-full"
        style={{ background: "rgba(200,155,60,0.20)" }}
      />
    </div>
  );
}

function GuestAuthActions() {
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="rounded-full px-4 py-1.5 text-sm transition-all duration-200"
        style={{ color: C.muted }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = C.text;
          (e.currentTarget as HTMLElement).style.background = "rgba(200,155,60,0.10)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = C.muted;
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        Login
      </Link>
      <Link
        href="/register"
        className="rounded-full px-5 py-1.5 text-sm font-medium transition-all hover:opacity-85"
        style={{
          background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
          color: C.surface,
          boxShadow: "0 2px 10px rgba(166,124,45,0.30)",
        }}
      >
        Register
      </Link>
    </div>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!user) return null;

  const dashboardPath = getHomePathForRole(user.roleName);
  const initials = user.fullName.trim().charAt(0).toUpperCase() || "U";
  const hasDashboard = isDashboardRole(user.roleName);

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {hasDashboard && (
        <Link
          href={dashboardPath}
          className="hidden items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all hover:opacity-90 sm:inline-flex"
          style={{
            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
            color: C.surface,
            boxShadow: "0 2px 10px rgba(166,124,45,0.30)",
          }}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
      )}

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-all duration-200 sm:pr-3"
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            boxShadow: open ? "0 4px 20px rgba(43,29,14,0.10)" : "none",
          }}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold"
            style={{
              background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
              color: C.surface,
            }}
          >
            {initials}
          </div>
          <div className="hidden text-left sm:block">
            <p className="max-w-[120px] truncate text-sm font-medium leading-none" style={{ color: C.text }}>
              {user.fullName}
            </p>
            <p className="mt-0.5 text-[11px]" style={{ color: C.muted }}>
              {getRoleDisplayLabel(user.roleName)}
            </p>
          </div>
          <ChevronDown
            className="hidden h-4 w-4 transition-transform sm:block"
            style={{
              color: C.muted,
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </button>

        {open && (
          <div
            className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[220px] overflow-hidden rounded-2xl py-1"
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              boxShadow: "0 12px 40px rgba(43,29,14,0.14)",
            }}
            role="menu"
          >
            <div className="border-b px-4 py-3" style={{ borderColor: C.border }}>
              <p className="text-sm font-medium" style={{ color: C.text }}>
                {user.fullName}
              </p>
              <p className="mt-0.5 truncate text-xs" style={{ color: C.muted }}>
                {user.email}
              </p>
              <span
                className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                style={{
                  background: "rgba(200,155,60,0.14)",
                  color: C.secondary,
                }}
              >
                {getRoleDisplayLabel(user.roleName)}
              </span>
            </div>

            {hasDashboard && (
              <Link
                href={dashboardPath}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors sm:hidden"
                style={{ color: C.text }}
                onClick={() => setOpen(false)}
                role="menuitem"
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(200,155,60,0.08)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <LayoutDashboard className="h-4 w-4" style={{ color: C.primary }} />
                Dashboard
              </Link>
            )}

            <Link
              href="/change-password"
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
              style={{ color: C.text }}
              onClick={() => setOpen(false)}
              role="menuitem"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(200,155,60,0.08)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <KeyRound className="h-4 w-4" style={{ color: C.primary }} />
              Change password
            </Link>

            <button
              type="button"
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors"
              style={{ color: "#8B3A3A" }}
              onClick={async () => {
                setOpen(false);
                await logout();
              }}
              role="menuitem"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(139,58,58,0.06)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-4 py-4 sm:px-8"
      style={{
        background: C.bg,
        borderBottom: `1px solid ${C.border}`,
        backdropFilter: "blur(16px)",
        boxShadow: "0 2px 24px rgba(43,29,14,0.10)",
      }}
    >
      <Link
        href="/"
        className="flex items-center gap-3"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
          style={{
            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
            color: C.surface,
            boxShadow: "0 2px 8px rgba(166,124,45,0.35)",
            letterSpacing: "0.05em",
          }}
        >
          M
        </div>
        <span className="text-base font-semibold tracking-wide" style={{ color: C.text }}>
          Museum<span style={{ color: C.primary }}>AR</span>
        </span>
      </Link>

      <div className="hidden items-center gap-0.5 md:flex">
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-1.5 text-sm transition-all duration-200"
              style={{
                color: active ? C.text : C.muted,
                background: active ? "rgba(200,155,60,0.12)" : "transparent",
                fontWeight: active ? 500 : 400,
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.color = C.text;
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.color = C.muted;
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {isLoading ? (
        <AuthSkeleton />
      ) : isAuthenticated ? (
        <UserMenu />
      ) : (
        <GuestAuthActions />
      )}
    </nav>
  );
}
