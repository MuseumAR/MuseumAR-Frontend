import { ContentVersionsPanel } from "@/components/content-manager/content-versions-panel";
import { ContentNoMuseumState } from "@/components/content-manager/no-museum-empty-state";
import { resolveActiveMuseumId } from "@/services/content-manager/museum-context";

export default async function ContentVersionsPage() {
  const museumId = await resolveActiveMuseumId();
  if (museumId == null) {
    return <ContentNoMuseumState />;
  }
  return <ContentVersionsPanel museumId={museumId} />;
}
