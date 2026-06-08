import { MuseumProfileView } from "@/components/museum-manager/museum-profile";
import { getMuseumProfile } from "@/services/museum-profile.service";

export default async function MuseumProfilePage() {
  const profile = await getMuseumProfile();
  return <MuseumProfileView profile={profile} />;
}
