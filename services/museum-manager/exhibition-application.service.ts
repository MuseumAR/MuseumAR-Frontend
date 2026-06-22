import type { ExhibitionApplication } from "@/types";

const MOCK_EXHIBITION_APPLICATIONS: ExhibitionApplication[] = [
  {
    id: "EX-001",
    title: "Ancient Egyptian Sarcophagus",
    exhibitionType: "Historical Collection",
    dateStart: "30-5-2026",
    dateEnd: "31-5-2026",
    openingHours: "8:00",
    closingHours: "17:00",
    contactEmail: "JackClayton@gmail.com",
    description:
      "An ancient Egyptian sarcophagus used for burial practices among nobles and high-ranking individuals.",
    image: null,
    submitted: "2026-05-28",
    status: "Pending",
  },
];

export async function getExhibitionApplications(): Promise<ExhibitionApplication[]> {
  return MOCK_EXHIBITION_APPLICATIONS;
}

export async function getExhibitionApplicationById(
  id: string,
): Promise<ExhibitionApplication | null> {
  return MOCK_EXHIBITION_APPLICATIONS.find((item) => item.id === id) ?? null;
}
