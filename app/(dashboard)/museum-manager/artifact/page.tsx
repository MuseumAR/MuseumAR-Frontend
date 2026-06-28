import { NoMuseumEmptyState } from "@/components/museum-manager/no-museum-empty-state";
import { ExhibitTable } from "@/components/content-manager/exhibit-table";
import { getExhibitRows } from "@/services/content-manager/exhibit.service";
import { resolveActiveMuseumId } from "@/services/museum-manager/museum.service";

export default async function ArtifactPage() {
  const museumId = await resolveActiveMuseumId();
  if (museumId == null) {
    return <NoMuseumEmptyState />;
  }

  const rows = await getExhibitRows(museumId);
  return (
    <div className="px-8 pb-10 pt-2">
      <ExhibitTable
        data={rows}
        basePath="/museum-manager"
        showCreate={false}
        canEdit={false}
        canPublish={false}
        canDelete={false}
      />
    </div>
  );
}
