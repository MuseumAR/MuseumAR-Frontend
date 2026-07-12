import { getMuseumIdFromAccessToken } from "@/lib/jwt";
import type { LoginResponseDto } from "./auth.types";

const ACCESS_TOKEN_KEY = "museumar_access_token";
const AUTH_USER_KEY = "museumar_auth_user";
export const MUSEUM_ID_COOKIE = "museumar_museum_id";

export const AUTH_CHANGED_EVENT = "museumar-auth-changed";

function notifyAuthChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
}

function setMuseumIdCookie(museumId: number | null): void {
  if (typeof document === "undefined") return;

  if (museumId != null && museumId > 0) {
    document.cookie = `${MUSEUM_ID_COOKIE}=${museumId}; path=/; max-age=86400; SameSite=Lax`;
  } else {
    document.cookie = `${MUSEUM_ID_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  }
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
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getAuthUser(): StoredAuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;

  try {
    return backfillMuseumId(JSON.parse(raw) as StoredAuthUser);
  } catch {
    return null;
  }
}

export function clearAuthSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  setMuseumIdCookie(null);
  notifyAuthChanged();
}
