import { apiGetAuth } from "@/services/api-client";
import { normalizeMuseumDashboardDto } from "@/lib/normalize-dto";
import type { MuseumDashboardDto } from "@/types/api";

export function getMuseumDashboard(accessToken?: string | null) {
  return apiGetAuth<unknown>("/api/MuseumManager/dashboard", accessToken).then(
    normalizeMuseumDashboardDto,
  );
}
