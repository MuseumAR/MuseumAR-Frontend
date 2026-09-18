import Link from "next/link";
import { ExhibitTable } from "@/components/content-manager/exhibit-table";
import { OverviewStats } from "@/components/content-manager/overview-stats";
import { dashboardTheme as T, cinzel, dashboardTitleClass } from "@/lib/dashboard-theme";

const QUICK_LINKS = [
  { href: "/content-manager/artifact", label: "Hiện vật" },
  { href: "/content-manager/exhibition", label: "Triển lãm" },
  { href: "/content-manager/content-versions", label: "Phiên bản nội dung" },
  { href: "/content-manager/offline-packages", label: "Gói offline" },
  { href: "/content-manager/maps-routes", label: "Bản đồ & Lộ trình" },
];

export function ContentManagerOverview() {
  return (
    <div className="space-y-8 px-8 pb-10">
      <section>
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-[0.22em]" style={{ color: T.mutedLight }}>
            Quản lý nội dung
          </p>
          <h2 className={`mt-1 ${dashboardTitleClass}`} style={{ fontFamily: cinzel, color: T.text }}>
            Bảng điều khiển nội dung
          </h2>
        </div>
        <OverviewStats />
      </section>

      <section>
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em]" style={{ color: T.mutedLight }}>
          Truy cập nhanh
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={false}
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
        <ExhibitTable showCreate={false} />
      </section>
    </div>
  );
}
