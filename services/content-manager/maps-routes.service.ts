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
} from "./content-api.service";
import { resolveActiveMuseumId } from "./museum-context";

export async function getMapList(museumId?: number): Promise<MuseumMapDto[]> {
  return safeFetch(async () => {
    const id = museumId ?? (await resolveActiveMuseumId());
    if (id == null) return [];
    return getMuseumMaps(id);
  }, []);
}

export async function getRouteList(museumId?: number): Promise<TourRouteDto[]> {
  return safeFetch(async () => {
    const id = museumId ?? (await resolveActiveMuseumId());
    if (id == null) return [];
    return getTourRoutes(id);
  }, []);
}

export async function createMapEntry(payload: CreateMuseumMapDto) {
  return createMuseumMap(payload);
}

export async function createRouteEntry(payload: CreateTourRouteDto) {
  return createTourRoute(payload);
}
