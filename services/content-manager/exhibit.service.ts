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

export async function getExhibitRows(): Promise<ExhibitRow[]> {
  return safeFetch(async () => {
    const exhibits = await getExhibits();
    return exhibits.map(mapExhibitToRow);
  }, []);
}

export async function getExhibitStats() {
  return safeFetch(async () => {
    const exhibits = await getExhibits();
    return {
      total: exhibits.length,
      published: exhibits.filter((e) => e.status === "Published").length,
      draft: exhibits.filter((e) => e.status === "Draft").length,
      withAr: exhibits.filter((e) => e.arOverlayUrl || e.arMarkerUrl).length,
      withQr: exhibits.filter((e) => e.qrCodeData).length,
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
