import type { MuseumProfile } from "@/types";
import { safeFetch } from "@/lib/fetch-safe";
import { getManagedMuseums } from "./museum.service";

export async function getMuseumProfile(): Promise<MuseumProfile | null> {
  return safeFetch(async () => {
    const museums = await getManagedMuseums();
    const museum = museums[0];
    if (!museum) return null;

    return {
      name: museum.name,
      address: [museum.address, museum.city].filter(Boolean).join(", ") || "—",
      email: "—",
      phone: "—",
      openingHours: "—",
      closingHours: "—",
      image: museum.thumbnailUrl ?? null,
    };
  }, null);
}
