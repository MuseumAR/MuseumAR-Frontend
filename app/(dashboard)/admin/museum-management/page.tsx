import { MuseumManagementPanel } from "@/components/admin/museum-management";
import { getMuseumList } from "@/services/admin";

export default async function MuseumManagementPage() {
  const museums = await getMuseumList();
  return <MuseumManagementPanel museums={museums} />;
}
