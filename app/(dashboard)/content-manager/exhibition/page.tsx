import { ContentNoMuseumState } from "@/components/content-manager/no-museum-empty-state";
import { ExhibitionPanel } from "@/components/content-manager/exhibition-panel";
import { getExhibitionList } from "@/services/content-manager/exhibition.service";
import { resolveActiveMuseumId } from "@/services/content-manager/museum-context";

export default async function ExhibitionPage() {
  const museumId = await resolveActiveMuseumId();
  if (museumId == null) {
    return <ContentNoMuseumState />;
  }

  const exhibitions = await getExhibitionList(museumId);
  return <ExhibitionPanel exhibitions={exhibitions} museumId={museumId} />;
}
