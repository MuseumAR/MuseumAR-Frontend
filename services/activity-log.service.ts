import type { ActivityLog } from "@/types";

const MOCK_LOGS: ActivityLog[] = [
  { id: 1, user: "Nguyen Van Anh", action: "Updated artifact: Ancient Egyptian Sarcophagus", time: "2026-05-19 14:32" },
  { id: 2, user: "Tran Thi Bang", action: "Created new exhibition: Echoes of Antiquity", time: "2026-05-19 11:15" },
  { id: 3, user: "Le Hoang Cuong", action: "Deactivated user: Do Thuy Phong", time: "2026-05-18 09:40" },
  { id: 4, user: "Pham Minh Duc", action: "Approved museum application: #APP-042", time: "2026-05-17 16:00" },
  { id: 5, user: "Nguyen Van Anh", action: "Logged in", time: "2026-05-17 08:01" },
];

export async function getActivityLogs(): Promise<ActivityLog[]> {
  // TODO: replace with real API call
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/activity-logs`, { cache: "no-store" });
  // return res.json();
  return MOCK_LOGS;
}
