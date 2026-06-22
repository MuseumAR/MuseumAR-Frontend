import type { AnalyticsMetric } from "@/types";
import { DEFAULT_MUSEUM_ID } from "@/lib/constants";
import { safeFetch } from "@/lib/fetch-safe";
import { getMuseumDashboard } from "@/services/museum-manager/dashboard-api.service";

const EMPTY_METRICS: AnalyticsMetric[] = [
  { label: "Total QR scans", value: "0", change: "—" },
  { label: "Avg. listening duration", value: "0 min", change: "—" },
  { label: "Offline downloads", value: "0", change: "—" },
  { label: "Popular exhibits", value: "0", change: "—" },
];

export async function getAnalyticsMetrics(
  museumId = DEFAULT_MUSEUM_ID,
): Promise<AnalyticsMetric[]> {
  return safeFetch(async () => {
    const dashboard = await getMuseumDashboard(museumId);
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
