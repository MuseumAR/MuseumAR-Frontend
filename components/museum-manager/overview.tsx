import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  getLanguageUsage,
  getMuseumManagerStats,
  getPopularExhibits,
  getVisitorsTrend,
} from "@/services/museum-manager.service";
import { LanguageUsageChart } from "./charts/language-usage-chart";
import { PopularExhibitChart } from "./charts/popular-exhibit-chart";
import { VisitorsTrendChart } from "./charts/visitors-trend-chart";

export async function MuseumManagerOverview() {
  const [stats, popularExhibits, languageUsage, visitorsTrend] = await Promise.all([
    getMuseumManagerStats(),
    getPopularExhibits(),
    getLanguageUsage(),
    getVisitorsTrend(),
  ]);

  return (
    <>
      <PageHeader title="Overview" icon="overview" />
    <div className="space-y-6 px-8 py-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Visitor" value={stats.totalVisitor} />
        <StatCard label="QR Scans Today" value={stats.qrScansToday} />
        <StatCard label="Offline Downloads" value={stats.offlineDownloads} />
        <StatCard label="Average Listening Time" value={stats.averageListeningTime} />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="rounded-full border border-white/25 px-5 py-2 text-sm text-white transition-colors hover:border-white/50"
        >
          Export PDF
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-6">
          <PopularExhibitChart data={popularExhibits} />
          <LanguageUsageChart data={languageUsage} />
        </div>
        <VisitorsTrendChart data={visitorsTrend} />
      </div>
    </div>
    </>
  );
}
