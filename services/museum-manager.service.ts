import type { LanguageUsage, MuseumManagerStats, PopularExhibit, VisitorTrend } from "@/types";

const MOCK_STATS: MuseumManagerStats = {
  totalVisitor: 0,
  qrScansToday: 0,
  offlineDownloads: 0,
  averageListeningTime: 0,
};

const MOCK_POPULAR_EXHIBITS: PopularExhibit[] = [
  { name: "Ancient Egypt", value: 320, color: "#3b82f6" },
  { name: "War Memorial", value: 280, color: "#22c55e" },
  { name: "Cham Sculpture", value: 210, color: "#a855f7" },
  { name: "Ancient Pottery", value: 145, color: "#ec4899" },
];

const MOCK_LANGUAGE_USAGE: LanguageUsage[] = [
  { name: "English", percent: 67, color: "#a855f7" },
  { name: "Vietnamese", percent: 33, color: "#22c55e" },
];

const MOCK_VISITORS_TREND: VisitorTrend[] = [
  { day: "Mon", value: 180 },
  { day: "Tue", value: 260 },
  { day: "Wed", value: 340 },
  { day: "Thu", value: 410 },
  { day: "Fri", value: 370 },
  { day: "Sat", value: 520 },
];

export async function getMuseumManagerStats(): Promise<MuseumManagerStats> {
  // TODO: replace with real API call
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/museum-manager/stats`);
  // return res.json();
  return MOCK_STATS;
}

export async function getPopularExhibits(): Promise<PopularExhibit[]> {
  // TODO: replace with real API call
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/museum-manager/popular-exhibits`);
  // return res.json();
  return MOCK_POPULAR_EXHIBITS;
}

export async function getLanguageUsage(): Promise<LanguageUsage[]> {
  // TODO: replace with real API call
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/museum-manager/language-usage`);
  // return res.json();
  return MOCK_LANGUAGE_USAGE;
}

export async function getVisitorsTrend(): Promise<VisitorTrend[]> {
  // TODO: replace with real API call
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/museum-manager/visitors-trend`);
  // return res.json();
  return MOCK_VISITORS_TREND;
}
