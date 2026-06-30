// ─── Shared response wrapper (BE ResponseModel) ─────────────────────────────

export type ApiResponse<T = unknown> = {
  id?: number;
  statusCode: number;
  status: string;
  message: string;
  data: T;
};

// ─── Museum ─────────────────────────────────────────────────────────────────

export type MuseumDto = {
  id: number;
  name: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  status: string;
  thumbnailUrl?: string | null;
};

export type CreateMuseumDto = {
  name: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
};

// ─── Museum dashboard / analytics ───────────────────────────────────────────

export type ExhibitScanStatDto = {
  exhibitId: number;
  exhibitName: string;
  scanCount: number;
};

export type PopularExhibitDto = {
  exhibitId: number;
  exhibitName: string;
  totalInteractions: number;
  avgDurationSeconds: number;
};

export type LanguageUsageDto = {
  languageCode: string;
  usageCount: number;
  percentage: number;
};

export type MuseumDashboardDto = {
  totalQrScans: number;
  averageListeningDurationMinutes: number;
  totalOfflineDownloads: number;
  exhibitScanStats: ExhibitScanStatDto[];
  popularExhibits: PopularExhibitDto[];
  languageUsageStats: LanguageUsageDto[];
};

export type CreateAnalyticsLogDto = {
  museumId: number;
  exhibitId?: number | null;
  actionType: string;
  languageUsed?: string | null;
  deviceType?: string | null;
  searchQuery?: string | null;
};

export type DashboardStatsDto = {
  totalExhibits: number;
  totalTicketsSold: number;
  totalRevenue: number;
  totalArScans: number;
  totalAudioPlays: number;
};

// ─── Exhibit ──────────────────────────────────────────────────────────────────

export type ExhibitTranslationDto = {
  id?: number | null;
  exhibitId: number;
  languageCode: string;
  title: string;
  description?: string | null;
  audioUrl?: string | null;
  audioDuration?: number | null;
};

export type ExhibitDto = {
  id: number;
  museumId: number;
  categoryId?: number | null;
  exhibitCode?: string | null;
  qrCodeData?: string | null;
  qrCodeImageUrl?: string | null;
  thumbnailUrl?: string | null;
  arOverlayUrl?: string | null;
  arMarkerUrl?: string | null;
  status: string;
  publishedAt?: string | null;
  translations: ExhibitTranslationDto[];
};

export type CreateExhibitDto = {
  museumId: number;
  categoryId?: number | null;
  exhibitCode?: string | null;
  thumbnailUrl?: string | null;
  arOverlayUrl?: string | null;
  arMarkerUrl?: string | null;
  status?: string;
  translations: ExhibitTranslationDto[];
};

// ─── Exhibition ───────────────────────────────────────────────────────────────

export type ExhibitionDto = {
  id: number;
  museumId: number;
  thumbnailUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
};

export type CreateExhibitionDto = {
  museumId: number;
  startDate?: string | null;
  endDate?: string | null;
  status?: string;
};

// ─── AR asset ─────────────────────────────────────────────────────────────────

export type ExhibitArassetDto = {
  id: number;
  exhibitId: number;
  assetUrl?: string | null;
  assetType?: string | null;
  description?: string | null;
  createdAt: string;
};

// ─── Content version ──────────────────────────────────────────────────────────

export type ContentVersionDto = {
  id: number;
  museumId: number;
  versionNumber: string;
  changeDescription?: string | null;
  status: string;
  createdAt: string;
};

// ─── Offline package ──────────────────────────────────────────────────────────

export type CreateOfflinePackageDto = {
  museumId: number;
  versionId: number;
};

export type OfflinePackageDto = {
  id: number;
  museumId: number;
  versionId: number;
  packageUrl?: string | null;
  checksum?: string | null;
  status?: string | null;
  arassetCount?: number | null;
  createdAt: string;
};

// ─── Museum map ───────────────────────────────────────────────────────────────

export type MuseumMapDto = {
  id: number;
  museumId: number;
  mapImageUrl: string;
  mapType: string;
  floorNumber: number;
  mapName?: string | null;
};

export type CreateMuseumMapDto = {
  museumId: number;
  mapImageUrl: string;
  mapType: string;
  floorNumber?: number;
  mapName?: string | null;
};

// ─── Tour route ───────────────────────────────────────────────────────────────

export type TourRouteDto = {
  id: number;
  museumId: number;
  name: string;
  estimatedDurationMinutes?: number | null;
};

export type CreateTourRouteDto = {
  museumId: number;
  name: string;
  estimatedDurationMinutes?: number | null;
};

// ─── Ticketing ────────────────────────────────────────────────────────────────

export type TicketTypeDto = {
  id: number;
  name: string;
  price: number;
  description?: string | null;
  museumId: number;
  exhibitionId?: number | null;
};

export type CreateTicketTypeDto = {
  museumId: number;
  exhibitionId?: number | null;
  name: string;
  price: number;
  description?: string | null;
  isActive?: boolean;
};

export type CreateOrderRequestDto = {
  ticketTypeId: number;
  quantity: number;
};

export type TicketDto = {
  id: number;
  ticketCode: string;
  ticketTypeName: string;
  purchaseDate: string;
  validDate?: string | null;
  status: string;
};

// ─── Visitor ──────────────────────────────────────────────────────────────────

export type BookmarkDto = {
  id: number;
  visitorId: number;
  exhibitId: number;
  createdAt: string;
};

export type CreateBookmarkDto = {
  exhibitId: number;
};

export type VisitedExhibitDto = {
  id: number;
  visitorId: number;
  exhibitId: number;
  visitedAt: string;
  timeSpentSeconds?: number | null;
};

export type CreateVisitedExhibitDto = {
  exhibitId: number;
  timeSpentSeconds?: number | null;
};

// ─── System config ────────────────────────────────────────────────────────────

export type SystemConfigDto = {
  id: number;
  configKey: string;
  configValue: string;
  description?: string | null;
};

export type UpdateSystemConfigDto = {
  configValue: string;
  description?: string | null;
};
