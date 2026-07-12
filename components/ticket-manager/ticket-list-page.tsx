import { TicketList } from "./ticket-list";
import { getTicketTypeRows } from "@/services/ticket-manager";

export async function TicketListPage() {
  const ticketTypes = await getTicketTypeRows();

  return <TicketList ticketTypes={ticketTypes} />;
}
