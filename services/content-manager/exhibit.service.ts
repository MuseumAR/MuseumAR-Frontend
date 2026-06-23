import { safeFetch } from "@/lib/fetch-safe";
import type { ExhibitDto } from "@/types/api";
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

export type ExhibitRow = {
  id: number;
  title: string;
  exhibitCode: string;
  status: string;
  hasAr: boolean;
  hasQr: boolean;
  hasAudio: boolean;
  thumbnailUrl: string | null;
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
  };
}

async function requireMuseumId(museumId?: number): Promise<number | null> {
  if (museumId != null) return museumId;
  return resolveActiveMuseumId();
}

export async function getExhibitRows(museumId?: number): Promise<ExhibitRow[]> {
  return safeFetch(async () => {
    const id = await requireMuseumId(museumId);
    if (id == null) return [];
    const exhibits = await getExhibits(id);
    return exhibits.map(mapExhibitToRow);
  }, []);
}

export async function getExhibitStats(museumId?: number) {
  return safeFetch(async () => {
    const id = await requireMuseumId(museumId);
    if (id == null) {
      return { total: 0, published: 0, draft: 0, withAr: 0, withQr: 0 };
    }
    const exhibits = await getExhibits(id);
    return {
      total: exhibits.length,
      published: exhibits.filter((e) => e.status === "Published").length,
      draft: exhibits.filter((e) => e.status === "Draft").length,
      withAr: exhibits.filter((e) => e.arOverlayUrl || e.arMarkerUrl).length,
      withQr: exhibits.filter((e) => e.qrCodeData).length,
    };
  }, { total: 0, published: 0, draft: 0, withAr: 0, withQr: 0 });
}

export async function getExhibitDetail(id: number, museumId?: number) {
  try {
    return await fetchExhibitById(id);
  } catch {
    const mid = await requireMuseumId(museumId);
    if (mid == null) return null;
    const exhibits = await getExhibits(mid);
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
