import { TicketApplicationTable } from "@/components/museum-manager/ticket-application";
import { getTickets } from "@/services/museum-manager";

export default async function TicketApplicationPage() {
  const tickets = await getTickets();
  return <TicketApplicationTable tickets={tickets} />;
}
