import { ContentVersionsPanel } from "@/components/content-manager/content-versions-panel";
import { getVersionList } from "@/services/content-manager/content-version.service";

export default async function ContentVersionsPage() {
  const { versions, loadError } = await getVersionList();
  return (
    <ContentVersionsPanel initialVersions={versions} loadError={loadError} />
  );
}
