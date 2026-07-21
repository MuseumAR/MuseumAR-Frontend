import { TicketTypeManagementPanel } from "@/components/admin/ticket-type-management";
import { getMuseumProfileEntry, getTicketTypeList } from "@/services/admin";
import { getServerAccessToken } from "@/services/auth/resolve-access-token.server";

export default async function TicketTypesPage() {
  const token = await getServerAccessToken();
  const [ticketTypes, museum] = await Promise.all([
    getTicketTypeList(token),
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
