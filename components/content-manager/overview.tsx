import { StatCard } from "@/components/dashboard/stat-card";
import { OverviewCharts } from "@/components/dashboard/overview-charts";
import { getArtifactRows, getArtifactStats } from "@/services/artifact.service";
import { dashboardTheme as T, cinzel } from "@/lib/dashboard-theme";
import { ArtifactTable } from "./artifact-table";

export async function ContentManagerOverview() {
  const [stats, rows] = await Promise.all([getArtifactStats(), getArtifactRows()]);

  return (
    <div className="space-y-8 px-8 pb-10">
      {/* Overview stats */}
      <section>
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-[0.22em]" style={{ color: T.mutedLight }}>
            Collection Overview
          </p>
          <h2
            className="mt-1 text-xl font-semibold"
            style={{ fontFamily: cinzel, color: T.text }}
          >
            Museum Statistics
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="AR Models Available" value={stats.arModelsAvailable} icon="box" growth={8} watermark="vase" />
          <StatCard label="Total Artifacts" value={stats.totalArtifact} icon="layers" growth={12} watermark="scroll" />
          <StatCard label="Visitors Today" value={stats.visitorsScannedToday} icon="users" growth={5} watermark="column" />
          <StatCard label="QR Scans" value={stats.qrScansToday} icon="qrCode" growth={18} watermark="map" />
        </div>
      </section>

      {/* Analytics charts */}
      <section>
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-[0.22em]" style={{ color: T.mutedLight }}>
            Analytics
          </p>
          <h2
            className="mt-1 text-xl font-semibold"
            style={{ fontFamily: cinzel, color: T.text }}
          >
            Engagement Insights
          </h2>
        </div>
        <OverviewCharts rows={rows} />
      </section>

      {/* Artifact catalog table */}
      <section>
        <ArtifactTable data={rows} />
      </section>
    </div>
  );
}
