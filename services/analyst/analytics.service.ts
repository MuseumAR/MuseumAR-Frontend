import type { AnalyticsMetric } from "@/types";
import { safeFetch } from "@/lib/fetch-safe";
import { getServerAccessToken } from "@/services/auth/resolve-access-token.server";
import { getMuseumDashboard } from "@/services/museum-manager/dashboard-api.service";

const EMPTY_METRICS: AnalyticsMetric[] = [
  { label: "Total QR scans", value: "0", change: "—" },
  { label: "Avg. listening duration", value: "0 min", change: "—" },
  { label: "Offline downloads", value: "0", change: "—" },
  { label: "Popular exhibits", value: "0", change: "—" },
];

export async function getAnalyticsMetrics(): Promise<AnalyticsMetric[]> {
  return safeFetch(async () => {
    const token = await getServerAccessToken();
    const dashboard = await getMuseumDashboard(token);
    return [
      {
        label: "Total QR scans",
        value: dashboard.totalQrScans.toLocaleString(),
        change: "—",
      },
      {
        label: "Avg. listening duration",
        value: `${dashboard.averageListeningDurationMinutes.toFixed(1)} min`,
        change: "—",
      },
      {
        label: "Offline downloads",
        value: dashboard.totalOfflineDownloads.toLocaleString(),
        change: "—",
      },
      {
        label: "Popular exhibits",
        value: dashboard.popularExhibits.length.toLocaleString(),
        change: "—",
      },
    ];
  }, EMPTY_METRICS);
}
