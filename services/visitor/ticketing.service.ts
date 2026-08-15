import { AppError } from "@/lib/validation";
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
  validateTicket as validateTicketApi,
} from "./ticketing-api.service";

export async function listPublicTicketTypes(lang?: string): Promise<TicketTypeDto[]> {
  const list = await getPublicTicketTypesApi(lang);
  return Array.isArray(list) ? list : [];
}

export async function listMyTickets(lang?: string): Promise<TicketDto[]> {
  const list = await getMyTicketsApi(lang);
  return Array.isArray(list) ? list : [];
}

export async function getTicketDetail(
  id: number,
  lang?: string,
): Promise<TicketDetailDto | null> {
  try {
    return await getTicketDetailApi(id, lang);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) return null;
    throw err;
  }
}

export async function placeTicketOrder(
  payload: CreateOrderRequestDto,
): Promise<CreateOrderResponseDto> {
  return createOrderApi(payload);
}


export async function cancelTicketOrder(orderCode: string): Promise<void> {
  await cancelPaymentApi(orderCode);
}

export {
  createOrderApi as createOrder,
  getMyTicketsApi as getMyTickets,
  getPublicTicketTypesApi as getPublicTicketTypes,
  cancelPaymentApi as cancelTicketOrderApi,
  getPendingOrder,
  validateTicketApi as validateTicket,
  checkInTicketApi as checkInTicket,
};
