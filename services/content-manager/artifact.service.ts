import type { ExhibitDto, ExhibitListItemDto, CreateExhibitDto } from "@/types/api";
import type { Artifact } from "@/types";
import { exhibitHasArModel } from "@/lib/normalize-dto";
import { safeFetch } from "@/lib/fetch-safe";
import {
  createExhibit,
  deleteExhibit,
  getExhibitByCode,
  getExhibitById as fetchExhibitById,
  getExhibits,
  getExhibitsPaged,
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
    eraEn: exhibit.exhibitMetadata?.eraEn ?? "",
    historicalEvent: exhibit.exhibitMetadata?.historicalEvent ?? "",
    historicalEventEn: exhibit.exhibitMetadata?.historicalEventEn ?? "",
    location: formatLocation(exhibit),
    qrLinked: exhibit.qrCodeData ? "Active" : "Inactive",
    qrCodeData: defaultQrData,
    qrCodeImageUrl: defaultQrImage,
    arModelStatus: exhibitHasArModel(exhibit) ? "Active" : "Inactive",
    audio: translation?.audioUrl ? "Active" : "Inactive",
    audioUrl: translation?.audioUrl ?? null,
    image: exhibit.thumbnailUrl ?? null,
    description: translation?.description ?? "",
  };
}

function parseNumericExhibitId(id: string): number | null {
  const raw = decodeURIComponent(id).trim();
  if (/^\d+$/.test(raw)) return Number(raw);
  const stripped = raw.replace(/^EX-/i, "");
  if (/^\d+$/.test(stripped)) return Number(stripped);
  return null;
}

function slugMatches(
  item: { id: number; exhibitCode?: string | null },
  slug: string,
): boolean {
  const s = slug.toLowerCase();
  const code = (item.exhibitCode || "").toLowerCase();
  return (
    code === s ||
    String(item.id) === s ||
    `ex-${item.id}` === s ||
    code === `ex-${s}`
  );
}

function mapListItemToArtifact(item: ExhibitListItemDto): Artifact {
  const code = item.exhibitCode ?? `EX-${item.id}`;
  return {
    id: code,
    exhibitId: item.id,
    name: item.title ?? `Exhibit ${item.id}`,
    arModel: "—",
    arOverlayUrl: null,
    arMarkerUrl: null,
    status: mapExhibitStatus(item.status),
    category: "—",
    era: "—",
    location: item.roomName
      ? [item.floorNumber != null ? `Floor ${item.floorNumber}` : null, item.roomName]
          .filter(Boolean)
          .join(" · ")
      : "Not assigned",
    qrLinked: item.hasQr ? "Active" : "Inactive",
    arModelStatus: item.hasArModel ? "Active" : "Inactive",
    audio: item.hasAudio ? "Active" : "Inactive",
    image: item.thumbnailUrl ?? null,
    description: "",
  };
}

export async function getArtifactById(id: string): Promise<Artifact | null> {
  const slug = decodeURIComponent(id).trim();
  if (!slug) return null;

  async function loadByKey(key: number | string): Promise<Artifact | null> {
    try {
      const exhibit = await fetchExhibitById(key);
      return exhibit?.id ? mapExhibitToArtifact(exhibit) : null;
    } catch {
      return null;
    }
  }

  const byIdOrCode = await loadByKey(slug);
  if (byIdOrCode) return byIdOrCode;

  const numericId = parseNumericExhibitId(slug);
  if (numericId != null && String(numericId) !== slug) {
    const byId = await loadByKey(numericId);
    if (byId) return byId;
  }

  try {
    const byCode = await getExhibitByCode(slug);
    if (byCode?.id) return mapExhibitToArtifact(byCode);
  } catch {
    // fall through to paged search
  }

  try {
    const page = await getExhibitsPaged({
      page: 1,
      pageSize: 20,
      search: slug,
      includeUnpublished: true,
    });
    const match =
      page.items.find((item) => slugMatches(item, slug)) ??
      page.items.find((item) =>
        (item.exhibitCode || "").toLowerCase().includes(slug.toLowerCase()),
      );
    if (!match) return null;
    return (await loadByKey(match.id)) ?? mapListItemToArtifact(match);
  } catch {
    return null;
  }
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
