import type { AnalyticsMetric } from "@/types";
import { safeFetch } from "@/lib/fetch-safe";
import { getMuseumDashboard } from "@/services/museum-manager/dashboard-api.service";
import { resolveActiveMuseumId } from "@/services/museum-manager/museum.service";

const EMPTY_METRICS: AnalyticsMetric[] = [
  { label: "Total QR scans", value: "0", change: "—" },
  { label: "Avg. listening duration", value: "0 min", change: "—" },
  { label: "Offline downloads", value: "0", change: "—" },
  { label: "Popular exhibits", value: "0", change: "—" },
];

export async function getAnalyticsMetrics(
  museumId?: number,
): Promise<AnalyticsMetric[]> {
  return safeFetch(async () => {
    const id = museumId ?? (await resolveActiveMuseumId());
    if (id == null) return EMPTY_METRICS;

    const dashboard = await getMuseumDashboard(id);
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
