import type {
  TicketDetailDto,
  TicketDto,
  TicketTypeDto,
} from "@/types/api";

const STORAGE_KEY = "museumar.visitor.tickets.mock";
const DETAIL_KEY = "museumar.visitor.ticket-details.mock";

/** Demo catalog when public ticket-types API is empty / unavailable. */
export const DEMO_TICKET_TYPES: TicketTypeDto[] = [
  {
    id: 1,
    name: "Vé người lớn",
    price: 100000,
    description: "Vé tham quan tiêu chuẩn cho khách từ 16 tuổi trở lên.",
    museumId: 1,
    exhibitionId: null,
    status: "Active",
  },
  {
    id: 2,
    name: "Vé học sinh / sinh viên",
    price: 50000,
    description: "Áp dụng khi xuất trình thẻ học sinh, sinh viên.",
    museumId: 1,
    exhibitionId: null,
    status: "Active",
  },
  {
    id: 3,
    name: "Vé trẻ em",
    price: 30000,
    description: "Dành cho trẻ dưới 12 tuổi, đi cùng người lớn.",
    museumId: 1,
    exhibitionId: null,
    status: "Active",
  },
];

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function readMockTickets(): TicketDto[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as TicketDto[]) : [];
  } catch {
    return [];
  }
}

function writeMockTickets(tickets: TicketDto[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

function readMockDetails(): Record<string, TicketDetailDto> {
  if (!canUseStorage()) return {};
  try {
    const raw = window.localStorage.getItem(DETAIL_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, TicketDetailDto>;
  } catch {
    return {};
  }
}

function writeMockDetails(map: Record<string, TicketDetailDto>) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(DETAIL_KEY, JSON.stringify(map));
}

function buildDetail(input: {
  ticket: TicketDto;
  ticketType: TicketTypeDto;
  orderCode: string;
}): TicketDetailDto {
  const paidAt = input.ticket.purchaseDate;
  return {
    id: input.ticket.id,
    ticketCode: input.ticket.ticketCode,
    status: input.ticket.status,
    purchaseDate: input.ticket.purchaseDate,
    validDate: input.ticket.validDate ?? null,
    ticketType: {
      id: input.ticketType.id,
      name: input.ticketType.name,
      price: input.ticketType.price,
      description: input.ticketType.description ?? null,
    },
    museum: {
      id: input.ticketType.museumId || 1,
      name: "Bảo tàng Lịch sử TP.HCM",
      address: "2 Nguyễn Bỉnh Khiêm, Quận 1, TP.HCM",
    },
    exhibition: input.ticketType.exhibitionId
      ? {
          id: input.ticketType.exhibitionId,
          name: `Triển lãm #${input.ticketType.exhibitionId}`,
        }
      : {
          id: 1,
          name: "Hiện vật tiêu biểu",
        },
    order: {
      orderCode: input.orderCode,
      totalAmount: input.ticketType.price,
      currency: "VND",
      paymentStatus: "Completed",
      paymentMethod: "Mock / UI demo",
      paidAt,
    },
    qrCodeData: input.ticket.ticketCode,
    qrCodeImageUrl: null,
  };
}

/**
 * UI-only purchase — BE create-order currently maps JWT UserId → VisitorId (FK fail).
 * Store paid tickets locally so the visitor flow is demoable.
 */
export function mockPurchaseTickets(input: {
  ticketType: TicketTypeDto;
  quantity: number;
}): { orderCode: string; tickets: TicketDto[] } {
  const orderCode = `UI-${Date.now()}`;
  const now = new Date().toISOString();
  const created: TicketDto[] = Array.from({ length: input.quantity }, (_, i) => ({
    id: Date.now() + i,
    ticketCode: `${orderCode}-${String(i + 1).padStart(2, "0")}`,
    ticketTypeName: input.ticketType.name,
    purchaseDate: now,
    validDate: null,
    status: "Paid",
  }));

  const details = readMockDetails();
  for (const ticket of created) {
    details[String(ticket.id)] = buildDetail({
      ticket,
      ticketType: input.ticketType,
      orderCode,
    });
  }
  writeMockDetails(details);

  const next = [...created, ...readMockTickets()];
  writeMockTickets(next);
  return { orderCode, tickets: created };
}

/** Proposed TicketDetailDto shape — mock until GET /api/ticketing/my-tickets/{id} exists. */
export function getMockTicketDetail(id: number): TicketDetailDto | null {
  const fromMap = readMockDetails()[String(id)];
  if (fromMap) return fromMap;

  const ticket = readMockTickets().find((t) => t.id === id);
  if (!ticket) return null;

  const type =
    DEMO_TICKET_TYPES.find((t) => t.name === ticket.ticketTypeName) ??
    DEMO_TICKET_TYPES[0];

  return buildDetail({
    ticket,
    ticketType: type,
    orderCode: ticket.ticketCode.split("-").slice(0, 2).join("-") || ticket.ticketCode,
  });
}
