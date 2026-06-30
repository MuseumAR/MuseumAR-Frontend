function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  if (typeof Buffer !== "undefined") {
    return Buffer.from(base64, "base64").toString("utf8");
  }
  return atob(base64);
}

export function decodeJwtPayload(
  token: string,
): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    return JSON.parse(base64UrlDecode(parts[1])) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** MuseumId is embedded in JWT when the user belongs to a museum (BE AuthService). */
export function getMuseumIdFromAccessToken(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const raw = payload.MuseumId ?? payload.museumId;
  if (raw === undefined || raw === null) return null;

  const id = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}
