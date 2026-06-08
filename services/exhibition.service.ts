import type { Exhibition, ExhibitionApplication } from "@/types";

const MOCK_EXHIBITIONS: Exhibition[] = [
  { id: 1, name: "Echoes of Antiquity", artifacts: 24, visitors: 1280, status: "Active" },
  { id: 2, name: "Royal Treasures", artifacts: 18, visitors: 940, status: "Active" },
  { id: 3, name: "Future Relics", artifacts: 12, visitors: 0, status: "Upcoming" },
];

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
      "An ancient Egyptian sarcophagus used for burial practices among nobles and high-ranking individuals. Decorated with symbolic carvings and inscriptions, it reflects beliefs about the afterlife and spiritual protection in ancient Egyptian culture.",
    image: null,
    submitted: "2026-05-28",
    status: "Pending",
  },
  {
    id: "EX-002",
    title: "Silent Horizons: Antarctica Unveiled",
    exhibitionType: "Landscape Photography",
    dateStart: "01-10-2026",
    dateEnd: "15-10-2026",
    openingHours: "08:30",
    closingHours: "17:30",
    contactEmail: "events@horizon-gallery.com",
    description:
      "A stunning photography exhibition capturing the raw and pristine landscapes of Antarctica. Through breathtaking images, visitors are transported to the world's last true wilderness.",
    image: null,
    submitted: "2026-05-20",
    status: "Pending",
  },
  {
    id: "EX-003",
    title: "Future Relics",
    exhibitionType: "Contemporary Art",
    dateStart: "01-07-2026",
    dateEnd: "30-07-2026",
    openingHours: "09:00",
    closingHours: "18:00",
    contactEmail: "info@futurerelics.art",
    description:
      "An exploration of how modern objects will be perceived by future archaeologists. Artists reimagine everyday items as sacred artifacts of a bygone civilization.",
    image: null,
    submitted: "2026-05-15",
    status: "Rejected",
  },
];

export async function getExhibitions(): Promise<Exhibition[]> {
  // TODO: replace with real API call
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exhibitions`);
  // return res.json();
  return MOCK_EXHIBITIONS;
}

export async function getExhibitionApplications(): Promise<ExhibitionApplication[]> {
  // TODO: replace with real API call
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exhibition-applications`);
  // return res.json();
  return MOCK_EXHIBITION_APPLICATIONS;
}

export async function getExhibitionApplicationById(
  id: string
): Promise<ExhibitionApplication | null> {
  // TODO: replace with real API call
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exhibition-applications/${id}`);
  // return res.json();
  return MOCK_EXHIBITION_APPLICATIONS.find((e) => e.id === id) ?? null;
}
