import { ContentNoMuseumState } from "@/components/content-manager/no-museum-empty-state";
import { ExhibitTable } from "@/components/content-manager/exhibit-table";
import { getExhibitRows } from "@/services/content-manager/exhibit.service";
import { resolveActiveMuseumId } from "@/services/content-manager/museum-context";

export default async function ArtifactPage() {
  const museumId = await resolveActiveMuseumId();
  if (museumId == null) {
    return <ContentNoMuseumState />;
  }

  const rows = await getExhibitRows(museumId);
  return (
    <div className="px-8 pb-10 pt-2">
      <ExhibitTable data={rows} />
    </div>
  );
}
