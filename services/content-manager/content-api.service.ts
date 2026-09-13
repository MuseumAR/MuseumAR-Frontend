import {
  apiDeleteAuth,
  apiGet,
  apiGetAuth,
  apiPostAuth,
  apiPostFormAuth,
  apiPutAuth,
  apiPutFormAuth,
} from "@/services/api-client";
import { getAccessToken } from "@/services/auth/auth.storage";
import {
  asRecord,
  exhibitHasArModel,
  normalizeCategoryDto,
  normalizeContentVersionDto,
  normalizeExhibitArassetDto,
  normalizeExhibitDto,
  normalizeMuseumMapDto,
  normalizeTagDto,
  normalizeTagGroupDto,
  normalizeThemeDto,
  normalizeTourRouteDto,
  unwrapArray,
} from "@/lib/normalize-dto";
import { AppError, AR_MODEL_MAX_BYTES, formatFileSize } from "@/lib/validation";
import type {
  AgeGroupDto,
  ConfirmUploadDto,
  CreateCategoryDto,
  CreateExhibitDto,
  CreateExhibitionDto,
  CreateOfflinePackageDto,
  CreateTagDto,
  CreateTagGroupDto,
  CreateThemeDto,
  CreateTourRouteDto,
  CreateTourRouteStopDto,
  ExhibitDto,
  ExhibitListItemDto,
  ExhibitTranslationDto,
  ExhibitionDto,
  MuseumMapDto,
  OfflinePackageDto,
  SignUploadRequestDto,
  SignUploadResponseDto,
  TagDto,
  TagGroupDto,
  ThemeDto,
  TourRouteDto,
  UpdateTourRouteDto,
} from "@/types/api";

export type GetExhibitsPagedParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  includeUnpublished?: boolean;
  accessToken?: string | null;
};

let exhibitsListCache: ExhibitDto[] | null = null;

function setExhibitsListCache(list: ExhibitDto[]) {
  exhibitsListCache = list;
}

export function invalidateExhibitsListCache() {
  exhibitsListCache = null;
}

export function getExhibits(includeUnpublished = true) {
  const query = includeUnpublished ? "?includeUnpublished=true" : "";
  const token = getAccessToken();
  const path = `/api/content/exhibits${query}`;
  const req = token ? apiGetAuth<unknown[]>(path, token) : apiGet<unknown[]>(path);
  return req.then((data) => {
    const list = unwrapArray(data).map(normalizeExhibitDto);
    setExhibitsListCache(list);
    return list;
  });
}

export async function getExhibitsCached(includeUnpublished = true) {
  if (exhibitsListCache) return exhibitsListCache;
  return getExhibits(includeUnpublished);
}

export function exhibitDtoToListItem(exhibit: ExhibitDto): ExhibitListItemDto {
  return {
    id: exhibit.id,
    exhibitCode: exhibit.exhibitCode,
    status: exhibit.status,
    title: exhibit.translations[0]?.title ?? null,
    thumbnailUrl: exhibit.thumbnailUrl ?? null,
    hasArModel: exhibitHasArModel(exhibit),
    arModelCount: (exhibit.arAssets ?? []).filter((a) =>
      (a.assetType ?? "").replace(/\s/g, "").toLowerCase() === "model3d",
    ).length,
    hasAudio: !!exhibit.translations.some((t) => t.audioUrl),
    hasQr: !!exhibit.qrCodeData,
    roomId: exhibit.roomId ?? null,
    roomName: exhibit.roomName ?? null,
    mapId: exhibit.mapId ?? null,
    floorNumber: exhibit.floorNumber ?? null,
  };
}

function matchesExhibitSearch(
  item: ExhibitListItemDto,
  search?: string,
  status?: string,
) {
  if (status && item.status.toLowerCase() !== status.toLowerCase()) return false;
  const q = search?.trim().toLowerCase();
  if (!q) return true;
  const title = (item.title ?? "").toLowerCase();
  const code = (item.exhibitCode ?? "").toLowerCase();
  const itemStatus = (item.status ?? "").toLowerCase();
  return title.includes(q) || code.includes(q) || itemStatus.includes(q);
}

