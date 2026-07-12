import { OfflinePackagesPanel } from "@/components/content-manager/offline-packages-panel";
import { getPackageList } from "@/services/content-manager/offline-package.service";

export default async function OfflinePackagesPage() {
  const packages = await getPackageList();
  return <OfflinePackagesPanel packages={packages} />;
}
