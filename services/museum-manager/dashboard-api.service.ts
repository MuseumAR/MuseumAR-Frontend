import { apiGet } from "@/services/api-client";
import type { MuseumDashboardDto } from "@/types/api";

export function getMuseumDashboard() {
  return apiGet<MuseumDashboardDto>("/api/MuseumManager/dashboard");
}
