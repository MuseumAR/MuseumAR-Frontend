/**
 * Repair UTF-8 text that was misread as Windows-1252/Latin-1 (common SQL Server seed issue).
 * Root fix on BE: re-seed with N'...' Unicode literals. This is a display fallback.
 *
 * Also handles MIXED strings (correct Vietnamese + mojibake room names embedded in
 * navigation instructions), which full-string decode cannot fix.
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

/** Keys that must stay byte-stable (tokens, URLs, codes). */
const SKIP_KEY =
  /^(accessToken|refreshToken|token|password|checkoutUrl|qrCode|qrCodeData|qrCodeImageUrl|mapImageUrl|thumbnailUrl|audioUrl|arOverlayUrl|arMarkerUrl|website|email|contactEmail|orderCode|ticketCode|exhibitCode|roomCode)$/i;

function isLatin1Char(char: string): boolean {
  if (CP1252_REVERSE.has(char)) return true;
  return char.charCodeAt(0) <= 0xff;
}

/** Telltale mojibake markers from UTF-8 misread as CP1252. */
function hasMojibakeMarker(s: string): boolean {
  return /Ã|Ä|Å|Æ|Â|Ð|Ñ|Ò|Ó|Ô|Õ|Ö|Ø|Ù|Ú|Û|Ü|Ý|Þ|ß|Œ|œ|Š|š|Ÿ|Ž|ž|ƒ|ˆ|˜/.test(
    s,
  );
}

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

function attemptDecode(input: string): string | null {
  const bytes = toLatin1Bytes(input);
  if (bytes.length === 0) return null;
  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (decoded && decoded !== input && !decoded.includes("\uFFFD")) {
      return decoded;
    }
  } catch {
    // keep trying
  }
  return null;
}

function tryRepairChunk(input: string): string {
  let cur = input;
  // Up to 3 passes for double/triple-encoded payloads
  for (let pass = 0; pass < 3; pass++) {
    let next = attemptDecode(cur);
    if (!next && cur.includes("Ã ")) {
      next = attemptDecode(cur.replace(/Ã /g, "Ã\u00A0"));
    }
    if (!next || next === cur) break;
    cur = next;
  }
  return cur;
}

function repairMixed(value: string): string {
  let out = "";
  let buf = "";

  const flush = () => {
    if (!buf) return;
    out += hasMojibakeMarker(buf) ? tryRepairChunk(buf) : buf;
    buf = "";
  };

  for (const ch of value) {
    if (isLatin1Char(ch)) {
      buf += ch;
    } else {
      flush();
      out += ch;
    }
  }
  flush();
  return out;
}

export function repairDisplayText(value: string | null | undefined): string {
  if (value == null || value === "") return value ?? "";

  // Pure latin-1 / mojibake payload (room names, map names, …)
  if ([...value].every(isLatin1Char)) {
    return tryRepairChunk(value);
  }

  // Mixed: correct Unicode + embedded mojibake (nav instructions, messages)
  return repairMixed(value);
}

export function repairJsonStrings<T>(value: T, key?: string): T {
  if (value == null) return value;

  if (typeof value === "string") {
    if (key && SKIP_KEY.test(key)) return value;
    if (/^(https?:\/\/|data:|eyJ)/i.test(value)) return value;
    return repairDisplayText(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => repairJsonStrings(item)) as T;
  }

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = repairJsonStrings(v, k);
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
    address?: string | null;
    description?: string | null;
  },
>(museum: T): T {
  return {
    ...museum,
    name: museum.name ? repairDisplayText(museum.name) : museum.name,
    city: museum.city ? repairDisplayText(museum.city) : museum.city,
    province: museum.province ? repairDisplayText(museum.province) : museum.province,
    address: museum.address ? repairDisplayText(museum.address) : museum.address,
    description: museum.description
      ? repairDisplayText(museum.description)
      : museum.description,
  };
}
