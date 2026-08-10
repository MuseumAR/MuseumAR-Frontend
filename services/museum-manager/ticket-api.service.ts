import { apiGetAuth, apiPostAuth, apiPutAuth } from "@/services/api-client";
import { normalizeTicketTypeDto } from "@/lib/normalize-dto";
import type { CreateTicketTypeDto } from "@/types/api";

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
