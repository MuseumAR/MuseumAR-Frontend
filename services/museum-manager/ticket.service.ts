import type { Ticket } from "@/types";
import { safeFetch } from "@/lib/fetch-safe";
import type { TicketTypeDto, CreateTicketTypeDto, UpdateTicketTypeDto } from "@/types/api";
import {
  getManagerTicketTypes,
  createManagerTicketType,
  publishManagerTicketType,
  getManagerTicketTypeDetail,
  updateManagerTicketType,
  deleteManagerTicketType,
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
    status: dto.isActive === false ? "Inactive" : dto.status === "Approved" ? "Active" : "Pending",
    description: dto.description,
    exhibitionId: dto.exhibitionId,
    nameEn: dto.nameEn,
    descriptionEn: dto.descriptionEn,
    rawPrice: dto.price,
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

export async function getTicketDetailForManager(id: number, accessToken?: string | null): Promise<Ticket> {
  const dto = await getManagerTicketTypeDetail(id, accessToken);
  return mapTicketType(dto);
}

export async function updateTicketTypeEntryForManager(
  id: number,
  payload: UpdateTicketTypeDto,
  accessToken?: string | null,
) {
  return updateManagerTicketType(id, payload, accessToken);
}

export async function deleteTicketTypeEntryForManager(id: number, accessToken?: string | null) {
  return deleteManagerTicketType(id, accessToken);
}
