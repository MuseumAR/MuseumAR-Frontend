import { StatCard } from "@/components/dashboard/stat-card";
import { loadMuseumManagerOverview } from "@/services/museum-manager";
import { dashboardTheme as T, cinzel, dashboardTitleClass } from "@/lib/dashboard-theme";
import { LanguageUsageChart } from "./charts/language-usage-chart";
import { PopularExhibitChart } from "./charts/popular-exhibit-chart";
import { VisitorsTrendChart } from "./charts/visitors-trend-chart";

export async function MuseumManagerOverview() {
  const { stats, popularExhibits, languageUsage, scanByExhibit, error } =
    await loadMuseumManagerOverview();

  return (
    <div className="space-y-8 px-8 pb-10">
      {error ? (
        <p
          className="rounded-2xl px-4 py-3 text-sm"
          style={{ background: "rgba(180,40,40,0.08)", color: "#8B2E2E" }}
        >
          {error}
        </p>
      ) : null}

      <section>
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-[0.22em]" style={{ color: T.mutedLight }}>
            Tổng quan
          </p>
          <h2 className={`mt-1 ${dashboardTitleClass}`} style={{ fontFamily: cinzel, color: T.text }}>
            Khách tham quan & Tương tác
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Tổng lượt quét QR" value={stats.qrScansToday} icon="qrCode" watermark="map" />
          <StatCard
            label="Tổng tương tác"
            value={stats.totalVisitor}
            icon="users"
            watermark="column"
          />
          <StatCard
            label="Lượt tải offline"
            value={stats.offlineDownloads}
            icon="download"
            watermark="scroll"
          />
          <StatCard
            label="Thời lượng nghe TB (phút)"
            value={stats.averageListeningTime}
            icon="headphones"
            watermark="vase"
          />
        </div>
      </section>

      <section>
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-[0.22em]" style={{ color: T.mutedLight }}>
            Phân tích
          </p>
          <h2 className={`mt-1 ${dashboardTitleClass}`} style={{ fontFamily: cinzel, color: T.text }}>
            Thống kê hiện vật
          </h2>
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="space-y-6">
            <PopularExhibitChart data={popularExhibits} />
            <LanguageUsageChart data={languageUsage} />
          </div>
          <VisitorsTrendChart data={scanByExhibit} />
        </div>
      </section>
    </div>
  );
}
