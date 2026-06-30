import { safeFetch } from "@/lib/fetch-safe";
import type {
  CreateMuseumMapDto,
  CreateTourRouteDto,
  MuseumMapDto,
  TourRouteDto,
} from "@/types/api";
import {
  createMuseumMap,
  createTourRoute,
  getMuseumMaps,
  getTourRoutes,
  uploadMuseumMap,
} from "./content-api.service";
import { getStoredMuseumId } from "@/services/auth/resolve-museum-id";

export async function getMapList(museumId?: number): Promise<MuseumMapDto[]> {
  return safeFetch(async () => {
    const id = museumId ?? getStoredMuseumId();
    if (id == null) return [];
    return getMuseumMaps(id);
  }, []);
}

export async function getRouteList(museumId?: number): Promise<TourRouteDto[]> {
  return safeFetch(async () => {
    const id = museumId ?? getStoredMuseumId();
    if (id == null) return [];
    return getTourRoutes(id);
  }, []);
}

export async function createMapEntry(payload: CreateMuseumMapDto) {
  return createMuseumMap(payload);
}

export async function createMapWithImage(
  museumId: number,
  file: File,
  mapType: string,
  floorNumber: number,
  mapName?: string,
) {
  return uploadMuseumMap(museumId, file, mapType, floorNumber, mapName);
}

export async function createRouteEntry(payload: CreateTourRouteDto) {
  return createTourRoute(payload);
}