/** Client-side paging — Azure binds /exhibits/{id} as int, so /paged and /stats return 400. */
export async function getExhibitsPaged(params: GetExhibitsPagedParams = {}) {
  const exhibits = await getExhibitsCached(params.includeUnpublished ?? true);
  const filtered = exhibits
    .map(exhibitDtoToListItem)
    .filter((item) => matchesExhibitSearch(item, params.search, params.status));
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, params.pageSize ?? 50);
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const current = Math.min(page, totalPages);
  const start = (current - 1) * pageSize;
  return {
    totalItems,
    page: current,
    pageSize,
    totalPages,
    items: filtered.slice(start, start + pageSize),
  };
}

export async function getAllExhibitListItems(
  includeUnpublished = true,
): Promise<ExhibitListItemDto[]> {
  const exhibits = await getExhibitsCached(includeUnpublished);
  return exhibits.map(exhibitDtoToListItem);
}

export function exhibitListItemToStub(item: ExhibitListItemDto): ExhibitDto {
  return {
    id: item.id,
    museumId: 0,
    exhibitCode: item.exhibitCode,
    status: item.status,
    thumbnailUrl: item.thumbnailUrl,
    hasArModel: item.hasArModel,
    floorNumber: item.floorNumber,
    roomId: item.roomId,
    roomName: item.roomName,
    mapId: item.mapId,
    translations: [
      {
        exhibitId: item.id,
        languageCode: "vi",
        title: item.title || `Exhibit #${item.id}`,
      },
    ],
  };
}

export function getExhibitById(id: number | string, includeUnpublished = true) {
  const raw = String(id).trim();
  if (!/^\d+$/.test(raw)) {
    return Promise.reject(new AppError("Exhibit id must be numeric", 400));
  }
  const query = includeUnpublished ? "?includeUnpublished=true" : "";
  const path = `/api/content/exhibits/${raw}${query}`;
  const token = getAccessToken();
  const req = token ? apiGetAuth<unknown>(path, token) : apiGet<unknown>(path);
  return req.then(normalizeExhibitDto);
}

export function getExhibitByCode(code: string, includeUnpublished = true) {
  const query = includeUnpublished ? "?includeUnpublished=true" : "";
  const path = `/api/content/exhibits/by-code/${encodeURIComponent(code.trim())}${query}`;
  const token = getAccessToken();
  const req = token ? apiGetAuth<unknown>(path, token) : apiGet<unknown>(path);
  return req.then(normalizeExhibitDto);
}

export async function createExhibit(payload: CreateExhibitDto) {
  const data = await apiPostAuth<unknown>("/api/content/exhibits", payload);
  if (typeof data === "number") {
    invalidateExhibitsListCache();
    return { id: data } as ExhibitDto;
  }
  const normalized = normalizeExhibitDto(data);
  if (!Number.isFinite(normalized.id) || normalized.id <= 0) {
    throw new Error("Create exhibit succeeded but no id was returned.");
  }
  invalidateExhibitsListCache();
  return normalized;
}

export function updateExhibit(id: number, payload: CreateExhibitDto) {
  return apiPutAuth<number>(`/api/content/exhibits/${id}`, payload).then((res) => {
    invalidateExhibitsListCache();
    return res;
  });
}

export function deleteExhibit(id: number) {
  return apiDeleteAuth<null>(`/api/content/exhibits/${id}`).then((res) => {
    invalidateExhibitsListCache();
    return res;
  });
}

export function publishExhibit(id: number) {
  return apiPostAuth<ExhibitDto>(`/api/content/exhibits/${id}/publish`).then((res) => {
    invalidateExhibitsListCache();
    return res;
  });
}

export function unpublishExhibit(id: number) {
  return apiPostAuth<ExhibitDto>(`/api/content/exhibits/${id}/unpublish`).then((res) => {
    invalidateExhibitsListCache();
    return res;
  });
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
  return apiGet<unknown[]>("/api/content/versions").then((data) =>
    (Array.isArray(data) ? data : []).map(normalizeContentVersionDto).filter((v) => v.id > 0),
  );
}

export function publishContentVersion(id: number) {
  return apiPostAuth<unknown>(`/api/content/versions/${id}/publish`);
}

