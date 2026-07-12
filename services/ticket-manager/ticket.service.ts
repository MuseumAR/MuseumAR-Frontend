import type { TicketStatisticRow, TicketStats } from "@/lib/mock-data";
import { TICKET_STATS, TICKET_STATISTIC_DATA } from "@/lib/mock-data";
import { getTicketTypeList } from "@/services/admin";
import type { TicketTypeDto } from "@/types/api";

/** Ticket list — backed by the real /api/admin/ticket-types endpoint. */
export async function getTicketTypeRows(): Promise<TicketTypeDto[]> {
  return getTicketTypeList();
}

// Statistics / overview remain on seeded sample data — no BE endpoint yet.
export async function getTicketStats(): Promise<TicketStats> {
  return TICKET_STATS;
}

export async function getTicketStatisticRows(): Promise<TicketStatisticRow[]> {
  return TICKET_STATISTIC_DATA;
}
