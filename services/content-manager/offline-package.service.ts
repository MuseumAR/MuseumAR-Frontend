import { safeFetch } from "@/lib/fetch-safe";
import type { CreateOfflinePackageDto, OfflinePackageDto } from "@/types/api";
import { generateOfflinePackage, getOfflinePackages } from "./content-api.service";
import { getStoredMuseumId } from "@/services/auth/resolve-museum-id";

export async function getPackageList(museumId?: number): Promise<OfflinePackageDto[]> {
  return safeFetch(async () => {
    const id = museumId ?? getStoredMuseumId();
    if (id == null) return [];
    return getOfflinePackages(id);
  }, []);
}

export async function generatePackageEntry(payload: CreateOfflinePackageDto) {
  return generateOfflinePackage(payload.museumId, payload);
}
