import { apiDeleteAuth, apiGet, apiGetAuth, apiPostAuth, apiPutAuth, apiPostFormAuth } from "@/services/api-client";
import { normalizeMuseumDto, normalizeTicketTypeDto } from "@/lib/normalize-dto";
import type {
  CreateTicketTypeDto,
  CreateUserDto,
  MuseumDto,
  PagedAuditLogsDto,
  SystemConfigDto,
  TicketTypeDto,
  UpdateMuseumProfileDto,
  UpdateSystemConfigDto,
  UpdateUserDto,
  UserResponseDto,
} from "@/types/api";

export function getMuseumProfile() {
  return apiGet<unknown>("/api/admin/museum-profile").then(normalizeMuseumDto);
}

export function updateMuseumProfile(payload: UpdateMuseumProfileDto) {
  return apiPutAuth<unknown>("/api/admin/museum-profile", payload).then(
    normalizeMuseumDto,
  );
}

export function getTicketTypes() {
  return apiGet<unknown[]>("/api/admin/ticket-types").then((data) =>
    (Array.isArray(data) ? data : []).map(normalizeTicketTypeDto),
  );
}

export function createTicketType(payload: CreateTicketTypeDto) {
  return apiPostAuth<unknown>("/api/admin/ticket-types", payload).then(
    normalizeTicketTypeDto,
  );
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

export function getUsers(
  params?: { role?: string; status?: string; search?: string },
  accessToken?: string | null,
) {
  const query = new URLSearchParams();
  if (params?.role) query.set("role", params.role);
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  return apiGetAuth<UserResponseDto[]>(
    `/api/admin/users${qs ? `?${qs}` : ""}`,
    accessToken,
  );
}

export function getUserById(id: number, accessToken?: string | null) {
  return apiGetAuth<UserResponseDto>(`/api/admin/users/${id}`, accessToken);
}

export function createUser(payload: CreateUserDto) {
  return apiPostAuth<UserResponseDto>("/api/admin/users", payload);
}

export function updateUser(id: number, payload: UpdateUserDto) {
  return apiPutAuth<UserResponseDto>(`/api/admin/users/${id}`, payload);
}

export function deleteUser(id: number) {
  return apiDeleteAuth<null>(`/api/admin/users/${id}`);
}

export function getAuditLogs(params?: {
  userId?: number;
  action?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}) {
  const query = new URLSearchParams();
  if (params?.userId != null) query.set("userId", String(params.userId));
  if (params?.action) query.set("action", params.action);
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  if (params?.page != null) query.set("page", String(params.page));
  if (params?.pageSize != null) query.set("pageSize", String(params.pageSize));
  const qs = query.toString();
  return apiGetAuth<PagedAuditLogsDto>(`/api/admin/audit-logs${qs ? `?${qs}` : ""}`);
}

export function uploadMuseumImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiPostFormAuth<string>("/api/admin/museum-profile/upload-image", formData);
}

