import { apiGet, apiPost, apiPutAuth, apiDeleteAuth } from "@/services/api-client";

export interface TicketDto {
  id: number;
  ticketName: string;
  ticketType: "standard" | "exhibition";
  price: number;
  status: "Active" | "Inactive";
  validFrom: string;
  validUntil: string;
  description?: string;
}

export interface CreateTicketDto {
  ticketName: string;
  ticketType: "standard" | "exhibition";
  price: number;
  status: "Active" | "Inactive";
  validFrom: string;
  validUntil: string;
  description?: string;
}

const DEFAULT_MUSEUM_ID = 1;

export function getTickets(museumId: number = DEFAULT_MUSEUM_ID) {
  return apiGet<TicketDto[]>(`/api/ticketing/museums/${museumId}/tickets`);
}

export function getTicketById(id: number) {
  return apiGet<TicketDto>(`/api/ticketing/tickets/${id}`);
}

export function createTicket(payload: CreateTicketDto) {
  return apiPost<TicketDto>("/api/ticketing/tickets", payload);
}

export function updateTicket(id: number, payload: CreateTicketDto) {
  return apiPutAuth<TicketDto>(`/api/ticketing/tickets/${id}`, payload);
}

export function deleteTicket(id: number) {
  return apiDeleteAuth<null>(`/api/ticketing/tickets/${id}`);
}

export function getTicketStatistics(museumId: number = DEFAULT_MUSEUM_ID) {
  return apiGet<any>(`/api/ticketing/museums/${museumId}/statistics`);
}
