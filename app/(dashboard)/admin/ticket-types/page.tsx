import { TicketTypeManagementPanel } from "@/components/admin/ticket-type-management";
import { getMuseumProfileEntry, getTicketTypeList } from "@/services/admin";

export default async function TicketTypesPage() {
  const [ticketTypes, museum] = await Promise.all([
    getTicketTypeList(),
    getMuseumProfileEntry(),
  ]);

  return (
    <TicketTypeManagementPanel
      ticketTypes={ticketTypes}
      museumId={museum?.id ?? null}
      museumName={museum?.name}
    />
  );
}
