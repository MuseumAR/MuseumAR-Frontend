export type ArtifactRow = {
  id: number;
  name: string;
  view: number;
  audioPlay: number;
  qrScan: number;
  arUsage: number;
};

export const ARTIFACT_STATS = {
  arModelsAvailable: 0,
  totalArtifact: 0,
  visitorsScannedToday: 0,
};

export const ARTIFACT_TABLE_DATA: ArtifactRow[] = [
  {
    id: 1,
    name: "Ancient Egyptian Sarcophagus",
    view: 10000,
    audioPlay: 10000,
    qrScan: 10000,
    arUsage: 10000,
  },
  {
    id: 2,
    name: "The Sovereign's Whisper",
    view: 9000,
    audioPlay: 9000,
    qrScan: 9000,
    arUsage: 9000,
  },
  {
    id: 3,
    name: "The Celestial Compass",
    view: 8000,
    audioPlay: 8000,
    qrScan: 8000,
    arUsage: 8000,
  },
  {
    id: 4,
    name: "The Alchemist's Secret",
    view: 7000,
    audioPlay: 7000,
    qrScan: 7000,
    arUsage: 7000,
  },
  {
    id: 5,
    name: "The Oracle's Gaze",
    view: 6000,
    audioPlay: 6000,
    qrScan: 6000,
    arUsage: 6000,
  },
  {
    id: 6,
    name: "The Timekeeper's Legacy",
    view: 5000,
    audioPlay: 5000,
    qrScan: 5000,
    arUsage: 5000,
  },
  {
    id: 7,
    name: "The Guardian's Oath",
    view: 4000,
    audioPlay: 4000,
    qrScan: 4000,
    arUsage: 4000,
  },
  {
    id: 8,
    name: "The Dreamer's Canvas",
    view: 3000,
    audioPlay: 3000,
    qrScan: 3000,
    arUsage: 3000,
  },
  {
    id: 9,
    name: "The Philosopher's Stone",
    view: 2000,
    audioPlay: 2000,
    qrScan: 2000,
    arUsage: 2000,
  },
  {
    id: 10,
    name: "The Voyager's Map",
    view: 1000,
    audioPlay: 1000,
    qrScan: 1000,
    arUsage: 1000,
  },
];

// ─── Ticket Data ───────────────────────────────────────────────────────────
export type StandardTicketRow = {
  id: number;
  ticketName: string;
  visitorType: string;
  price: number;
  validFrom: string;
  validUntil: string;
  status: "Active" | "Inactive";
};

export type ExhibitionTicketRow = {
  id: number;
  ticketName: string;
  exhibitionId: number;
  price: number;
  maxTicket: number;
  maxQuantity: number;
  validFrom: string;
  validUntil: string;
  status: "Active" | "Inactive";
};

export type TicketStatisticRow = {
  childrenTicket: number;
  studentTicket: number;
  adultTicket: number;
  total: number;
  date: string;
};

export type TicketStats = {
  totalTicketsSold: number;
  activeTickets: number;
  inactiveTickets: number;
  totalRevenue: number;
};

export const TICKET_STATS: TicketStats = {
  totalTicketsSold: 3075,
  activeTickets: 8,
  inactiveTickets: 2,
  totalRevenue: 1250000,
};

export const STANDARD_TICKET_DATA: StandardTicketRow[] = [
  {
    id: 1,
    ticketName: "StdA13",
    visitorType: "Age 0-5, Age > 60, Disable",
    price: 0,
    validFrom: "2026-05-15",
    validUntil: "2026-05-16",
    status: "Active",
  },
  {
    id: 2,
    ticketName: "StdA12",
    visitorType: "Age 6-18",
    price: 50000,
    validFrom: "2026-05-15",
    validUntil: "2026-05-16",
    status: "Active",
  },
  {
    id: 3,
    ticketName: "StdA11",
    visitorType: "Age >18",
    price: 70000,
    validFrom: "2026-05-15",
    validUntil: "2026-05-16",
    status: "Active",
  },
  {
    id: 4,
    ticketName: "StdA10",
    visitorType: "Age >18",
    price: 70000,
    validFrom: "2026-05-13",
    validUntil: "2026-05-14",
    status: "Inactive",
  },
  {
    id: 5,
    ticketName: "StdA09",
    visitorType: "Age 6-18",
    price: 50000,
    validFrom: "2026-05-13",
    validUntil: "2026-05-14",
    status: "Inactive",
  },
];

export const EXHIBITION_TICKET_DATA: ExhibitionTicketRow[] = [
  {
    id: 11,
    ticketName: "ExhA3",
    exhibitionId: 1,
    price: 50000,
    maxTicket: 1,
    maxQuantity: 100,
    validFrom: "2026-05-15",
    validUntil: "2026-05-16",
    status: "Active",
  },
  {
    id: 21,
    ticketName: "ExhA2",
    exhibitionId: 2,
    price: 60000,
    maxTicket: 1,
    maxQuantity: 150,
    validFrom: "2026-05-15",
    validUntil: "2026-05-16",
    status: "Active",
  },
  {
    id: 31,
    ticketName: "ExhA1",
    exhibitionId: 3,
    price: 70000,
    maxTicket: 2,
    maxQuantity: 200,
    validFrom: "2026-05-13",
    validUntil: "2026-05-14",
    status: "Inactive",
  },
];

export const TICKET_STATISTIC_DATA: TicketStatisticRow[] = [
  {
    childrenTicket: 100,
    studentTicket: 125,
    adultTicket: 150,
    total: 375,
    date: "2026-05-15",
  },
  {
    childrenTicket: 200,
    studentTicket: 225,
    adultTicket: 250,
    total: 675,
    date: "2026-05-16",
  },
  {
    childrenTicket: 300,
    studentTicket: 325,
    adultTicket: 350,
    total: 975,
    date: "2026-05-17",
  },
  {
    childrenTicket: 400,
    studentTicket: 425,
    adultTicket: 450,
    total: 1275,
    date: "2026-05-18",
  },
  {
    childrenTicket: 500,
    studentTicket: 525,
    adultTicket: 550,
    total: 1575,
    date: "2026-05-19",
  },
  {
    childrenTicket: 600,
    studentTicket: 625,
    adultTicket: 650,
    total: 1875,
    date: "2026-05-20",
  },
  {
    childrenTicket: 700,
    studentTicket: 725,
    adultTicket: 750,
    total: 2175,
    date: "2026-05-21",
  },
  {
    childrenTicket: 800,
    studentTicket: 825,
    adultTicket: 850,
    total: 2475,
    date: "2026-05-22",
  },
  {
    childrenTicket: 900,
    studentTicket: 925,
    adultTicket: 950,
    total: 2775,
    date: "2026-05-23",
  },
  {
    childrenTicket: 1000,
    studentTicket: 1025,
    adultTicket: 1050,
    total: 3075,
    date: "2026-05-24",
  },
];
