import { ExhibitTable } from "@/components/content-manager/exhibit-table";
import { getExhibitRows } from "@/services/content-manager/exhibit.service";

export default async function ArtifactPage() {
  const rows = await getExhibitRows();
  return (
    <div className="px-8 pb-10 pt-2">
      <ExhibitTable data={rows} />
    </div>
  );
}
