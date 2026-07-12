import { ExhibitionPanel } from "@/components/content-manager/exhibition-panel";
import { ContentNoMuseumState } from "@/components/content-manager/no-museum-empty-state";
import { getExhibitionList } from "@/services/content-manager/exhibition.service";
import { resolveActiveMuseumId } from "@/services/content-manager/museum-context";
import { getMuseumProfileEntry } from "@/services/admin";
import { getThemeOptions } from "@/services/content-manager/taxonomy.service";

export default async function ExhibitionPage() {
  const [exhibitions, museumIdFromJwt, museum, themes] = await Promise.all([
    getExhibitionList(),
    resolveActiveMuseumId(),
    getMuseumProfileEntry(),
    getThemeOptions(),
  ]);
  const museumId = museumIdFromJwt ?? museum?.id ?? null;
  if (museumId == null) {
    return <ContentNoMuseumState />;
  }

  return (
    <ExhibitionPanel exhibitions={exhibitions} museumId={museumId} themes={themes} />
  );
}
