import Link from "next/link";
import { StatCard } from "@/components/dashboard/stat-card";
import { ContentNoMuseumState } from "@/components/content-manager/no-museum-empty-state";
import { ExhibitTable } from "@/components/content-manager/exhibit-table";
import {
  getExhibitRows,
  getExhibitStats,
} from "@/services/content-manager/exhibit.service";
import { resolveActiveMuseumId } from "@/services/content-manager/museum-context";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";

const QUICK_LINKS = [
  { href: "/content-manager/artifact", label: "Exhibits" },
  { href: "/content-manager/exhibition", label: "Exhibitions" },
  { href: "/content-manager/content-versions", label: "Versions" },
  { href: "/content-manager/offline-packages", label: "Packages" },
  { href: "/content-manager/maps-routes", label: "Maps & Routes" },
];

export async function ContentManagerOverview() {
  const museumId = await resolveActiveMuseumId();
  if (museumId == null) {
    return <ContentNoMuseumState />;
  }

  const [stats, rows] = await Promise.all([
    getExhibitStats(museumId),
    getExhibitRows(museumId),
  ]);

  return (
    <div className="space-y-8 px-8 pb-10">
      <section>
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-[0.22em]" style={{ color: T.mutedLight }}>
            Content Manager
          </p>
          <h2 className="mt-1 text-xl font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
            Museum #{museumId} — Content Dashboard
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total Exhibits" value={stats.total} icon="layers" watermark="scroll" />
          <StatCard label="Published" value={stats.published} icon="box" watermark="column" />
          <StatCard label="Draft" value={stats.draft} icon="layers" watermark="vase" />
          <StatCard label="With AR" value={stats.withAr} icon="box" watermark="map" />
          <StatCard label="With QR" value={stats.withQr} icon="qrCode" watermark="scroll" />
        </div>
      </section>

      <section>
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em]" style={{ color: T.mutedLight }}>
          Quick access
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl px-4 py-2 text-sm transition-colors"
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                color: T.muted,
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <ExhibitTable data={rows} showCreate />
      </section>
    </div>
  );
}
