import { OfflinePackagesPanel } from "@/components/content-manager/offline-packages-panel";
import { getPackageList } from "@/services/content-manager/offline-package.service";
import { getVersionList } from "@/services/content-manager/content-version.service";
import { getExhibitionList } from "@/services/content-manager/exhibition.service";

export default async function OfflinePackagesPage() {
  const [packages, versions, exhibitions] = await Promise.all([
    getPackageList(),
    getVersionList(),
    getExhibitionList(),
  ]);
  return <OfflinePackagesPanel packages={packages} versions={versions} exhibitions={exhibitions} />;
}
