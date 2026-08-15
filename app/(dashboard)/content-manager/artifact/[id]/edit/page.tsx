import { UpdateArtifactForm } from "@/components/content-manager/update-artifact-form";
import { ContentNoMuseumState } from "@/components/content-manager/no-museum-empty-state";
import { getArtifactById, getExhibitById } from "@/services/content-manager";
import { resolveActiveMuseumId } from "@/services/content-manager/museum-context";
import { getMuseumProfileEntry } from "@/services/admin";
import {
  getAgeGroupOptions,
  getCategoryOptions,
  getExhibitTagList,
  getTagOptions,
} from "@/services/content-manager/taxonomy.service";
import { getMuseumMaps } from "@/services/content-manager/content-api.service";
import { getRoomList } from "@/services/content-manager/room.service";
import { notFound } from "next/navigation";

export default async function UpdateArtifactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const museumId =
    (await resolveActiveMuseumId()) ?? (await getMuseumProfileEntry())?.id ?? null;
  if (museumId == null) {
    return <ContentNoMuseumState />;
  }
  const artifact = await getArtifactById(id);
  if (!artifact) notFound();

  const exhibitId =
    artifact.exhibitId ?? Number(artifact.id.replace(/^EX-/i, ""));
  const [categories, ageGroups, tags, exhibit, exhibitTags, maps, rooms] = await Promise.all([
    getCategoryOptions(),
    getAgeGroupOptions(),
    getTagOptions(),
    Number.isFinite(exhibitId) ? getExhibitById(exhibitId).catch(() => null) : Promise.resolve(null),
    Number.isFinite(exhibitId) ? getExhibitTagList(exhibitId) : Promise.resolve([]),
    getMuseumMaps(),
    getRoomList(museumId),
  ]);

  return (
    <UpdateArtifactForm
      artifact={artifact}
      museumId={museumId}
      categories={categories}
      ageGroups={ageGroups}
      tags={tags}
      maps={maps}
      rooms={rooms}
      initialCategoryId={exhibit?.categoryId ?? null}
      initialAgeGroupId={exhibit?.exhibitMetadata?.ageGroupId ?? null}
      initialEra={exhibit?.exhibitMetadata?.era ?? ""}
      initialEraEn={exhibit?.exhibitMetadata?.eraEn ?? ""}
      initialHistoricalEvent={exhibit?.exhibitMetadata?.historicalEvent ?? ""}
      initialHistoricalEventEn={exhibit?.exhibitMetadata?.historicalEventEn ?? ""}
      initialTagIds={exhibitTags.map((t) => t.id)}
      initialMapId={exhibit?.mapId ?? null}
      initialRoomId={exhibit?.roomId ?? null}
      initialTranslations={exhibit?.translations ?? []}
    />
  );
}
