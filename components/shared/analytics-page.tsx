"use client";

import { useEffect, useState, useMemo } from "react";
import {
  TrendingDown,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Calendar,
  Clock,
  RotateCcw,
  Loader2,
  CheckCircle2,
  Ticket,
  ArrowUpRight,
} from "lucide-react";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import type { AnalyticsMetric } from "@/types";
import type {
  MuseumDashboardDto,
  VisitorTrafficDto,
  RevenueAnalyticsDto,
} from "@/types/api";
import {
  AnalyticsCharts,
  VisitorTrafficCharts,
  RevenueAnalyticsCharts,
} from "./analytics-charts";
import {
  getManagerRevenueAnalytics,
  getManagerVisitorTrafficAnalytics,
} from "@/services/museum-manager/ticket-api.service";
import { formatDateTimeVi, formatVnd } from "@/lib/format";
import { getDisplayError } from "@/lib/validation";

interface Props {
  metrics: AnalyticsMetric[];
  dashboard?: MuseumDashboardDto | null;
  error?: string | null;
}

function hasDelta(change: string) {
  return change.startsWith("+") || change.startsWith("-");
}

export function AnalyticsPageContent({ metrics, dashboard, error: initialError }: Props) {
  const [activeTab, setActiveTab] = useState<"footfall" | "revenue" | "engagement">("footfall");
  const [dateFilter, setDateFilter] = useState<"all" | "30d" | "7d">("30d");

  // Dynamic state for Revenue & Traffic
  const [trafficData, setTrafficData] = useState<VisitorTrafficDto | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueAnalyticsDto | null>(null);
  const [loadingExtra, setLoadingExtra] = useState(false);
  const [extraError, setExtraError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoadingExtra(true);
    setExtraError(null);

    let fromDate: string | undefined = undefined;
    const now = new Date();
    if (dateFilter === "7d") {
      const d = new Date();
      d.setDate(now.getDate() - 7);
      fromDate = d.toISOString().split("T")[0];
    } else if (dateFilter === "30d") {
      const d = new Date();
      d.setDate(now.getDate() - 30);
      fromDate = d.toISOString().split("T")[0];
    }

    try {
      const [traffic, revenue] = await Promise.all([
        getManagerVisitorTrafficAnalytics(fromDate),
        getManagerRevenueAnalytics(fromDate),
      ]);
      setTrafficData(traffic);
      setRevenueData(revenue);
    } catch (err: unknown) {
      setExtraError(getDisplayError(err, "Không thể tải đầy đủ số liệu thống kê doanh thu và lưu lượng khách."));
    } finally {
      setLoadingExtra(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateFilter]);

  // Calculations for traffic peak hour
  const highestPeakHour = useMemo(() => {
    if (!trafficData || !trafficData.peakHoursTraffic || trafficData.peakHoursTraffic.length === 0)
      return null;
    return trafficData.peakHoursTraffic.reduce(
      (max, cur) => (cur.visitorCount > max.visitorCount ? cur : max),
      trafficData.peakHoursTraffic[0]
    );
  }, [trafficData]);

  return (
    <div className="space-y-6 px-4 sm:px-8 pb-12">
      {/* Page Title & Date Range Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p
            className="text-xs font-medium uppercase tracking-[0.22em]"
            style={{ color: T.mutedLight }}
          >
            Báo cáo & Thống kê thông minh
          </p>
          <h1
            className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ fontFamily: cinzel, color: T.text }}
          >
            Trung tâm Phân tích Bảo tàng (Analytics)
          </h1>
        </div>

        {/* Date Filter & Refresh */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center rounded-2xl p-1 border"
            style={{ background: T.surface, borderColor: T.border }}
          >
            {(["7d", "30d", "all"] as const).map((period) => {
              const labels = { "7d": "7 ngày qua", "30d": "30 ngày qua", all: "Tất cả" };
              const isSelected = dateFilter === period;
              return (
                <button
                  key={period}
                  onClick={() => setDateFilter(period)}
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
                  style={{
                    background: isSelected ? T.primary : "transparent",
                    color: isSelected ? "#FFF8E7" : T.muted,
                  }}
                >
                  {labels[period]}
                </button>
              );
            })}
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={loadingExtra}
            title="Làm mới số liệu"
            className="flex h-9 w-9 items-center justify-center rounded-2xl border transition-all hover:opacity-80 active:scale-95 disabled:opacity-50"
            style={{ background: T.surface, borderColor: T.border, color: T.text }}
          >
            <RotateCcw className={`h-4 w-4 ${loadingExtra ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-1 overflow-x-auto p-1.5 rounded-2xl border"
        style={{ background: T.surface, borderColor: T.border }}
      >
        <button
          onClick={() => setActiveTab("footfall")}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap"
          style={{
            background: activeTab === "footfall" ? T.primary : "transparent",
            color: activeTab === "footfall" ? "#FFF8E7" : T.muted,
          }}
        >
          <Users className="h-4 w-4" />
          Lưu lượng Khách ra vào cổng
        </button>

        <button
          onClick={() => setActiveTab("revenue")}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap"
          style={{
            background: activeTab === "revenue" ? T.primary : "transparent",
            color: activeTab === "revenue" ? "#FFF8E7" : T.muted,
          }}
        >
          <DollarSign className="h-4 w-4" />
          Báo cáo Doanh thu & Bán vé
        </button>

        <button
          onClick={() => setActiveTab("engagement")}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap"
          style={{
            background: activeTab === "engagement" ? T.primary : "transparent",
            color: activeTab === "engagement" ? "#FFF8E7" : T.muted,
          }}
        >
          <BarChart3 className="h-4 w-4" />
          Tương tác Hiện vật & Audio
        </button>
      </div>

      {(initialError || extraError) && (
        <p
          className="rounded-2xl px-4 py-3 text-xs font-medium"
          style={{ background: "rgba(180,40,40,0.08)", color: "#8B2E2E" }}
        >
          {initialError || extraError}
        </p>
      )}

      {/* TAB 1: VISITOR FOOTFALL & PEAK HOURS */}
      {activeTab === "footfall" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top KPI Cards for Footfall */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div
              className="rounded-3xl p-5 border"
              style={{ background: T.surface, borderColor: T.border }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase font-medium" style={{ color: T.muted }}>
                  Khách đã vào cổng
                </p>
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <p
                className="mt-3 text-3xl font-bold tabular-nums"
                style={{ fontFamily: cinzel, color: T.text }}
              >
                {trafficData ? trafficData.totalAdmittedVisitors : "0"}
              </p>
              <p className="mt-1 text-[11px]" style={{ color: T.mutedLight }}>
                Lượt quét mã check-in thành công
              </p>
            </div>

            <div
              className="rounded-3xl p-5 border"
              style={{ background: T.surface, borderColor: T.border }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase font-medium" style={{ color: T.muted }}>
                  Tổng vé đã bán
                </p>
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Ticket className="h-4 w-4" />
                </div>
              </div>
              <p
                className="mt-3 text-3xl font-bold tabular-nums"
                style={{ fontFamily: cinzel, color: T.text }}
              >
                {trafficData ? trafficData.totalTicketsSold : "0"}
              </p>
              <p className="mt-1 text-[11px]" style={{ color: T.mutedLight }}>
                Vé đã thanh toán trong kỳ
              </p>
            </div>

            <div
              className="rounded-3xl p-5 border"
              style={{ background: T.surface, borderColor: T.border }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase font-medium" style={{ color: T.muted }}>
                  Tỷ lệ đến tham quan
                </p>
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
              <p
                className="mt-3 text-3xl font-bold tabular-nums"
                style={{ fontFamily: cinzel, color: "#1D4ED8" }}
              >
                {trafficData ? `${trafficData.attendanceRate}%` : "0%"}
              </p>
              <p className="mt-1 text-[11px]" style={{ color: T.mutedLight }}>
                Vé check-in / Tổng vé bán ra
              </p>
            </div>

            <div
              className="rounded-3xl p-5 border"
              style={{ background: T.surface, borderColor: T.border }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase font-medium" style={{ color: T.muted }}>
                  Giờ cao điểm nhất
                </p>
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <p
                className="mt-3 text-2xl font-bold text-amber-800"
                style={{ fontFamily: cinzel }}
              >
                {highestPeakHour && highestPeakHour.visitorCount > 0
                  ? highestPeakHour.hourLabel
                  : "09:00 - 11:00"}
              </p>
              <p className="mt-1 text-[11px]" style={{ color: T.mutedLight }}>
                {highestPeakHour && highestPeakHour.visitorCount > 0
                  ? `${highestPeakHour.visitorCount} lượt vào cổng`
                  : "Chưa ghi nhận giờ đông đột biến"}
              </p>
            </div>
          </div>

          {/* Charts */}
          <VisitorTrafficCharts traffic={trafficData} />

          {/* Detailed Daily Footfall Table */}
          {trafficData && trafficData.dailyFootfall.length > 0 && (
            <div
              className="rounded-3xl p-6 border"
              style={{ background: T.surface, borderColor: T.border }}
            >
              <h3 className="text-base font-semibold mb-1" style={{ fontFamily: cinzel, color: T.text }}>
                Chi tiết lượt khách vào cổng theo ngày
              </h3>
              <p className="text-xs mb-4" style={{ color: T.mutedLight }}>
                Nhật ký số lượng khách quét mã QR bước vào bảo tàng
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b font-semibold" style={{ borderColor: T.border, color: T.mutedLight }}>
                      <th className="pb-2">Ngày tham quan</th>
                      <th className="pb-2 text-right">Số lượt khách check-in</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: T.border }}>
                    {trafficData.dailyFootfall.map((item) => (
                      <tr key={item.date} className="hover:bg-amber-50/20">
                        <td className="py-2.5 font-medium" style={{ color: T.text }}>
                          {item.date}
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-emerald-700">
                          {item.visitorCount} khách
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REVENUE & DAILY SALES */}
      {activeTab === "revenue" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top KPI Cards for Revenue */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div
              className="rounded-3xl p-5 border"
              style={{ background: T.surface, borderColor: T.border }}
            >
              <p className="text-xs uppercase font-medium" style={{ color: T.muted }}>
                Tổng doanh thu (Gross)
              </p>
              <p className="mt-2 text-2xl font-bold" style={{ color: T.text }}>
                {formatVnd(revenueData?.totalGrossRevenue ?? 0)}
              </p>
              <p className="mt-1 text-[11px]" style={{ color: T.mutedLight }}>
                Tổng tiền thu từ bán vé
              </p>
            </div>

            <div
              className="rounded-3xl p-5 border"
              style={{
                background: "rgba(239,68,68,0.05)",
                borderColor: "rgba(239,68,68,0.25)",
              }}
            >
              <p className="text-xs uppercase font-semibold text-rose-700">
                Tiền hoàn trả (Refunded)
              </p>
              <p className="mt-2 text-2xl font-bold text-rose-700">
                {formatVnd(revenueData?.totalRefundedAmount ?? 0)}
              </p>
              <p className="mt-1 text-[11px] text-rose-600">
                {revenueData?.totalRefundedTickets ?? 0} vé đã duyệt hoàn
              </p>
            </div>

            <div
              className="rounded-3xl p-5 border"
              style={{
                background: "rgba(60,120,80,0.08)",
                borderColor: "rgba(60,120,80,0.3)",
              }}
            >
              <p className="text-xs uppercase font-bold text-emerald-800">
                Doanh thu thực nhận (Net)
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-800">
                {formatVnd(revenueData?.netRevenue ?? 0)}
              </p>
              <p className="mt-1 text-[11px] text-emerald-700">
                Sau khi trừ các khoản hoàn
              </p>
            </div>

            <div
              className="rounded-3xl p-5 border"
              style={{ background: T.surface, borderColor: T.border }}
            >
              <p className="text-xs uppercase font-medium" style={{ color: T.muted }}>
                Tổng vé bán ra
              </p>
              <p className="mt-2 text-2xl font-bold" style={{ color: T.text }}>
                {revenueData?.totalTicketsSold ?? 0}
              </p>
              <p className="mt-1 text-[11px]" style={{ color: T.mutedLight }}>
                Tất cả đơn đặt vé thành công
              </p>
            </div>

            <div
              className="rounded-3xl p-5 border"
              style={{ background: T.surface, borderColor: T.border }}
            >
              <p className="text-xs uppercase font-medium" style={{ color: T.muted }}>
                Vé đã check-in
              </p>
              <p className="mt-2 text-2xl font-bold text-amber-800">
                {revenueData?.totalUsedTickets ?? 0}
              </p>
              <p className="mt-1 text-[11px]" style={{ color: T.mutedLight }}>
                Vé đã sử dụng qua cổng
              </p>
            </div>
          </div>

          {/* Revenue Charts */}
          <RevenueAnalyticsCharts revenue={revenueData} />

          {/* Daily Sales Breakdown Table */}
          {revenueData && revenueData.dailySales.length > 0 && (
            <div
              className="rounded-3xl p-6 border"
              style={{ background: T.surface, borderColor: T.border }}
            >
              <h3 className="text-base font-semibold mb-1" style={{ fontFamily: cinzel, color: T.text }}>
                Báo cáo doanh số và vé bán theo ngày
              </h3>
              <p className="text-xs mb-4" style={{ color: T.mutedLight }}>
                Chi tiết tổng thu, tiền hoàn trả và doanh thu thực nhận mỗi ngày
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b font-semibold" style={{ borderColor: T.border, color: T.mutedLight }}>
                      <th className="pb-2">Ngày</th>
                      <th className="pb-2 text-center">Số vé bán</th>
                      <th className="pb-2 text-right">Tổng thu (Gross)</th>
                      <th className="pb-2 text-right">Tiền hoàn trả</th>
                      <th className="pb-2 text-right">Doanh thu thực (Net)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: T.border }}>
                    {revenueData.dailySales.map((day) => (
                      <tr key={day.date} className="hover:bg-amber-50/20">
                        <td className="py-2.5 font-medium" style={{ color: T.text }}>
                          {day.date}
                        </td>
                        <td className="py-2.5 text-center font-mono font-semibold" style={{ color: T.text }}>
                          {day.ticketsSold}
                        </td>
                        <td className="py-2.5 text-right font-medium" style={{ color: T.text }}>
                          {formatVnd(day.grossRevenue)}
                        </td>
                        <td className="py-2.5 text-right font-medium text-rose-600">
                          {day.refundedAmount > 0 ? `-${formatVnd(day.refundedAmount)}` : "0 ₫"}
                        </td>
                        <td className="py-2.5 text-right font-bold text-emerald-700">
                          {formatVnd(day.netRevenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EXHIBIT & AUDIO ENGAGEMENT */}
      {activeTab === "engagement" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <section>
            <div className="mb-4">
              <h2
                className="text-xl font-semibold"
                style={{ fontFamily: cinzel, color: T.text }}
              >
                Chỉ số tương tác tham quan
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {(metrics.length > 0
                ? metrics
                : [
                    { label: "Tổng lượt quét QR", value: "0", change: "—" },
                    { label: "Thời lượng nghe trung bình", value: "0 phút", change: "—" },
                    { label: "Lượt tải gói offline", value: "0", change: "—" },
                    { label: "Hiện vật phổ biến", value: "0", change: "—" },
                  ]
              ).map((metric) => {
                const delta = hasDelta(metric.change);
                const positive = metric.change.startsWith("+");
                return (
                  <div
                    key={metric.label}
                    className="relative overflow-hidden rounded-3xl p-6 border"
                    style={{
                      background: T.surface,
                      borderColor: T.border,
                      boxShadow: "0 8px 24px rgba(43,29,14,0.06)",
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-sm" style={{ color: T.muted }}>
                        {metric.label}
                      </p>
                      {delta ? (
                        <div
                          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{
                            background: positive
                              ? "rgba(79,125,74,0.10)"
                              : "rgba(180,83,9,0.10)",
                            color: positive ? T.success : T.danger,
                          }}
                        >
                          {positive ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {metric.change}
                        </div>
                      ) : null}
                    </div>

                    <p
                      className="mt-4 text-3xl font-semibold tabular-nums"
                      style={{ fontFamily: cinzel, color: T.text }}
                    >
                      {metric.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-4">
              <h2
                className="text-xl font-semibold"
                style={{ fontFamily: cinzel, color: T.text }}
              >
                Biểu đồ Tương tác AR & Audio Guide
              </h2>
            </div>
            <AnalyticsCharts dashboard={dashboard} />
          </section>
        </div>
      )}
    </div>
  );
}
