import { safeFetch } from "@/lib/fetch-safe";
import { fillMuseumLocationDefaults } from "@/lib/normalize-dto";
import type { MuseumDto } from "@/types/api";
import { getMuseumProfile as fetchMuseumProfile } from "./admin-api.service";

export async function getMuseumProfileEntry(): Promise<MuseumDto | null> {
  return safeFetch(async () => {
    const museum = await fetchMuseumProfile();
    return fillMuseumLocationDefaults(museum);
  }, null);
}

/** @deprecated Prefer getMuseumProfileEntry — single-museum model */
export async function getMuseumList(): Promise<MuseumDto[]> {
  const museum = await getMuseumProfileEntry();
  return museum ? [museum] : [];
}
