import { safeFetch } from "@/lib/fetch-safe";
import { fillMuseumLocationDefaults } from "@/lib/normalize-dto";
import type { MuseumDto, UpdateMuseumProfileDto } from "@/types/api";
import {
  getMuseumProfile as fetchMuseumProfile,
  updateMuseumProfile,
} from "@/services/admin/admin-api.service";

export async function getManagedMuseum(): Promise<MuseumDto | null> {
  return safeFetch(async () => {
    const museum = await fetchMuseumProfile();
    return fillMuseumLocationDefaults(museum);
  }, null);
}

/** @deprecated Prefer getManagedMuseum — single-museum model */
export async function getManagedMuseums(): Promise<MuseumDto[]> {
  const museum = await getManagedMuseum();
  return museum ? [museum] : [];
}

export async function saveMuseumProfile(payload: UpdateMuseumProfileDto) {
  return updateMuseumProfile(payload);
}
