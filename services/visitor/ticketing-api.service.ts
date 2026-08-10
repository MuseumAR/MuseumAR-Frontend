import { apiGet, apiGetAuth, apiPost, apiPostAuth } from "@/services/api-client";
import {
  normalizeCreateOrderResponse,
  normalizePendingOrderDto,
  normalizeTicketDto,
  normalizeTicketTypeDto,
} from "@/lib/normalize-dto";
import type {
  CheckInRequestDto,
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

function normalizeTicketDetail(raw: unknown): TicketDetailDto {
  const o = asRecord(raw);
  const ticketType = asRecord(o.ticketType ?? o.TicketType);
  const museum = asRecord(o.museum ?? o.Museum);
  const exhibition = o.exhibition ?? o.Exhibition;
  const exhibitionRec =
    exhibition && typeof exhibition === "object"
      ? asRecord(exhibition)
      : null;
  const order = asRecord(o.order ?? o.Order);

  return {
    id: Number(o.id ?? o.Id ?? 0),
    ticketCode: String(o.ticketCode ?? o.TicketCode ?? ""),
    status: String(o.status ?? o.Status ?? ""),
    purchaseDate: String(o.purchaseDate ?? o.PurchaseDate ?? ""),
    validDate: (o.validDate ?? o.ValidDate) as string | null | undefined,
    ticketType: {
      id: Number(ticketType.id ?? ticketType.Id ?? 0),
      name: String(ticketType.name ?? ticketType.Name ?? ""),
      price: Number(ticketType.price ?? ticketType.Price ?? 0),
      description: (ticketType.description ?? ticketType.Description) as
        | string
        | null
        | undefined,
    },
    museum: {
      id: Number(museum.id ?? museum.Id ?? 0),
      name: String(museum.name ?? museum.Name ?? ""),
      address: (museum.address ?? museum.Address) as string | null | undefined,
    },
    exhibition: exhibitionRec
      ? {
          id: Number(exhibitionRec.id ?? exhibitionRec.Id ?? 0),
          name: String(exhibitionRec.name ?? exhibitionRec.Name ?? ""),
        }
      : null,
    order: {
      orderCode: String(order.orderCode ?? order.OrderCode ?? ""),
      totalAmount: Number(order.totalAmount ?? order.TotalAmount ?? 0),
      currency: String(order.currency ?? order.Currency ?? "VND"),
      paymentStatus: String(order.paymentStatus ?? order.PaymentStatus ?? ""),
      paymentMethod: (order.paymentMethod ?? order.PaymentMethod) as
        | string
        | null
        | undefined,
      paidAt: (order.paidAt ?? order.PaidAt) as string | null | undefined,
    },
    qrCodeData: (o.qrCodeData ?? o.QrCodeData) as string | null | undefined,
    qrCodeImageUrl: (o.qrCodeImageUrl ?? o.QrCodeImageUrl) as
      | string
      | null
      | undefined,
  };
}

export function getMyTicketDetail(id: number): Promise<TicketDetailDto> {
  return apiGetAuth<unknown>(`/api/ticketing/my-tickets/${id}`).then(
    normalizeTicketDetail,
  );
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

export function createPaymentLink(orderCode: string): Promise<CreateOrderResponseDto> {
  const params = new URLSearchParams({ orderCode });
  return apiPostAuth<unknown>(`/api/payment/create-link?${params.toString()}`, {}).then(
    normalizeCreateOrderResponse,
  );
}

export function getPendingOrder(): Promise<PendingOrderDto | null> {
  return apiGetAuth<unknown>("/api/ticketing/pending-order").then(normalizePendingOrderDto);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function normalizeValidateTicket(raw: unknown): ValidateTicketResponseDto {
  const o = asRecord(raw);
  return {
    ticketId: Number(o.ticketId ?? o.TicketId ?? 0),
    ticketCode: String(o.ticketCode ?? o.TicketCode ?? ""),
    status: String(o.status ?? o.Status ?? ""),
    isValid: Boolean(o.isValid ?? o.IsValid ?? false),
    message: String(o.message ?? o.Message ?? ""),
    ticketTypeName: String(o.ticketTypeName ?? o.TicketTypeName ?? ""),
    price: Number(o.price ?? o.Price ?? 0),
    visitorName: String(o.visitorName ?? o.VisitorName ?? ""),
    visitorEmail: (o.visitorEmail ?? o.VisitorEmail) as string | null | undefined,
    purchaseDate: String(o.purchaseDate ?? o.PurchaseDate ?? ""),
    validDate: (o.validDate ?? o.ValidDate) as string | null | undefined,
    usedAt: (o.usedAt ?? o.UsedAt) as string | null | undefined,
  };
}

export function validateTicket(
  ticketCode: string,
): Promise<ValidateTicketResponseDto> {
  return apiGet<unknown>(
    `/api/ticketing/validate/${encodeURIComponent(ticketCode.trim())}`,
  ).then(normalizeValidateTicket);
}

export function checkInTicket(
  payload: CheckInRequestDto,
): Promise<ValidateTicketResponseDto> {
  return apiPost<unknown>("/api/ticketing/check-in", payload).then(
    normalizeValidateTicket,
  );
}

