"use client";

import { motion } from "framer-motion";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import type { MuseumDashboardDto, VisitorTrafficDto, RevenueAnalyticsDto } from "@/types/api";
import { formatVnd } from "@/lib/format";

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
      {data.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex h-full flex-1 flex-col justify-end items-center gap-1">
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

function shortLabel(name: string) {
  return name.length > 10 ? `${name.substring(0, 10)}..` : name;
}

const EMPTY_LINE_POINTS = [0, 0, 0, 0, 0];
const EMPTY_LINE_LABELS = ["1", "2", "3", "4", "5"];
const EMPTY_BARS = [
  { label: "1", value: 0 },
  { label: "2", value: 0 },
  { label: "3", value: 0 },
  { label: "4", value: 0 },
  { label: "5", value: 0 },
];
const EMPTY_LANG = [
  { label: "VI", value: 0 },
  { label: "EN", value: 0 },
];

export function AnalyticsCharts({ dashboard }: { dashboard?: MuseumDashboardDto | null }) {
  const scanStats = dashboard?.exhibitScanStats ?? [];
  const langStats = dashboard?.languageUsageStats ?? [];
  const popular = dashboard?.popularExhibits ?? [];

  const popularInteractions =
    popular.length > 0 ? popular.map((x) => x.totalInteractions) : EMPTY_LINE_POINTS;
  const popularLabels =
    popular.length > 0 ? popular.map((x) => shortLabel(x.exhibitName)) : EMPTY_LINE_LABELS;

  const qrByExhibit =
    scanStats.length > 0
      ? scanStats.slice(0, 7).map((x) => ({
          label: shortLabel(x.exhibitName),
          value: x.scanCount,
        }))
      : EMPTY_BARS;

  const languageUsage =
    langStats.length > 0
      ? langStats.map((x) => ({
          label: x.languageCode.toUpperCase(),
          value: Math.round(x.percentage),
        }))
      : EMPTY_LANG;

  const listeningTime =
    popular.length > 0
      ? popular.slice(0, 5).map((x) => ({
          label: shortLabel(x.exhibitName),
          value: Math.round(x.avgDurationSeconds / 60),
        }))
      : EMPTY_BARS;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <ChartCard title="Popular exhibits" subtitle="Interactions from the dashboard API">
        <LineChart points={popularInteractions} labels={popularLabels} />
      </ChartCard>

      <ChartCard title="QR scans by exhibit" subtitle="Most scanned exhibits">
        <BarChart data={qrByExhibit} />
      </ChartCard>

      <ChartCard title="Language statistics" subtitle="Language usage (%)">
        <BarChart data={languageUsage} color="#9A6F1F" suffix="%" />
      </ChartCard>

      <ChartCard title="Average listening time (min)" subtitle="By popular exhibits">
        <BarChart data={listeningTime} color="#5C4033" suffix=" min" />
      </ChartCard>
    </div>
  );
}

