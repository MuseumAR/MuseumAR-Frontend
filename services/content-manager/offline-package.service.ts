import { safeFetch } from "@/lib/fetch-safe";
import type { CreateOfflinePackageDto, OfflinePackageDto } from "@/types/api";
import { generateOfflinePackage, getOfflinePackages } from "./content-api.service";

export async function getPackageList(): Promise<OfflinePackageDto[]> {
  return safeFetch(() => getOfflinePackages(), []);
}

export async function generatePackageEntry(payload: CreateOfflinePackageDto) {
  return generateOfflinePackage(payload);
}
