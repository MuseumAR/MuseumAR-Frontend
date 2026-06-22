import type { Exhibition } from "@/types";
import type { CreateExhibitionDto, ExhibitionDto } from "@/types/api";
import { DEFAULT_MUSEUM_ID } from "@/lib/constants";
import { safeFetch } from "@/lib/fetch-safe";
import { createExhibition, getExhibitions as fetchExhibitions } from "./content-api.service";
function mapExhibitionDto(dto: ExhibitionDto): Exhibition {
  return {
    id: dto.id,
    name: `Exhibition ${dto.id}`,
    artifacts: 0,
    visitors: 0,
    status:
      dto.status === "Active"
        ? "Active"
        : dto.status === "Upcoming"
          ? "Upcoming"
          : "Closed",
  };
}

export async function getExhibitions(museumId = DEFAULT_MUSEUM_ID): Promise<Exhibition[]> {
  return safeFetch(async () => {
    const exhibitions = await fetchExhibitions(museumId);
    return exhibitions.map(mapExhibitionDto);
  }, []);
}

export { createExhibition };
export type { CreateExhibitionDto };
