import { apiPost, apiPostAuth, getApiUrl } from "./auth.api";
import { clearAuthSession, saveAuthSession } from "./auth.storage";
import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  LoginResponseDto,
  RegisterRequest,
  ResetPasswordRequest,
} from "./auth.types";

export async function login(payload: LoginRequest): Promise<LoginResponseDto> {
  const data = await apiPost<LoginResponseDto>("/api/auth/login", payload);
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
  const data = await apiPost<LoginResponseDto>("/api/auth/google-login", payload);
  saveAuthSession(data);
  return data;
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
