/**
 * Repair UTF-8 text that was misread as Windows-1252/Latin-1 when stored in SQL Server.
 * Root fix: re-seed DB with N'...' Unicode literals. This is a display fallback.
 */
const CP1252_REVERSE = new Map<string, number>([
  ["\u20AC", 0x80],
  ["\u201A", 0x82],
  ["\u0192", 0x83],
  ["\u201E", 0x84],
  ["\u2026", 0x85],
  ["\u2020", 0x86],
  ["\u2021", 0x87],
  ["\u02C6", 0x88],
  ["\u2030", 0x89],
  ["\u0160", 0x8a],
  ["\u2039", 0x8b],
  ["\u0152", 0x8c],
  ["\u017D", 0x8e],
  ["\u2018", 0x91],
  ["\u2019", 0x92],
  ["\u201C", 0x93],
  ["\u201D", 0x94],
  ["\u2022", 0x95],
  ["\u2013", 0x96],
  ["\u2014", 0x97],
  ["\u02DC", 0x98],
  ["\u2122", 0x99],
  ["\u0161", 0x9a],
  ["\u203A", 0x9b],
  ["\u0153", 0x9c],
  ["\u017E", 0x9e],
  ["\u0178", 0x9f],
]);

function toLatin1Bytes(value: string): Uint8Array {
  const bytes: number[] = [];
  for (const char of value) {
    const mapped = CP1252_REVERSE.get(char);
    if (mapped != null) {
      bytes.push(mapped);
      continue;
    }
    const code = char.charCodeAt(0);
    if (code <= 0xff) {
      bytes.push(code);
      continue;
    }
    return new Uint8Array(0);
  }
  return Uint8Array.from(bytes);
}

function decodeOnce(value: string): string | null {
  const bytes = toLatin1Bytes(value);
  if (bytes.length === 0) return null;

  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (decoded && decoded !== value && !decoded.includes("\uFFFD")) {
      return decoded;
    }
  } catch {
    // keep original
  }

  return null;
}

export function repairDisplayText(value: string | null | undefined): string {
  if (value == null || value === "") return value ?? "";
  if (/^(https?:|data:|blob:)/i.test(value)) return value;

  let current = value;
  for (let i = 0; i < 3; i++) {
    const next = decodeOnce(current);
    if (!next) break;
    current = next;
  }
  return current;
}

/** Recursively repair UTF-8 mojibake on every string in an API payload. */
export function repairJsonValue<T>(value: T): T {
  if (typeof value === "string") {
    return repairDisplayText(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => repairJsonValue(item)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = repairJsonValue(nested);
    }
    return out as T;
  }
  return value;
}

export function repairMuseumText<
  T extends {
    name?: string | null;
    city?: string | null;
    province?: string | null;
    country?: string | null;
    address?: string | null;
    description?: string | null;
  },
>(museum: T): T {
  const address = museum.address ? repairDisplayText(museum.address) : museum.address;
  let city = museum.city ? repairDisplayText(museum.city) : museum.city;
  let province = museum.province ? repairDisplayText(museum.province) : museum.province;
  let country = museum.country ? repairDisplayText(museum.country) : museum.country;

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
    name: museum.name ? repairDisplayText(museum.name) : museum.name,
    city,
    province,
    country,
    address,
    description: museum.description ? repairDisplayText(museum.description) : museum.description,
  };
}
