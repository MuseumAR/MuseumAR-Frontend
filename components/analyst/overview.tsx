import { StatCard } from "@/components/dashboard/stat-card";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";

export function AnalystOverview() {
  return (
    <div className="space-y-8 px-8 pb-10">
      <section>
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-[0.22em]" style={{ color: T.mutedLight }}>
            Analyst Overview
          </p>
          <h2 className="mt-1 text-xl font-semibold" style={{ fontFamily: cinzel, color: T.text }}>
            Reports & Exports
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <StatCard label="Reports Generated" value={12} icon="fileText" growth={4} watermark="scroll" />
          <StatCard label="Data Exports This Month" value={5} icon="barChart" growth={2} watermark="map" />
        </div>
      </section>
    </div>
  );
}
