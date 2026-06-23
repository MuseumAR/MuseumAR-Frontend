import type { ExhibitDto, CreateExhibitDto } from "@/types/api";
import type { Artifact } from "@/types";
import { safeFetch } from "@/lib/fetch-safe";
import {
  createExhibit,
  deleteExhibit,
  getExhibitById as fetchExhibitById,
  getExhibits,
  publishExhibit,
  unpublishExhibit,
  updateExhibit,
} from "./content-api.service";
import { resolveActiveMuseumId } from "./museum-context";

function getPrimaryTranslation(exhibit: ExhibitDto) {
  return exhibit.translations[0];
}

function mapExhibitStatus(status: string): Artifact["status"] {
  if (status === "Published") return "Published";
  if (status === "Draft") return "Draft";
  return "Pending";
}

function mapExhibitToArtifact(exhibit: ExhibitDto): Artifact {
  const translation = getPrimaryTranslation(exhibit);

  return {
    id: exhibit.exhibitCode ?? `EX-${exhibit.id}`,
    exhibitId: exhibit.id,
    name: translation?.title ?? `Exhibit ${exhibit.id}`,
    arModel: exhibit.arOverlayUrl ?? "—",
    status: mapExhibitStatus(exhibit.status),
    category: exhibit.categoryId ? `Category ${exhibit.categoryId}` : "—",
    era: "—",
    location: `Museum ${exhibit.museumId}`,
    qrLinked: exhibit.qrCodeData ? "Active" : "Inactive",
    arModelStatus: exhibit.arOverlayUrl ? "Active" : "Inactive",
    audio: translation?.audioUrl ? "Active" : "Inactive",
    image: exhibit.thumbnailUrl ?? null,
    description: translation?.description ?? "",
  };
}

async function requireMuseumId(museumId?: number): Promise<number | null> {
  if (museumId != null) return museumId;
  return resolveActiveMuseumId();
}

export async function getArtifactById(id: string, museumId?: number): Promise<Artifact | null> {
  const numericId = Number(id.replace(/^EX-/i, ""));
  if (!Number.isNaN(numericId)) {
    try {
      const exhibit = await fetchExhibitById(numericId);
      return mapExhibitToArtifact(exhibit);
    } catch {
      return null;
    }
  }

  const mid = await requireMuseumId(museumId);
  if (mid == null) return null;

  return safeFetch(async () => {
    const exhibits = await getExhibits(mid);
    const exhibit = exhibits.find(
      (item) => item.exhibitCode === id || String(item.id) === id,
    );
    return exhibit ? mapExhibitToArtifact(exhibit) : null;
  }, null);
}

export async function getArtifacts(museumId?: number): Promise<Artifact[]> {
  return safeFetch(async () => {
    const id = await requireMuseumId(museumId);
    if (id == null) return [];
    const exhibits = await getExhibits(id);
    return exhibits.map(mapExhibitToArtifact);
  }, []);
}

export {
  createExhibit,
  updateExhibit,
  deleteExhibit,
  publishExhibit,
  unpublishExhibit,
};
export type { CreateExhibitDto };
