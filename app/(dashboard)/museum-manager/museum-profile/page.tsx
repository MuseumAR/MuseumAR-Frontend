import { MuseumProfileView } from "@/components/museum-manager/museum-profile";
import { getMuseumProfile } from "@/services/museum-manager";

export default async function MuseumProfilePage() {
  const profile = await getMuseumProfile();
  return <MuseumProfileView profile={profile} />;
}
