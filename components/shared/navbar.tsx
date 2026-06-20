"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Collections", href: "#collections" },
  { label: "Museums", href: "#museums" },
  { label: "About", href: "#about" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-8 py-4"
      style={{
        background: "rgba(245,230,200,0.88)",
        borderBottom: "1px solid rgba(200,155,60,0.25)",
        backdropFilter: "blur(16px)",
        boxShadow: "0 2px 24px rgba(43,29,14,0.10)",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-3"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
      >
        {/* Wax seal motif */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
          style={{
            background: "linear-gradient(135deg, #C89B3C 0%, #A67C2D 100%)",
            color: "#FFF8E7",
            boxShadow: "0 2px 8px rgba(166,124,45,0.35)",
            letterSpacing: "0.05em",
          }}
        >
          M
        </div>
        <span className="text-base font-semibold tracking-wide" style={{ color: "#2B1D0E" }}>
          Museum<span style={{ color: "#C89B3C" }}>AR</span>
        </span>
      </Link>

      {/* Nav links */}
      <div className="hidden items-center gap-0.5 md:flex">
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-1.5 text-sm transition-all duration-200"
              style={{
                color: active ? "#2B1D0E" : "#7D5A3C",
                background: active ? "rgba(200,155,60,0.12)" : "transparent",
                fontWeight: active ? 500 : 400,
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.color = "#2B1D0E";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.color = "#7D5A3C";
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Auth */}
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="rounded-full px-4 py-1.5 text-sm transition-all duration-200"
          style={{ color: "#7D5A3C" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#2B1D0E";
            (e.currentTarget as HTMLElement).style.background = "rgba(200,155,60,0.10)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#7D5A3C";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          Login
        </Link>
        <Link
          href="/register"
          className="rounded-full px-5 py-1.5 text-sm font-medium transition-all hover:opacity-85"
          style={{
            background: "linear-gradient(135deg, #C89B3C 0%, #A67C2D 100%)",
            color: "#FFF8E7",
            boxShadow: "0 2px 10px rgba(166,124,45,0.30)",
          }}
        >
          Register
        </Link>
      </div>
    </nav>
  );
}
