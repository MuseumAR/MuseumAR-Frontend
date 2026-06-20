"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Box,
  Download,
  FileText,
  Headphones,
  Layers,
  QrCode,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";

export type StatIconName =
  | "box"
  | "layers"
  | "users"
  | "qrCode"
  | "download"
  | "headphones"
  | "fileText"
  | "barChart";

const ICONS = {
  box: Box,
  layers: Layers,
  users: Users,
  qrCode: QrCode,
  download: Download,
  headphones: Headphones,
  fileText: FileText,
  barChart: BarChart3,
} as const;

type StatCardProps = {
  label: string;
  value: number;
  icon: StatIconName;
  growth?: number;
  watermark?: "column" | "map" | "vase" | "scroll";
};

function Watermark({ type }: { type: StatCardProps["watermark"] }) {
  const opacity = 0.07;
  const color = T.primaryDark;

  if (type === "column") {
    return (
      <svg className="absolute -bottom-2 -right-2 h-24 w-24" viewBox="0 0 80 80" fill="none" aria-hidden>
        <path d="M20 70V30l10-10 10 10v40M50 70V20l10-10 10 10v50" stroke={color} strokeWidth="2" opacity={opacity * 8} />
      </svg>
    );
  }
  if (type === "map") {
    return (
      <svg className="absolute -bottom-1 -right-1 h-20 w-20" viewBox="0 0 80 80" fill="none" aria-hidden>
        <circle cx="40" cy="40" r="28" stroke={color} strokeWidth="1.5" opacity={opacity * 8} />
        <path d="M12 40h56M40 12v56" stroke={color} strokeWidth="1" opacity={opacity * 6} />
      </svg>
    );
  }
  if (type === "vase") {
    return (
      <svg className="absolute -bottom-2 -right-2 h-24 w-24" viewBox="0 0 80 80" fill="none" aria-hidden>
        <path d="M30 20h20l-4 10v30c0 6-4 10-6 10s-6-4-6-10V30l-4-10z" stroke={color} strokeWidth="2" opacity={opacity * 8} />
      </svg>
    );
  }
  return (
    <svg className="absolute -bottom-1 -right-1 h-20 w-20" viewBox="0 0 80 80" fill="none" aria-hidden>
      <rect x="16" y="20" width="48" height="36" rx="2" stroke={color} strokeWidth="1.5" opacity={opacity * 8} />
      <path d="M16 30h48" stroke={color} strokeWidth="1" opacity={opacity * 6} />
    </svg>
  );
}

function AnimatedValue({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span className="tabular-nums" style={{ fontFamily: cinzel }}>
      {display.toLocaleString()}
    </span>
  );
}

export function StatCard({ label, value, icon, growth = 0, watermark = "scroll" }: StatCardProps) {
  const Icon = ICONS[icon];
  const positive = growth >= 0;

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-3xl p-6"
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        boxShadow: "0 8px 24px rgba(43,29,14,0.06)",
      }}
    >
      <Watermark type={watermark} />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl"
            style={{
              background: "rgba(200,155,69,0.12)",
              border: `1px solid rgba(200,155,69,0.22)`,
            }}
          >
            <Icon className="h-5 w-5" style={{ color: T.primaryDark }} />
          </div>
          {growth !== 0 && (
            <div
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{
                background: positive ? "rgba(79,125,74,0.10)" : "rgba(180,83,9,0.10)",
                color: positive ? T.success : T.danger,
              }}
            >
              {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(growth)}%
            </div>
          )}
        </div>

        <p className="mt-5 text-3xl font-semibold" style={{ color: T.text }}>
          <AnimatedValue value={value} />
        </p>
        <p className="mt-1.5 text-sm" style={{ color: T.muted }}>
          {label}
        </p>
      </div>
    </motion.div>
  );
}
