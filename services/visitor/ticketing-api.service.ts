import { apiGet, apiGetAuth, apiPostAuth } from "@/services/api-client";
import {
  normalizeCreateOrderResponse,
  normalizeTicketDto,
  normalizeTicketTypeDto,
} from "@/lib/normalize-dto";
import type {
  CreateOrderRequestDto,
  CreateOrderResponseDto,
  TicketDto,
  TicketTypeDto,
} from "@/types/api";

export function getPublicTicketTypes(): Promise<TicketTypeDto[]> {
  return apiGet<unknown[]>("/api/ticketing/types").then((data) =>
    (Array.isArray(data) ? data : []).map(normalizeTicketTypeDto),
  );
}

export function createOrder(
  payload: CreateOrderRequestDto,
): Promise<CreateOrderResponseDto> {
  return apiPostAuth<unknown>("/api/ticketing/create-order", payload).then(
    normalizeCreateOrderResponse,
  );
}

export function getMyTickets(): Promise<TicketDto[]> {
  return apiGetAuth<unknown[]>("/api/ticketing/my-tickets").then((data) =>
    (Array.isArray(data) ? data : []).map(normalizeTicketDto),
  );
}

export function mockConfirmPayment(orderCode: string) {
  const params = new URLSearchParams({ orderCode });
  return apiGet<unknown>(`/api/ticketing/mock-confirm?${params.toString()}`);
}
