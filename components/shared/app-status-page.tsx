"use client";

import Link from "next/link";

const C = {
  bg: "#F5E6C8",
  surface: "#FFF8E7",
  text: "#2B1D0E",
  muted: "#7D5A3C",
  primary: "#C89B3C",
  secondary: "#A67C2D",
};

export function AppStatusPage({
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  onPrimary,
  primaryAsButton,
}: {
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  primaryAsButton?: boolean;
}) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 py-16"
      style={{ background: C.bg, color: C.text }}
    >
      <div
        className="w-full max-w-md rounded-3xl px-8 py-10 text-center"
        style={{ background: C.surface, border: "1px solid rgba(200,155,60,0.28)" }}
      >
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-be-vietnam), system-ui, sans-serif" }}>
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: C.muted }}>
          {description}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {primaryAsButton && onPrimary ? (
            <button
              type="button"
              onClick={onPrimary}
              className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium"
              style={{
                background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
                color: C.surface,
              }}
            >
              {primaryLabel}
            </button>
          ) : (
            <Link
              href={primaryHref ?? "/"}
              className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium"
              style={{
                background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
                color: C.surface,
              }}
            >
              {primaryLabel}
            </Link>
          )}
          {secondaryHref && secondaryLabel ? (
            <Link
              href={secondaryHref}
              className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm"
              style={{ color: C.muted }}
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
