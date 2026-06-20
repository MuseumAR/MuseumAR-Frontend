import { StatCard } from "@/components/dashboard/stat-card";
import {
  getLanguageUsage,
  getMuseumManagerStats,
  getPopularExhibits,
  getVisitorsTrend,
} from "@/services/museum-manager.service";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
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
    <div className="space-y-8 px-8 pb-10">
      <section>
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-[0.22em]" style={{ color: T.mutedLight }}>
            Museum Overview
          </p>
          <h2 className="mt-1 text-xl font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
            Visitor & Engagement
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Visitors" value={stats.totalVisitor} icon="users" growth={14} watermark="column" />
          <StatCard label="QR Scans Today" value={stats.qrScansToday} icon="qrCode" growth={9} watermark="map" />
          <StatCard label="Offline Downloads" value={stats.offlineDownloads} icon="download" growth={6} watermark="scroll" />
          <StatCard label="Avg. Listening Time" value={stats.averageListeningTime} icon="headphones" growth={3} watermark="vase" />
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          className="rounded-2xl px-5 py-2.5 text-sm font-medium transition-colors"
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            color: T.muted,
          }}
        >
          Export PDF
        </button>
      </div>

      <section>
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-[0.22em]" style={{ color: T.mutedLight }}>
            Analytics
          </p>
          <h2 className="mt-1 text-xl font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
            Exhibition Insights
          </h2>
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="space-y-6">
            <PopularExhibitChart data={popularExhibits} />
            <LanguageUsageChart data={languageUsage} />
          </div>
          <VisitorsTrendChart data={visitorsTrend} />
        </div>
      </section>
    </div>
  );
}
