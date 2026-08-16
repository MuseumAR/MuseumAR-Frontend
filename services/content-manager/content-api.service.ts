import {
  apiDeleteAuth,
  apiGet,
  apiPostAuth,
  apiPostFormAuth,
  apiPutAuth,
  apiPutFormAuth,
} from "@/services/api-client";
import { normalizeExhibitDto, normalizeMuseumMapDto, normalizeTourRouteDto } from "@/lib/normalize-dto";
import type {
  AgeGroupDto,
  CategoryDto,
  ContentVersionDto,
  CreateCategoryDto,
  CreateExhibitDto,
  CreateExhibitionDto,
  CreateOfflinePackageDto,
  CreateTagDto,
  CreateTagGroupDto,
  CreateThemeDto,
  CreateTourRouteDto,
  CreateTourRouteStopDto,
  ExhibitArassetDto,
  ExhibitDto,
  ExhibitTranslationDto,
  ExhibitionDto,
  MuseumMapDto,
  OfflinePackageDto,
  TagDto,
  TagGroupDto,
  ThemeDto,
  TourRouteDto,
  UpdateTourRouteDto,
} from "@/types/api";

export function getExhibits(includeUnpublished = true) {
  const query = includeUnpublished ? "?includeUnpublished=true" : "";
  return apiGet<unknown[]>(`/api/content/exhibits${query}`).then((data) =>
    (Array.isArray(data) ? data : []).map(normalizeExhibitDto),
  );
}

export function getExhibitById(id: number, includeUnpublished = true) {
  const query = includeUnpublished ? "?includeUnpublished=true" : "";
  return apiGet<unknown>(`/api/content/exhibits/${id}${query}`).then(
    normalizeExhibitDto,
  );
}

export async function createExhibit(payload: CreateExhibitDto) {
  const data = await apiPostAuth<ExhibitDto | number>("/api/content/exhibits", payload);
  if (typeof data === "number") {
    return { id: data } as ExhibitDto;
  }
  const id = Number((data as ExhibitDto)?.id);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Create exhibit succeeded but no id was returned.");
  }
  return data;
}

export function updateExhibit(id: number, payload: CreateExhibitDto) {
  return apiPutAuth<number>(`/api/content/exhibits/${id}`, payload);
}

export function deleteExhibit(id: number) {
  return apiDeleteAuth<null>(`/api/content/exhibits/${id}`);
}

export function publishExhibit(id: number) {
  return apiPostAuth<ExhibitDto>(`/api/content/exhibits/${id}/publish`);
}

export function unpublishExhibit(id: number) {
  return apiPostAuth<ExhibitDto>(`/api/content/exhibits/${id}/unpublish`);
}

export function uploadExhibitImage(id: number, file: File, caption: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("caption", caption);
  return apiPostFormAuth<ExhibitDto>(`/api/content/exhibits/${id}/upload-image`, formData);
}

export function uploadExhibitAudio(id: number, languageCode: string, file: File) {
  const formData = new FormData();
  formData.append("languageCode", languageCode);
  formData.append("file", file);
  return apiPostFormAuth<ExhibitDto>(`/api/content/exhibits/${id}/upload-audio`, formData);
}

export function getExhibitTranslations(id: number) {
  return apiGet<ExhibitTranslationDto[]>(`/api/content/exhibits/${id}/translations`);
}

export function createContentVersion(versionNumber: string, description: string) {
  const params = new URLSearchParams({ versionNumber, description });
  return apiPostAuth<number>(`/api/content/versions?${params.toString()}`);
}

export function getContentVersions() {
  return apiGet<ContentVersionDto[]>("/api/content/versions");
}

export function publishContentVersion(id: number) {
  return apiPostAuth<unknown>(`/api/content/versions/${id}/publish`);
}

export function getArAssets(exhibitId: number) {
  return apiGet<ExhibitArassetDto[]>(`/api/content/exhibits/${exhibitId}/ar-assets`);
}

export function uploadArAsset(
  exhibitId: number,
  assetType: string,
  file: File,
  description?: string,
) {
  const formData = new FormData();
  formData.append("assetType", assetType);
  formData.append("file", file);
  if (description) formData.append("description", description);
  return apiPostFormAuth<ExhibitArassetDto>(
    `/api/content/exhibits/${exhibitId}/ar-assets/upload`,
    formData,
  );
}

