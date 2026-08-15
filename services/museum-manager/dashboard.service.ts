import type {
  LanguageUsage,
  MuseumManagerStats,
  PopularExhibit,
  VisitorTrend,
} from "@/types";
import type { MuseumDashboardDto } from "@/types/api";
import { getDisplayError } from "@/lib/validation";
import { getServerAccessToken } from "@/services/auth/resolve-access-token.server";
import { getMuseumDashboard } from "./dashboard-api.service";

const CHART_COLORS = ["#3b82f6", "#22c55e", "#a855f7", "#ec4899", "#f59e0b"];

export type MuseumManagerOverviewData = {
  stats: MuseumManagerStats;
  popularExhibits: PopularExhibit[];
  languageUsage: LanguageUsage[];
  scanByExhibit: VisitorTrend[];
  error: string | null;
};

const EMPTY_STATS: MuseumManagerStats = {
  totalVisitor: 0,
  qrScansToday: 0,
  offlineDownloads: 0,
  averageListeningTime: 0,
};

function mapDashboard(dashboard: MuseumDashboardDto) {
  const popularExhibits = dashboard.popularExhibits.map((item, index) => ({
    name: item.exhibitName,
    value: item.totalInteractions,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const languageUsage = dashboard.languageUsageStats.map((item, index) => ({
    name: item.languageCode,
    percent: Math.round(item.percentage),
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const scanByExhibit = dashboard.exhibitScanStats.map((item) => ({
    day: item.exhibitName,
    value: item.scanCount,
  }));

  const stats: MuseumManagerStats = {
    totalVisitor: dashboard.popularExhibits.reduce(
      (sum, item) => sum + item.totalInteractions,
      0,
    ),
    qrScansToday: dashboard.totalQrScans,
    offlineDownloads: dashboard.totalOfflineDownloads,
    averageListeningTime: Math.round(dashboard.averageListeningDurationMinutes),
  };

  return { stats, popularExhibits, languageUsage, scanByExhibit };
}

export async function loadMuseumManagerOverview(): Promise<MuseumManagerOverviewData> {
  try {
    const token = await getServerAccessToken();
    const dashboard = await getMuseumDashboard(token);
    return { ...mapDashboard(dashboard), error: null };
  } catch (err) {
    return {
      stats: EMPTY_STATS,
      popularExhibits: [],
      languageUsage: [],
      scanByExhibit: [],
      error: getDisplayError(err, "Could not load museum statistics."),
    };
  }
}

export async function getMuseumManagerStats(): Promise<MuseumManagerStats> {
  const page = await loadMuseumManagerOverview();
  return page.stats;
}

export async function getPopularExhibits(): Promise<PopularExhibit[]> {
  const page = await loadMuseumManagerOverview();
  return page.popularExhibits;
}

export async function getLanguageUsage(): Promise<LanguageUsage[]> {
  const page = await loadMuseumManagerOverview();
  return page.languageUsage;
}

export async function getVisitorsTrend(): Promise<VisitorTrend[]> {
  const page = await loadMuseumManagerOverview();
  return page.scanByExhibit;
}

export { getMuseumDashboard };
