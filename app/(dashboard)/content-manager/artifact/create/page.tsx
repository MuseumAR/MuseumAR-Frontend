import { CreateExhibitForm } from "@/components/content-manager/create-exhibit-form";
import { ContentNoMuseumState } from "@/components/content-manager/no-museum-empty-state";
import { resolveActiveMuseumId } from "@/services/content-manager/museum-context";
import { getMuseumProfileEntry } from "@/services/admin";
import {
  getAgeGroupOptions,
  getCategoryOptions,
  getTagOptions,
} from "@/services/content-manager/taxonomy.service";
import { getMuseumMaps } from "@/services/content-manager/content-api.service";
import { getRoomList } from "@/services/content-manager/room.service";

export default async function CreateArtifactPage() {
  const museumId =
    (await resolveActiveMuseumId()) ?? (await getMuseumProfileEntry())?.id ?? null;
  if (museumId == null) {
    return <ContentNoMuseumState />;
  }

  const [categories, ageGroups, tags, maps, rooms] = await Promise.all([
    getCategoryOptions(),
    getAgeGroupOptions(),
    getTagOptions(),
    getMuseumMaps(),
    getRoomList(museumId),
  ]);

  return (
    <CreateExhibitForm
      museumId={museumId}
      categories={categories}
      ageGroups={ageGroups}
      tags={tags}
      maps={maps}
      rooms={rooms}
    />
  );
}
