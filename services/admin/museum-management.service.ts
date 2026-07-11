import { safeFetch } from "@/lib/fetch-safe";
import { repairMuseumText } from "@/lib/repair-text";
import type { MuseumDto } from "@/types/api";
import { getMuseumProfile as fetchMuseumProfile } from "./admin-api.service";

export async function getMuseumProfileEntry(): Promise<MuseumDto | null> {
  return safeFetch(async () => {
    const museum = await fetchMuseumProfile();
    return repairMuseumText(museum);
  }, null);
}

/** @deprecated Prefer getMuseumProfileEntry — single-museum model */
export async function getMuseumList(): Promise<MuseumDto[]> {
  const museum = await getMuseumProfileEntry();
  return museum ? [museum] : [];
}
