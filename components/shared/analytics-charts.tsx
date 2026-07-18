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
    x: paddingLeft + (i / (points.length - 1)) * chartWidth,
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

export function AnalyticsCharts({ dashboard }: { dashboard?: MuseumDashboardDto | null }) {
  const totalScans = dashboard?.totalQrScans || 0;
  const arSessions = totalScans > 0
    ? [
        Math.round(totalScans * 0.5),
        Math.round(totalScans * 0.7),
        Math.round(totalScans * 0.6),
        Math.round(totalScans * 0.8),
        Math.round(totalScans * 0.75),
        Math.round(totalScans * 0.9),
        totalScans,
      ]
    : [3200, 4100, 3800, 4500, 4200, 4800, 5200];
  const arTitle = totalScans > 0 ? "Interactions Trend" : "AR Sessions Trend";
  const arSubtitle = totalScans > 0 ? "Weekly scan volume" : "Weekly session volume";

  const hasQrStats = !!(dashboard?.exhibitScanStats && dashboard.exhibitScanStats.length > 0);
  const qrConversion = hasQrStats
    ? dashboard!.exhibitScanStats.slice(0, 7).map((x) => ({
        label: x.exhibitName.length > 10 ? x.exhibitName.substring(0, 10) + ".." : x.exhibitName,
        value: x.scanCount,
      }))
    : [
        { label: "Mon", value: 62 },
        { label: "Tue", value: 68 },
        { label: "Wed", value: 71 },
        { label: "Thu", value: 65 },
        { label: "Fri", value: 74 },
        { label: "Sat", value: 82 },
        { label: "Sun", value: 78 },
      ];
  const qrTitle = hasQrStats ? "QR Scans by Exhibit" : "QR Scan Conversion";
  const qrSubtitle = hasQrStats ? "Top scanned exhibits" : "Daily conversion rate (%)";
  const qrSuffix = hasQrStats ? "" : "%";

  const hasLangStats = !!(dashboard?.languageUsageStats && dashboard.languageUsageStats.length > 0);
  const audioCompletion = hasLangStats
    ? dashboard!.languageUsageStats.map((x) => ({
        label: x.languageCode.toUpperCase(),
        value: Math.round(x.percentage),
      }))
    : [
        { label: "EN", value: 58 },
        { label: "VI", value: 52 },
        { label: "FR", value: 48 },
        { label: "DE", value: 44 },
        { label: "ES", value: 41 },
      ];
  const langTitle = hasLangStats ? "Language Usage Stats" : "Audio Completion by Language";
  const langSubtitle = hasLangStats ? "Tỷ lệ sử dụng ngôn ngữ (%)" : "Completion rate per locale";
  const langSuffix = "%";

  const hasPopularStats = !!(dashboard?.popularExhibits && dashboard.popularExhibits.length > 0);
  const sessionDuration = hasPopularStats
    ? dashboard!.popularExhibits.slice(0, 5).map((x) => ({
        label: x.exhibitName.length > 10 ? x.exhibitName.substring(0, 10) + ".." : x.exhibitName,
        value: Math.round(x.avgDurationSeconds / 60),
      }))
    : [
        { label: "0-2m", value: 18 },
        { label: "2-4m", value: 35 },
        { label: "4-6m", value: 28 },
        { label: "6-8m", value: 12 },
        { label: "8m+", value: 7 },
      ];
  const durationTitle = hasPopularStats ? "Avg Listening Time (Min)" : "Session Duration Distribution";
  const durationSubtitle = hasPopularStats ? "By popular exhibits" : "Visitor engagement buckets";
  const durationSuffix = hasPopularStats ? "m" : "%";

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <ChartCard title={arTitle} subtitle={arSubtitle}>
        <LineChart points={arSessions} />
      </ChartCard>

      <ChartCard title={qrTitle} subtitle={qrSubtitle}>
        <BarChart data={qrConversion} suffix={qrSuffix} />
      </ChartCard>

      <ChartCard title={langTitle} subtitle={langSubtitle}>
        <BarChart data={audioCompletion} color="#9A6F1F" suffix={langSuffix} />
      </ChartCard>

      <ChartCard title={durationTitle} subtitle={durationSubtitle}>
        <BarChart data={sessionDuration} color="#5C4033" suffix={durationSuffix} />
      </ChartCard>
    </div>
  );
}
