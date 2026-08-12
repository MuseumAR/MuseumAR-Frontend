import { getDisplayError } from "@/lib/validation";
import type { ContentVersionDto } from "@/types/api";
import { createContentVersion, getContentVersions } from "./content-api.service";

export type VersionListResult = {
  versions: ContentVersionDto[];
  loadError: string | null;
};

function normalizeVersion(raw: unknown): ContentVersionDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = Number(o.id ?? o.Id ?? 0);
  if (!id) return null;
  return {
    id,
    museumId: Number(o.museumId ?? o.MuseumId ?? 0),
    versionNumber: String(o.versionNumber ?? o.VersionNumber ?? ""),
    changeDescription: (o.changeDescription ??
      o.ChangeDescription ??
      null) as string | null,
    status: String(o.status ?? o.Status ?? "Draft"),
    createdAt: String(o.createdAt ?? o.CreatedAt ?? ""),
  };
}

export async function getVersionList(): Promise<VersionListResult> {
  try {
    const data = await getContentVersions();
    const list = Array.isArray(data) ? data : [];
    return {
      versions: list
        .map(normalizeVersion)
        .filter((v): v is ContentVersionDto => v != null)
        .sort((a, b) => b.id - a.id),
      loadError: null,
    };
  } catch (error) {
    return {
      versions: [],
      loadError: getDisplayError(
        error,
        "Unable to load content versions. Check that the API is running.",
      ),
    };
  }
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    const nested = o.id ?? o.Id ?? o.data ?? o.Data;
    if (nested !== value) return asNumber(nested);
  }
  return null;
}

/** Creates a content version snapshot. Returns created version id. */
export async function createVersionEntry(
  versionNumber: string,
  description: string,
): Promise<{ id: number; versionNumber: string; changeDescription: string }> {
  try {
    const raw = await createContentVersion(versionNumber, description);
    const id = asNumber(raw);
    if (id == null) {
      throw new Error("Version created but id was not returned.");
    }
    return {
      id,
      versionNumber,
      changeDescription: description,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (/UQ_ContentVersion|duplicate key|UNIQUE KEY/i.test(msg)) {
      throw new Error(
        `Version "${versionNumber}" already exists. Use a new number (e.g. v1.0.1).`,
      );
    }
    throw error;
  }
}

export type CreatedVersionRow = Pick<
  ContentVersionDto,
  "id" | "versionNumber" | "changeDescription" | "status" | "createdAt"
>;
