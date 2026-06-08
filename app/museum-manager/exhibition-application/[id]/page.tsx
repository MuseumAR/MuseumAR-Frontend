import { ExhibitionApplicationDetail } from "@/components/museum-manager/exhibition-application-detail";
import { getExhibitionApplicationById } from "@/services/exhibition.service";
import { notFound } from "next/navigation";

export default async function ExhibitionApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = await getExhibitionApplicationById(id);
  if (!application) notFound();
  return <ExhibitionApplicationDetail application={application} />;
}
