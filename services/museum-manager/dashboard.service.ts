import type {
  LanguageUsage,
  MuseumManagerStats,
  PopularExhibit,
  VisitorTrend,
} from "@/types";
import { DEFAULT_MUSEUM_ID } from "@/lib/constants";
import { safeFetch } from "@/lib/fetch-safe";
import { getMuseumDashboard } from "./dashboard-api.service";

const CHART_COLORS = ["#3b82f6", "#22c55e", "#a855f7", "#ec4899", "#f59e0b"];

const EMPTY_STATS: MuseumManagerStats = {
  totalVisitor: 0,
  qrScansToday: 0,
  offlineDownloads: 0,
  averageListeningTime: 0,
};

export async function getMuseumManagerStats(
  museumId = DEFAULT_MUSEUM_ID,
): Promise<MuseumManagerStats> {
  return safeFetch(async () => {
    const dashboard = await getMuseumDashboard(museumId);
    return {
      totalVisitor: dashboard.popularExhibits.reduce(
        (sum, item) => sum + item.totalInteractions,
        0,
      ),
      qrScansToday: dashboard.totalQrScans,
      offlineDownloads: dashboard.totalOfflineDownloads,
      averageListeningTime: Math.round(dashboard.averageListeningDurationMinutes),
    };
  }, EMPTY_STATS);
}

export async function getPopularExhibits(
  museumId = DEFAULT_MUSEUM_ID,
): Promise<PopularExhibit[]> {
  return safeFetch(async () => {
    const dashboard = await getMuseumDashboard(museumId);
    return dashboard.popularExhibits.map((item, index) => ({
      name: item.exhibitName,
      value: item.totalInteractions,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, []);
}

export async function getLanguageUsage(
  museumId = DEFAULT_MUSEUM_ID,
): Promise<LanguageUsage[]> {
  return safeFetch(async () => {
    const dashboard = await getMuseumDashboard(museumId);
    return dashboard.languageUsageStats.map((item, index) => ({
      name: item.languageCode,
      percent: Math.round(item.percentage),
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, []);
}

export async function getVisitorsTrend(
  museumId = DEFAULT_MUSEUM_ID,
): Promise<VisitorTrend[]> {
  return safeFetch(async () => {
    const dashboard = await getMuseumDashboard(museumId);
    return dashboard.exhibitScanStats.map((item) => ({
      day: item.exhibitName,
      value: item.scanCount,
    }));
  }, []);
}

export { getMuseumDashboard };
