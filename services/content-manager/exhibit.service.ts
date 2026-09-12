import { safeFetch } from "@/lib/fetch-safe";
import type { ExhibitDto } from "@/types/api";
import {
  createExhibit,
  deleteExhibit,
  getExhibitById as fetchExhibitById,
  getExhibitStatsApi,
  getExhibits,
  getExhibitsPaged,
  publishExhibit,
  unpublishExhibit,
  updateExhibit,
} from "./content-api.service";

export type ExhibitRow = {
  id: number;
  title: string;
  exhibitCode: string;
  status: string;
  hasAr: boolean;
  hasQr: boolean;
  hasAudio: boolean;
  thumbnailUrl: string | null;
  floorNumber?: number | null;
  roomCode?: string | null;
  roomName?: string | null;
};

function getPrimaryTitle(exhibit: ExhibitDto): string {
  return exhibit.translations[0]?.title ?? `Exhibit #${exhibit.id}`;
}

export function mapExhibitToRow(exhibit: ExhibitDto): ExhibitRow {
  const translation = exhibit.translations[0];
  return {
    id: exhibit.id,
    title: getPrimaryTitle(exhibit),
    exhibitCode: exhibit.exhibitCode ?? `EX-${exhibit.id}`,
    status: exhibit.status,
    hasAr: !!(exhibit.arOverlayUrl || exhibit.arMarkerUrl),
    hasQr: !!exhibit.qrCodeData,
    hasAudio: !!translation?.audioUrl,
    thumbnailUrl: exhibit.thumbnailUrl ?? null,
    floorNumber: exhibit.floorNumber ?? null,
    roomCode: exhibit.roomCode ?? null,
    roomName: exhibit.roomName ?? null,
  };
}

export async function getExhibitRows(): Promise<ExhibitRow[]> {
  return safeFetch(async () => {
    // Fast path: use paged endpoint with slim DTO (Mục 2 & 3)
    try {
      const paged = await getExhibitsPaged({ pageSize: 50, includeUnpublished: true });
      if (paged?.items && Array.isArray(paged.items)) {
        return paged.items.map((item) => ({
          id: item.id,
          title: item.title ?? `Exhibit #${item.id}`,
          exhibitCode: item.exhibitCode ?? `EX-${item.id}`,
          status: item.status,
          hasAr: item.hasArModel,
          hasQr: item.hasQr,
          hasAudio: item.hasAudio,
          thumbnailUrl: item.thumbnailUrl ?? null,
          floorNumber: item.floorNumber ?? null,
          roomCode: null,
          roomName: item.roomName ?? null,
        }));
      }
    } catch {
      // Fallback to legacy full list if paged fails
    }
    const exhibits = await getExhibits();
    return exhibits.map(mapExhibitToRow);
  }, []);
}

export async function getExhibitStats() {
  return safeFetch(async () => {
    // Call backend stats API (Mục 1)
    const stats = await getExhibitStatsApi();
    return {
      total: stats.total,
      published: stats.published,
      draft: stats.draft,
      withAr: stats.withArModel ?? stats.withAr ?? 0,
      withQr: stats.withQr,
    };
  }, { total: 0, published: 0, draft: 0, withAr: 0, withQr: 0 });
}

export async function getExhibitDetail(id: number) {
  try {
    return await fetchExhibitById(id);
  } catch {
    const exhibits = await getExhibits();
    return exhibits.find((e) => e.id === id) ?? null;
  }
}

export {
  createExhibit,
  updateExhibit,
  deleteExhibit,
  publishExhibit,
  unpublishExhibit,
};
export type { CreateExhibitDto } from "@/types/api";
