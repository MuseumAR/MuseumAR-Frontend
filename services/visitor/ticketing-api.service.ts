import { apiGet, apiGetAuth, apiPostAuth } from "@/services/api-client";
import {
  normalizeCreateOrderResponse,
  normalizeTicketDto,
  normalizeTicketTypeDto,
} from "@/lib/normalize-dto";
import type {
  CreateOrderRequestDto,
  CreateOrderResponseDto,
  PendingOrderDto,
  TicketDetailDto,
  TicketDto,
  TicketTypeDto,
  ValidateTicketResponseDto,
} from "@/types/api";

export function getPublicTicketTypes(lang?: string): Promise<TicketTypeDto[]> {
  const query = lang ? `?lang=${encodeURIComponent(lang)}` : "";
  return apiGet<unknown[]>(`/api/ticketing/types${query}`).then((data) =>
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

export function getTicketDetail(id: number): Promise<TicketDetailDto> {
  return apiGetAuth<TicketDetailDto>(`/api/ticketing/my-tickets/${id}`);
}

export function mockConfirmPayment(orderCode: string) {
  const params = new URLSearchParams({ orderCode });
  return apiGet<unknown>(`/api/ticketing/mock-confirm?${params.toString()}`);
}

export function checkPaymentStatus(orderCode: string): Promise<{ isPaid?: boolean; isCancelled?: boolean; status?: string }> {
  return apiGet<{ isPaid?: boolean; isCancelled?: boolean; status?: string }>(`/api/payment/check-status/${encodeURIComponent(orderCode)}`);
}

export function cancelPayment(orderCode: string): Promise<unknown> {
  return apiPostAuth<unknown>(`/api/payment/cancel/${encodeURIComponent(orderCode)}`, {});
}

export function getPendingOrder(): Promise<PendingOrderDto | null> {
  return apiGetAuth<PendingOrderDto | null>("/api/ticketing/pending-order");
}

export function validateTicket(ticketCode: string): Promise<ValidateTicketResponseDto> {
  return apiGet<ValidateTicketResponseDto>(`/api/ticketing/validate/${encodeURIComponent(ticketCode)}`);
}

export function checkInTicket(ticketCode: string): Promise<ValidateTicketResponseDto> {
  return apiPostAuth<ValidateTicketResponseDto>("/api/ticketing/check-in", { ticketCode });
}

