import { OfflinePackagesPanel } from "@/components/content-manager/offline-packages-panel";
import { getPackageList } from "@/services/content-manager/offline-package.service";
import { getVersionList } from "@/services/content-manager/content-version.service";

export default async function OfflinePackagesPage() {
  const [packages, versions] = await Promise.all([getPackageList(), getVersionList()]);
  return <OfflinePackagesPanel packages={packages} versions={versions} />;
}
