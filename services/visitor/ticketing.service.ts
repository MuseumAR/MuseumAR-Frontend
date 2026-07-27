import type {
  CreateOrderRequestDto,
  CreateOrderResponseDto,
  TicketDto,
  TicketTypeDto,
} from "@/types/api";
import {
  createOrder as createOrderApi,
  getMyTickets as getMyTicketsApi,
  getPublicTicketTypes as getPublicTicketTypesApi,
  mockConfirmPayment as mockConfirmPaymentApi,
} from "./ticketing-api.service";
import {
  DEMO_TICKET_TYPES,
  mockPurchaseTickets,
  readMockTickets,
} from "./ticket-mock.store";

/** UI demo catalog — no ticketing API calls (BE VisitorId FK broken). */
export async function listPublicTicketTypes(): Promise<TicketTypeDto[]> {
  return DEMO_TICKET_TYPES;
}

/** UI-only — reads locally purchased mock tickets. */
export async function listMyTickets(): Promise<TicketDto[]> {
  return readMockTickets();
}

/**
 * @deprecated Prefer purchaseTickets — create-order FK is broken on BE.
 */
export async function placeTicketOrder(
  payload: CreateOrderRequestDto,
): Promise<CreateOrderResponseDto> {
  return createOrderApi(payload);
}

/** @deprecated Prefer purchaseTickets — mock-confirm depends on a real order. */
export async function confirmTicketPayment(orderCode: string): Promise<void> {
  await mockConfirmPaymentApi(orderCode);
}

/**
 * UI-only purchase (localStorage). Skips create-order / mock-confirm until BE
 * resolves VisitorId from JWT UserId correctly.
 */
export async function purchaseTickets(input: {
  ticketType: TicketTypeDto;
  quantity: number;
}): Promise<{ orderCode: string }> {
  await new Promise((r) => setTimeout(r, 450));
  const { orderCode } = mockPurchaseTickets(input);
  return { orderCode };
}

export {
  createOrderApi as createOrder,
  getMyTicketsApi as getMyTickets,
  getPublicTicketTypesApi as getPublicTicketTypes,
  mockConfirmPaymentApi as mockConfirmPayment,
};
