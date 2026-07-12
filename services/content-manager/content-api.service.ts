import {
  apiDeleteAuth,
  apiGet,
  apiGetAuth,
  apiPost,
  apiPostAuth,
  apiPostFormAuth,
  apiPutAuth,
} from "@/services/api-client";
import { normalizeExhibitDto, normalizeTourRouteDto } from "@/lib/normalize-dto";
import type {
  AgeGroupDto,
  CategoryDto,
  CreateCategoryDto,
  CreateExhibitDto,
  CreateExhibitionDto,
  CreateOfflinePackageDto,
  CreateTagDto,
  CreateTagGroupDto,
  CreateThemeDto,
  CreateTourRouteDto,
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
  return apiPost<ExhibitDto>("/api/content/exhibits", payload);
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
  return apiPost<ExhibitionDto>("/api/content/exhibitions", payload);
}

export function getMuseumMaps() {
  return apiGet<MuseumMapDto[]>("/api/content/maps");
}

export function uploadMuseumMap(museumId: number, file: File, mapType: string) {
  const formData = new FormData();
  formData.append("MuseumId", String(museumId));
  formData.append("MapImage", file);
  formData.append("MapType", mapType);
  return apiPostFormAuth<MuseumMapDto>("/api/content/maps", formData);
}

export function getTourRoutes() {
  return apiGet<unknown[]>("/api/content/routes").then((data) =>
    (Array.isArray(data) ? data : []).map(normalizeTourRouteDto),
  );
}

export function createTourRoute(payload: CreateTourRouteDto) {
  return apiPost<TourRouteDto>("/api/content/routes", payload);
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
