import { TicketTypeManagementPanel } from "@/components/admin/ticket-type-management";
import { getMuseumList, getTicketTypeList } from "@/services/admin";

export default async function TicketTypesPage() {
  const [ticketTypes, museums] = await Promise.all([
    getTicketTypeList(),
    getMuseumList(),
  ]);

  return <TicketTypeManagementPanel ticketTypes={ticketTypes} museums={museums} />;
}
