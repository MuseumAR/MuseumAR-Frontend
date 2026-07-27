import { safeFetch } from "@/lib/fetch-safe";
import type {
  CreateTourRouteDto,
  CreateTourRouteStopDto,
  MuseumMapDto,
  TourRouteDto,
  UpdateTourRouteDto,
} from "@/types/api";
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
  uploadMuseumMap,
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

