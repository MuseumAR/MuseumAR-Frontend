import { safeFetch } from "@/lib/fetch-safe";
import type {
  CreateTourRouteDto,
  CreateTourRouteStopDto,
  MuseumMapDto,
  TourRouteDto,
  UpdateMuseumMapDto,
  UpdateTourRouteDto,
} from "@/types/api";
import {
  addStopToRoute,
  createTourRoute,
  deleteMuseumMap,
  deleteTourRoute,
  getMuseumMaps,
  getTourRouteById,
  getTourRoutes,
  getTourRoutesByExhibition,
  removeStopFromRoute,
  reorderRouteStops,
  updateMuseumMap,
  updateTourRoute,
  uploadMuseumMap,
} from "./content-api.service";

export async function getMapList(): Promise<MuseumMapDto[]> {
  return safeFetch(() => getMuseumMaps(), []);
}

export async function getRouteList(): Promise<TourRouteDto[]> {
  return safeFetch(() => getTourRoutes(), []);
}

export async function getRouteDetail(id: number): Promise<TourRouteDto | null> {
  return safeFetch(() => getTourRouteById(id), null);
}

export async function getRoutesByExhibition(
  exhibitionId: number,
): Promise<TourRouteDto[]> {
  return safeFetch(() => getTourRoutesByExhibition(exhibitionId), []);
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

export async function updateMapEntry(id: number, payload: UpdateMuseumMapDto) {
  return updateMuseumMap(id, payload);
}

export async function deleteMapEntry(id: number) {
  return deleteMuseumMap(id);
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

export {
  updateMuseumMap,
  deleteMuseumMap,
  getTourRoutesByExhibition,
};

