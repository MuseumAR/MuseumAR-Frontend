import { UpdateArtifactForm } from "@/components/content-manager/update-artifact-form";
import { ContentNoMuseumState } from "@/components/content-manager/no-museum-empty-state";
import { getArtifactById } from "@/services/content-manager";
import { resolveActiveMuseumId } from "@/services/content-manager/museum-context";
import { notFound } from "next/navigation";

export default async function UpdateArtifactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const museumId = await resolveActiveMuseumId();
  if (museumId == null) {
    return <ContentNoMuseumState />;
  }
  const artifact = await getArtifactById(id, museumId);
  if (!artifact) notFound();
  return <UpdateArtifactForm artifact={artifact} museumId={museumId} />;
}
