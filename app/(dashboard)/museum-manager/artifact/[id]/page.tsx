import { ArtifactDetail } from "@/components/shared/artifact-detail";
import { getArtifactById } from "@/services/museum-manager";
import { getExhibitById } from "@/services/content-manager";
import { notFound } from "next/navigation";

export default async function ArtifactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const artifact = await getArtifactById(id);
  if (!artifact) notFound();

  const exhibitId = artifact.exhibitId ?? Number(artifact.id.replace(/^EX-/i, ""));
  const exhibit = Number.isFinite(exhibitId) ? await getExhibitById(exhibitId).catch(() => null) : null;

  return (
    <ArtifactDetail
      artifact={artifact}
      backPath="/museum-manager/artifact"
      translations={exhibit?.translations ?? []}
    />
  );
}
