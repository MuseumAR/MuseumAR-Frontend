import {
  clearAuthSession,
  getAccessToken,
} from "@/services/auth/auth.storage";
import { refreshAccessToken } from "@/services/auth/refresh-token";
import { AppError } from "@/lib/validation";
import type { ApiResponse } from "@/types/api";


const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function getApiUrl(path: string) {
  if (!API_URL) {
    throw new AppError("NEXT_PUBLIC_API_URL is not configured");
  }

  return `${API_URL}${path}`;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  accessToken?: string | null;
  headers?: Record<string, string>;
  /** Internal: skip refresh retry */
  _retried?: boolean;
};

let refreshInFlight: Promise<string | null> | null = null;

async function ensureFreshToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, accessToken, headers = {}, _retried } = options;

  const requestHeaders: Record<string, string> = {
    Accept: "application/json; charset=utf-8",
    ...headers,
  };

  if (accessToken) {
    requestHeaders.Authorization = `Bearer ${accessToken}`;
  }

  const hasJsonBody = body !== undefined && !(body instanceof FormData);
  if (hasJsonBody) {
    requestHeaders["Content-Type"] = "application/json";
  }

  let res: Response;
  try {
    res = await fetch(getApiUrl(path), {
      method,
      headers: requestHeaders,
      cache: "no-store",
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    });
  } catch {
    throw new AppError("Failed to fetch");
  }

  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new AppError("Request failed", res.status);
  }

  // Support both camelCase and PascalCase ResponseModel keys from BE
  const statusCode =
    (json as ApiResponse<T> & { StatusCode?: number }).statusCode ??
    (json as ApiResponse<T> & { StatusCode?: number }).StatusCode ??
    res.status;
  const message =
    (json as ApiResponse<T> & { Message?: string }).message ??
    (json as ApiResponse<T> & { Message?: string }).Message ??
    "Request failed";
  const data =
    (json as ApiResponse<T> & { Data?: T }).data ??
    (json as ApiResponse<T> & { Data?: T }).Data;

  if (statusCode !== 200) {
    const isUnauthorized = statusCode === 401 || res.status === 401;
    const canRetry =
      isUnauthorized &&
      !_retried &&
      !!accessToken &&
      path !== "/api/auth/refresh" &&
      path !== "/api/auth/login";

    if (canRetry) {
      const newToken = await ensureFreshToken();
      if (newToken) {
        return request<T>(path, { ...options, accessToken: newToken, _retried: true });
      }
      clearAuthSession();
    }

    throw new AppError(message || "Request failed", statusCode);
  }

  return data as T;
}

function withAuth(accessToken?: string | null) {
  return accessToken ?? getAccessToken();
}

export function apiGet<T>(path: string) {
  return request<T>(path);
}

export function apiGetAuth<T>(path: string, accessToken?: string | null) {
  const token = withAuth(accessToken);
  if (!token) throw new AppError("Not authenticated", 401);
  return request<T>(path, { accessToken: token });
}

export function apiPost<T>(path: string, body?: unknown) {
  return request<T>(path, { method: "POST", body });
}

export function apiPostAuth<T>(
  path: string,
  body?: unknown,
  accessToken?: string | null,
) {
  const token = withAuth(accessToken);
  if (!token) throw new AppError("Not authenticated", 401);
  return request<T>(path, { method: "POST", body, accessToken: token });
}

export function apiPutAuth<T>(
  path: string,
  body?: unknown,
  accessToken?: string | null,
) {
  const token = withAuth(accessToken);
  if (!token) throw new AppError("Not authenticated", 401);
  return request<T>(path, { method: "PUT", body, accessToken: token });
}

export function apiDeleteAuth<T>(path: string, accessToken?: string | null) {
  const token = withAuth(accessToken);
  if (!token) throw new AppError("Not authenticated", 401);
  return request<T>(path, { method: "DELETE", accessToken: token });
}

export function apiPostFormAuth<T>(
  path: string,
  formData: FormData,
  accessToken?: string | null,
) {
  const token = withAuth(accessToken);
  if (!token) throw new AppError("Not authenticated", 401);
  return request<T>(path, {
    method: "POST",
    body: formData,
    accessToken: token,
  });
}

export function apiPostForm<T>(path: string, formData: FormData) {
  return request<T>(path, { method: "POST", body: formData });
}
