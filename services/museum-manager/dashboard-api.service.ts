import { apiGetAuth } from "@/services/api-client";
import type { MuseumDashboardDto } from "@/types/api";

export function getMuseumDashboard(accessToken?: string | null) {
  return apiGetAuth<MuseumDashboardDto>(
    "/api/MuseumManager/dashboard",
    accessToken,
  );
}
