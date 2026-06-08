import { ArtifactPageContent } from "@/components/shared/artifact-page";
import { getArtifacts } from "@/services/artifact.service";

export default async function ArtifactPage() {
  const artifacts = await getArtifacts();
  return <ArtifactPageContent artifacts={artifacts} basePath="/museum-manager" />;
}
