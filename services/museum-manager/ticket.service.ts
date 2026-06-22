import type { Ticket } from "@/types";
import { safeFetch } from "@/lib/fetch-safe";
import type { CreateOrderRequestDto, TicketTypeDto } from "@/types/api";
import { getTicketTypes as fetchAdminTicketTypes } from "@/services/admin/admin-api.service";
import {
  createOrder,
  getMyTickets,
  getPublicTicketTypes as fetchPublicTicketTypes,
  mockConfirmPayment,
} from "@/services/visitor/ticketing-api.service";

function mapTicketType(dto: TicketTypeDto): Ticket {
  return {
    id: `TK-${dto.id}`,
    type: dto.name,
    price: `$${dto.price}`,
    status: "Active",
  };
}

export async function getTickets(): Promise<Ticket[]> {
  return safeFetch(async () => {
    const ticketTypes = await fetchAdminTicketTypes();
    return ticketTypes.map(mapTicketType);
  }, []);
}

export async function getPublicTicketTypes() {
  return fetchPublicTicketTypes();
}

export { createOrder, getMyTickets, mockConfirmPayment };
export type { CreateOrderRequestDto };
