// ─── Shared response wrapper (BE ResponseModel) ─────────────────────────────

export type ApiResponse<T = unknown> = {
  id?: number;
  statusCode: number;
  status: string;
  message: string;
  data: T;
};

// ─── Museum ─────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/museum-profile returns a slim BE DTO:
 * id, name, description, address, city, status, thumbnailUrl.
 * Extra profile fields are optional — only filled if BE expands the payload.
 * PUT UpdateMuseumProfileDto can send the full profile set.
 */
export type MuseumDto = {
  id: number;
  name: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  /** Not on current BE MuseumDto GET — kept for UI / future */
  province?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  thumbnailUrl?: string | null;
  openingHours?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  website?: string | null;
};

export type UpdateMuseumProfileDto = {
  name: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  thumbnailUrl?: string | null;
  openingHours?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  website?: string | null;
};

/** @deprecated Prefer UpdateMuseumProfileDto — kept as alias for form compatibility */
export type CreateMuseumDto = UpdateMuseumProfileDto;

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
  /** Normalized from qrCodeData / qRCodeData / QRCodeData */
  qrCodeData?: string | null;
  qrCodeImageUrl?: string | null;
  thumbnailUrl?: string | null;
  /** Normalized from arOverlayUrl / aROverlayUrl / AROverlayUrl */
  arOverlayUrl?: string | null;
  arMarkerUrl?: string | null;
  status: string;
  publishedAt?: string | null;
  exhibitMetadata?: ExhibitMetadataDto | null;
  translations: ExhibitTranslationDto[];
};

export type ExhibitMetadataDto = {
  ageGroupId?: number | null;
  era?: string | null;
  historicalEvent?: string | null;
};

export type CreateExhibitDto = {
  museumId: number;
  categoryId?: number | null;
  exhibitCode?: string | null;
  thumbnailUrl?: string | null;
  arOverlayUrl?: string | null;
  arMarkerUrl?: string | null;
  status?: string;
  exhibitMetadata?: ExhibitMetadataDto | null;
  translations: ExhibitTranslationDto[];
};

// ─── Exhibition ───────────────────────────────────────────────────────────────

export type ExhibitionDto = {
  id: number;
  museumId: number;
  themeId?: number | null;
  name?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
};

export type CreateExhibitionDto = {
  museumId: number;
  themeId?: number | null;
  name: string;
  description?: string | null;
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
  versionId: number;
  museumId?: number;
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
  /**
   * BE maps entity MapName → MapType on the DTO.
   * Seeded maps often put the display name here (e.g. "Bản đồ Tầng trệt").
   */
  mapType: string;
  /** Not on current BE MuseumMapDto — optional if payload expands */
  floorNumber?: number;
  mapName?: string | null;
};

export type CreateMuseumMapDto = {
  museumId: number;
  mapType: string;
};

// ─── Tour route ───────────────────────────────────────────────────────────────

export type TourRouteStopDto = {
  exhibitId: number;
  exhibitName?: string | null;
  exhibitCode?: string | null;
  stopOrder: number;
  estimatedMinutes?: number | null;
  mapId?: number | null;
  floorNumber?: number | null;
  locationX?: number | null;
  locationY?: number | null;
};

export type TourRouteTranslationFE = {
  languageCode: string;
  routeName: string;
  description?: string | null;
};

export type TourRouteDto = {
  id: number;
  museumId: number;
  /** May be empty from BE mapping — FE falls back to `Route #{id}` */
  name: string;
  description?: string | null;
  /** Also accepts EstimatedMinutes from entity-shaped payloads */
  estimatedDurationMinutes?: number | null;
  thumbnailUrl?: string | null;
  ageGroupId?: number | null;
  ageGroupName?: string | null;
  exhibitionId?: number | null;
  exhibitionName?: string | null;
  isDefault: boolean;
  status: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  stops: TourRouteStopDto[];
  translations: TourRouteTranslationFE[];
};

export type CreateTourRouteDto = {
  museumId: number;
  name: string;
  estimatedDurationMinutes?: number | null;
  ageGroupId?: number | null;
  exhibitionId?: number | null;
  isDefault?: boolean;
  thumbnailUrl?: string | null;
  stops?: CreateTourRouteStopDto[];
  translations?: TourRouteTranslationFE[];
};

export type UpdateTourRouteDto = {
  name?: string | null;
  estimatedDurationMinutes?: number | null;
  ageGroupId?: number | null;
  exhibitionId?: number | null;
  isDefault?: boolean;
  thumbnailUrl?: string | null;
  status?: string | null;
};

