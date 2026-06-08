import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { getArtifactRows, getArtifactStats } from "@/services/artifact.service";
import { ArtifactTable } from "./artifact-table";

export async function ContentManagerOverview() {
  const [stats, rows] = await Promise.all([getArtifactStats(), getArtifactRows()]);

  return (
    <>
      <PageHeader title="Overview" icon="overview" />
    <div className="space-y-8 px-8 py-8">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="AR Models Available" value={stats.arModelsAvailable} />
        <StatCard label="Total artifact" value={stats.totalArtifact} />
        <StatCard label="Visitors scanned today" value={stats.visitorsScannedToday} />
      </div>
      <ArtifactTable data={rows} />
    </div>
    </>
  );
}
