import {
  apiDeleteAuth,
  apiGet,
  apiGetAuth,
  apiPost,
  apiPostAuth,
} from "@/services/api-client";
import type {
  BookmarkDto,
  CreateAnalyticsLogDto,
  CreateBookmarkDto,
  CreateVisitedExhibitDto,
  OfflinePackageDto,
  VisitedExhibitDto,
} from "@/types/api";

export function trackAction(payload: CreateAnalyticsLogDto) {
  return apiPost<unknown>("/api/visitor/track-action", payload);
}

export function checkForUpdates(museumId: number) {
  return apiGet<OfflinePackageDto>(`/api/visitor/museums/${museumId}/sync-check`);
}

export function getVisitorProfile() {
  return apiGetAuth<unknown>("/api/visitor/profile");
}

export function getBookmarks() {
  return apiGetAuth<BookmarkDto[]>("/api/visitor/bookmarks");
}

export function addBookmark(payload: CreateBookmarkDto) {
  return apiPostAuth<BookmarkDto>("/api/visitor/bookmarks", payload);
}

export function removeBookmark(exhibitId: number) {
  return apiDeleteAuth<null>(`/api/visitor/bookmarks/${exhibitId}`);
}

export function getVisitedExhibits() {
  return apiGetAuth<VisitedExhibitDto[]>("/api/visitor/visited-exhibits");
}

export function trackVisitedExhibit(payload: CreateVisitedExhibitDto) {
  return apiPostAuth<VisitedExhibitDto>("/api/visitor/visited-exhibits", payload);
}
