import { getMuseumIdFromAccessToken } from "@/lib/jwt";
import { canonicalRoleName } from "@/lib/roles";
import type { LoginResponseDto } from "./auth.types";

const ACCESS_TOKEN_KEY = "museumar_access_token";
const REFRESH_TOKEN_KEY = "museumar_refresh_token";
const AUTH_USER_KEY = "museumar_auth_user";
export const MUSEUM_ID_COOKIE = "museumar_museum_id";
/** Readable by SSR so authenticated GETs work in Server Components */
export const ACCESS_TOKEN_COOKIE = "museumar_access_token";

export const AUTH_CHANGED_EVENT = "museumar-auth-changed";

function notifyAuthChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
}

function setCookie(name: string, value: string | null, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  if (value) {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
  } else {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  }
}

function setMuseumIdCookie(museumId: number | null): void {
  if (museumId != null && museumId > 0) {
    setCookie(MUSEUM_ID_COOKIE, String(museumId), 86400);
  } else {
    setCookie(MUSEUM_ID_COOKIE, null, 0);
  }
}

function setAccessTokenCookie(token: string | null): void {
  setCookie(ACCESS_TOKEN_COOKIE, token, 86400);
}

export type StoredAuthUser = Pick<
  LoginResponseDto,
  "userId" | "fullName" | "email" | "roleName"
> & {
  museumId?: number | null;
};

function backfillMuseumId(user: StoredAuthUser): StoredAuthUser {
  if (user.museumId != null) return user;

  const token = getAccessToken();
  if (!token) return user;

  const museumId = getMuseumIdFromAccessToken(token);
  if (museumId == null) return user;

  const updated = { ...user, museumId };
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
  setMuseumIdCookie(museumId);
  return updated;
}

export function saveAuthSession(data: LoginResponseDto): void {
  const museumId = getMuseumIdFromAccessToken(data.accessToken);

  localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
  setAccessTokenCookie(data.accessToken);
  if (data.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  }
  localStorage.setItem(
    AUTH_USER_KEY,
    JSON.stringify({
      userId: data.userId,
      fullName: data.fullName,
      email: data.email,
      roleName: data.roleName,
      museumId,
    } satisfies StoredAuthUser),
  );
  setMuseumIdCookie(museumId);
  notifyAuthChanged();
}

export function getAccessToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (
    token &&
    typeof document !== "undefined" &&
    !document.cookie.includes(`${ACCESS_TOKEN_COOKIE}=`)
  ) {
    setAccessTokenCookie(token);
  }
  return token;
}

export function getRefreshToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getAuthUser(): StoredAuthUser | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredAuthUser;
    return backfillMuseumId({
      ...parsed,
      roleName: canonicalRoleName(parsed.roleName ?? ""),
    });
  } catch {
    return null;
  }
}

let authSnapshotRaw: string | null | undefined = undefined;
let authSnapshotUser: StoredAuthUser | null = null;

export function getAuthUserSnapshot(): StoredAuthUser | null {
  const raw =
    typeof localStorage === "undefined" ? null : localStorage.getItem(AUTH_USER_KEY);
  if (raw === authSnapshotRaw) return authSnapshotUser;
  authSnapshotRaw = raw;
  authSnapshotUser = getAuthUser();
  return authSnapshotUser;
}

export function getAuthServerSnapshot(): StoredAuthUser | null {
  return null;
}

export function subscribeAuth(onStoreChange: () => void) {
  const notify = () => {
    authSnapshotRaw = undefined;
    onStoreChange();
  };
  window.addEventListener(AUTH_CHANGED_EVENT, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, notify);
    window.removeEventListener("storage", notify);
  };
}

export function clearAuthSession(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  setAccessTokenCookie(null);
  setMuseumIdCookie(null);
  notifyAuthChanged();
}
