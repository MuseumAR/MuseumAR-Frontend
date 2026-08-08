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
  const defaultQrData = exhibit.qrCodeData ?? `MUSEUM_EX_${exhibit.id}_${exhibit.exhibitCode || `EX${exhibit.id}`}`;
  const defaultQrImage = exhibit.qrCodeImageUrl ?? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(defaultQrData)}`;

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
    qrCodeData: defaultQrData,
    qrCodeImageUrl: defaultQrImage,
    arModelStatus: exhibit.arOverlayUrl ? "Active" : "Inactive",
    audio: translation?.audioUrl ? "Active" : "Inactive",
    audioUrl: translation?.audioUrl ?? null,
    image: exhibit.thumbnailUrl ?? null,
    description: translation?.description ?? "",
  };
}

export async function getArtifactById(id: string): Promise<Artifact | null> {
  const cleanIdStr = id.replace(/^EX-/i, "").trim();
  const numericId = Number(cleanIdStr);

  if (!Number.isNaN(numericId) && numericId > 0) {
    try {
      const exhibit = await fetchExhibitById(numericId);
      if (exhibit && (String(exhibit.id) === cleanIdStr || exhibit.exhibitCode === id)) {
        return mapExhibitToArtifact(exhibit);
      }
    } catch {
      // Fallthrough to searching all exhibits list if ID fetch fails
    }
  }

  return safeFetch(async () => {
    const exhibits = await getExhibits();
    const targetIdLower = id.toLowerCase();
    const targetCleanLower = cleanIdStr.toLowerCase();

    const exhibit = exhibits.find((item) => {
      const itemCodeLower = (item.exhibitCode || "").toLowerCase();
      const defaultCodeLower = `ex-${item.id}`.toLowerCase();

      return (
        itemCodeLower === targetIdLower ||
        defaultCodeLower === targetIdLower ||
        itemCodeLower === `ex-${targetCleanLower}` ||
        String(item.id) === targetCleanLower ||
        String(item.id) === targetIdLower
      );
    });
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
