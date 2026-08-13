import { StatCard } from "@/components/dashboard/stat-card";
import {
  getLanguageUsage,
  getMuseumManagerStats,
  getPopularExhibits,
  getVisitorsTrend,
} from "@/services/museum-manager";
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
            Tổng quan
          </p>
          <h2 className="mt-1 text-xl font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
            Khách tham quan & Tương tác
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Tổng khách" value={stats.totalVisitor} icon="users" watermark="column" />
          <StatCard label="Lượt quét QR hôm nay" value={stats.qrScansToday} icon="qrCode" watermark="map" />
          <StatCard label="Lượt tải ngoại tuyến" value={stats.offlineDownloads} icon="download" watermark="scroll" />
          <StatCard label="Thời gian nghe trung bình" value={stats.averageListeningTime} icon="headphones" watermark="vase" />
        </div>
      </section>

      <section>
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-[0.22em]" style={{ color: T.mutedLight }}>
            Phân tích
          </p>
          <h2 className="mt-1 text-xl font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
            Thông tin triển lãm
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
