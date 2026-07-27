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
          title: String(pickField(tr, "title", "Title") ?? ""),
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
  return {
    id: Number(pickField(o, "id", "Id") ?? 0),
    name: String(pickField(o, "name", "Name") ?? ""),
    description: pickStr(o, "description", "Description") ?? null,
    address: pickStr(o, "address", "Address") ?? null,
    city: pickStr(o, "city", "City") ?? null,
    province: pickStr(o, "province", "Province") ?? null,
    country: pickStr(o, "country", "Country") ?? null,
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
      locationX: pickNum(sr, "locationX", "LocationX") ?? null,
      locationY: pickNum(sr, "locationY", "LocationY") ?? null,
    };
  });

  const translationsRaw = pickField<unknown[]>(o, "translations", "Translations") ?? [];
  const translations: import("@/types/api").TourRouteTranslationFE[] = (
    Array.isArray(translationsRaw) ? translationsRaw : []
  ).map((t) => {
    const tr = asRecord(t);
    return {
      languageCode: String(pickField(tr, "languageCode", "LanguageCode") ?? "vi"),
      routeName: String(pickField(tr, "routeName", "RouteName") ?? ""),
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
  return {
    id: Number(pickField(o, "id", "Id") ?? 0),
    name: String(pickField(o, "name", "Name") ?? ""),
    price: Number(pickField(o, "price", "Price") ?? 0),
    description: pickStr(o, "description", "Description") ?? null,
    museumId: Number(pickField(o, "museumId", "MuseumId") ?? 0),
    exhibitionId: pickNum(o, "exhibitionId", "ExhibitionId") ?? null,
    status: String(pickField(o, "status", "Status") ?? "Pending"),
  };
}

export function normalizeTicketDto(
  raw: unknown,
): import("@/types/api").TicketDto {
  const o = asRecord(raw);
  return {
    id: Number(pickField(o, "id", "Id") ?? 0),
    ticketCode: String(pickField(o, "ticketCode", "TicketCode") ?? ""),
    ticketTypeName: String(
      pickField(o, "ticketTypeName", "TicketTypeName") ?? "",
    ),
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
