import "server-only";

import { cookies } from "next/headers";

/** Must match `ACCESS_TOKEN_COOKIE` in auth.storage.ts */
const ACCESS_TOKEN_COOKIE = "museumar_access_token";

/** Access token for Server Components / Route Handlers (from auth cookie). */
export async function getServerAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
