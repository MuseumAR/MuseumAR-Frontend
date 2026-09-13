import { exhibitHasArModel } from "@/lib/normalize-dto";
import { safeFetch } from "@/lib/fetch-safe";
import type { ExhibitDto, ExhibitListItemDto } from "@/types/api";
import {
  createExhibit,
  deleteExhibit,
  getAllExhibitListItems,
  getExhibitById as fetchExhibitById,
  getExhibits,
  getExhibitsCached,
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
    hasAr: exhibitHasArModel(exhibit),
    hasQr: !!exhibit.qrCodeData,
    hasAudio: !!translation?.audioUrl,
    thumbnailUrl: exhibit.thumbnailUrl ?? null,
    floorNumber: exhibit.floorNumber ?? null,
    roomCode: exhibit.roomCode ?? null,
    roomName: exhibit.roomName ?? null,
  };
}

export function mapListItemToRow(item: ExhibitListItemDto): ExhibitRow {
  return {
    id: item.id,
    title: item.title || `Exhibit #${item.id}`,
    exhibitCode: item.exhibitCode ?? `EX-${item.id}`,
    status: item.status,
    hasAr: item.hasArModel,
    hasQr: item.hasQr,
    hasAudio: item.hasAudio,
    thumbnailUrl: item.thumbnailUrl ?? null,
    floorNumber: item.floorNumber ?? null,
    roomName: item.roomName ?? null,
  };
}

export const EXHIBIT_PAGE_SIZE = 8;

export type ExhibitPageResult = {
  rows: ExhibitRow[];
  totalItems: number;
  totalPages: number;
  page: number;
};

export async function getExhibitPage(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}): Promise<ExhibitPageResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? EXHIBIT_PAGE_SIZE;
  const search = params.search?.trim() || undefined;

  try {
    const result = await getExhibitsPaged({
      page,
      pageSize,
      search,
      status: params.status,
      includeUnpublished: true,
    });
    const totalPages = Math.max(
      1,
      result.totalPages || Math.ceil((result.totalItems || 0) / Math.max(pageSize, 1)),
    );
    return {
      rows: result.items.map(mapListItemToRow),
      totalItems: result.totalItems,
      totalPages,
      page: result.page || page,
    };
  } catch {
    const exhibits = await getExhibits();
    const q = search?.toLowerCase() ?? "";
    const filtered = q
      ? exhibits.filter((item) => {
          const title = (item.translations[0]?.title ?? "").toLowerCase();
          const code = (item.exhibitCode ?? "").toLowerCase();
          const status = (item.status ?? "").toLowerCase();
          return title.includes(q) || code.includes(q) || status.includes(q);
        })
      : exhibits;
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const current = Math.min(page, totalPages);
    const start = (current - 1) * pageSize;
    return {
      rows: filtered.slice(start, start + pageSize).map(mapExhibitToRow),
      totalItems,
      totalPages,
      page: current,
    };
  }
}

export async function getExhibitRows(): Promise<ExhibitRow[]> {
  return safeFetch(async () => {
    const items = await getAllExhibitListItems();
    return items.map(mapListItemToRow);
  }, []);
}

export async function getExhibitStats() {
  try {
    const exhibits = await getExhibitsCached();
    return {
      total: exhibits.length,
      published: exhibits.filter((e) => e.status.toLowerCase() === "published").length,
      draft: exhibits.filter((e) => e.status.toLowerCase() === "draft").length,
      withAr: exhibits.filter((e) => exhibitHasArModel(e)).length,
      withQr: exhibits.filter((e) => !!e.qrCodeData).length,
    };
  } catch {
    return { total: 0, published: 0, draft: 0, withAr: 0, withQr: 0 };
  }
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
