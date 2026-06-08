import { TicketApplicationTable } from "@/components/museum-manager/ticket-application";
import { getTickets } from "@/services/ticket.service";

export default async function TicketApplicationPage() {
  const tickets = await getTickets();
  return <TicketApplicationTable tickets={tickets} />;
}
