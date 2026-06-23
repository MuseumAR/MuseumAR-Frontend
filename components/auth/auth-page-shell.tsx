"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { AUTH_C, AUTH_CINZEL } from "@/lib/auth-theme";

function OrnamentalRule() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1" style={{ background: AUTH_C.border }} />
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="4" y="0" width="6" height="6" transform="rotate(45 7 7)" fill={AUTH_C.primary} opacity="0.65" />
      </svg>
      <div className="h-px flex-1" style={{ background: AUTH_C.border }} />
    </div>
  );
}

export function AuthPageShell({
  backHref = "/login",
  backLabel = "Back to Sign In",
  title,
  subtitle,
  children,
  footer,
}: {
  backHref?: string;
  backLabel?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-6 py-10"
      style={{ background: AUTH_C.bg }}
    >
      <Link
        href={backHref}
        className="group absolute left-6 top-5 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all duration-200"
        style={{
          background: "rgba(255,248,231,0.80)",
          border: `1px solid ${AUTH_C.border}`,
          color: AUTH_C.muted,
          backdropFilter: "blur(10px)",
        }}
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
        {backLabel}
      </Link>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(200,155,60,0.07) 0%, transparent 65%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div
          className="rounded-[28px] px-10 py-10"
          style={{
            background: AUTH_C.card,
            border: `1px solid ${AUTH_C.border}`,
            boxShadow: "0 20px 60px rgba(43,29,14,0.10), 0 0 0 1px rgba(200,155,60,0.06)",
          }}
        >
          <div className="mb-7 flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold"
              style={{
                background: `linear-gradient(135deg, ${AUTH_C.primary} 0%, ${AUTH_C.secondary} 100%)`,
                color: AUTH_C.card,
                fontFamily: AUTH_CINZEL,
                boxShadow: "0 4px 16px rgba(166,124,45,0.32)",
              }}
            >
              M
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.2em]" style={{ fontFamily: AUTH_CINZEL, color: AUTH_C.text }}>
                MUSEUM<span style={{ color: AUTH_C.primary }}>AR</span>
              </p>
              <p className="text-[9px] tracking-widest uppercase" style={{ color: AUTH_C.mutedLight }}>
                Cultural Heritage Platform
              </p>
            </div>
          </div>

          <OrnamentalRule />

          <div className="mt-6 mb-1">
            <h1
              className="text-2xl font-bold tracking-wide"
              style={{ fontFamily: AUTH_CINZEL, color: AUTH_C.text }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1.5 text-sm" style={{ color: AUTH_C.muted }}>
                {subtitle}
              </p>
            )}
          </div>

          <div className="mt-7">{children}</div>

          {footer && <div className="mt-6">{footer}</div>}
        </div>
      </motion.div>
    </div>
  );
}
