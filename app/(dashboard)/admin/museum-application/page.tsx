import { MuseumApplicationTable } from "@/components/admin/museum-application";
import { getMuseumApplications } from "@/services/admin";

export default async function MuseumApplicationPage() {
  const applications = await getMuseumApplications();
  return <MuseumApplicationTable applications={applications} />;
}
