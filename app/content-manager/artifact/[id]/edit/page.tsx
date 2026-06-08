import { UpdateArtifactForm } from "@/components/content-manager/update-artifact-form";
import { getArtifactById } from "@/services/artifact.service";
import { notFound } from "next/navigation";

export default async function UpdateArtifactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const artifact = await getArtifactById(id);
  if (!artifact) notFound();
  return <UpdateArtifactForm artifact={artifact} />;
}
