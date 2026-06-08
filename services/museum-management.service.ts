import type { Museum } from "@/types";

const MOCK_MUSEUMS: Museum[] = [
  { id: 1, name: "National History Museum", location: "Hanoi", manager: "Vo Van Long", status: "Active" },
  { id: 2, name: "Da Nang Art Museum", location: "Da Nang", manager: "Tran Thi Bang", status: "Active" },
  { id: 3, name: "Hue Royal Antiquities", location: "Hue", manager: "Le Hoang Cuong", status: "Active" },
  { id: 4, name: "HCMC History Museum", location: "Ho Chi Minh City", manager: "—", status: "Inactive" },
];

export async function getMuseums(): Promise<Museum[]> {
  // TODO: replace with real API call
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/museums`);
  // return res.json();
  return MOCK_MUSEUMS;
}
