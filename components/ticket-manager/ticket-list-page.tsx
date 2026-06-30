import { TicketList } from "./ticket-list";
import { getStandardTickets, getExhibitionTickets } from "@/services/ticket-manager";

export async function TicketListPage() {
  const [standardTickets, exhibitionTickets] = await Promise.all([
    getStandardTickets(),
    getExhibitionTickets(),
  ]);

  return <TicketList standardTickets={standardTickets} exhibitionTickets={exhibitionTickets} />;
}
