import { safeFetch } from "@/lib/fetch-safe";
import type { CreateExhibitionDto, ExhibitionDto } from "@/types/api";
import { createExhibition, getExhibitions as fetchExhibitions } from "./content-api.service";
import { resolveActiveMuseumId } from "./museum-context";

export async function getExhibitionList(museumId?: number): Promise<ExhibitionDto[]> {
  return safeFetch(async () => {
    const id = museumId ?? (await resolveActiveMuseumId());
    if (id == null) return [];
    return fetchExhibitions(id);
  }, []);
}

export async function createExhibitionEntry(payload: CreateExhibitionDto) {
  return createExhibition(payload);
}
