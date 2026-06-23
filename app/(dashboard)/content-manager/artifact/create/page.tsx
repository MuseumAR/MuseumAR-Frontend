import { CreateExhibitForm } from "@/components/content-manager/create-exhibit-form";
import { ContentNoMuseumState } from "@/components/content-manager/no-museum-empty-state";
import { resolveActiveMuseumId } from "@/services/content-manager/museum-context";

export default async function CreateArtifactPage() {
  const museumId = await resolveActiveMuseumId();
  if (museumId == null) {
    return <ContentNoMuseumState />;
  }
  return <CreateExhibitForm museumId={museumId} />;
}
