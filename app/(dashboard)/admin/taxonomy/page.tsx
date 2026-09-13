import { TaxonomyManagementPanel } from "@/components/admin/taxonomy-management";
import { getMuseumProfileEntry } from "@/services/admin";

export default async function TaxonomyPage() {
  const museum = await getMuseumProfileEntry();

  return <TaxonomyManagementPanel museumId={museum?.id ?? null} />;
}
