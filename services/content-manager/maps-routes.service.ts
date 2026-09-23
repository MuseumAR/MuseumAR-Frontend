import { safeFetch } from "@/lib/fetch-safe";
import { resolveApiMediaUrl } from "@/lib/normalize-dto";
import type {
  CreateTourRouteDto,
  CreateTourRouteStopDto,
  MuseumMapDto,
  TourRouteDto,
  UpdateTourRouteDto,
} from "@/types/api";
import { uploadMuseumImage } from "@/services/admin/admin-api.service";
import {
  addStopToRoute,
  createTourRoute,
  deleteTourRoute,
  getMuseumMaps,
  getTourRouteById,
  getTourRoutes,
  removeStopFromRoute,
  reorderRouteStops,
  updateTourRoute,
  uploadImageViaSignedCloudinary,
  uploadMuseumMap,
  uploadRouteImage,
} from "./content-api.service";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function normalizeMap(raw: unknown): MuseumMapDto {
  const o = asRecord(raw);
  return {
    id: Number(o.id ?? o.Id ?? 0),
    museumId: Number(o.museumId ?? o.MuseumId ?? 0),
    mapImageUrl: String(o.mapImageUrl ?? o.MapImageUrl ?? ""),
    // BE maps entity MapName → DTO MapType
    mapType: String(o.mapType ?? o.MapType ?? "floor"),
    floorNumber:
      o.floorNumber != null || o.FloorNumber != null
        ? Number(o.floorNumber ?? o.FloorNumber)
        : undefined,
    mapName: (o.mapName ?? o.MapName) as string | null | undefined,
  };
}

export async function getMapList(): Promise<MuseumMapDto[]> {
  return safeFetch(async () => {
    const data = await getMuseumMaps();
    return (Array.isArray(data) ? data : []).map(normalizeMap);
  }, []);
}

export async function getRouteList(): Promise<TourRouteDto[]> {
  return safeFetch(() => getTourRoutes(), []);
}

export async function getRouteDetail(id: number): Promise<TourRouteDto | null> {
  return safeFetch(() => getTourRouteById(id), null);
}

export async function createMapWithImage(
  museumId: number,
  file: File,
  mapType: string,
  mapName: string,
  floorNumber: number,
) {
  return uploadMuseumMap(museumId, file, mapType, mapName, floorNumber);
}

function hostedImageUrl(raw: unknown): string | null {
  if (typeof raw === "string") {
    return resolveApiMediaUrl(raw);
  }
  const o = asRecord(raw);
  const candidates = [
    o.thumbnailUrl,
    o.ThumbnailUrl,
    o.url,
    o.Url,
    o.secureUrl,
    o.SecureUrl,
    o.mapImageUrl,
    o.MapImageUrl,
  ];
  for (const value of candidates) {
    if (typeof value === "string") {
      const url = resolveApiMediaUrl(value);
      if (url) return url;
    }
  }
  return null;
}

async function tryHost(fn: () => Promise<unknown>): Promise<string | null> {
  try {
    return hostedImageUrl(await fn());
  } catch {
    return null;
  }
}

/** Host the file then return a public URL for TourRoute.ThumbnailUrl (NVARCHAR 500). */
export async function hostRouteThumbnail(
  file: File,
  exhibitId?: number,
  museumId?: number,
): Promise<string> {
  // ContentManager usually cannot call Admin museum-profile upload — try last.
  if (exhibitId && exhibitId > 0) {
    const fromCloud = await tryHost(() => uploadImageViaSignedCloudinary(exhibitId, file));
    if (fromCloud) return fromCloud;
  }

  if (museumId && museumId > 0) {
    const fromMap = await tryHost(() =>
      uploadMuseumMap(museumId, file, "route-thumb", `route-cover-${Date.now()}`, 0),
    );
    if (fromMap) return fromMap;
  }

  const fromMuseum = await tryHost(() => uploadMuseumImage(file));
  if (fromMuseum) return fromMuseum;

  throw new Error("Không tải được ảnh đại diện. Thử file PNG/JPG nhỏ hơn rồi lưu lại.");
}

export async function attachRouteThumbnail(
  routeId: number,
  file: File,
  exhibitId?: number,
  museumId?: number,
): Promise<string> {
  const fromRoute = await tryHost(() => uploadRouteImage(routeId, file));
  if (fromRoute) return fromRoute;

  const hosted = await hostRouteThumbnail(file, exhibitId, museumId);
  await updateTourRoute(routeId, { thumbnailUrl: hosted });
  return hosted;
}

export async function createRouteEntry(payload: CreateTourRouteDto) {
  return createTourRoute(payload);
}

export async function updateRouteEntry(id: number, payload: UpdateTourRouteDto) {
  return updateTourRoute(id, payload);
}

export async function deleteRouteEntry(id: number) {
  return deleteTourRoute(id);
}

export async function addRouteStop(routeId: number, stop: CreateTourRouteStopDto) {
  return addStopToRoute(routeId, stop);
}

export async function removeRouteStop(routeId: number, exhibitId: number) {
  return removeStopFromRoute(routeId, exhibitId);
}

export async function reorderStops(routeId: number, exhibitIds: number[]) {
  return reorderRouteStops(routeId, exhibitIds);
}

