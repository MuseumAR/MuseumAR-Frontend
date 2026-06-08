export const MUSEUM_MANAGER_STATS = {
  totalVisitor: 0,
  qrScansToday: 0,
  offlineDownloads: 0,
  averageListeningTime: 0,
};

export const POPULAR_EXHIBITS = [
  { name: "Ancient Egypt", value: 320, color: "#3b82f6" },
  { name: "War Memorial", value: 280, color: "#22c55e" },
  { name: "Cham Sculpture", value: 210, color: "#a855f7" },
  { name: "Ancient Pottery", value: 145, color: "#ec4899" },
] as const;

export const LANGUAGE_USAGE = [
  { name: "English", percent: 67, color: "#a855f7" },
  { name: "Vietnamese", percent: 33, color: "#22c55e" },
] as const;

export const VISITORS_TREND = [
  { day: "Mon", value: 180 },
  { day: "Tue", value: 260 },
  { day: "Wed", value: 340 },
  { day: "Thu", value: 410 },
  { day: "Fri", value: 370 },
  { day: "Sat", value: 520 },
] as const;
