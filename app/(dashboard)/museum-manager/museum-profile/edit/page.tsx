import { redirect } from "next/navigation";
import { UpdateMuseumForm } from "@/components/museum-manager/update-museum-form";
import { getMuseumProfile } from "@/services/museum-manager";

export default async function EditMuseumPage() {
  const profile = await getMuseumProfile();
  if (!profile) {
    redirect("/museum-manager/museum-profile/create");
  }
  return <UpdateMuseumForm profile={profile} />;
}
