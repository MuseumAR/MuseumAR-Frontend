import { ArtifactDetail } from "@/components/shared/artifact-detail";
import { getArtifactById } from "@/services/artifact.service";
import { notFound } from "next/navigation";

export default async function ArtifactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const artifact = await getArtifactById(id);
  if (!artifact) notFound();
  return <ArtifactDetail artifact={artifact} backPath="/museum-manager/artifact" />;
}
