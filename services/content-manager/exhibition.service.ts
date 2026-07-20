import { safeFetch } from "@/lib/fetch-safe";
import type { CreateExhibitionDto, ExhibitionDto } from "@/types/api";
import {
  createExhibition,
  getExhibitionById as fetchExhibitionById,
  getExhibitions as fetchExhibitions,
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

  return safeFetch(async () => {
    try {
      return await fetchExhibitionById(id);
    } catch {
      const list = await fetchExhibitions();
      return list.find((item) => item.id === id) ?? null;
    }
  }, null);
}

export async function createExhibitionEntry(payload: CreateExhibitionDto) {
  return createExhibition(payload);
}

export { uploadExhibitionImage, updateExhibition, deleteExhibition };
