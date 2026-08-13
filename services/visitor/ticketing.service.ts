import type {
  CreateOrderRequestDto,
  CreateOrderResponseDto,
  TicketDetailDto,
  TicketDto,
  TicketTypeDto,
} from "@/types/api";
import {
  cancelPayment as cancelPaymentApi,
  checkInTicket as checkInTicketApi,
  createOrder as createOrderApi,
  getMyTickets as getMyTicketsApi,
  getPendingOrder,
  getPublicTicketTypes as getPublicTicketTypesApi,
  getTicketDetail as getTicketDetailApi,
  mockConfirmPayment as mockConfirmPaymentApi,
  validateTicket as validateTicketApi,
} from "./ticketing-api.service";
import {
  DEMO_TICKET_TYPES,
  getMockTicketDetail,
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
export async function listMyTickets(lang?: string): Promise<TicketDto[]> {
  try {
    return await getMyTicketsApi(lang);
  } catch (err) {
    console.warn("Failed to fetch tickets from backend API:", err);
    return [];
  }
}

/** Fetch user's single ticket detail from backend API (with mock fallback) */
export async function getTicketDetail(id: number, lang?: string): Promise<TicketDetailDto | null> {
  try {
    return await getTicketDetailApi(id, lang);
  } catch (err) {
    console.warn("Failed to fetch ticket detail from backend API, trying fallback:", err);
    return getMockTicketDetail(id);
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
  validateTicketApi as validateTicket,
  checkInTicketApi as checkInTicket,
};

