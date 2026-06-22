import type { Museum } from "@/types";
import type { CreateMuseumDto, MuseumDto } from "@/types/api";
import { safeFetch } from "@/lib/fetch-safe";
import { createMuseum, getMuseums as fetchMuseums } from "./admin-api.service";
function mapMuseumDto(dto: MuseumDto): Museum {
  return {
    id: dto.id,
    name: dto.name,
    location: dto.city ?? dto.address ?? "—",
    manager: "—",
    status: dto.status === "Inactive" ? "Inactive" : "Active",
  };
}

export async function getMuseums(): Promise<Museum[]> {
  return safeFetch(async () => {
    const museums = await fetchMuseums();
    return museums.map(mapMuseumDto);
  }, []);
}

export async function createMuseumEntry(payload: CreateMuseumDto) {
  const museum = await createMuseum(payload);
  return mapMuseumDto(museum);
}
