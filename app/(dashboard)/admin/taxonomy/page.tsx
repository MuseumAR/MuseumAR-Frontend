import { TaxonomyManagementPanel } from "@/components/admin/taxonomy-management";
import { getMuseumProfileEntry } from "@/services/admin";
import {
  getCategoryOptions,
  getTagGroupOptions,
  getTagOptions,
  getThemeOptions,
} from "@/services/content-manager/taxonomy.service";

export default async function TaxonomyPage() {
  const [categories, themes, tagGroups, tags, museum] = await Promise.all([
    getCategoryOptions(),
    getThemeOptions(),
    getTagGroupOptions(),
    getTagOptions(),
    getMuseumProfileEntry(),
  ]);

  return (
    <TaxonomyManagementPanel
      categories={categories}
      themes={themes}
      tagGroups={tagGroups}
      tags={tags}
      museumId={museum?.id ?? null}
    />
  );
}
