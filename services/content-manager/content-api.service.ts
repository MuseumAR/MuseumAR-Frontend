import {
  apiDeleteAuth,
  apiGet,
  apiPost,
  apiPostAuth,
  apiPostFormAuth,
  apiPutAuth,
} from "@/services/api-client";
import type {
  CreateExhibitDto,
  CreateExhibitionDto,
  CreateMuseumMapDto,
  CreateOfflinePackageDto,
  CreateTourRouteDto,
  ExhibitArassetDto,
  ExhibitDto,
  ExhibitTranslationDto,
  ExhibitionDto,
  MuseumMapDto,
  OfflinePackageDto,
  TourRouteDto,
} from "@/types/api";

export function getExhibits(museumId: number) {
  return apiGet<ExhibitDto[]>(`/api/content/museums/${museumId}/exhibits`);
}

export function getExhibitById(id: number) {
  return apiGet<ExhibitDto>(`/api/content/exhibits/${id}`);
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

export function createContentVersion(
  museumId: number,
  versionNumber: string,
  description: string,
) {
  const params = new URLSearchParams({ versionNumber, description });
  return apiPostAuth<unknown>(
    `/api/content/museums/${museumId}/versions?${params.toString()}`,
  );
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

export function getOfflinePackages(museumId: number) {
  return apiGet<OfflinePackageDto[]>(`/api/content/museums/${museumId}/packages`);
}

export function generateOfflinePackage(museumId: number, payload: CreateOfflinePackageDto) {
  return apiPostAuth<OfflinePackageDto>(
    `/api/content/museums/${museumId}/packages/generate`,
    payload,
  );
}

export function getExhibitions(museumId: number) {
  return apiGet<ExhibitionDto[]>(`/api/content/museums/${museumId}/exhibitions`);
}

export function createExhibition(payload: CreateExhibitionDto) {
  return apiPost<ExhibitionDto>("/api/content/exhibitions", payload);
}

export function getMuseumMaps(museumId: number) {
  return apiGet<MuseumMapDto[]>(`/api/content/museums/${museumId}/maps`);
}

export function createMuseumMap(payload: CreateMuseumMapDto) {
  return apiPost<MuseumMapDto>("/api/content/maps", payload);
}

export function getTourRoutes(museumId: number) {
  return apiGet<TourRouteDto[]>(`/api/content/museums/${museumId}/routes`);
}

export function createTourRoute(payload: CreateTourRouteDto) {
  return apiPost<TourRouteDto>("/api/content/routes", payload);
}
