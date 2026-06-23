import { safeFetch } from "@/lib/fetch-safe";
import type { CreateTicketTypeDto, TicketTypeDto } from "@/types/api";
import { createTicketType, getTicketTypes } from "./admin-api.service";

export async function getTicketTypeList(): Promise<TicketTypeDto[]> {
  return safeFetch(() => getTicketTypes(), []);
}

export async function createTicketTypeEntry(payload: CreateTicketTypeDto) {
  return createTicketType(payload);
}