export type CreateTourRouteStopDto = {
  exhibitId: number;
  stopOrder: number;
  estimatedMinutes?: number | null;
};

// ─── Ticketing ────────────────────────────────────────────────────────────────

export type TicketTypeDto = {
  id: number;
  name: string;
  price: number;
  description?: string | null;
  museumId: number;
  exhibitionId?: number | null;
  status: string;
  /** Create-only on BE today — not returned on list DTO */
  isActive?: boolean;
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

/** POST /api/ticketing/create-order — returns orderCode and optional PayOS link/QR */
export type CreateOrderResponseDto = {
  orderCode: string;
  checkoutUrl?: string | null;
  qrCode?: string | null;
  amount?: number | null;
};

export type TicketDto = {
  id: number;
  ticketCode: string;
  ticketTypeName: string;
  purchaseDate: string;
  validDate?: string | null;
  status: string;
};

/**
 * Proposed BE contract — GET /api/ticketing/my-tickets/{id}
 * (not implemented on BE yet; FE uses mock detail for UX / handoff)
 */
export type TicketDetailDto = {
  id: number;
  ticketCode: string;
  status: string;
  purchaseDate: string;
  validDate?: string | null;
  ticketType: {
    id: number;
    name: string;
    price: number;
    description?: string | null;
  };
  museum: {
    id: number;
    name: string;
    address?: string | null;
  };
  exhibition?: {
    id: number;
    name: string;
  } | null;
  order: {
    orderCode: string;
    totalAmount: number;
    currency: string;
    paymentStatus: string;
    paymentMethod?: string | null;
    paidAt?: string | null;
  };
  /** Optional QR payload / image for check-in */
  qrCodeData?: string | null;
  qrCodeImageUrl?: string | null;
};

/**
 * Proposed enrichment for GET /api/ticketing/types (list or GET /types/{id})
 */
export type TicketTypeDetailDto = {
  id: number;
  name: string;
  price: number;
  description?: string | null;
  isActive: boolean;
  museum: {
    id: number;
    name: string;
    address?: string | null;
    thumbnailUrl?: string | null;
  };
  exhibition?: {
    id: number;
    name: string;
  } | null;
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

// ─── Admin users ──────────────────────────────────────────────────────────────

export type UserResponseDto = {
  id: number;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  roleId: number;
  roleName: string;
  museumId?: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateUserDto = {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string | null;
  roleId: number;
  museumId?: number | null;
};

export type UpdateUserDto = {
  fullName: string;
  phoneNumber?: string | null;
  roleId: number;
  status: string;
  museumId?: number | null;
  password?: string | null;
};

export type AuditLogDto = {
  id: number;
  userId?: number | null;
  action?: string | null;
  entityType?: string | null;
  entityId?: number | null;
  oldValues?: string | null;
  newValues?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
};

export type PagedAuditLogsDto = {
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: AuditLogDto[];
};

// ─── Content taxonomy ─────────────────────────────────────────────────────────

export type CategoryTranslationDto = {
  id?: number | null;
  categoryId: number;
  languageCode: string;
  categoryName: string;
  description?: string | null;
};

export type CategoryDto = {
  id: number;
  museumId?: number | null;
  parentId?: number | null;
  sortOrder: number;
  iconUrl?: string | null;
  status: string;
  categoryTranslations: CategoryTranslationDto[];
};

export type ThemeDto = {
  id: number;
  museumId?: number | null;
  themeName: string;
  description?: string | null;
};

export type AgeGroupDto = {
  id: number;
  groupName: string;
  minAge?: number | null;
  maxAge?: number | null;
};

export type TagGroupDto = {
  id: number;
  groupName: string;
  sortOrder: number;
};

export type TagDto = {
  id: number;
  tagGroupId: number;
  tagName: string;
  sortOrder: number;
};

export type CreateCategoryDto = {
  museumId?: number | null;
  parentId?: number | null;
  sortOrder: number;
  iconUrl?: string | null;
  status: string;
  categoryTranslations: Array<{
    id?: number | null;
    categoryId?: number;
    languageCode: string;
    categoryName: string;
    description?: string | null;
  }>;
};

export type CreateThemeDto = {
  museumId?: number | null;
  themeName: string;
  description?: string | null;
};

export type CreateTagGroupDto = {
  groupName: string;
  sortOrder: number;
};

export type CreateTagDto = {
  tagGroupId: number;
  tagName: string;
  sortOrder: number;
};
