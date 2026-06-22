import type { MuseumApplication } from "@/types";

const MOCK_APPLICATIONS: MuseumApplication[] = [
  { id: "APP-041", museum: "Hanoi Heritage Museum", submitted: "2026-05-10", status: "Pending" },
  { id: "APP-042", museum: "Da Nang Art Museum", submitted: "2026-05-08", status: "Approved" },
  { id: "APP-043", museum: "Hue Royal Antiquities", submitted: "2026-04-30", status: "Approved" },
  { id: "APP-044", museum: "HCMC History Museum", submitted: "2026-04-22", status: "Rejected" },
];

export async function getMuseumApplications(): Promise<MuseumApplication[]> {
  return MOCK_APPLICATIONS;
}
