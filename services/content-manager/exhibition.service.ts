import { safeFetch } from "@/lib/fetch-safe";
import type { CreateExhibitionDto, ExhibitionDto } from "@/types/api";
import {
  createExhibition,
  getExhibitionById as fetchExhibitionById,
  getExhibitions as fetchExhibitions,
} from "./content-api.service";
import { getStoredMuseumId } from "@/services/auth/resolve-museum-id";

export async function getExhibitionList(museumId?: number): Promise<ExhibitionDto[]> {
  return safeFetch(async () => {
    const id = museumId ?? (await getStoredMuseumId());
    if (id == null) return [];
    return fetchExhibitions(id);
  }, []);
}

export async function getExhibitionById(
  exhibitionId: number | string,
  museumId?: number,
): Promise<ExhibitionDto | null> {
  const id = Number(exhibitionId);
  if (Number.isNaN(id)) return null;

  return safeFetch(async () => {
    try {
      return await fetchExhibitionById(id);
    } catch {
      const mid = museumId ?? (await getStoredMuseumId());
      if (mid == null) return null;
      const list = await fetchExhibitions(mid);
      return list.find((item) => item.id === id) ?? null;
    }
  }, null);
}

export async function createExhibitionEntry(payload: CreateExhibitionDto) {
  return createExhibition(payload);
}