export function VisitorTrafficCharts({ traffic }: { traffic?: VisitorTrafficDto | null }) {
  const dailyFootfall = traffic?.dailyFootfall ?? [];
  const peakHours = traffic?.peakHoursTraffic ?? [];

  const footfallBars = dailyFootfall.length > 0
    ? dailyFootfall.slice(-7).map((d) => ({
        label: d.date.split("-").slice(1).join("/"),
        value: d.visitorCount,
      }))
    : [{ label: "Hôm nay", value: 0 }];

  const maxPeak = Math.max(...peakHours.map((p) => p.visitorCount), 0);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <ChartCard
        title="Lưu lượng khách theo ngày (Daily Footfall)"
        subtitle="Số lượt khách check-in qua cổng bảo tàng các ngày gần đây"
      >
        {dailyFootfall.length === 0 ? (
          <div className="h-44 flex items-center justify-center text-xs" style={{ color: T.mutedLight }}>
            Chưa có dữ liệu check-in trong khoảng thời gian này
          </div>
        ) : (
          <BarChart data={footfallBars} color="#3C7850" suffix=" khách" />
        )}
      </ChartCard>

      <ChartCard
        title="Khung giờ cao điểm (Peak Hours 08:00 - 18:00)"
        subtitle="Phân bố lượt khách vào cổng theo từng giờ trong ngày"
      >
        <div className="flex h-44 items-end justify-between gap-1 pt-4">
          {peakHours.map((p) => {
            const isHighest = maxPeak > 0 && p.visitorCount === maxPeak;
            const maxVal = Math.max(maxPeak, 1);
            return (
              <div key={p.hour} className="flex h-full flex-1 flex-col justify-end items-center gap-1">
                <span className={`text-[9px] font-semibold ${isHighest ? "text-amber-600 font-bold" : ""}`} style={{ color: isHighest ? "#B45309" : T.text }}>
                  {p.visitorCount > 0 ? p.visitorCount : ""}
                </span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(p.visitorCount / maxVal) * 75}%` }}
                  transition={{ duration: 0.6 }}
                  className={`w-full min-h-[4px] rounded-t-md ${isHighest ? "ring-1 ring-amber-500" : ""}`}
                  style={{
                    background: isHighest
                      ? "linear-gradient(180deg, #F59E0B 0%, #D97706 100%)"
                      : "linear-gradient(180deg, #C89B3C 0%, #A67C2D 100%)",
                  }}
                />
                <span className={`text-[9px] leading-none mt-1 ${isHighest ? "font-bold text-amber-700" : ""}`} style={{ color: isHighest ? "#B45309" : T.mutedLight }}>
                  {p.hour}h
                </span>
              </div>
            );
          })}
        </div>
      </ChartCard>
    </div>
  );
}

export function RevenueAnalyticsCharts({ revenue }: { revenue?: RevenueAnalyticsDto | null }) {
  const dailySales = revenue?.dailySales ?? [];
  const revenueByType = revenue?.revenueByTicketType ?? [];

  const dailyRevenueBars = dailySales.length > 0
    ? dailySales.slice(-7).map((d) => ({
        label: d.date.split("-").slice(1).join("/"),
        value: Math.round(d.netRevenue / 1000),
      }))
    : [{ label: "Hôm nay", value: 0 }];

  const dailyTicketBars = dailySales.length > 0
    ? dailySales.slice(-7).map((d) => ({
        label: d.date.split("-").slice(1).join("/"),
        value: d.ticketsSold,
      }))
    : [{ label: "Hôm nay", value: 0 }];

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard
          title="Doanh thu thực nhận theo ngày (Net Revenue)"
          subtitle="Doanh thu sau khi trừ tiền hoàn trả (Đơn vị: nghìn VND)"
        >
          {dailySales.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs" style={{ color: T.mutedLight }}>
              Chưa có dữ liệu bán vé trong khoảng thời gian này
            </div>
          ) : (
            <BarChart data={dailyRevenueBars} color="#3C7850" suffix="k" />
          )}
        </ChartCard>

        <ChartCard
          title="Số lượng vé bán ra theo ngày"
          subtitle="Số vé bán thành công trong từng ngày"
        >
          {dailySales.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs" style={{ color: T.mutedLight }}>
              Chưa có dữ liệu bán vé trong khoảng thời gian này
            </div>
          ) : (
            <BarChart data={dailyTicketBars} color="#C89B3C" suffix=" vé" />
          )}
        </ChartCard>
      </div>

      {revenueByType.length > 0 && (
        <ChartCard
          title="Phân bố Doanh thu theo Loại vé"
          subtitle="Tỷ trọng doanh thu và số lượng vé bán của từng loại vé"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b font-semibold" style={{ borderColor: T.border, color: T.mutedLight }}>
                  <th className="pb-2">Tên loại vé</th>
                  <th className="pb-2 text-center">Số vé bán ra</th>
                  <th className="pb-2 text-right">Doanh thu thu về</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: T.border }}>
                {revenueByType.map((item) => (
                  <tr key={item.ticketTypeId} className="hover:bg-amber-50/20">
                    <td className="py-2.5 font-medium" style={{ color: T.text }}>
                      {item.ticketTypeName}
                    </td>
                    <td className="py-2.5 text-center font-mono font-semibold" style={{ color: T.text }}>
                      {item.ticketsSold}
                    </td>
                    <td className="py-2.5 text-right font-bold text-emerald-700">
                      {formatVnd(item.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}
    </div>
  );
}

