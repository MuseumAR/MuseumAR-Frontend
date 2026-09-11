import { ExhibitTable } from "@/components/content-manager/exhibit-table";

export default function ArtifactPage() {
  return (
    <div className="px-8 pb-10 pt-2">
      <ExhibitTable
        basePath="/museum-manager"
        showCreate={false}
        canEdit={false}
        canPublish={false}
        canDelete={false}
      />
    </div>
  );
}
