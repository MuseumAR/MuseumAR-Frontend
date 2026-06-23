import { OfflinePackagesPanel } from "@/components/content-manager/offline-packages-panel";
import { ContentNoMuseumState } from "@/components/content-manager/no-museum-empty-state";
import { getPackageList } from "@/services/content-manager/offline-package.service";
import { resolveActiveMuseumId } from "@/services/content-manager/museum-context";

export default async function OfflinePackagesPage() {
  const museumId = await resolveActiveMuseumId();
  if (museumId == null) {
    return <ContentNoMuseumState />;
  }

  const packages = await getPackageList(museumId);
  return <OfflinePackagesPanel packages={packages} museumId={museumId} />;
}
