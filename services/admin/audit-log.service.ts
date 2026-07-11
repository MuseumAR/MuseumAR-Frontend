import type { AuditLogDto, PagedAuditLogsDto } from "@/types/api";
import { getAuditLogs } from "./admin-api.service";

export type AuditLogQuery = {
  userId?: number;
  action?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function normalizeLog(raw: unknown): AuditLogDto {
  const o = asRecord(raw);
  return {
    id: Number(o.id ?? o.Id ?? 0),
    userId: (o.userId ?? o.UserId) as number | null | undefined,
    action: (o.action ?? o.Action) as string | null | undefined,
    entityType: (o.entityType ?? o.EntityType) as string | null | undefined,
    entityId: (o.entityId ?? o.EntityId) as number | null | undefined,
    oldValues: (o.oldValues ?? o.OldValues) as string | null | undefined,
    newValues: (o.newValues ?? o.NewValues) as string | null | undefined,
    ipAddress: (o.ipAddress ?? o.IpAddress) as string | null | undefined,
    userAgent: (o.userAgent ?? o.UserAgent) as string | null | undefined,
    createdAt: String(o.createdAt ?? o.CreatedAt ?? ""),
  };
}

function normalizePaged(raw: unknown): PagedAuditLogsDto {
  const o = asRecord(raw);
  const items = (o.items ?? o.Items ?? []) as unknown[];
  const pageSize = Number(o.pageSize ?? o.PageSize ?? 20);
  const totalItems = Number(o.totalItems ?? o.TotalItems ?? 0);
  return {
    totalItems,
    page: Number(o.page ?? o.Page ?? 1),
    pageSize,
    totalPages: Number(
      o.totalPages ?? o.TotalPages ?? Math.ceil(totalItems / Math.max(pageSize, 1)),
    ),
    items: items.map(normalizeLog),
  };
}

/** Fetches audit logs; throws on API failure (for client UI). */
export async function fetchAuditLogPage(
  params?: AuditLogQuery,
): Promise<PagedAuditLogsDto> {
  const data = await getAuditLogs({
    page: 1,
    pageSize: 20,
    ...params,
  });
  return normalizePaged(data);
}
