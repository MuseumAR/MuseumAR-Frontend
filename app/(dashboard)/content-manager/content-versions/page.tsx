import { ContentVersionsPanel } from "@/components/content-manager/content-versions-panel";
import { ContentNoMuseumState } from "@/components/content-manager/no-museum-empty-state";
import { resolveActiveMuseumId } from "@/services/content-manager/museum-context";
import { getVersionList } from "@/services/content-manager/content-version.service";

export default async function ContentVersionsPage() {
  const museumId = await resolveActiveMuseumId();
  if (museumId == null) {
    return <ContentNoMuseumState />;
  }

  const versions = await getVersionList(museumId);
  return <ContentVersionsPanel versions={versions} museumId={museumId} />;
}
