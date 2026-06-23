import { safeFetch } from "@/lib/fetch-safe";
import type { CreateOfflinePackageDto, OfflinePackageDto } from "@/types/api";
import { generateOfflinePackage, getOfflinePackages } from "./content-api.service";
import { resolveActiveMuseumId } from "./museum-context";

export async function getPackageList(museumId?: number): Promise<OfflinePackageDto[]> {
  return safeFetch(async () => {
    const id = museumId ?? (await resolveActiveMuseumId());
    if (id == null) return [];
    return getOfflinePackages(id);
  }, []);
}

export async function generatePackageEntry(payload: CreateOfflinePackageDto) {
  return generateOfflinePackage(payload.museumId, payload);
}
