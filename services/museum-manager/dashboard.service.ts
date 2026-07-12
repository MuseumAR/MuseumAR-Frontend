import type {
  LanguageUsage,
  MuseumManagerStats,
  PopularExhibit,
  VisitorTrend,
} from "@/types";
import { safeFetch } from "@/lib/fetch-safe";
import { getMuseumDashboard } from "./dashboard-api.service";

const CHART_COLORS = ["#3b82f6", "#22c55e", "#a855f7", "#ec4899", "#f59e0b"];

const EMPTY_STATS: MuseumManagerStats = {
  totalVisitor: 0,
  qrScansToday: 0,
  offlineDownloads: 0,
  averageListeningTime: 0,
};

export async function getMuseumManagerStats(): Promise<MuseumManagerStats> {
  return safeFetch(async () => {
    const dashboard = await getMuseumDashboard();
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

export async function getPopularExhibits(): Promise<PopularExhibit[]> {
  return safeFetch(async () => {
    const dashboard = await getMuseumDashboard();
    return dashboard.popularExhibits.map((item, index) => ({
      name: item.exhibitName,
      value: item.totalInteractions,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, []);
}

export async function getLanguageUsage(): Promise<LanguageUsage[]> {
  return safeFetch(async () => {
    const dashboard = await getMuseumDashboard();
    return dashboard.languageUsageStats.map((item, index) => ({
      name: item.languageCode,
      percent: Math.round(item.percentage),
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, []);
}

export async function getVisitorsTrend(): Promise<VisitorTrend[]> {
  return safeFetch(async () => {
    const dashboard = await getMuseumDashboard();
    return dashboard.exhibitScanStats.map((item) => ({
      day: item.exhibitName,
      value: item.scanCount,
    }));
  }, []);
}

export { getMuseumDashboard };
