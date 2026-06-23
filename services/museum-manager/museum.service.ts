import { safeFetch } from "@/lib/fetch-safe";
import { repairMuseumText } from "@/lib/repair-text";
import type { CreateMuseumDto, MuseumDto } from "@/types/api";
import { createMuseum, getMuseums } from "@/services/admin/admin-api.service";

export async function getManagedMuseums(): Promise<MuseumDto[]> {
  return safeFetch(async () => {
    const museums = await getMuseums();
    return museums.map(repairMuseumText);
  }, []);
}

export async function resolveActiveMuseumId(): Promise<number | null> {
  const museums = await getManagedMuseums();
  return museums[0]?.id ?? null;
}

/** Museum Manager registers a museum. */
export async function registerMuseum(payload: CreateMuseumDto) {
  return createMuseum(payload);
}
