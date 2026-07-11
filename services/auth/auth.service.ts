import { apiPost, apiPostAuth, getApiUrl } from "./auth.api";
import { clearAuthSession, saveAuthSession } from "./auth.storage";
import { refreshAccessToken } from "./refresh-token";
import { AppError } from "@/lib/validation";
import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  LoginResponseDto,
  RegisterRequest,
  ResetPasswordRequest,
} from "./auth.types";

export { refreshAccessToken };

export async function login(payload: LoginRequest): Promise<LoginResponseDto> {
  const raw = await apiPost<LoginResponseDto | Record<string, unknown>>(
    "/api/auth/login",
    payload,
  );
  const data = normalizeLoginResponse(raw);
  if (!data.accessToken) {
    throw new AppError("Login failed");
  }
  saveAuthSession(data);
  return data;
}

export async function register(payload: RegisterRequest): Promise<number> {
  return apiPost<number>("/api/auth/register", payload);
}

export async function forgotPassword(
  payload: ForgotPasswordRequest,
): Promise<void> {
  await apiPost<null>("/api/auth/forgot-password", payload);
}

export async function resetPassword(
  payload: ResetPasswordRequest,
): Promise<void> {
  await apiPost<null>("/api/auth/reset-password", payload);
}

export async function changePassword(
  payload: ChangePasswordRequest,
): Promise<void> {
  await apiPostAuth<null>("/api/auth/change-password", payload);
}

export async function loginWithGoogle(
  payload: GoogleLoginRequest,
): Promise<LoginResponseDto> {
  const raw = await apiPost<LoginResponseDto | Record<string, unknown>>(
    "/api/auth/google-login",
    payload,
  );
  const data = normalizeLoginResponse(raw);
  if (!data.accessToken) {
    throw new AppError("Login failed");
  }
  saveAuthSession(data);
  return data;
}

function normalizeLoginResponse(
  raw: LoginResponseDto | Record<string, unknown>,
): LoginResponseDto {
  const r = raw as Record<string, unknown>;
  return {
    userId: Number(r.userId ?? r.UserId ?? 0),
    fullName: String(r.fullName ?? r.FullName ?? ""),
    email: String(r.email ?? r.Email ?? ""),
    roleName: String(r.roleName ?? r.RoleName ?? ""),
    accessToken: String(r.accessToken ?? r.AccessToken ?? ""),
    refreshToken: (r.refreshToken ?? r.RefreshToken ?? null) as string | null,
  };
}

export async function logout(): Promise<void> {
  try {
    const res = await fetch(getApiUrl("/api/auth/logout"), {
      method: "POST",
    });

    if (!res.ok) {
      throw new Error("Logout failed");
    }
  } finally {
    clearAuthSession();
  }
}
