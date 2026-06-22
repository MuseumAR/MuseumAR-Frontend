import { UpdateMuseumForm } from "@/components/museum-manager/update-museum-form";
import { getMuseumProfile } from "@/services/museum-manager";

export default async function EditMuseumPage() {
  const profile = await getMuseumProfile();
  return <UpdateMuseumForm profile={profile} />;
}
