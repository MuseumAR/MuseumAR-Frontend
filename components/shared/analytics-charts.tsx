"use client";

import { motion } from "framer-motion";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import type { MuseumDashboardDto } from "@/types/api";

function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return value.toString();
}

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
  suffix = "",
}: {
  data: { label: string; value: number }[];
  color?: string;
  suffix?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex h-44 items-end justify-between gap-2 pt-4">
      {data.map((item) => (
        <div key={item.label} className="flex h-full flex-1 flex-col justify-end items-center gap-1">
          <span className="text-[10px] font-semibold" style={{ color: T.text }}>
            {formatCompactNumber(item.value)}{suffix}
          </span>
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(item.value / max) * 75}%` }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
            className="w-full min-h-[4px] rounded-t-md"
            style={{ background: `linear-gradient(180deg, ${color} 0%, ${T.primaryDark} 100%)` }}
          />
          <span className="text-[10px] text-center leading-tight mt-1" style={{ color: T.mutedLight }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function LineChart({
  points,
  labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
}: {
  points: number[];
  labels?: string[];
}) {
  const width = 360;
  const height = 150;
  const paddingLeft = 36;
  const paddingBottom = 24;
  const paddingRight = 16;
  const paddingTop = 16;

  const max = Math.max(...points, 1);
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const coords = points.map((v, i) => ({
    x:
      points.length === 1
        ? paddingLeft + chartWidth / 2
        : paddingLeft + (i / (points.length - 1)) * chartWidth,
    y: paddingTop + chartHeight - (v / max) * chartHeight,
  }));
  const path = coords.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const gridRatios = [0, 0.5, 1]; // Top, Middle, Bottom

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-32 w-full">
      {gridRatios.map((ratio) => {
        const y = paddingTop + chartHeight * ratio;
        const val = Math.round(max * (1 - ratio));
        return (
          <g key={ratio}>
            <line
              x1={paddingLeft}
              x2={width - paddingRight}
              y1={y}
              y2={y}
              stroke={T.border}
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text
              x={paddingLeft - 8}
              y={y + 3}
              textAnchor="end"
              fontSize="8"
              fill={T.mutedLight}
            >
              {formatCompactNumber(val)}
            </text>
          </g>
        );
      })}
      <path d={path} fill="none" stroke={T.primaryDark} strokeWidth="2.5" strokeLinecap="round" />
      {coords.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={T.primary} />
      ))}
      {labels.map((label, i) => {
        const x = coords[i]?.x;
        if (x === undefined) return null;
        return (
          <text
            key={i}
            x={x}
            y={height - 6}
            textAnchor="middle"
            fontSize="8"
            fill={T.mutedLight}
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

function ChartEmpty() {
  return (
    <p className="flex h-32 items-center justify-center text-sm" style={{ color: T.muted }}>
      No data
    </p>
  );
}

function shortLabel(name: string) {
  return name.length > 10 ? `${name.substring(0, 10)}..` : name;
}

export function AnalyticsCharts({ dashboard }: { dashboard?: MuseumDashboardDto | null }) {
  const scanStats = dashboard?.exhibitScanStats ?? [];
  const langStats = dashboard?.languageUsageStats ?? [];
  const popular = dashboard?.popularExhibits ?? [];

  const popularInteractions = popular.map((x) => x.totalInteractions);
  const popularLabels = popular.map((x) => shortLabel(x.exhibitName));

  const qrByExhibit = scanStats.slice(0, 7).map((x) => ({
    label: shortLabel(x.exhibitName),
    value: x.scanCount,
  }));

  const languageUsage = langStats.map((x) => ({
    label: x.languageCode.toUpperCase(),
    value: Math.round(x.percentage),
  }));

  const listeningTime = popular.slice(0, 5).map((x) => ({
    label: shortLabel(x.exhibitName),
    value: Math.round(x.avgDurationSeconds / 60),
  }));

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <ChartCard title="Popular exhibits" subtitle="Interactions from the dashboard API">
        {popularInteractions.length > 0 ? (
          <LineChart points={popularInteractions} labels={popularLabels} />
        ) : (
          <ChartEmpty />
        )}
      </ChartCard>

      <ChartCard title="QR scans by exhibit" subtitle="Most scanned exhibits">
        {qrByExhibit.length > 0 ? <BarChart data={qrByExhibit} /> : <ChartEmpty />}
      </ChartCard>

      <ChartCard title="Language statistics" subtitle="Language usage (%)">
        {languageUsage.length > 0 ? (
          <BarChart data={languageUsage} color="#9A6F1F" suffix="%" />
        ) : (
          <ChartEmpty />
        )}
      </ChartCard>

      <ChartCard title="Average listening time (min)" subtitle="By popular exhibits">
        {listeningTime.length > 0 ? (
          <BarChart data={listeningTime} color="#5C4033" suffix=" min" />
        ) : (
          <ChartEmpty />
        )}
      </ChartCard>
    </div>
  );
}
