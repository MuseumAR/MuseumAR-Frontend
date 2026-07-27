import type { Ticket } from "@/types";
import { safeFetch } from "@/lib/fetch-safe";
import type { TicketTypeDto, CreateTicketTypeDto } from "@/types/api";
import {
  getManagerTicketTypes,
  createManagerTicketType,
  publishManagerTicketType,
} from "./ticket-api.service";

function mapTicketType(dto: TicketTypeDto): Ticket {
  return {
    id: `TK-${dto.id}`,
    type: dto.name,
    price: new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(dto.price),
    status: dto.status === "Approved" ? "Active" : "Pending",
  };
}

export async function getTickets(accessToken?: string | null): Promise<Ticket[]> {
  return safeFetch(async () => {
    const ticketTypes = await getManagerTicketTypes(accessToken);
    return ticketTypes.map(mapTicketType);
  }, []);
}

export async function createTicketTypeEntryForManager(payload: CreateTicketTypeDto) {
  return createManagerTicketType(payload);
}

export async function publishTicketTypeEntryForManager(id: number) {
  return publishManagerTicketType(id);
}
