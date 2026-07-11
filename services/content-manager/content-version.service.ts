import type { ContentVersionDto } from "@/types/api";
import { createContentVersion } from "./content-api.service";

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

/** BE has POST only (no GET list). Returns created version id. */
export async function createVersionEntry(
  versionNumber: string,
  description: string,
): Promise<{ id: number; versionNumber: string; changeDescription: string }> {
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
}

export type CreatedVersionRow = Pick<
  ContentVersionDto,
  "id" | "versionNumber" | "changeDescription" | "status" | "createdAt"
>;
