/**
 * Resolve media URLs from BE (relative uploads, broken seed CDN, etc.)
 */

const FAKE_CDN_HOST = "cdn.museum.gov.vn";

const FAKE_CDN_MAP: Record<string, string> = {
  "/maps/hcm-ground-floor.png": "/maps/hcm-ground-floor.svg",
  "/maps/hcm-first-floor.png": "/maps/hcm-first-floor.svg",
  "/maps/hcm-ground-floor.svg": "/maps/hcm-ground-floor.svg",
  "/maps/hcm-first-floor.svg": "/maps/hcm-first-floor.svg",
};

function getApiOrigin(): string | null {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return null;
  try {
    return new URL(base).origin;
  } catch {
    return null;
  }
}

export function resolveMediaUrl(
  url: string | null | undefined,
): string {
  if (!url?.trim()) return "";

  const raw = url.trim();

  // Absolute URL
  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      if (parsed.hostname === FAKE_CDN_HOST) {
        const mapped = FAKE_CDN_MAP[parsed.pathname];
        if (mapped) return mapped;
        // Unknown fake CDN path → local generic placeholder
        return "/maps/hcm-ground-floor.svg";
      }
      return raw;
    } catch {
      return raw;
    }
  }

  // Protocol-relative
  if (raw.startsWith("//")) {
    return `https:${raw}`;
  }

  // App-local public assets
  if (raw.startsWith("/maps/")) {
    return FAKE_CDN_MAP[raw] ?? raw;
  }

  // BE uploads: /uploads/... → API origin
  if (raw.startsWith("/")) {
    const origin = getApiOrigin();
    return origin ? `${origin}${raw}` : raw;
  }

  return raw;
}

export function resolveMapImageUrl(url: string | null | undefined): string {
  return resolveMediaUrl(url);
}
