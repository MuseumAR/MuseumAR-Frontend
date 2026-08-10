import { safeFetch } from "@/lib/fetch-safe";
import type { CreateExhibitionDto, ExhibitionDto, ExhibitDto } from "@/types/api";
import {
  assignExhibitsToExhibition,
  createExhibition,
  getExhibitionExhibits,
  getExhibitions as fetchExhibitions,
  removeExhibitFromExhibition,
  uploadExhibitionImage,
  updateExhibition,
  deleteExhibition,
} from "./content-api.service";

export async function getExhibitionList(): Promise<ExhibitionDto[]> {
  return safeFetch(() => fetchExhibitions(), []);
}

export async function getExhibitionById(
  exhibitionId: number | string,
): Promise<ExhibitionDto | null> {
  const id = Number(exhibitionId);
  if (Number.isNaN(id)) return null;

  // BE has no GET /exhibitions/{id} — resolve from list
  return safeFetch(async () => {
    const list = await fetchExhibitions();
    return list.find((item) => item.id === id) ?? null;
  }, null);
}

export async function createExhibitionEntry(payload: CreateExhibitionDto) {
  return createExhibition(payload);
}

export async function getExhibitionExhibitList(
  exhibitionId: number,
): Promise<ExhibitDto[]> {
  return safeFetch(() => getExhibitionExhibits(exhibitionId), []);
}

export async function assignExhibitsToExhibitionEntry(
  exhibitionId: number,
  exhibitIds: number[],
) {
  return assignExhibitsToExhibition(exhibitionId, exhibitIds);
}

export async function removeExhibitFromExhibitionEntry(
  exhibitionId: number,
  exhibitId: number,
) {
  return removeExhibitFromExhibition(exhibitionId, exhibitId);
}

export {
  uploadExhibitionImage,
  updateExhibition,
  deleteExhibition,
  getExhibitionExhibits,
  assignExhibitsToExhibition,
  removeExhibitFromExhibition,
};
