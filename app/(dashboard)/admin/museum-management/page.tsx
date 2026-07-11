import { MuseumManagementPanel } from "@/components/admin/museum-management";
import { getMuseumProfileEntry } from "@/services/admin";

export default async function MuseumManagementPage() {
  const museum = await getMuseumProfileEntry();
  return <MuseumManagementPanel museum={museum} />;
}
