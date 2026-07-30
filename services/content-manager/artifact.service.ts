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

function getPrimaryTranslation(exhibit: ExhibitDto) {
  return exhibit.translations[0];
}

function mapExhibitStatus(status: string): Artifact["status"] {
  if (status === "Published") return "Published";
  if (status === "Draft") return "Draft";
  return "Pending";
}

function formatLocation(exhibit: ExhibitDto): string {
  const parts: string[] = [];
  if (exhibit.floorNumber !== undefined && exhibit.floorNumber !== null) {
    parts.push(`Floor ${exhibit.floorNumber}`);
  }
  if (exhibit.roomCode || exhibit.roomName) {
    const roomStr = [exhibit.roomCode, exhibit.roomName].filter(Boolean).join(" ");
    parts.push(roomStr);
  }
  if (parts.length > 0) {
    return parts.join(" · ");
  }
  return "Not assigned";
}

function mapExhibitToArtifact(exhibit: ExhibitDto): Artifact {
  const translation = getPrimaryTranslation(exhibit);

  return {
    id: exhibit.exhibitCode ?? `EX-${exhibit.id}`,
    exhibitId: exhibit.id,
    name: translation?.title ?? `Exhibit ${exhibit.id}`,
    arModel: exhibit.arOverlayUrl ?? "—",
    arOverlayUrl: exhibit.arOverlayUrl ?? null,
    arMarkerUrl: exhibit.arMarkerUrl ?? null,
    status: mapExhibitStatus(exhibit.status),
    category: exhibit.categoryId ? `Category ${exhibit.categoryId}` : "—",
    era: exhibit.exhibitMetadata?.era ?? "—",
    location: formatLocation(exhibit),
    qrLinked: exhibit.qrCodeData ? "Active" : "Inactive",
    arModelStatus: exhibit.arOverlayUrl ? "Active" : "Inactive",
    audio: translation?.audioUrl ? "Active" : "Inactive",
    audioUrl: translation?.audioUrl ?? null,
    image: exhibit.thumbnailUrl ?? null,
    description: translation?.description ?? "",
  };
}

export async function getArtifactById(id: string): Promise<Artifact | null> {
  const numericId = Number(id.replace(/^EX-/i, ""));
  if (!Number.isNaN(numericId)) {
    try {
      const exhibit = await fetchExhibitById(numericId);
      return mapExhibitToArtifact(exhibit);
    } catch {
      return null;
    }
  }

  return safeFetch(async () => {
    const exhibits = await getExhibits();
    const exhibit = exhibits.find(
      (item) => item.exhibitCode === id || String(item.id) === id,
    );
    return exhibit ? mapExhibitToArtifact(exhibit) : null;
  }, null);
}

export async function getArtifacts(): Promise<Artifact[]> {
  return safeFetch(async () => {
    const exhibits = await getExhibits();
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
