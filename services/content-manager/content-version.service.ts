import { safeFetch } from "@/lib/fetch-safe";
import type { ContentVersionDto } from "@/types/api";
import {
  createContentVersion,
  getContentVersions,
} from "./content-api.service";
import { getStoredMuseumId } from "@/services/auth/resolve-museum-id";

export async function getVersionList(
  museumId?: number,
): Promise<ContentVersionDto[]> {
  return safeFetch(async () => {
    const id = museumId ?? getStoredMuseumId();
    if (id == null) return [];
    return getContentVersions(id);
  }, []);
}

export async function createVersionEntry(
  versionNumber: string,
  description: string,
  museumId?: number,
) {
  const id = museumId ?? getStoredMuseumId();
  if (id == null) {
    throw new Error("No museum available for content versioning.");
  }
  return createContentVersion(id, versionNumber, description);
}
