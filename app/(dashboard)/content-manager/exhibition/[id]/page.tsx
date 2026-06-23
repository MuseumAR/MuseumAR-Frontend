import { ExhibitionDetail } from "@/components/content-manager/exhibition-detail";
import { ContentNoMuseumState } from "@/components/content-manager/no-museum-empty-state";
import { getExhibitionById } from "@/services/content-manager/exhibition.service";
import { resolveActiveMuseumId } from "@/services/content-manager/museum-context";
import { notFound } from "next/navigation";

export default async function ExhibitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const museumId = await resolveActiveMuseumId();
  if (museumId == null) {
    return <ContentNoMuseumState />;
  }

  const exhibition = await getExhibitionById(id, museumId);
  if (!exhibition) notFound();

  return <ExhibitionDetail exhibition={exhibition} />;
}
