import { OfflinePackagesPanel } from "@/components/content-manager/offline-packages-panel";
import { getPackageList } from "@/services/content-manager/offline-package.service";
import { getVersionList } from "@/services/content-manager/content-version.service";

export default async function OfflinePackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ versionId?: string }>;
}) {
  const params = await searchParams;
  const [packages, versionResult] = await Promise.all([
    getPackageList(),
    getVersionList(),
  ]);

  const preselected =
    params.versionId && Number.isFinite(Number(params.versionId))
      ? Number(params.versionId)
      : null;

  return (
    <OfflinePackagesPanel
      packages={packages}
      versions={versionResult.versions}
      initialVersionId={preselected}
    />
  );
}
