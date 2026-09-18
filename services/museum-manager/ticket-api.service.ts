import { apiGetAuth, apiPostAuth, apiPutAuth, apiDeleteAuth } from "@/services/api-client";
import { normalizeTicketTypeDto } from "@/lib/normalize-dto";
import type {
  CreateTicketTypeDto,
  UpdateTicketTypeDto,
  CreateTicketPromotionDto,
  UpdateTicketPromotionDto,
  TicketTypeDto,
  TicketPromotionDto,
  TicketRefundRequestDto,
  ProcessTicketRefundRequestDto,
  RevenueAnalyticsDto,
  VisitorTrafficDto,
} from "@/types/api";

export function getManagerTicketTypes(accessToken?: string | null) {
  return apiGetAuth<unknown[]>("/api/MuseumManager/ticket-types", accessToken).then((data) =>
    (Array.isArray(data) ? data : []).map(normalizeTicketTypeDto),
  );
}

export function createManagerTicketType(payload: CreateTicketTypeDto, accessToken?: string | null) {
  return apiPostAuth<unknown>("/api/MuseumManager/ticket-types", payload, accessToken).then(
    normalizeTicketTypeDto,
  );
}

export function publishManagerTicketType(id: number, accessToken?: string | null) {
  return apiPutAuth<unknown>(`/api/MuseumManager/ticket-types/${id}/publish`, {}, accessToken);
}

export function getManagerTicketTypeDetail(id: number, accessToken?: string | null) {
  return apiGetAuth<unknown>(`/api/MuseumManager/ticket-types/${id}`, accessToken).then(
    normalizeTicketTypeDto,
  );
}

export function updateManagerTicketType(
  id: number,
  payload: UpdateTicketTypeDto,
  accessToken?: string | null,
) {
  return apiPutAuth<unknown>(`/api/MuseumManager/ticket-types/${id}`, payload, accessToken).then(
    normalizeTicketTypeDto,
  );
}

export function deleteManagerTicketType(id: number, accessToken?: string | null) {
  return apiDeleteAuth<unknown>(`/api/MuseumManager/ticket-types/${id}`, accessToken);
}

// ═══ PROMOTION API ═══

export function getManagerTicketPromotions(ticketTypeId: number, accessToken?: string | null) {
  return apiGetAuth<TicketPromotionDto[]>(
    `/api/MuseumManager/ticket-types/${ticketTypeId}/promotions`,
    accessToken,
  ).then((data) => (Array.isArray(data) ? data : []));
}

export function createManagerTicketPromotion(
  ticketTypeId: number,
  payload: CreateTicketPromotionDto,
  accessToken?: string | null,
) {
  return apiPostAuth<TicketPromotionDto>(
    `/api/MuseumManager/ticket-types/${ticketTypeId}/promotions`,
    payload,
    accessToken,
  );
}

export function getManagerTicketPromotionDetail(
  promotionId: number,
  accessToken?: string | null,
) {
  return apiGetAuth<TicketPromotionDto>(
    `/api/MuseumManager/promotions/${promotionId}`,
    accessToken,
  );
}

export function updateManagerTicketPromotion(
  promotionId: number,
  payload: UpdateTicketPromotionDto,
  accessToken?: string | null,
) {
  return apiPutAuth<TicketPromotionDto>(
    `/api/MuseumManager/promotions/${promotionId}`,
    payload,
    accessToken,
  );
}

export function deleteManagerTicketPromotion(
  promotionId: number,
  accessToken?: string | null,
) {
  return apiDeleteAuth<unknown>(
    `/api/MuseumManager/promotions/${promotionId}`,
    accessToken,
  );
}

export function toggleManagerTicketPromotion(
  promotionId: number,
  isActive: boolean,
  accessToken?: string | null,
) {
  return apiPutAuth<unknown>(
    `/api/MuseumManager/promotions/${promotionId}/toggle?isActive=${isActive}`,
    {},
    accessToken,
  );
}

// ═══ REFUND REQUESTS API ═══

export function getManagerRefundRequests(status?: string, accessToken?: string | null) {
  const query = status && status !== "All" ? `?status=${encodeURIComponent(status)}` : "";
  return apiGetAuth<TicketRefundRequestDto[]>(
    `/api/MuseumManager/refund-requests${query}`,
    accessToken,
  ).then((data) => (Array.isArray(data) ? data : []));
}

export function processManagerRefundRequest(
  id: number,
  payload: ProcessTicketRefundRequestDto,
  accessToken?: string | null,
) {
  return apiPutAuth<unknown>(
    `/api/MuseumManager/refund-requests/${id}/process`,
    payload,
    accessToken,
  );
}

// ═══ REVENUE & TRAFFIC ANALYTICS API ═══

export function getManagerRevenueAnalytics(
  fromDate?: string,
  toDate?: string,
  accessToken?: string | null,
) {
  const params = new URLSearchParams();
  if (fromDate) params.append("fromDate", fromDate);
  if (toDate) params.append("toDate", toDate);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiGetAuth<RevenueAnalyticsDto>(
    `/api/MuseumManager/analytics/revenue${query}`,
    accessToken,
  );
}

export function getManagerVisitorTrafficAnalytics(
  fromDate?: string,
  toDate?: string,
  accessToken?: string | null,
) {
  const params = new URLSearchParams();
  if (fromDate) params.append("fromDate", fromDate);
  if (toDate) params.append("toDate", toDate);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiGetAuth<VisitorTrafficDto>(
    `/api/MuseumManager/analytics/traffic${query}`,
    accessToken,
  );
}