export function getArAssets(exhibitId: number) {
  return apiGet<unknown>(`/api/content/exhibits/${exhibitId}/ar-assets`).then(
    (data) => unwrapArray(data).map(normalizeExhibitArassetDto),
  );
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
  return apiPostFormAuth<unknown>(
    `/api/content/exhibits/${exhibitId}/ar-assets/upload`,
    formData,
  ).then(normalizeExhibitArassetDto);
}

function normalizeSignUploadResponse(raw: unknown): SignUploadResponseDto {
  const o = asRecord(raw);
  return {
    cloudName: String(o.cloudName ?? o.CloudName ?? ""),
    apiKey: String(o.apiKey ?? o.ApiKey ?? ""),
    timestamp: Number(o.timestamp ?? o.Timestamp ?? 0),
    signature: String(o.signature ?? o.Signature ?? ""),
    folder: String(o.folder ?? o.Folder ?? ""),
    publicId: String(o.publicId ?? o.PublicId ?? ""),
    uploadUrl: String(o.uploadUrl ?? o.UploadUrl ?? ""),
    maxBytes: Number(o.maxBytes ?? o.MaxBytes ?? 0),
  };
}

export function signArAssetUpload(
  exhibitId: number,
  payload: SignUploadRequestDto,
) {
  return apiPostAuth<unknown>(
    `/api/content/exhibits/${exhibitId}/ar-assets/sign-upload`,
    payload,
  ).then(normalizeSignUploadResponse);
}

export function confirmArAssetUpload(
  exhibitId: number,
  payload: ConfirmUploadDto,
) {
  return apiPostAuth<unknown>(
    `/api/content/exhibits/${exhibitId}/ar-assets/confirm-upload`,
    payload,
  ).then(normalizeExhibitArassetDto);
}

/** Multipart upload to BE — 3D models are stored locally (up to 200 MB), not Cloudinary. */
export async function uploadArModel3d(exhibitId: number, file: File) {
  if (file.size > AR_MODEL_MAX_BYTES) {
    throw new AppError(
      `3D model is too large (${formatFileSize(file.size)}). Maximum is ${formatFileSize(AR_MODEL_MAX_BYTES)}.`,
    );
  }
  return uploadArAsset(exhibitId, "Model3D", file);
}

export function deleteArAsset(id: number) {
  return apiDeleteAuth<null>(`/api/content/ar-assets/${id}`);
}

export function migrateOldOverlayAssets() {
  return apiPostAuth<number>("/api/content/ar-assets/migrate-overlay");
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
  return apiGet<unknown>("/api/content/categories").then((data) =>
    unwrapArray(data).map(normalizeCategoryDto),
  );
}

export function createCategory(payload: CreateCategoryDto) {
  return apiPostAuth<unknown>("/api/content/categories", payload).then((data) =>
    data != null ? normalizeCategoryDto(data) : data,
  );
}

export function updateCategory(id: number, payload: CreateCategoryDto) {
  return apiPutAuth<unknown>(`/api/content/categories/${id}`, payload).then((data) =>
    data != null ? normalizeCategoryDto(data) : data,
  );
}

export function upsertCategoryTranslation(
  id: number,
  dto: {
    languageCode: string;
    categoryName: string;
    description?: string;
  },
) {
  return apiPutAuth<unknown>(`/api/content/categories/${id}/translations`, {
    categoryId: id,
    ...dto,
  });
}

export function deleteCategory(id: number) {
  return apiDeleteAuth<null>(`/api/content/categories/${id}`);
}

export function getThemes() {
  return apiGet<unknown>("/api/content/themes").then((data) =>
    unwrapArray(data).map(normalizeThemeDto),
  );
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
  return apiGet<unknown>("/api/content/tag-groups").then((data) =>
    unwrapArray(data).map(normalizeTagGroupDto),
  );
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
  return apiGet<unknown>("/api/content/tags").then((data) =>
    unwrapArray(data).map(normalizeTagDto),
  );
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
  return apiGet<unknown[]>(`/api/content/exhibits/${exhibitId}/tags`).then(
    (data) => (Array.isArray(data) ? data : []).map(normalizeTagDto),
  );
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
