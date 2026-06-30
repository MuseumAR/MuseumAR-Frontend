import type {
  StandardTicketRow,
  ExhibitionTicketRow,
  TicketStatisticRow,
  TicketStats,
} from "@/lib/mock-data";
import {
  TICKET_STATS,
  STANDARD_TICKET_DATA,
  EXHIBITION_TICKET_DATA,
  TICKET_STATISTIC_DATA,
} from "@/lib/mock-data";
import { safeFetch } from "@/lib/fetch-safe";
import { getTicketStatistics } from "./ticket-api.service";

export async function getTicketStats(): Promise<TicketStats> {
  try {
    const data = await safeFetch(() => getTicketStatistics(), TICKET_STATS);
    return data || TICKET_STATS;
  } catch {
    return TICKET_STATS;
  }
}

export async function getStandardTickets(): Promise<StandardTicketRow[]> {
  return STANDARD_TICKET_DATA;
}

export async function getExhibitionTickets(): Promise<ExhibitionTicketRow[]> {
  return EXHIBITION_TICKET_DATA;
}

export async function getTicketStatisticRows(): Promise<TicketStatisticRow[]> {
  return TICKET_STATISTIC_DATA;
}

export async function getTicketRows(): Promise<
  (StandardTicketRow | ExhibitionTicketRow)[]
> {
  const [standard, exhibition] = await Promise.all([
    getStandardTickets(),
    getExhibitionTickets(),
  ]);
  return [...standard, ...exhibition];
}
