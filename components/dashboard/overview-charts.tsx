"use client";

import { motion } from "framer-motion";
import type { ArtifactRow } from "@/types";
import { formatNumber } from "@/lib/format";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-3xl p-6"
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        boxShadow: "0 6px 20px rgba(43,29,14,0.05)",
      }}
    >
      <h3 className="text-base font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
        {title}
      </h3>
      {subtitle && (
        <p className="mt-1 text-xs" style={{ color: T.mutedLight }}>
          {subtitle}
        </p>
      )}
      <div className="mt-5">{children}</div>
    </motion.div>
  );
}

function BarChart({
  data,
  color = T.primary,
}: {
  data: { label: string; value: number }[];
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex h-44 items-end justify-between gap-2">
      {data.map((item) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(item.value / max) * 100}%` }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
            className="w-full min-h-[4px] rounded-t-lg"
            style={{ background: `linear-gradient(180deg, ${color} 0%, ${T.primaryDark} 100%)` }}
          />
          <span className="text-[10px] text-center leading-tight" style={{ color: T.mutedLight }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function LineChart({ points }: { points: number[] }) {
  const width = 320;
  const height = 120;
  const padding = 16;
  const max = Math.max(...points, 1);
  const coords = points.map((v, i) => ({
    x: padding + (i / (points.length - 1)) * (width - padding * 2),
    y: padding + (height - padding * 2) - (v / max) * (height - padding * 2),
  }));
  const path = coords.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-32 w-full">
      {[0.25, 0.5, 0.75].map((ratio) => (
        <line
          key={ratio}
          x1={padding}
          x2={width - padding}
          y1={padding + (height - padding * 2) * ratio}
          y2={padding + (height - padding * 2) * ratio}
          stroke={T.border}
          strokeWidth="1"
        />
      ))}
      <path d={path} fill="none" stroke={T.primaryDark} strokeWidth="2.5" strokeLinecap="round" />
      {coords.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={T.primary} />
      ))}
    </svg>
  );
}

export function OverviewCharts({ rows }: { rows: ArtifactRow[] }) {
  const topArtifacts = [...rows]
    .sort((a, b) => b.view - a.view)
    .slice(0, 5)
    .map((r) => ({
      label: r.name.split(" ").slice(-1)[0] ?? r.name,
      value: r.view,
    }));

  const visitorTrend = rows.slice(0, 7).map((r) => r.view);

  const arUsage = rows.slice(0, 6).map((r) => ({
    label: `#${r.id}`,
    value: r.arUsage,
  }));

  const qrStats = rows.slice(0, 6).map((r) => ({
    label: `#${r.id}`,
    value: r.qrScan,
  }));

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <ChartCard title="Visitor Activity" subtitle="Weekly engagement trend">
        <LineChart points={visitorTrend.length > 1 ? visitorTrend : [100, 240, 180, 320, 280, 360, 420]} />
      </ChartCard>

      <ChartCard title="Artifact Popularity" subtitle="Top viewed artifacts">
        <BarChart data={topArtifacts} />
      </ChartCard>

      <ChartCard title="AR Usage" subtitle="Sessions per artifact">
        <BarChart data={arUsage} color="#9A6F1F" />
      </ChartCard>

      <ChartCard title="QR Scan Statistics" subtitle="Scans across collection">
        <BarChart data={qrStats} color="#5C4033" />
        <p className="mt-4 text-center text-xs" style={{ color: T.muted }}>
          Total scans: {formatNumber(rows.reduce((sum, r) => sum + r.qrScan, 0))}
        </p>
      </ChartCard>
    </div>
  );
}
