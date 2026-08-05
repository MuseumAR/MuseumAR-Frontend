import type {
  CreateOrderRequestDto,
  CreateOrderResponseDto,
  TicketDto,
  TicketTypeDto,
} from "@/types/api";
import {
  cancelPayment as cancelPaymentApi,
  createOrder as createOrderApi,
  getMyTickets as getMyTicketsApi,
  getPendingOrder,
  getPublicTicketTypes as getPublicTicketTypesApi,
  mockConfirmPayment as mockConfirmPaymentApi,
} from "./ticketing-api.service";
import {
  DEMO_TICKET_TYPES,
  mockPurchaseTickets,
  readMockTickets,
} from "./ticket-mock.store";

/** Fetch active ticket types from backend API (with demo fallback if empty) */
export async function listPublicTicketTypes(lang?: string): Promise<TicketTypeDto[]> {
  try {
    const list = await getPublicTicketTypesApi(lang);
    return list && list.length > 0 ? list : DEMO_TICKET_TYPES;
  } catch (err) {
    console.warn("Failed to fetch public ticket types from API, using fallback:", err);
    return DEMO_TICKET_TYPES;
  }
}

/** Fetch user's paid tickets from backend API */
export async function listMyTickets(): Promise<TicketDto[]> {
  try {
    return await getMyTicketsApi();
  } catch (err) {
    console.warn("Failed to fetch tickets from backend API:", err);
    return [];
  }
}

/** Place real ticket order on backend and confirm payment */
export async function placeTicketOrder(
  payload: CreateOrderRequestDto,
): Promise<CreateOrderResponseDto> {
  return createOrderApi(payload);
}

export async function confirmTicketPayment(orderCode: string): Promise<void> {
  await mockConfirmPaymentApi(orderCode);
}

export async function cancelTicketOrder(orderCode: string): Promise<void> {
  await cancelPaymentApi(orderCode);
}

export {
  createOrderApi as createOrder,
  getMyTicketsApi as getMyTickets,
  getPublicTicketTypesApi as getPublicTicketTypes,
  mockConfirmPaymentApi as mockConfirmPayment,
  cancelPaymentApi as cancelTicketOrderApi,
  getPendingOrder,
};

