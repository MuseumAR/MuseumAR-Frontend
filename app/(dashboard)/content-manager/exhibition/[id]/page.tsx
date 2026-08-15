import { ExhibitionDetail } from "@/components/content-manager/exhibition-detail";
import { getExhibitionById } from "@/services/content-manager/exhibition.service";
import { getThemeOptions } from "@/services/content-manager/taxonomy.service";
import { notFound } from "next/navigation";

export default async function ExhibitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [exhibition, themes] = await Promise.all([
    getExhibitionById(id),
    getThemeOptions(),
  ]);
  if (!exhibition) notFound();

  return <ExhibitionDetail exhibition={exhibition} themes={themes} />;
}
