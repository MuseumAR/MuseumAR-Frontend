/** Pick first defined value among alternate API keys (camelCase / PascalCase / acronym). */
export function pickField<T = unknown>(
  raw: Record<string, unknown>,
  ...keys: string[]
): T | undefined {
  for (const key of keys) {
    if (raw[key] !== undefined && raw[key] !== null) {
      return raw[key] as T;
    }
  }
  return undefined;
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function pickStr(
  raw: Record<string, unknown>,
  ...keys: string[]
): string | null | undefined {
  const v = pickField<unknown>(raw, ...keys);
  if (v == null) return v as null | undefined;
  return String(v);
}

function pickNum(
  raw: Record<string, unknown>,
  ...keys: string[]
): number | null | undefined {
  const v = pickField<unknown>(raw, ...keys);
  if (v == null || v === "") return v as null | undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** Normalize exhibit payload — BE acronyms often serialize as qRCodeData / aROverlayUrl. */
export function normalizeExhibitDto(raw: unknown): import("@/types/api").ExhibitDto {
  const o = asRecord(raw);
  const translationsRaw = pickField<unknown[]>(o, "translations", "Translations") ?? [];
  const metaRaw = pickField<unknown>(o, "exhibitMetadata", "ExhibitMetadata");
  const meta = asRecord(metaRaw);

  return {
    id: Number(pickField(o, "id", "Id") ?? 0),
    museumId: Number(pickField(o, "museumId", "MuseumId") ?? 0),
    categoryId: pickNum(o, "categoryId", "CategoryId") ?? null,
    exhibitCode: pickStr(o, "exhibitCode", "ExhibitCode") ?? null,
    qrCodeData:
      pickStr(o, "qrCodeData", "QRCodeData", "qRCodeData", "QrcodeData") ?? null,
    qrCodeImageUrl:
      pickStr(
        o,
        "qrCodeImageUrl",
        "QRCodeImageUrl",
        "qRCodeImageUrl",
        "QrcodeImageUrl",
      ) ?? null,
    thumbnailUrl: pickStr(o, "thumbnailUrl", "ThumbnailUrl") ?? null,
    arOverlayUrl:
      pickStr(
        o,
        "arOverlayUrl",
        "AROverlayUrl",
        "aROverlayUrl",
        "AroverlayUrl",
      ) ?? null,
    arMarkerUrl:
      pickStr(o, "arMarkerUrl", "ARMarkerUrl", "aRMarkerUrl", "ArmarkerUrl") ??
      null,
    status: String(pickField(o, "status", "Status") ?? ""),
    publishedAt: pickStr(o, "publishedAt", "PublishedAt") ?? null,
    mapId: pickNum(o, "mapId", "MapId") ?? null,
    mapName: pickStr(o, "mapName", "MapName") ?? null,
    floorNumber: pickNum(o, "floorNumber", "FloorNumber") ?? null,
    roomId: pickNum(o, "roomId", "RoomId") ?? null,
    roomCode: pickStr(o, "roomCode", "RoomCode") ?? null,
    roomName: pickStr(o, "roomName", "RoomName") ?? null,
    exhibitMetadata: metaRaw
      ? {
          ageGroupId: pickNum(meta, "ageGroupId", "AgeGroupId") ?? null,
          era: pickStr(meta, "era", "Era") ?? null,
          historicalEvent:
            pickStr(meta, "historicalEvent", "HistoricalEvent") ?? null,
        }
      : null,
    translations: (Array.isArray(translationsRaw) ? translationsRaw : []).map(
      (t) => {
        const tr = asRecord(t);
        return {
          id: pickNum(tr, "id", "Id") ?? null,
          exhibitId: Number(pickField(tr, "exhibitId", "ExhibitId") ?? 0),
          languageCode: String(pickField(tr, "languageCode", "LanguageCode") ?? "vi"),
          title: pickStr(tr, "title", "Title") ?? "",
          description: pickStr(tr, "description", "Description") ?? null,
          audioUrl: pickStr(tr, "audioUrl", "AudioUrl") ?? null,
          audioDuration: pickNum(tr, "audioDuration", "AudioDuration") ?? null,
        };
      },
    ),
  };
}

/** Slim BE MuseumDto + optional profile fields if present on payload. */
export function normalizeMuseumDto(raw: unknown): import("@/types/api").MuseumDto {
  const o = asRecord(raw);
  const address = pickStr(o, "address", "Address") ?? null;
  let city = pickStr(o, "city", "City") ?? null;
  let province = pickStr(o, "province", "Province") ?? null;
  let country = pickStr(o, "country", "Country") ?? null;

  if (!country || !country.trim() || country === "—" || country === "-") {
    country = "Việt Nam";
  }

  if (address) {
    const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const extractedCity = parts[parts.length - 1];
      const extractedProvince = parts[parts.length - 2];
      if (!city || !city.trim() || city === "—" || city === "-") {
        city = extractedCity;
      }
      if (!province || !province.trim() || province === "—" || province === "-") {
        province = extractedProvince;
      }
    } else if (parts.length === 1) {
      if (!city || !city.trim() || city === "—" || city === "-") {
        city = parts[0];
      }
      if (!province || !province.trim() || province === "—" || province === "-") {
        province = parts[0];
      }
    }
  }

  if (!city || !city.trim() || city === "—" || city === "-") {
    city = "Thành phố Hồ Chí Minh";
  }
  if (!province || !province.trim() || province === "—" || province === "-") {
    province = "Quận 1";
  }

  return {
    id: Number(pickField(o, "id", "Id") ?? 0),
    name: pickStr(o, "name", "Name") ?? "",
    description: pickStr(o, "description", "Description") ?? null,
    address,
    city,
    province,
    country,
    latitude: pickNum(o, "latitude", "Latitude") ?? null,
    longitude: pickNum(o, "longitude", "Longitude") ?? null,
    status: String(pickField(o, "status", "Status") ?? "Active"),
    thumbnailUrl: pickStr(o, "thumbnailUrl", "ThumbnailUrl") ?? null,
    openingHours: pickStr(o, "openingHours", "OpeningHours") ?? null,
    contactPhone: pickStr(o, "contactPhone", "ContactPhone") ?? null,
    contactEmail: pickStr(o, "contactEmail", "ContactEmail") ?? null,
    website: pickStr(o, "website", "Website") ?? null,
  };
}

/**
 * Tour routes: BE DTO has Name / EstimatedDurationMinutes but entity mapping
 * often leaves them empty — also accept EstimatedMinutes.
 */
export function normalizeTourRouteDto(
  raw: unknown,
): import("@/types/api").TourRouteDto {
  const o = asRecord(raw);
  const id = Number(pickField(o, "id", "Id") ?? 0);
  const name =
    pickStr(o, "name", "Name")?.trim() ||
    `Route #${id}`;

  const stopsRaw = pickField<unknown[]>(o, "stops", "Stops") ?? [];
  const stops: import("@/types/api").TourRouteStopDto[] = (
    Array.isArray(stopsRaw) ? stopsRaw : []
  ).map((s) => {
    const sr = asRecord(s);
    return {
      exhibitId: Number(pickField(sr, "exhibitId", "ExhibitId") ?? 0),
      exhibitName: pickStr(sr, "exhibitName", "ExhibitName") ?? null,
      exhibitCode: pickStr(sr, "exhibitCode", "ExhibitCode") ?? null,
      stopOrder: Number(pickField(sr, "stopOrder", "StopOrder") ?? 0),
      estimatedMinutes: pickNum(sr, "estimatedMinutes", "EstimatedMinutes") ?? null,
      mapId: pickNum(sr, "mapId", "MapId") ?? null,
      floorNumber: pickNum(sr, "floorNumber", "FloorNumber") ?? null,
      roomId: pickNum(sr, "roomId", "RoomId") ?? null,
      roomCode: pickStr(sr, "roomCode", "RoomCode") ?? null,
      roomName: pickStr(sr, "roomName", "RoomName") ?? null,
    };
  });

  const translationsRaw = pickField<unknown[]>(o, "translations", "Translations") ?? [];
  const translations: import("@/types/api").TourRouteTranslationFE[] = (
    Array.isArray(translationsRaw) ? translationsRaw : []
  ).map((t) => {
    const tr = asRecord(t);
    return {
      languageCode: String(pickField(tr, "languageCode", "LanguageCode") ?? "vi"),
      routeName: pickStr(tr, "routeName", "RouteName") ?? "",
      description: pickStr(tr, "description", "Description") ?? null,
    };
  });

  return {
    id,
    museumId: Number(pickField(o, "museumId", "MuseumId") ?? 0),
    name,
    description: pickStr(o, "description", "Description") ?? null,
    estimatedDurationMinutes:
      pickNum(
        o,
        "estimatedDurationMinutes",
        "EstimatedDurationMinutes",
        "estimatedMinutes",
        "EstimatedMinutes",
      ) ?? null,
    thumbnailUrl: pickStr(o, "thumbnailUrl", "ThumbnailUrl") ?? null,
    ageGroupId: pickNum(o, "ageGroupId", "AgeGroupId") ?? null,
    ageGroupName: pickStr(o, "ageGroupName", "AgeGroupName") ?? null,
    exhibitionId: pickNum(o, "exhibitionId", "ExhibitionId") ?? null,
    exhibitionName: pickStr(o, "exhibitionName", "ExhibitionName") ?? null,
    isDefault: Boolean(pickField(o, "isDefault", "IsDefault") ?? false),
    status: String(pickField(o, "status", "Status") ?? "Active"),
    createdAt: pickStr(o, "createdAt", "CreatedAt") ?? null,
    updatedAt: pickStr(o, "updatedAt", "UpdatedAt") ?? null,
    stops,
    translations,
  };
}

export function normalizeTicketTypeDto(
  raw: unknown,
): import("@/types/api").TicketTypeDto {
  const o = asRecord(raw);
  const activePromosRaw = pickField<unknown[]>(o, "activePromotions", "ActivePromotions") ?? [];
  const activePromotions: import("@/types/api").TicketPromotionDto[] = (
    Array.isArray(activePromosRaw) ? activePromosRaw : []
  ).map((p) => {
    const pr = asRecord(p);
    return {
      id: Number(pickField(pr, "id", "Id") ?? 0),
      ticketTypeId: Number(pickField(pr, "ticketTypeId", "TicketTypeId") ?? 0),
      name: pickStr(pr, "name", "Name") ?? "",
      nameEn: pickStr(pr, "nameEn", "NameEn") ?? null,
      description: pickStr(pr, "description", "Description") ?? null,
      descriptionEn: pickStr(pr, "descriptionEn", "DescriptionEn") ?? null,
      discountType:
        pickField(pr, "discountType", "DiscountType") === "FixedAmount"
          ? "FixedAmount"
          : "Percentage",
      discountValue: Number(pickField(pr, "discountValue", "DiscountValue") ?? 0),
      startDate: String(pickField(pr, "startDate", "StartDate") ?? ""),
      endDate: String(pickField(pr, "endDate", "EndDate") ?? ""),
      isActive: Boolean(pickField(pr, "isActive", "IsActive") ?? false),
    };
  });

  return {
    id: Number(pickField(o, "id", "Id") ?? 0),
    name: pickStr(o, "name", "Name") ?? "",
    nameEn: pickStr(o, "nameEn", "NameEn") ?? null,
    price: Number(pickField(o, "price", "Price") ?? 0),
    description: pickStr(o, "description", "Description") ?? null,
    descriptionEn: pickStr(o, "descriptionEn", "DescriptionEn") ?? null,
    museumId: Number(pickField(o, "museumId", "MuseumId") ?? 0),
    exhibitionId: pickNum(o, "exhibitionId", "ExhibitionId") ?? null,
    status: String(pickField(o, "status", "Status") ?? "Pending"),
    isActive: Boolean(pickField(o, "isActive", "IsActive") ?? true),
    activePromotions,
    originalPrice: pickNum(o, "originalPrice", "OriginalPrice") ?? null,
  };
}

export function normalizeTicketDto(
  raw: unknown,
): import("@/types/api").TicketDto {
  const o = asRecord(raw);
  return {
    id: Number(pickField(o, "id", "Id") ?? 0),
    ticketCode: String(pickField(o, "ticketCode", "TicketCode") ?? ""),
    ticketTypeName: pickStr(o, "ticketTypeName", "TicketTypeName") ?? "",
    price: pickNum(o, "price", "Price") ?? 0,
    purchaseDate: String(pickField(o, "purchaseDate", "PurchaseDate") ?? ""),
    validDate: pickStr(o, "validDate", "ValidDate") ?? null,
    status: String(pickField(o, "status", "Status") ?? ""),
  };
}

export function normalizeCreateOrderResponse(
  raw: unknown,
): import("@/types/api").CreateOrderResponseDto {
  const o = asRecord(raw);
  return {
    orderCode: String(pickField(o, "orderCode", "OrderCode") ?? ""),
    checkoutUrl: pickStr(o, "checkoutUrl", "CheckoutUrl", "paymentUrl", "PaymentUrl") ?? null,
    qrCode: pickStr(o, "qrCode", "QrCode", "QRCode") ?? null,
    amount: pickNum(o, "amount", "Amount") ?? null,
  };
}

export function normalizeRoomDto(raw: unknown): import("@/types/api").RoomDto {
  const o = asRecord(raw);
  return {
    id: Number(pickField(o, "id", "Id") ?? 0),
    museumId: Number(pickField(o, "museumId", "MuseumId") ?? 0),
    mapId: pickNum(o, "mapId", "MapId") ?? null,
    roomCode: String(pickField(o, "roomCode", "RoomCode") ?? ""),
    roomName: pickStr(o, "roomName", "RoomName") ?? "",
    floorNumber: Number(pickField(o, "floorNumber", "FloorNumber") ?? 1),
    description: pickStr(o, "description", "Description") ?? null,
    createdAt: pickStr(o, "createdAt", "CreatedAt") ?? undefined,
    updatedAt: pickStr(o, "updatedAt", "UpdatedAt") ?? undefined,
  };
}

export function normalizeMuseumMapDto(
  raw: unknown,
): import("@/types/api").MuseumMapDto {
  const o = asRecord(raw);
  return {
    id: Number(pickField(o, "id", "Id") ?? 0),
    museumId: Number(pickField(o, "museumId", "MuseumId") ?? 0),
    mapImageUrl: pickStr(o, "mapImageUrl", "MapImageUrl") ?? "",
    mapType: pickStr(o, "mapType", "MapType") ?? "floor",
    floorNumber: pickNum(o, "floorNumber", "FloorNumber") ?? undefined,
    mapName: pickStr(o, "mapName", "MapName") ?? undefined,
  };
}

export function normalizeMuseumDashboardDto(
  raw: unknown,
): import("@/types/api").MuseumDashboardDto {
  const o = asRecord(raw);
  const scans = pickField<unknown[]>(o, "exhibitScanStats", "ExhibitScanStats") ?? [];
  const popular = pickField<unknown[]>(o, "popularExhibits", "PopularExhibits") ?? [];
  const langs = pickField<unknown[]>(o, "languageUsageStats", "LanguageUsageStats") ?? [];

  return {
    totalQrScans: pickNum(o, "totalQrScans", "TotalQrScans") ?? 0,
    averageListeningDurationMinutes:
      pickNum(o, "averageListeningDurationMinutes", "AverageListeningDurationMinutes") ?? 0,
    totalOfflineDownloads: pickNum(o, "totalOfflineDownloads", "TotalOfflineDownloads") ?? 0,
    exhibitScanStats: (Array.isArray(scans) ? scans : []).map((item) => {
      const s = asRecord(item);
      return {
        exhibitId: pickNum(s, "exhibitId", "ExhibitId") ?? 0,
        exhibitName: pickStr(s, "exhibitName", "ExhibitName") ?? "",
        scanCount: pickNum(s, "scanCount", "ScanCount") ?? 0,
      };
    }),
    popularExhibits: (Array.isArray(popular) ? popular : []).map((item) => {
      const p = asRecord(item);
      return {
        exhibitId: pickNum(p, "exhibitId", "ExhibitId") ?? 0,
        exhibitName: pickStr(p, "exhibitName", "ExhibitName") ?? "",
        totalInteractions: pickNum(p, "totalInteractions", "TotalInteractions") ?? 0,
        avgDurationSeconds: pickNum(p, "avgDurationSeconds", "AvgDurationSeconds") ?? 0,
      };
    }),
    languageUsageStats: (Array.isArray(langs) ? langs : []).map((item) => {
      const l = asRecord(item);
      return {
        languageCode: pickStr(l, "languageCode", "LanguageCode") ?? "",
        usageCount: pickNum(l, "usageCount", "UsageCount") ?? 0,
        percentage: pickNum(l, "percentage", "Percentage") ?? 0,
      };
    }),
  };
}

/** Fill empty city/province/country from address — not encoding repair. */
export function fillMuseumLocationDefaults<
  T extends {
    name?: string | null;
    city?: string | null;
    province?: string | null;
    country?: string | null;
    address?: string | null;
    description?: string | null;
  },
>(museum: T): T {
  const address = museum.address;
  let city = museum.city;
  let province = museum.province;
  let country = museum.country;

  if (!country || !country.trim() || country === "—" || country === "-") {
    country = "Việt Nam";
  }

  if (address) {
    const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const extractedCity = parts[parts.length - 1];
      const extractedProvince = parts[parts.length - 2];
      if (!city || !city.trim() || city === "—" || city === "-") {
        city = extractedCity;
      }
      if (!province || !province.trim() || province === "—" || province === "-") {
        province = extractedProvince;
      }
    } else if (parts.length === 1) {
      if (!city || !city.trim() || city === "—" || city === "-") {
        city = parts[0];
      }
      if (!province || !province.trim() || province === "—" || province === "-") {
        province = parts[0];
      }
    }
  }

  if (!city || !city.trim() || city === "—" || city === "-") {
    city = "Thành phố Hồ Chí Minh";
  }
  if (!province || !province.trim() || province === "—" || province === "-") {
    province = "Quận 1";
  }

  return {
    ...museum,
    city,
    province,
    country,
    address,
  };
}

export function normalizeContentVersionDto(
  raw: unknown,
): import("@/types/api").ContentVersionDto {
  const o = asRecord(raw);
  return {
    id: Number(pickField(o, "id", "Id") ?? 0),
    museumId: Number(pickField(o, "museumId", "MuseumId") ?? 0),
    versionNumber: String(pickField(o, "versionNumber", "VersionNumber") ?? ""),
    changeDescription:
      pickStr(o, "changeDescription", "ChangeDescription") ?? null,
    status: String(pickField(o, "status", "Status") ?? ""),
    createdAt: String(pickField(o, "createdAt", "CreatedAt") ?? ""),
  };
}
