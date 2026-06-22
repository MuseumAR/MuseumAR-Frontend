import { MuseumManagementTable } from "@/components/admin/museum-management";
import { getMuseums } from "@/services/admin";

export default async function MuseumManagementPage() {
  const museums = await getMuseums();
  return <MuseumManagementTable museums={museums} />;
}
