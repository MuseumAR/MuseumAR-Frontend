import { MuseumManagementTable } from "@/components/admin/museum-management";
import { getMuseums } from "@/services/museum-management.service";

export default async function MuseumManagementPage() {
  const museums = await getMuseums();
  return <MuseumManagementTable museums={museums} />;
}
