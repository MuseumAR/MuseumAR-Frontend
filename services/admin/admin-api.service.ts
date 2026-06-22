import { apiGet, apiPost, apiPostAuth } from "@/services/api-client";
import type {
  CreateMuseumDto,
  CreateTicketTypeDto,
  MuseumDto,
  SystemConfigDto,
  TicketTypeDto,
  UpdateSystemConfigDto,
} from "@/types/api";

export function getMuseums() {
  return apiGet<MuseumDto[]>("/api/admin/museums");
}

export function createMuseum(payload: CreateMuseumDto) {
  return apiPost<MuseumDto>("/api/admin/museums", payload);
}

export function getTicketTypes() {
  return apiGet<TicketTypeDto[]>("/api/admin/ticket-types");
}

export function createTicketType(payload: CreateTicketTypeDto) {
  return apiPost<TicketTypeDto>("/api/admin/ticket-types", payload);
}

export function getSystemConfigs() {
  return apiGet<SystemConfigDto[]>("/api/admin/configs");
}

export function updateSystemConfig(key: string, payload: UpdateSystemConfigDto) {
  return apiPostAuth<SystemConfigDto>(
    `/api/admin/configs/${encodeURIComponent(key)}`,
    payload,
  );
}
