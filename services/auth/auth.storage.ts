import type { LoginResponseDto } from "./auth.types";

const ACCESS_TOKEN_KEY = "museumar_access_token";
const AUTH_USER_KEY = "museumar_auth_user";

export type StoredAuthUser = Pick<
  LoginResponseDto,
  "userId" | "fullName" | "email" | "roleName"
>;

export function saveAuthSession(data: LoginResponseDto): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
  localStorage.setItem(
    AUTH_USER_KEY,
    JSON.stringify({
      userId: data.userId,
      fullName: data.fullName,
      email: data.email,
      roleName: data.roleName,
    } satisfies StoredAuthUser),
  );
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getAuthUser(): StoredAuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredAuthUser;
  } catch {
    return null;
  }
}

export function clearAuthSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}
