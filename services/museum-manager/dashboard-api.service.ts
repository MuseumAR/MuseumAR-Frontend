import { apiGet } from "@/services/api-client";
import type { MuseumDashboardDto } from "@/types/api";

export function getMuseumDashboard(museumId: number) {
  return apiGet<MuseumDashboardDto>(`/api/MuseumManager/dashboard/${museumId}`);
}
