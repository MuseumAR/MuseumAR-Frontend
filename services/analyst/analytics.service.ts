import type { AnalyticsMetric } from "@/types";
import { safeFetch } from "@/lib/fetch-safe";
import { getServerAccessToken } from "@/services/auth/resolve-access-token.server";
import { getMuseumDashboard } from "@/services/museum-manager/dashboard-api.service";

const EMPTY_METRICS: AnalyticsMetric[] = [
  { label: "Tổng lượt quét QR", value: "0", change: "—" },
  { label: "Thời gian nghe trung bình", value: "0 phút", change: "—" },
  { label: "Lượt tải ngoại tuyến", value: "0", change: "—" },
  { label: "Hiện vật phổ biến", value: "0", change: "—" },
];

export async function getAnalyticsMetrics(): Promise<AnalyticsMetric[]> {
  return safeFetch(async () => {
    const token = await getServerAccessToken();
    const dashboard = await getMuseumDashboard(token);
    return [
      {
        label: "Tổng lượt quét QR",
        value: dashboard.totalQrScans.toLocaleString(),
        change: "—",
      },
      {
        label: "Thời gian nghe trung bình",
        value: `${dashboard.averageListeningDurationMinutes.toFixed(1)} phút`,
        change: "—",
      },
      {
        label: "Lượt tải ngoại tuyến",
        value: dashboard.totalOfflineDownloads.toLocaleString(),
        change: "—",
      },
      {
        label: "Hiện vật phổ biến",
        value: dashboard.popularExhibits.length.toLocaleString(),
        change: "—",
      },
    ];
  }, EMPTY_METRICS);
}

export async function getAnalyticsDashboard() {
  return safeFetch(async () => {
    const token = await getServerAccessToken();
    return getMuseumDashboard(token);
  }, null);
}

