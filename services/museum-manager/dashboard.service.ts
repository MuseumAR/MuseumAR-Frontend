import type {
  LanguageUsage,
  MuseumManagerStats,
  PopularExhibit,
  VisitorTrend,
} from "@/types";
import { safeFetch } from "@/lib/fetch-safe";
import { getMuseumDashboard } from "./dashboard-api.service";
import { getStoredMuseumId } from "@/services/auth/resolve-museum-id";

const CHART_COLORS = ["#3b82f6", "#22c55e", "#a855f7", "#ec4899", "#f59e0b"];

const EMPTY_STATS: MuseumManagerStats = {
  totalVisitor: 0,
  qrScansToday: 0,
  offlineDownloads: 0,
  averageListeningTime: 0,
};

async function requireMuseumId(museumId?: number): Promise<number | null> {
  if (museumId != null) return museumId;
  return getStoredMuseumId();
}

export async function getMuseumManagerStats(
  museumId?: number,
): Promise<MuseumManagerStats> {
  return safeFetch(async () => {
    const id = await requireMuseumId(museumId);
    if (id == null) return EMPTY_STATS;

    const dashboard = await getMuseumDashboard(id);
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
  museumId?: number,
): Promise<PopularExhibit[]> {
  return safeFetch(async () => {
    const id = await requireMuseumId(museumId);
    if (id == null) return [];

    const dashboard = await getMuseumDashboard(id);
    return dashboard.popularExhibits.map((item, index) => ({
      name: item.exhibitName,
      value: item.totalInteractions,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, []);
}

export async function getLanguageUsage(
  museumId?: number,
): Promise<LanguageUsage[]> {
  return safeFetch(async () => {
    const id = await requireMuseumId(museumId);
    if (id == null) return [];

    const dashboard = await getMuseumDashboard(id);
    return dashboard.languageUsageStats.map((item, index) => ({
      name: item.languageCode,
      percent: Math.round(item.percentage),
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, []);
}

export async function getVisitorsTrend(
  museumId?: number,
): Promise<VisitorTrend[]> {
  return safeFetch(async () => {
    const id = await requireMuseumId(museumId);
    if (id == null) return [];

    const dashboard = await getMuseumDashboard(id);
    return dashboard.exhibitScanStats.map((item) => ({
      day: item.exhibitName,
      value: item.scanCount,
    }));
  }, []);
}

export { getMuseumDashboard };
