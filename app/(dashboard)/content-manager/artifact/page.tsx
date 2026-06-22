import { ArtifactPageContent } from "@/components/shared/artifact-page";
import { getArtifacts } from "@/services/content-manager";

export default async function ArtifactPage() {
  const artifacts = await getArtifacts();
  return (
    <ArtifactPageContent
      artifacts={artifacts}
      basePath="/content-manager"
      createHref="/content-manager/artifact/create"
      showDelete
    />
  );
}
