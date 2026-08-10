import {
  apiDeleteAuth,
  apiGet,
  apiPostAuth,
  apiPostFormAuth,
  apiPutAuth,
  apiPutFormAuth,
} from "@/services/api-client";
import { normalizeExhibitDto, normalizeExhibitScanResultDto, normalizeMuseumMapDto, normalizeTourRouteDto } from "@/lib/normalize-dto";
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
  UpdateMuseumMapDto,
  UpdateTourRouteDto,
} from "@/types/api";

export function getExhibits() {
  return apiGet<unknown[]>("/api/content/exhibits").then((data) =>
    (Array.isArray(data) ? data : []).map(normalizeExhibitDto),
  );
}

export function getExhibitById(id: number) {
  return apiGet<unknown>(`/api/content/exhibits/${id}`).then(normalizeExhibitDto);
}

export function createExhibit(payload: CreateExhibitDto) {
  return apiPostAuth<ExhibitDto>("/api/content/exhibits", payload);
}

export function updateExhibit(id: number, payload: CreateExhibitDto) {
  return apiPutAuth<ExhibitDto>(`/api/content/exhibits/${id}`, payload);
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
  return apiGet<unknown[]>("/api/content/packages").then((data) =>
    (Array.isArray(data) ? data : []).map((raw) => {
      const o =
        raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
      return {
        id: Number(o.id ?? o.Id ?? 0),
        museumId: Number(o.museumId ?? o.MuseumId ?? 0),
        versionId: Number(o.versionId ?? o.VersionId ?? 0),
        packageUrl: (o.packageUrl ?? o.PackageUrl) as string | null | undefined,
        packageSizeBytes:
          o.packageSizeBytes != null || o.PackageSizeBytes != null
            ? Number(o.packageSizeBytes ?? o.PackageSizeBytes)
            : null,
        checksum: (o.checksum ?? o.Checksum) as string | null | undefined,
        status: (o.status ?? o.Status) as string | null | undefined,
        exhibitCount:
          o.exhibitCount != null || o.ExhibitCount != null
            ? Number(o.exhibitCount ?? o.ExhibitCount)
            : null,
        arassetCount:
          o.arassetCount != null || o.ArassetCount != null
            ? Number(o.arassetCount ?? o.ArassetCount)
            : null,
        imageCount:
          o.imageCount != null || o.ImageCount != null
            ? Number(o.imageCount ?? o.ImageCount)
            : null,
        audioCount:
          o.audioCount != null || o.AudioCount != null
            ? Number(o.audioCount ?? o.AudioCount)
            : null,
        createdAt: String(o.createdAt ?? o.CreatedAt ?? ""),
      } satisfies OfflinePackageDto;
    }),
  );
}

export function generateOfflinePackage(payload: CreateOfflinePackageDto) {
  return apiPostAuth<OfflinePackageDto>("/api/content/packages/generate", payload);
}

export function getExhibitions() {
  return apiGet<ExhibitionDto[]>("/api/content/exhibitions");
}

/** BE has no GET /exhibitions/{id} — resolve from list */
export async function getExhibitionById(id: number) {
  const list = await getExhibitions();
  return list.find((item) => item.id === id) ?? null;
}

export function scanExhibitQr(params: {
  qrData: string;
  lang?: string;
  visitorId?: number;
}) {
  const query = new URLSearchParams({ qrData: params.qrData });
  if (params.lang) query.set("lang", params.lang);
  if (params.visitorId != null) query.set("visitorId", String(params.visitorId));
  return apiGet<unknown>(`/api/content/exhibits/scan-qr?${query.toString()}`).then(
    normalizeExhibitScanResultDto,
  );
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

export function getExhibitionExhibits(exhibitionId: number) {
  return apiGet<unknown[]>(`/api/content/exhibitions/${exhibitionId}/exhibits`).then(
    (data) => (Array.isArray(data) ? data : []).map(normalizeExhibitDto),
  );
}

export function assignExhibitsToExhibition(
  exhibitionId: number,
  exhibitIds: number[],
) {
  return apiPostAuth<unknown>(
    `/api/content/exhibitions/${exhibitionId}/exhibits`,
    exhibitIds,
  );
}

export function removeExhibitFromExhibition(
  exhibitionId: number,
  exhibitId: number,
) {
  return apiDeleteAuth<null>(
    `/api/content/exhibitions/${exhibitionId}/exhibits/${exhibitId}`,
  );
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

/**
 * Update map (multipart).
 * BE UpdateMuseumMapDto currently maps form "MapType" → entity.MapName (bug).
 * We send display name as MapType so rename works until BE is fixed.
 */
export function updateMuseumMap(id: number, payload: UpdateMuseumMapDto) {
  const formData = new FormData();
  const nameOrType = payload.mapName?.trim() || payload.mapType?.trim();
  if (nameOrType) formData.append("MapType", nameOrType);
  if (payload.floorNumber != null) {
    formData.append("FloorNumber", String(payload.floorNumber));
  }
  if (payload.mapImage) formData.append("MapImage", payload.mapImage);
  return apiPutFormAuth<unknown>(`/api/content/maps/${id}`, formData).then(
    normalizeMuseumMapDto,
  );
}

export function deleteMuseumMap(id: number) {
  return apiDeleteAuth<null>(`/api/content/maps/${id}`);
}

export function getTourRoutes() {
  return apiGet<unknown[]>("/api/content/routes").then((data) =>
    (Array.isArray(data) ? data : []).map(normalizeTourRouteDto),
  );
}

export function getTourRoutesByExhibition(exhibitionId: number) {
  return apiGet<unknown[]>(`/api/content/routes/exhibition/${exhibitionId}`).then(
    (data) => (Array.isArray(data) ? data : []).map(normalizeTourRouteDto),
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
