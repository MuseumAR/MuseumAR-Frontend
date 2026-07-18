import { TicketApplicationTable } from "@/components/museum-manager/ticket-application";
import { getTickets } from "@/services/museum-manager/ticket.service";
import { getManagedMuseum } from "@/services/museum-manager/museum.service";
import { getServerAccessToken } from "@/services/auth/resolve-access-token.server";

export default async function TicketApplicationPage() {
  const token = await getServerAccessToken();
  const [tickets, museum] = await Promise.all([
    getTickets(token),
    getManagedMuseum(),
  ]);

  return (
    <TicketApplicationTable
      tickets={tickets}
      museumId={museum?.id ?? null}
      museumName={museum?.name}
    />
  );
}
