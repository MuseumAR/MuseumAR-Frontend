import { safeFetch } from "@/lib/fetch-safe";
import type {
  CreateTourRouteDto,
  MuseumMapDto,
  TourRouteDto,
} from "@/types/api";
import {
  createTourRoute,
  getMuseumMaps,
  getTourRoutes,
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
