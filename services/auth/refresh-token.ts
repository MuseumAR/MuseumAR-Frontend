import type { ApiResponse } from "@/types/api";
import type { LoginResponseDto } from "./auth.types";
import {
  clearAuthSession,
  getRefreshToken,
  saveAuthSession,
} from "./auth.storage";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/** Bare fetch refresh — kept separate to avoid api-client ↔ auth.service cycles. */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken || !API_URL) return null;

  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        Accept: "application/json; charset=utf-8",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    const json = (await res.json()) as ApiResponse<LoginResponseDto>;
    if (json.statusCode !== 200 || !json.data?.accessToken) {
      clearAuthSession();
      return null;
    }

    saveAuthSession(json.data);
    return json.data.accessToken;
  } catch {
    clearAuthSession();
    return null;
  }
}