export function deleteArAsset(id: number) {
  return apiDeleteAuth<null>(`/api/content/ar-assets/${id}`);
}

export function getOfflinePackages() {
  return apiGet<OfflinePackageDto[]>("/api/content/packages");
}

export function generateOfflinePackage(payload: CreateOfflinePackageDto) {
  return apiPostAuth<OfflinePackageDto>("/api/content/packages/generate", payload);
}

export function getExhibitions() {
  return apiGet<ExhibitionDto[]>("/api/content/exhibitions");
}

export function getExhibitionById(id: number) {
  return apiGet<ExhibitionDto>(`/api/content/exhibitions/${id}`);
}

export function createExhibition(payload: CreateExhibitionDto) {
  return apiPostAuth<ExhibitionDto>("/api/content/exhibitions", payload);
}

export function uploadExhibitionImage(id: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiPostFormAuth<ExhibitionDto>(`/api/content/exhibitions/${id}/upload-image`, formData);
}

export function updateExhibition(id: number, payload: CreateExhibitionDto) {
  return apiPutAuth<ExhibitionDto>(`/api/content/exhibitions/${id}`, payload);
}

export function deleteExhibition(id: number) {
  return apiDeleteAuth<null>(`/api/content/exhibitions/${id}`);
}

export function getMuseumMaps() {
  return apiGet<unknown[]>("/api/content/maps").then((data) =>
    (Array.isArray(data) ? data : []).map(normalizeMuseumMapDto),
  );
}

export function uploadMuseumMap(
  museumId: number,
  file: File,
  mapType: string,
  mapName: string,
  floorNumber: number,
) {
  const formData = new FormData();
  formData.append("MuseumId", String(museumId));
  formData.append("MapImage", file);
  formData.append("MapType", mapType);
  formData.append("MapName", mapName);
  formData.append("FloorNumber", String(floorNumber));
  return apiPostFormAuth<MuseumMapDto>("/api/content/maps", formData);
}

export function updateMuseumMap(id: number, formData: FormData) {
  return apiPutFormAuth<MuseumMapDto>(`/api/content/maps/${id}`, formData);
}

export function deleteMuseumMap(id: number) {
  return apiDeleteAuth<null>(`/api/content/maps/${id}`);
}

function normalizeMapPoiDto(raw: unknown): import("@/types/api").MapPoiDto {
  const o = (raw ?? {}) as Record<string, unknown>;
  return {
    id: Number(o.id ?? o.Id ?? 0),
    mapId: Number(o.mapId ?? o.MapId ?? 0),
    poiType: String(o.poiType ?? o.PoiType ?? o.Poitype ?? "WC"),
    locationX: Number(o.locationX ?? o.LocationX ?? 0),
    locationY: Number(o.locationY ?? o.LocationY ?? 0),
    description: (o.description ?? o.Description ?? null) as string | null,
  };
}

export function getMapPois(mapId: number) {
  return apiGet<unknown[]>(`/api/content/maps/${mapId}/pois`).then((data) =>
    (Array.isArray(data) ? data : []).map(normalizeMapPoiDto),
  );
}

export function createMapPoi(payload: import("@/types/api").CreateMapPoiDto) {
  return apiPostAuth<unknown>("/api/content/map-pois", payload).then(
    normalizeMapPoiDto,
  );
}

export function updateMapPoi(
  id: number,
  payload: import("@/types/api").UpdateMapPoiDto,
) {
  return apiPutAuth<unknown>(`/api/content/map-pois/${id}`, payload).then(
    normalizeMapPoiDto,
  );
}

export function deleteMapPoi(id: number) {
  return apiDeleteAuth<null>(`/api/content/map-pois/${id}`);
}

export function getTourRoutes() {
  return apiGet<unknown[]>("/api/content/routes").then((data) =>
    (Array.isArray(data) ? data : []).map(normalizeTourRouteDto),
  );
}

export function createTourRoute(payload: CreateTourRouteDto) {
  return apiPostAuth<TourRouteDto>("/api/content/routes", payload);
}

export function getTourRouteById(id: number) {
  return apiGet<unknown>(`/api/content/routes/${id}`).then(normalizeTourRouteDto);
}

