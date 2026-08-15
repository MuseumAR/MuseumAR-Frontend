import type { AnalyticsMetric } from "@/types";
import type { MuseumDashboardDto } from "@/types/api";
import { getDisplayError } from "@/lib/validation";
import { getServerAccessToken } from "@/services/auth/resolve-access-token.server";
import { getMuseumDashboard } from "@/services/museum-manager/dashboard-api.service";

export type AnalyticsPageData = {
  metrics: AnalyticsMetric[];
  dashboard: MuseumDashboardDto | null;
  error: string | null;
};

function toMetrics(dashboard: MuseumDashboardDto): AnalyticsMetric[] {
  return [
    {
      label: "Total QR scans",
      value: dashboard.totalQrScans.toLocaleString(),
      change: "—",
    },
    {
      label: "Average listening time",
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
}

export async function loadAnalyticsPage(): Promise<AnalyticsPageData> {
  try {
    const token = await getServerAccessToken();
    const dashboard = await getMuseumDashboard(token);
    return { metrics: toMetrics(dashboard), dashboard, error: null };
  } catch (err) {
    return {
      metrics: [],
      dashboard: null,
      error: getDisplayError(err, "Could not load analytics."),
    };
  }
}
