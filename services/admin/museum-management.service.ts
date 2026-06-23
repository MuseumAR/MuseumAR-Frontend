import { safeFetch } from "@/lib/fetch-safe";
import { repairMuseumText } from "@/lib/repair-text";
import type { MuseumDto } from "@/types/api";
import { getMuseums as fetchMuseums } from "./admin-api.service";

export async function getMuseumList(): Promise<MuseumDto[]> {
  return safeFetch(async () => {
    const museums = await fetchMuseums();
    return museums.map(repairMuseumText);
  }, []);
}
