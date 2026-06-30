import "server-only";

import { cookies } from "next/headers";
import { MUSEUM_ID_COOKIE } from "./auth.storage";

function parseMuseumId(raw: string | undefined): number | null {
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/**
 * Resolves the museum the signed-in user belongs to (SSR / Server Components).
 * BE stores MuseumId on User and adds a `MuseumId` claim to the JWT; login persists it in a cookie.
 */
export async function resolveActiveMuseumId(): Promise<number | null> {
  const cookieStore = await cookies();
  return parseMuseumId(cookieStore.get(MUSEUM_ID_COOKIE)?.value);
}
