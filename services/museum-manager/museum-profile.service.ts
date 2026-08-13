import type { MuseumProfile } from "@/types";
import { safeFetch } from "@/lib/fetch-safe";
import { getManagedMuseum, saveMuseumProfile } from "./museum.service";
import type { UpdateMuseumProfileDto } from "@/types/api";

function parseOpeningHours(openingHours?: string | null): {
  opening: string;
  closing: string;
} {
  if (!openingHours || openingHours === "—") {
    return { opening: "—", closing: "—" };
  }
  const parts = openingHours.split(/\s*[-–]\s*/);
  if (parts.length >= 2) {
    return { opening: parts[0].trim() || "—", closing: parts[1].trim() || "—" };
  }
  return { opening: openingHours, closing: "—" };
}

export async function getMuseumProfile(): Promise<MuseumProfile | null> {
  return safeFetch(async () => {
    const museum = await getManagedMuseum();
    if (!museum) return null;

    const hours = parseOpeningHours(museum.openingHours);

    return {
      name: museum.name,
      nameEn: museum.nameEn?.trim() || "",
      address: [museum.address, museum.city].filter(Boolean).join(", ") || "—",
      addressEn: museum.addressEn?.trim() || "",
      email: museum.contactEmail?.trim() || "—",
      phone: museum.contactPhone?.trim() || "—",
      openingHours: hours.opening,
      closingHours: hours.closing,
      openingHoursEn: museum.openingHoursEn?.trim() || "",
      image: museum.thumbnailUrl ?? null,
      description: museum.description?.trim() || "",
      descriptionEn: museum.descriptionEn?.trim() || "",
    };
  }, null);
}

export async function updateMuseumProfileEntry(payload: UpdateMuseumProfileDto) {
  return saveMuseumProfile(payload);
}
