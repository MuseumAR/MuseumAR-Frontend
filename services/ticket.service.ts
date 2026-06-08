import type { Ticket } from "@/types";

const MOCK_TICKETS: Ticket[] = [
  { id: "TK-101", type: "General Admission", price: "$12", status: "Active" },
  { id: "TK-102", type: "Student", price: "$6", status: "Active" },
  { id: "TK-103", type: "AR Experience Bundle", price: "$18", status: "Draft" },
];

export async function getTickets(): Promise<Ticket[]> {
  // TODO: replace with real API call
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets`);
  // return res.json();
  return MOCK_TICKETS;
}