export function updateTourRoute(id: number, payload: UpdateTourRouteDto) {
  return apiPutAuth<TourRouteDto>(`/api/content/routes/${id}`, payload);
}

export function deleteTourRoute(id: number) {
  return apiDeleteAuth<null>(`/api/content/routes/${id}`);
}

export function addStopToRoute(routeId: number, stop: CreateTourRouteStopDto) {
  return apiPostAuth<unknown>(`/api/content/routes/${routeId}/stops`, stop);
}

export function removeStopFromRoute(routeId: number, exhibitId: number) {
  return apiDeleteAuth<null>(`/api/content/routes/${routeId}/stops/${exhibitId}`);
}

export function reorderRouteStops(routeId: number, exhibitIdsInOrder: number[]) {
  return apiPutAuth<unknown>(`/api/content/routes/${routeId}/stops/reorder`, exhibitIdsInOrder);
}

// ─── Taxonomy ─────────────────────────────────────────────────────────────────

export function getCategories() {
  return apiGet<CategoryDto[]>("/api/content/categories");
}

export function createCategory(payload: CreateCategoryDto) {
  return apiPostAuth<CategoryDto>("/api/content/categories", payload);
}

export function updateCategory(id: number, payload: CreateCategoryDto) {
  return apiPutAuth<CategoryDto>(`/api/content/categories/${id}`, payload);
}

export function deleteCategory(id: number) {
  return apiDeleteAuth<null>(`/api/content/categories/${id}`);
}

export function getThemes() {
  return apiGet<ThemeDto[]>("/api/content/themes");
}

export function createTheme(payload: CreateThemeDto) {
  return apiPostAuth<ThemeDto>("/api/content/themes", payload);
}

export function updateTheme(id: number, payload: CreateThemeDto) {
  return apiPutAuth<unknown>(`/api/content/themes/${id}`, payload);
}

export function deleteTheme(id: number) {
  return apiDeleteAuth<null>(`/api/content/themes/${id}`);
}

export function getAgeGroups() {
  return apiGet<AgeGroupDto[]>("/api/content/age-groups");
}

export function getTagGroups() {
  return apiGet<TagGroupDto[]>("/api/content/tag-groups");
}

export function createTagGroup(payload: CreateTagGroupDto) {
  return apiPostAuth<TagGroupDto>("/api/content/tag-groups", payload);
}

export function updateTagGroup(id: number, payload: CreateTagGroupDto) {
  return apiPutAuth<unknown>(`/api/content/tag-groups/${id}`, payload);
}

export function deleteTagGroup(id: number) {
  return apiDeleteAuth<null>(`/api/content/tag-groups/${id}`);
}

export function getTags() {
  return apiGet<TagDto[]>("/api/content/tags");
}

export function createTag(payload: CreateTagDto) {
  return apiPostAuth<TagDto>("/api/content/tags", payload);
}

export function updateTag(id: number, payload: CreateTagDto) {
  return apiPutAuth<unknown>(`/api/content/tags/${id}`, payload);
}

export function deleteTag(id: number) {
  return apiDeleteAuth<null>(`/api/content/tags/${id}`);
}

export function getExhibitTags(exhibitId: number) {
  return apiGet<TagDto[]>(`/api/content/exhibits/${exhibitId}/tags`);
}

export function assignExhibitTags(exhibitId: number, tagIds: number[]) {
  return apiPostAuth<unknown>(`/api/content/exhibits/${exhibitId}/tags`, tagIds);
}

export function removeExhibitTag(exhibitId: number, tagId: number) {
  return apiDeleteAuth<null>(`/api/content/exhibits/${exhibitId}/tags/${tagId}`);
}

export function getExhibitsByExhibition(exhibitionId: number) {
  return apiGet<unknown[]>(`/api/content/exhibitions/${exhibitionId}/exhibits`).then((data) =>
    (Array.isArray(data) ? data : []).map(normalizeExhibitDto),
  );
}

export function assignExhibitsToExhibition(exhibitionId: number, exhibitIds: number[]) {
  return apiPostAuth<unknown>(`/api/content/exhibitions/${exhibitionId}/exhibits`, exhibitIds);
}

export function removeExhibitFromExhibition(exhibitionId: number, exhibitId: number) {
  return apiDeleteAuth<null>(`/api/content/exhibitions/${exhibitionId}/exhibits/${exhibitId}`);
}
