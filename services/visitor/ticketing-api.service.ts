import { apiGet, apiGetAuth, apiPostAuth } from "@/services/api-client";
import type {
  CreateOrderRequestDto,
  TicketDto,
  TicketTypeDto,
} from "@/types/api";

export function getPublicTicketTypes() {
  return apiGet<TicketTypeDto[]>("/api/ticketing/types");
}

export function createOrder(payload: CreateOrderRequestDto) {
  return apiPostAuth<unknown>("/api/ticketing/create-order", payload);
}

export function getMyTickets() {
  return apiGetAuth<TicketDto[]>("/api/ticketing/my-tickets");
}

export function mockConfirmPayment(orderCode: string) {
  const params = new URLSearchParams({ orderCode });
  return apiGet<unknown>(`/api/ticketing/mock-confirm?${params.toString()}`);
}
