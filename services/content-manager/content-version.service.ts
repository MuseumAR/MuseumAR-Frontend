import { createContentVersion } from "./content-api.service";
import { resolveActiveMuseumId } from "./museum-context";

export async function createVersionEntry(
  versionNumber: string,
  description: string,
  museumId?: number,
) {
  const id = museumId ?? (await resolveActiveMuseumId());
  if (id == null) {
    throw new Error("No museum available for content versioning.");
  }
  return createContentVersion(id, versionNumber, description);
}
