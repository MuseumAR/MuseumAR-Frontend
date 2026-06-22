import type { MuseumProfile } from "@/types";
import { DEFAULT_MUSEUM_ID } from "@/lib/constants";
import { safeFetch } from "@/lib/fetch-safe";
import { getMuseums as fetchMuseums } from "@/services/admin/admin-api.service";

const EMPTY_PROFILE: MuseumProfile = {
  name: "—",
  address: "—",
  email: "—",
  phone: "—",
  openingHours: "—",
  closingHours: "—",
  image: null,
};

export async function getMuseumProfile(
  museumId = DEFAULT_MUSEUM_ID,
): Promise<MuseumProfile> {
  return safeFetch(async () => {
    const museums = await fetchMuseums();
    const museum = museums.find((item) => item.id === museumId) ?? museums[0];
    if (!museum) return EMPTY_PROFILE;

    return {
      name: museum.name,
      address: [museum.address, museum.city].filter(Boolean).join(", ") || "—",
      email: "—",
      phone: "—",
      openingHours: "—",
      closingHours: "—",
      image: museum.thumbnailUrl ?? null,
    };
  }, EMPTY_PROFILE);
}
